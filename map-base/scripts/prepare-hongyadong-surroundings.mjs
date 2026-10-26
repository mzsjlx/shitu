import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Geometry-only, offline preparation. Planting is authored decoration inside a
// sourced park; it is not a conversion of OSM tree nodes or surveyed tree data.
const read=path=>readFile(new URL(path,import.meta.url));
const xmlBytes=await read('../../design/prototype-3d/data/osm-raw.xml');
const manifest=JSON.parse(await read('../../design/prototype-3d/data/osm-source.json'));
const landmark=JSON.parse(await read('../data/hongyadong-landmark.json'));
const xmlHash=createHash('sha256').update(xmlBytes).digest('hex');
assert.equal(xmlHash,manifest.sha256,'Retained OSM XML hash does not match its manifest');
const xml=xmlBytes.toString('utf8');
const decode=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,key)=>key[0]==='#'?String.fromCodePoint(key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10)):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[key]));
const attributes=s=>Object.fromEntries([...s.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const tagsOf=s=>Object.fromEntries([...s.matchAll(/<tag\b([^>]*?)\/>/g)].map(m=>{const a=attributes(m[1]);return [a.k,a.v];}));
const nodes=new Map();
for(const m of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){
  const a=attributes(m[1]);nodes.set(Number(a.id),[Number(a.lon),Number(a.lat)]);
}
const ways=new Map();
for(const m of xml.matchAll(/<way\b([^>]*?)>([\s\S]*?)<\/way>/g)){
  const a=attributes(m[1]),ids=[...m[2].matchAll(/<nd\b([^>]*?)\/>/g)].map(m=>Number(attributes(m[1]).ref));
  ways.set(Number(a.id),{id:Number(a.id),nodeIds:ids,tags:tagsOf(m[2]),points:ids.map(id=>nodes.get(id))});
}
const relations=[];
for(const m of xml.matchAll(/<relation\b([^>]*?)>([\s\S]*?)<\/relation>/g)){
  const a=attributes(m[1]);relations.push({id:Number(a.id),tags:tagsOf(m[2]),members:[...m[2].matchAll(/<member\b([^>]*?)\/>/g)].map(m=>attributes(m[1]))});
}
const origin=[landmark.centroid.lon,landmark.centroid.lat],R=6378137,rad=Math.PI/180,cos=Math.cos(origin[1]*rad);
// Local metres: X east, Z south, matching the runtime landmark coordinate frame.
const project=p=>[(p[0]-origin[0])*R*rad*cos,(origin[1]-p[1])*R*rad];
const unproject=p=>[origin[0]+p[0]/(R*rad*cos),origin[1]-p[1]/(R*rad)].map(n=>Number(n.toFixed(10)));
const complete=way=>way.points.length>=2&&way.points.every(p=>p&&p.every(Number.isFinite));
const closed=points=>points.length>=4&&points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1];
const contains=(point,ring)=>{let inside=false;const [x,y]=point;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
}return inside;};
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const lineDistance=(p,points)=>Math.min(...points.slice(1).map((q,i)=>segmentDistance(p,points[i],q)));
const bounds=points=>[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
const intersects=(a,b,pad)=>a[0]-pad<=b[2]&&a[2]+pad>=b[0]&&a[1]-pad<=b[3]&&a[3]+pad>=b[1];
const park=ways.get(1418261449);assert(park&&complete(park)&&closed(park.points));assert.equal(park.tags.leisure,'park');
const ring=park.points.map(project),parkBounds=bounds(ring);
const rules={maxTrees:24,gridSpacingMetres:7,minTreeSpacingMetres:8.5,parkBoundaryClearanceMetres:4,buildingClearanceMetres:5,ordinaryHighwayClearanceMetres:6,walkingHighwayClearanceMetres:2.5};
const walking=new Set(['path','footway','steps','pedestrian','cycleway','bridleway','corridor','elevator']);
const buildings=[],highways=[],conservativeBuildingBounds=[];
const buildingTag=tags=>(tags.building&&tags.building!=='no')||(tags['building:part']&&tags['building:part']!=='no');
const addBuilding=(id,points,basis)=>{
  if(points.length<2||!points.every(Boolean))return;
  let local=points.map(project),box=bounds(local);
  if(!intersects(box,parkBounds,rules.buildingClearanceMetres))return;
  if(!closed(local)){
    // Conservatively reserve incomplete/open member outlines by their bounds.
    local=[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]],[box[0],box[1]]];
    conservativeBuildingBounds.push(id);
  }
  buildings.push({id,points:local,basis});
};
for(const way of ways.values()){
  if((buildingTag(way.tags)||way.tags.highway)&&!complete(way))throw new Error('Incomplete source way '+way.id+' prevents safe local exclusions');
  if(buildingTag(way.tags))addBuilding('way/'+way.id,way.points,'building-tagged source way');
  if(way.tags.highway){
    const points=way.points.map(project),clearance=walking.has(way.tags.highway)?rules.walkingHighwayClearanceMetres:rules.ordinaryHighwayClearanceMetres;
    if(intersects(bounds(points),parkBounds,clearance))highways.push({id:'way/'+way.id,kind:way.tags.highway,points,clearance});
  }
}
// Reserve member outlines as well as explicitly building-tagged ways. Inner
// courtyards are conservatively excluded, rather than treated as planting sites.
for(const relation of relations.filter(r=>buildingTag(r.tags))){
  const members=relation.members.filter(m=>m.type==='way').map(m=>ways.get(Number(m.ref))).filter(Boolean);
  for(const member of members)addBuilding('relation/'+relation.id+'/way/'+member.id,member.points,'conservative building relation member');
}
function clearance(point){
  const parkBoundary=lineDistance(point,ring);
  let building=Infinity,roadMargin=Infinity,ordinaryHighway=Infinity,walkingHighway=Infinity;
  for(const outline of buildings)building=Math.min(building,contains(point,outline.points)?0:lineDistance(point,outline.points));
  for(const road of highways){const d=lineDistance(point,road.points);roadMargin=Math.min(roadMargin,d-road.clearance);if(road.clearance===rules.walkingHighwayClearanceMetres)walkingHighway=Math.min(walkingHighway,d);else ordinaryHighway=Math.min(ordinaryHighway,d);}
  return {insidePark:contains(point,ring),parkBoundary,building,roadMargin,ordinaryHighway,walkingHighway};
}
const candidates=[];let testedGridPoints=0;
for(let x=Math.ceil(parkBounds[0]/rules.gridSpacingMetres)*rules.gridSpacingMetres;x<=parkBounds[2];x+=rules.gridSpacingMetres){
  for(let z=Math.ceil(parkBounds[1]/rules.gridSpacingMetres)*rules.gridSpacingMetres;z<=parkBounds[3];z+=rules.gridSpacingMetres){
    testedGridPoints++;const p=[x,z],c=clearance(p);
    if(c.insidePark&&c.parkBoundary>=rules.parkBoundaryClearanceMetres&&c.building>=rules.buildingClearanceMetres&&c.roadMargin>=0)candidates.push(p);
  }
}
const centre=[(parkBounds[0]+parkBounds[2])/2,(parkBounds[1]+parkBounds[3])/2];
const squaredDistance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
const selected=[],remaining=[...candidates];
while(remaining.length&&selected.length<rules.maxTrees){
  let bestIndex=-1,bestScore=-Infinity;
  for(let i=0;i<remaining.length;i++){
    const score=selected.length?Math.min(...selected.map(p=>squaredDistance(p,remaining[i]))):-squaredDistance(centre,remaining[i]);
    if(score>bestScore){bestScore=score;bestIndex=i;}
  }
  if(selected.length&&bestScore<rules.minTreeSpacingMetres**2)break;
  selected.push(remaining.splice(bestIndex,1)[0]);
}
const decorativeTrees=selected.map((point,index)=>({id:'hongyadong-park-ornamental-'+String(index+1).padStart(2,'0'),coordinates:unproject(point)}));
const checks=decorativeTrees.map(tree=>({id:tree.id,...clearance(project(tree.coordinates))}));
for(const c of checks){assert(c.insidePark);assert(c.parkBoundary>=rules.parkBoundaryClearanceMetres-1e-6);assert(c.building>=rules.buildingClearanceMetres-1e-6);assert(c.roadMargin>=-1e-6);}
const finalPositions=decorativeTrees.map(tree=>project(tree.coordinates));
const minSpacing=finalPositions.length>1?Math.min(...finalPositions.flatMap((p,i)=>finalPositions.slice(i+1).map(q=>Math.sqrt(squaredDistance(p,q))))):null;
assert(minSpacing===null||minSpacing>=rules.minTreeSpacingMetres);
const finiteOrNull=n=>Number.isFinite(n)?Number(n.toFixed(6)):null;
const result={schemaVersion:1,id:'hongyadong-surroundings',coordinateReferenceSystem:'EPSG:4326',preparedOn:'2026-10-26',
  source:{file:'design/prototype-3d/data/osm-raw.xml',manifestFile:'design/prototype-3d/data/osm-source.json',xmlSha256:xmlHash,sourceDate:manifest.retrievedAt.slice(0,10),endpoint:manifest.endpoint,attribution:manifest.attribution,license:manifest.license,licenseUrl:manifest.licenseUrl},
  park:{osmType:'way',osmId:park.id,url:'https://www.openstreetmap.org/way/'+park.id,tags:park.tags,geometry:{type:'Polygon',coordinates:[park.points]}},
  decorativeTrees,
  plantingBasis:'Authored decorative planting positions, not OSM individual tree records, tree inventory or surveyed locations. Only the park boundary and exclusion geometries come from the source XML. Runtime chooses artistic tree dimensions and reads ground elevation; no tree height or ground elevation is asserted here.',
  placementRules:{...rules,method:'Fixed 7m local-metre grid, then deterministic farthest-point sampling with stable X/Z order tie-breaks. Start near park bounds centre. No random number generator.',projection:{originLonLat:origin,earthRadiusMetres:R,axes:'X east, Z south',formula:'x=(lon-lon0)*PI*R/180*cos(lat0); z=(lat0-lat)*PI*R/180'},exclusions:'All source highway centre lines, including bridge/tunnel and area boundaries, are conservatively buffered. Closed building polygons and available relation member outlines are reserved; open member outlines use their bounding rectangles. These are visual avoidance margins, not surveyed widths, access or walking guarantees.'},
  audit:{testedGridPoints,eligibleGridPoints:candidates.length,selectedTrees:decorativeTrees.length,nearbyBuildingOutlines:buildings.length,nearbyHighwayLines:highways.length,conservativeBuildingBounds,
    minimumParkBoundaryClearanceMetres:finiteOrNull(Math.min(...checks.map(c=>c.parkBoundary))),minimumBuildingClearanceMetres:finiteOrNull(Math.min(...checks.map(c=>c.building))),minimumHighwayMarginBeyondRequiredMetres:finiteOrNull(Math.min(...checks.map(c=>c.roadMargin))),minimumTreeSpacingMetres:finiteOrNull(minSpacing),
    sourceBuildingIds:buildings.map(b=>b.id),sourceHighwayIds:highways.map(h=>({id:h.id,kind:h.kind,clearanceMetres:h.clearance})),
    perTree:checks.map(c=>({id:c.id,insidePark:c.insidePark,parkBoundaryClearanceMetres:finiteOrNull(c.parkBoundary),buildingClearanceMetres:finiteOrNull(c.building),ordinaryHighwayClearanceMetres:finiteOrNull(c.ordinaryHighway),walkingHighwayClearanceMetres:finiteOrNull(c.walkingHighway),highwayMarginBeyondRequiredMetres:finiteOrNull(c.roadMargin)}))}
};
await writeFile(new URL('../data/hongyadong-surroundings.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({parkWay:park.id,sourceXmlSha256:xmlHash,...result.audit,perTree:undefined,sourceBuildingIds:undefined,sourceHighwayIds:undefined}));
