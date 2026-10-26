import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// This preparation step uses only the already retained OSM response.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=path.resolve(root,'../design/prototype-3d/data');
const rawBytes=await readFile(path.join(sourceDir,'osm-raw.json'));
const source=JSON.parse(await readFile(path.join(sourceDir,'osm-source.json'),'utf8'));
const raw=JSON.parse(rawBytes);
const config=JSON.parse(await readFile(path.join(root,'config/cities.json'),'utf8'));
const bounds=config.cities.chongqing.bounds;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const xmlBytes=await readFile(path.join(sourceDir,'osm-raw.xml'));
if(hash(xmlBytes)!==source.sha256)throw new Error('Retained OSM XML does not match its source manifest');
const jsonNodes=raw.elements.filter(e=>e.type==='node');
const nodes=new Map(jsonNodes.map(e=>[e.id,e]));
// The old modeling JSON kept tagged nodes only. Recover original coordinates
// from its hash-verified XML response; never interpolate missing coordinates.
let recoveredNodes=0;
for(const match of xmlBytes.toString('utf8').matchAll(/<node\b([^>]*?)(?:\/>|>)/g)){
  const attrs=Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  const id=Number(attrs.id),lon=Number(attrs.lon),lat=Number(attrs.lat);
  if(!Number.isSafeInteger(id)||!Number.isFinite(lon)||!Number.isFinite(lat))continue;
  const existing=nodes.get(id);
  if(existing&&(existing.lon!==lon||existing.lat!==lat))throw new Error('JSON/XML node coordinates disagree: '+id);
  if(!existing){nodes.set(id,{type:'node',id,lon,lat});recoveredNodes++;}
}
const sourceWays=raw.elements.filter(e=>e.type==='way'&&e.tags?.highway);
const carHighways=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','residential','living_street','service','unclassified','road']);
const inside=p=>Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=bounds[0]&&p[0]<=bounds[2]&&p[1]>=bounds[1]&&p[1]<=bounds[3];
function classify(tags){
  if(tags.highway==='steps')return 'steps';
  if(tags.highway==='crossing'||tags.footway==='crossing')return 'crossing';
  if(tags.footway==='sidewalk')return 'sidewalk';
  if(tags.highway==='pedestrian')return 'pedestrian';
  if(['footway','path','corridor'].includes(tags.highway))return 'footpath';
  if(carHighways.has(tags.highway))return 'raw-road';
  return null;
}
const parseLanes=value=>/^\d+$/.test(value||'')&&Number(value)>0&&Number(value)<=16?Number(value):0;
const skipped={unsupportedHighway:0,tooFewNodes:0,incompleteGeometry:0,outsideCityBounds:0,degenerateGeometry:0};
const features=[];
for(const way of sourceWays){
  const type=classify(way.tags);
  if(!type){skipped.unsupportedHighway++;continue;}
  if(!Array.isArray(way.nodes)||way.nodes.length<2){skipped.tooFewNodes++;continue;}
  // Never connect across a missing node: retained relation members can be incomplete.
  if(way.nodes.some(id=>!nodes.has(id))){skipped.incompleteGeometry++;continue;}
  const coordinates=way.nodes.map(id=>{const n=nodes.get(id);return [n.lon,n.lat];});
  if(!coordinates.every(inside)){skipped.outsideCityBounds++;continue;}
  if(!coordinates.some(p=>p[0]!==coordinates[0][0]||p[1]!==coordinates[0][1])){skipped.degenerateGeometry++;continue;}
  const t=way.tags;
  const layer=/^-?\d+$/.test(t.layer||'')?Number(t.layer):0;
  const restricted=t.foot==='no'||t.foot==='private'||t.access==='private'||t.access==='no';
  const markings=t['crossing:markings']||'';
  features.push({
    type:'Feature',id:way.id,
    properties:{
      type,osmId:way.id,name:t['name:zh-Hans']||t['name:zh']||t.name||'',
      lanes:parseLanes(t.lanes),sourceGeometry:'OSM-way-node-coordinates',surveyStatus:'source-record-only',
      sourceRetrievedAt:source.retrievedAt,nodeIds:[...way.nodes],rawTags:JSON.stringify(t),
      highway:t.highway,footway:t.footway||'',sidewalk:t.sidewalk||'',
      oneway:t.oneway||'',layer,bridge:t.bridge||'',tunnel:t.tunnel||'',
      foot:t.foot||'',access:t.access||'',restricted,
      indoor:t.indoor||'',area:t.area||'',
      isElevated:!!t.bridge&&t.bridge!=='no'||layer>0,
      isUnderground:!!t.tunnel&&t.tunnel!=='no'||layer<0,
      crossing:t.crossing||'',crossingMarkings:markings,
      explicitlyZebra:markings==='zebra'||t.crossing_ref==='zebra',
      widthMetres:/^\d+(\.\d+)?$/.test(t.width||'')?Number(t.width):0,
    },
    geometry:{type:'LineString',coordinates},
  });
}
const collection={type:'FeatureCollection',name:'Chongqing retained-source street detail sample',features};
const typeCounts={};
for(const f of features)typeCounts[f.properties.type]=(typeCounts[f.properties.type]||0)+1;
const tagCounts={};
for(const key of ['lanes','lanes:forward','lanes:backward','width','sidewalk','footway','crossing','crossing:markings','crossing_ref','turn:lanes','surface'])tagCounts[key]=features.filter(f=>Object.hasOwn(JSON.parse(f.properties.rawTags),key)).length;
const bboxOf=coords=>[Math.min(...coords.map(p=>p[0])),Math.min(...coords.map(p=>p[1])),Math.max(...coords.map(p=>p[0])),Math.max(...coords.map(p=>p[1]))];
const geometryBounds=bboxOf(features.flatMap(f=>f.geometry.coordinates));
const mid=f=>{const points=f.geometry.coordinates;return points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]);};
const distance=(a,b)=>Math.hypot((a[0]-b[0])*96800,(a[1]-b[1])*111320);
function distanceToLine(point,coordinates){
  let best=Infinity;
  for(let i=1;i<coordinates.length;i++){
    const a=[(coordinates[i-1][0]-point[0])*96800,(coordinates[i-1][1]-point[1])*111320];
    const b=[(coordinates[i][0]-point[0])*96800,(coordinates[i][1]-point[1])*111320];
    const vx=b[0]-a[0],vy=b[1]-a[1],d=vx*vx+vy*vy;
    const t=d?Math.max(0,Math.min(1,-(a[0]*vx+a[1]*vy)/d)):0;
    best=Math.min(best,Math.hypot(a[0]+t*vx,a[1]+t*vy));
  }
  return best;
}
const candidates=features.filter(f=>f.properties.type==='crossing'&&!f.properties.restricted&&!f.properties.isElevated&&!f.properties.isUnderground);
const scored=candidates.map(f=>{
  const center=mid(f);
  const nearby=features.filter(other=>distanceToLine(center,other.geometry.coordinates)<180);
  const count=type=>nearby.filter(other=>other.properties.type===type).length;
  const laneRoads=nearby.filter(other=>other.properties.type==='raw-road'&&other.properties.lanes>1&&!other.properties.isElevated&&!other.properties.isUnderground&&!other.properties.restricted&&['yes','1','true'].includes(other.properties.oneway));
  const score=count('sidewalk')*4+count('crossing')*2+Math.min(count('steps'),5)+laneRoads.length*2;
  return {osmId:f.id,center,score,nearbyCounts:Object.fromEntries(['sidewalk','crossing','steps','footpath','pedestrian'].map(type=>[type,count(type)])),laneRoads:laneRoads.map(other=>({osmId:other.id,name:other.properties.name,lanes:other.properties.lanes}))};
}).sort((a,b)=>b.score-a.score);
// Keep the first visible pilot on the Jiefangbei / Xiaoshizi side of the river.
const preferredStreet=[106.58012705,29.562860625];
const recommended=[...scored].filter(candidate=>candidate.center[1]<29.568&&candidate.laneRoads.length).sort((a,b)=>distance(a.center,preferredStreet)-distance(b.center,preferredStreet))[0]||scored[0];
if(!recommended)throw new Error('No complete at-grade crossing geometry exists for a pilot');
recommended.bounds=[recommended.center[0]-.0018,recommended.center[1]-.0014,recommended.center[0]+.0018,recommended.center[1]+.0014];
recommended.zoom=18.55;recommended.pitch=40;recommended.bearing=-18;
const manifest={
  schemaVersion:1,city:'chongqing',coordinateSystem:'WGS84',generatedBy:'scripts/prepare-street-detail.mjs',
  source:{endpoint:source.endpoint,retrievedAt:source.retrievedAt,cacheJSON:'design/prototype-3d/data/osm-raw.json',cacheJSONSHA256:hash(rawBytes),cacheXML:'design/prototype-3d/data/osm-raw.xml',cacheXMLSHA256:hash(xmlBytes),declaredXMLSHA256:source.sha256,jsonNodeRecords:jsonNodes.length,recoveredOriginalXMLNodes:recoveredNodes,totalRetainedNodes:nodes.size,sourceQueryBounds:[source.bboxSouthWestNorthEast[1],source.bboxSouthWestNorthEast[0],source.bboxSouthWestNorthEast[3],source.bboxSouthWestNorthEast[2]],attribution:source.attribution,license:source.license,licenseUrl:source.licenseUrl},
  cityBounds:bounds,geometryBounds,
  counts:{inputHighwayWays:sourceWays.length,retainedFeatures:features.length,typeCounts,tagPresence:tagCounts,validLaneCounts:features.filter(f=>f.properties.lanes>0).length,restricted:features.filter(f=>f.properties.restricted).length,elevated:features.filter(f=>f.properties.isElevated).length,underground:features.filter(f=>f.properties.isUnderground).length,explicitlyZebra:features.filter(f=>f.properties.explicitlyZebra).length,skipped},
  recommendedView:recommended,crossingCandidates:scored,
  limitations:[
    'Source records have not been independently surveyed; source-record-only is not a verified walking permission.',
    'The old modeling JSON omitted untagged nodes; original node coordinates are recovered from its hash-verified source XML response, without new sampling or interpolation.',
    'Incomplete ways are excluded in full; no line is drawn across a missing source node.',
    'Source way centre lines are retained, not inferred carriageway or sidewalk boundaries.',
    'Lanes attributes do not establish lane widths, lane marking geometry or junction topology.',
    'Crossing lines do not imply zebra markings. Only explicitlyZebra is based on an explicit source marking tag.',
    'Elevated, underground, restricted and indoor ways need distinct display treatment and cannot be connected merely by 2D proximity.',
    'The OSM query rectangle is a retrieval scope, not a completeness or positional accuracy guarantee.',
  ],
};
await writeFile(path.join(root,'data/street-detail.geojson'),JSON.stringify(collection));
await writeFile(path.join(root,'data/street-detail-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({counts:manifest.counts,recommendedView:recommended,geometryBounds},null,2));
