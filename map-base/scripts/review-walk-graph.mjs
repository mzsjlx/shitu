import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildWalkGraph,findWalkRoute} from '../src/walk-graph.js';

const load=async relative=>JSON.parse(await readFile(new URL(relative,import.meta.url),'utf8'));
const data=await load('../data/walk-network.json');
const source=await load('../../design/prototype-3d/data/osm-source.json');
const foods=await load('../data/food-records.json');
const xmlBytes=await readFile(new URL('../../design/prototype-3d/data/osm-raw.xml',import.meta.url));
const xml=xmlBytes.toString('utf8');
const decode=s=>s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,key)=>{
  if(key[0]==='#')return String.fromCodePoint(key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10));
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[key];
});
const attributes=body=>Object.fromEntries([...body.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const tagsOf=body=>Object.fromEntries([...body.matchAll(/<tag\b([^>]*?)\/>/g)].map(m=>{const a=attributes(m[1]);return [a.k,a.v];}));
// This oracle reads node coordinates, node tags, way membership and way tags
// directly from the retained XML, without the preparation JSON or graph filters.
const originalNodes=new Map();
for(const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)){
  const a=attributes(match[1]);originalNodes.set(Number(a.id),{point:[Number(a.lon),Number(a.lat)],tags:tagsOf(match[2]||'')});
}
const originalWays=new Map();
for(const match of xml.matchAll(/<way\b([^>]*?)>([\s\S]*?)<\/way>/g)){
  const a=attributes(match[1]);originalWays.set(Number(a.id),{nodes:[...match[2].matchAll(/<nd\b([^>]*?)\/>/g)].map(m=>Number(attributes(m[1]).ref)),tags:tagsOf(match[2])});
}
// Independent Haversine oracle uses atan2 and mean Earth radius 6371008.8 m.
// The runtime uses 6371000 m; sub-centimetre differences are expected at this scale.
const independentHaversine=(a,b)=>{
  const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
};
const report={verifiedOn:'2026-10-22',scope:'Original-XML topology and synthetic graph verification only; no current pedestrian permission, shop entrance, physical walkability or global shortest-path claim.',sourceXMLSHA256:createHash('sha256').update(xmlBytes).digest('hex'),checks:[],issues:[]};
function check(name,body){try{const details=body();report.checks.push({name,passed:true,...(details===undefined?{}:{details})});}catch(error){report.checks.push({name,passed:false,error:error.message});report.issues.push(name);}}
const connected=(graph,a,b)=>findWalkRoute(graph,a,b)!==null;
const road=(id,nodes,tags={})=>({id,nodes,tags:{highway:'residential',...tags}});
const fixture=(nodes,ways,extra={})=>({nodes,ways,...extra});
const lineNodes=[[1,106,29],[2,106.001,29],[3,106.002,29],[4,106.003,29]];

check('Original XML hash matches source manifest and network provenance',()=>{
  assert.equal(report.sourceXMLSHA256,source.sha256);assert.equal(data.source.xmlSHA256,source.sha256);assert.equal(data.source.date,source.retrievedAt.slice(0,10));
  return {hashMatches:true,date:data.source.date};
});
check('Every network node preserves XML ID, coordinates and node tags',()=>{
  const ids=new Set();
  for(const [id,lon,lat,tags]of data.nodes){assert(!ids.has(id),'Duplicate node '+id);ids.add(id);const original=originalNodes.get(id);assert(original,'Unknown original node '+id);assert.deepEqual([lon,lat],original.point,'Coordinate mutation '+id);assert.deepEqual(tags,original.tags,'Node tags changed '+id);}
  return {nodesChecked:data.nodes.length,originalXMLNodes:originalNodes.size};
});
check('Every network way preserves full XML node order and tags',()=>{
  const ids=new Set();
  for(const way of data.ways){assert(!ids.has(way.id),'Duplicate way '+way.id);ids.add(way.id);const original=originalWays.get(way.id);assert(original,'Synthetic/unknown way '+way.id);assert.deepEqual(way.nodes,original.nodes,'Way node order changed '+way.id);assert.deepEqual(way.tags,original.tags,'Way tags changed '+way.id);}
  const sourceHighways=[...originalWays.values()].filter(w=>w.tags.highway).length;assert.equal(data.ways.length,sourceHighways);
  return {waysChecked:data.ways.length,sourceHighwayWays:sourceHighways};
});

const graph=buildWalkGraph(data),start=data.sample.endpoints[0].nodeID,end=data.sample.endpoints[1].nodeID,route=findWalkRoute(graph,start,end);
check('Sample uses original road nodes, leaves POIs unconnected and ineligible',()=>{
  assert.equal(data.sample.status,'road-topology-trial');assert.equal(data.sample.entrancesConnected,false);
  assert.deepEqual([start,end],[4592547287,13912494389]);
  for(const endpoint of [start,end])assert(originalNodes.has(endpoint));
  const pois=foods.records.map(f=>f.coordinateEvidence.id);
  for(const food of foods.records){assert.equal(food.routeEligible,false);assert.equal(food.entranceStatus,'unverified');assert(!graph.adj.has(food.coordinateEvidence.id));}
  assert(route);assert(route.nodeIDs.every(id=>!pois.includes(id)));assert.deepEqual(route.nodeIDs.slice(0,1),[start]);assert.equal(route.nodeIDs.at(-1),end);
  return {endpoints:[start,end],entrancesConnected:false,candidatePOINodes:pois};
});
check('Every sample edge follows adjacent original way nodes and exact XML coordinates',()=>{
  assert(route);assert.equal(route.edges.length+1,route.nodeIDs.length);assert.equal(route.coordinates.length,route.nodeIDs.length);
  for(let i=0;i<route.nodeIDs.length;i++)assert.deepEqual(route.coordinates[i],originalNodes.get(route.nodeIDs[i]).point);
  for(let i=0;i<route.edges.length;i++){
    const edge=route.edges[i],way=originalWays.get(edge.way);assert(way);assert.equal(edge.from,route.nodeIDs[i]);assert.equal(edge.to,route.nodeIDs[i+1]);
    assert(way.nodes.some((id,j)=>j>0&&((way.nodes[j-1]===edge.from&&id===edge.to)||(way.nodes[j-1]===edge.to&&id===edge.from))),'Non-adjacent source edge '+edge.from+' / '+edge.to);
  }
  return {edgesChecked:route.edges.length,originalCoordinatesChecked:route.coordinates.length,sourceWays:[...new Set(route.edges.map(e=>e.way))]};
});
check('Sample edge and total distances match independent Haversine oracle',()=>{
  assert(route);let oracle=0,maxEdgeDifference=0;
  for(const edge of route.edges){const distance=independentHaversine(originalNodes.get(edge.from).point,originalNodes.get(edge.to).point);oracle+=distance;const error=Math.abs(distance-edge.length);maxEdgeDifference=Math.max(maxEdgeDifference,error);assert(error<.01,'Edge distance mismatch '+edge.way);}
  assert(Math.abs(oracle-route.distanceMetres)<.05,'Total distance mismatch');
  return {runtimeMetres:route.distanceMetres,independentMetres:oracle,absoluteDifferenceMetres:Math.abs(oracle-route.distanceMetres),maxEdgeDifferenceMetres:maxEdgeDifference,oracleEarthRadiusMetres:6371008.8};
});
check('Sample source ways have no bridge, tunnel, nonzero layer, steps or explicit foot prohibition',()=>{
  assert(route);let ordinarySourceWays=0;
  for(const id of new Set(route.edges.map(e=>e.way))){const t=originalWays.get(id).tags;
    assert(!t.bridge||t.bridge==='no');assert(!t.tunnel||t.tunnel==='no');assert(!t.layer||Number(t.layer)===0);assert.notEqual(t.highway,'steps');assert(!['no','private'].includes(t.foot));
    if(['private','no'].includes(t.access))assert(['yes','designated','permissive','official'].includes(t.foot));
    if(!['footway','path','pedestrian','steps'].includes(t.highway)&&!['yes','designated','permissive','official'].includes(t.foot))ordinarySourceWays++;
  }
  return {hasSteps:route.hasSteps,ordinarySourceWaysWithoutExplicitFootPermission:ordinarySourceWays,permissionStillUnverified:true};
});

check('Geometric intersection alone does not connect; a shared original node does',()=>{
  const nodes=[[1,106,29],[2,106.002,29],[3,106.001,28.999],[4,106.001,29.001],[5,106.001,29]];
  const disconnected=buildWalkGraph(fixture(nodes,[road(10,[1,2]),road(20,[3,4])]));
  assert(connected(disconnected,1,2));assert.equal(findWalkRoute(disconnected,1,4),null);
  const joined=buildWalkGraph(fixture(nodes,[road(10,[1,5,2]),road(20,[3,5,4])]));assert.deepEqual(findWalkRoute(joined,1,4).nodeIDs,[1,5,4]);
});
check('Missing source nodes break connectivity while complete remaining segments survive',()=>{
  const g=buildWalkGraph(fixture(lineNodes.filter(n=>n[0]!==2),[road(10,[1,2,3,4])]));
  assert.equal(findWalkRoute(g,1,4),null);assert.deepEqual(findWalkRoute(g,3,4).nodeIDs,[3,4]);assert(!g.adj.get(1)?.some(e=>e.to===3));
});
check('Motor-vehicle one-way does not constrain walking; oneway:foot does',()=>{
  const motor=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],{oneway:'yes'})]));assert(connected(motor,2,1));
  const forward=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],{oneway:'yes','oneway:foot':'yes'})]));assert(connected(forward,1,2));assert.equal(findWalkRoute(forward,2,1),null);
  const reverse=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],{'oneway:foot':'-1'})]));assert(connected(reverse,2,1));assert.equal(findWalkRoute(reverse,1,2),null);
});
check('Way foot prohibition wins; explicit foot permission overrides general restricted access',()=>{
  const cases=[{tags:{foot:'no',access:'yes'},allowed:false},{tags:{foot:'private'},allowed:false},{tags:{access:'private'},allowed:false},{tags:{access:'no',foot:'yes'},allowed:true},{tags:{access:'private',foot:'designated'},allowed:true},{tags:{access:'customers',foot:'permissive'},allowed:true}];
  for(const test of cases){const g=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],test.tags)]));assert.equal(connected(g,1,2),test.allowed,JSON.stringify(test.tags));}
  return {permissionCases:cases};
});
check('Directional private foot access excludes only that direction',()=>{
  const forward=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],{highway:'footway','foot:forward':'private'})]));assert.equal(findWalkRoute(forward,1,2),null);assert(connected(forward,2,1));
  const backward=buildWalkGraph(fixture(lineNodes,[road(10,[1,2],{highway:'footway','foot:backward':'private'})]));assert.equal(findWalkRoute(backward,2,1),null);assert(connected(backward,1,2));
});
check('Ground-only model excludes bridges, tunnels and nonzero layers',()=>{
  assert(connected(buildWalkGraph(fixture(lineNodes,[road(10,[1,2])])),1,2));
  for(const tags of [{bridge:'yes'},{tunnel:'yes'},{layer:'1'},{layer:'-1'}])assert.equal(findWalkRoute(buildWalkGraph(fixture(lineNodes,[road(10,[1,2],tags)])),1,2),null,JSON.stringify(tags));
});
check('Barrier nodes block gates without permission and honor explicit foot permission/prohibition',()=>{
  const test=tags=>buildWalkGraph(fixture([[1,106,29],[2,106.001,29,tags],[3,106.002,29]],[road(10,[1,2,3])]));
  assert.equal(findWalkRoute(test({barrier:'gate'}),1,3),null);
  assert(connected(test({barrier:'gate',access:'private',foot:'yes'}),1,3));
  assert(connected(test({barrier:'bollard'}),1,3));
  assert.equal(findWalkRoute(test({barrier:'bollard',foot:'no'}),1,3),null);
});
check('Unreachable and unknown endpoints return null',()=>{
  const g=buildWalkGraph(fixture(lineNodes,[road(10,[1,2]),road(20,[3,4])]));assert.equal(findWalkRoute(g,1,4),null);assert.equal(findWalkRoute(g,1,999),null);assert.equal(findWalkRoute(g,999,1),null);
});
check('Shortest path chooses the shorter connected alternative rather than an arbitrary detour',()=>{
  const g=buildWalkGraph(fixture([[1,106,29],[2,106.001,29.0001],[3,106.001,29.004],[4,106.002,29]],[road(10,[1,3,4]),road(20,[1,2,4])]));assert.deepEqual(findWalkRoute(g,1,4).nodeIDs,[1,2,4]);
});
check('Explicit foot-restriction exclusion list is enforced',()=>{
  const g=buildWalkGraph(fixture(lineNodes,[road(10,[1,2])],{excludedFootRestrictionWays:[10]}));assert.equal(findWalkRoute(g,1,2),null);
});
check('Pedestrian-only and avoid-steps options exclude their distinct road classes',()=>{
  const ordinaryOnly=fixture(lineNodes,[road(10,[1,2])]);assert.equal(findWalkRoute(buildWalkGraph(ordinaryOnly,{pedestrianOnly:true}),1,2),null);
  const steps=fixture(lineNodes,[road(10,[1,2],{highway:'steps'})]);assert(connected(buildWalkGraph(steps),1,2));assert.equal(findWalkRoute(buildWalkGraph(steps,{avoidSteps:true}),1,2),null);
});

report.graphStats=graph.stats;
report.sample=route?{start,end,sourceNodeCount:route.nodeIDs.length,sourceEdges:route.edges.length,sourceWayCount:new Set(route.edges.map(e=>e.way)).size,distanceMetres:route.distanceMetres,entrancesConnected:false,status:data.sample.status}:null;
report.limitations=['Tests establish consistency with retained source records and graph rules, not current real-world permission or physical access.','The retrieval rectangle does not guarantee complete surrounding connectivity or a global shortest route.','Sample endpoints are road nodes; candidate POI entrances remain unverified and disconnected.'];
report.passed=report.issues.length===0;
await writeFile(new URL('../WALK-DATA-VERIFICATION.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,issues:report.issues,sample:report.sample,failedChecks:report.checks.filter(c=>!c.passed)},null,2));
if(!report.passed)process.exitCode=1;
