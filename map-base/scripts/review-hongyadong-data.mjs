import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PMTiles} from 'pmtiles';
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import {createHongyadongModel,HONGYADONG_ORIENTATION} from '../src/hongyadong-model.js';

const read=p=>readFile(new URL(p,import.meta.url));
const data=JSON.parse(await read('../data/hongyadong-landmark.json'));
const xml=await read('../../design/prototype-3d/data/osm-raw.xml');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const nodes=new Map([...xml.toString().matchAll(/<node\b([^>]*?)(?:\/>|>)/g)].map(m=>{const a=attrs(m[1]);return [Number(a.id),[Number(a.lon),Number(a.lat)]];}));
const ways=[...xml.toString().matchAll(/<way\b([^>]*?)>([\s\S]*?)<\/way>/g)];
const way=ways.find(m=>Number(attrs(m[1]).id)===939578294);
const original=[...way[2].matchAll(/<nd\b([^>]*?)\/>/g)].map(m=>nodes.get(Number(attrs(m[1]).ref)));
const ring=data.footprint.coordinates[0],R=6378137,rad=Math.PI/180,lat0=data.centroid.lat,lon0=data.centroid.lon;
const local=p=>[(p[0]-lon0)*R*rad*Math.cos(lat0*rad),(p[1]-lat0)*R*rad];
const polygon=ring.map(local);
const inside=p=>{const [x,y]=local(p);let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
}return hit;};
const report={date:'2026-10-26',scope:'Independent retained OSM XML and PMTiles footprint comparison plus geometry budget. Geographic source does not certify the authored rooflines/storeys or coarse DEM fit.',checks:[],issues:[]};
function check(name,fn){try{report.checks.push({name,passed:true,details:fn()});}catch(e){report.checks.push({name,passed:false,error:e.message});report.issues.push(name);}}
check('Original OSM XML hash and identity match landmark provenance',()=>{assert.equal(createHash('sha256').update(xml).digest('hex'),data.source.sourceXmlSha256);assert.equal(data.source.osmId,939578294);assert.equal(data.source.sourceDate,'2026-10-19');return data.source.sourceXmlSha256;});
check('All 22 closed WGS84 positions equal original XML node coordinates',()=>{assert.deepEqual(ring,original);assert.equal(ring.length,22);assert.deepEqual(ring[0],ring.at(-1));return {positions:ring.length};});
check('Footprint bounds and centroid derive from original polygon',()=>{
  const bounds=[Math.min(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[1]))];assert.deepEqual(bounds,data.bounds);
  let a=0,cx=0,cy=0;for(let i=0;i<polygon.length-1;i++){const p=polygon[i],q=polygon[i+1],cross=p[0]*q[1]-q[0]*p[1];a+=cross;cx+=(p[0]+q[0])*cross;cy+=(p[1]+q[1])*cross;}
  const deltaMetres=Math.hypot(cx/(3*a),cy/(3*a));assert(deltaMetres<.01);assert(inside([lon0,lat0]));return {centroidDeltaMetres:deltaMetres,bounds};
});
check('Three river-front grounding points stay inside real footprint',()=>{const points=[[106.5745498603,29.5650955583],[106.5752283149,29.5653127615],[106.5759067695,29.5655299647]];assert(points.every(inside));return points;});
const {group,stats}=createHongyadongModel();
check('Authored geometry has finite vertices, ground zero and bounded GPU budget',()=>{assert(stats.finite);assert.equal(stats.minGround,0);assert(stats.triangles<=data.model.budget.maxTriangles);assert(stats.drawCalls<=data.model.budget.maxDrawCalls);assert.equal(stats.drawCalls,8);assert.equal(stats.mainWings,11);assert.equal(stats.pavilions,12);assert(Math.abs(stats.bounds.max[1]-data.model.approximateHeightMetres)<.01);return stats;});
check('Orientation is baked once and resource ownership stays local',()=>{assert.equal(stats.orientationRadians,HONGYADONG_ORIENTATION);assert.equal(HONGYADONG_ORIENTATION,data.orientation.angleRadians);assert.equal(group.rotation.y,0);const gs=new Set(),ms=new Set();group.traverse(o=>{if(o.isMesh){assert(!gs.has(o.geometry));assert(!ms.has(o.material));gs.add(o.geometry);ms.add(o.material);assert(!o.material.map);}});return {geometries:gs.size,materials:ms.size,textures:0};});
const archiveBytes=await read('../data/chongqing.pmtiles');
check('Replacement feature ID is pinned to the retained city archive hash',()=>{const hash=createHash('sha256').update(archiveBytes).digest('hex');assert.equal(hash,data.renderReplacement.archiveSha256);return hash;});
const archive=new PMTiles({getKey:()=> 'retained-local-map',getBytes:async(offset,length)=>{const b=archiveBytes.subarray(offset,offset+length);return {data:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};}});
const header=await archive.getHeader();
const tileXY=(lon,lat,z)=>{const n=2**z;return [Math.floor((lon+180)/360*n),Math.floor((1-Math.asinh(Math.tan(lat*rad))/Math.PI)/2*n)];};
const distanceToSegment=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
report.renderTiles=[];
for(const z of [14,15].filter(z=>z<=header.maxZoom)){
  const [x,y]=tileXY(lon0,lat0,z),tile=await archive.getZxy(z,x,y);let matched=null;
  if(tile){const vt=new VectorTile(new PbfReader(tile.data)),layer=vt.layers.buildings;
    if(layer)for(let i=0;i<layer.length;i++){const f=layer.feature(i);if(f.id===data.renderReplacement.featureId){matched=f.toGeoJSON(x,y,z);break;}}
  }
  if(z===14){check('Merged source zoom has no exact replacement; model is kept above z15',()=>{assert(!matched);assert(data.renderReplacement.minimumMapZoom>=15.2);return {z,exactIdPresent:false,modelMinZoom:data.renderReplacement.minimumMapZoom};});continue;}
  check('Exact replacement ID matches the original footprint at source zoom '+z,()=>{
    assert(matched,'No exact ID at this zoom');assert.equal(matched.properties.kind,'building');const points=matched.geometry.coordinates[0].map(local);
    const maxEdgeDistanceMetres=Math.max(...points.map(p=>Math.min(...polygon.slice(0,-1).map((a,i)=>distanceToSegment(p,a,polygon[i+1])))));
    assert(maxEdgeDistanceMetres<1,'Render footprint differs by more than tile quantization');
    const details={z,x,y,id:matched.id,vertices:points.length,maxEdgeDistanceMetres};report.renderTiles.push(details);return details;
  });
}
const foodBytes=await read('../data/food-records.json');
check('Public food source bytes remain unchanged',()=>{const hash=createHash('sha256').update(foodBytes).digest('hex');assert.equal(hash,'899a01a8d0fb65ff17afaa7dbf37c30204215202d50095800d053469a0b5ed99');return hash;});
group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
report.summary={passed:report.checks.filter(c=>c.passed).length,total:report.checks.length,failed:report.issues.length};
await writeFile(new URL('../HONGYADONG-DATA-QA.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,issues:report.issues,renderTiles:report.renderTiles}));
if(report.issues.length)process.exitCode=1;
