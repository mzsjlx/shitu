// One-pass audit of the existing cache. No proximity or building-containment inference.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildWalkGraph,findWalkRoute,wayExclusion} from '../map-base/src/walk-graph.js';
const read=async path=>readFile(new URL(path,import.meta.url),'utf8');
const xml=await read('../design/prototype-3d/data/osm-raw.xml');
const raw=JSON.parse(await read('../design/prototype-3d/data/osm-raw.json'));
const source=JSON.parse(await read('../design/prototype-3d/data/osm-source.json'));
const data=JSON.parse(await read('../map-base/data/walk-network.json'));
const sha256=createHash('sha256').update(xml).digest('hex');
assert.equal(sha256,source.sha256);
assert.equal(sha256,data.source.xmlSHA256);
const decode=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&(quot|apos|lt|gt|amp);/g,(_,n)=>({quot:'"',apos:"'",lt:'<',gt:'>',amp:'&'}[n]));
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const tags=s=>Object.fromEntries([...s.matchAll(/<tag\b([^>]*?)\/>/g)].map(m=>{const a=attrs(m[1]);return [a.k,a.v];}));
const nodes=[...xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)].map(m=>{const a=attrs(m[1]);return {type:'node',id:Number(a.id),lon:Number(a.lon),lat:Number(a.lat),tags:tags(m[2]||'')};});
const ways=[...xml.matchAll(/<way\b([^>]*?)>([\s\S]*?)<\/way>/g)].map(m=>{const a=attrs(m[1]);return {type:'way',id:Number(a.id),nodes:[...m[2].matchAll(/<nd\b([^>]*?)\/>/g)].map(n=>Number(attrs(n[1]).ref)),tags:tags(m[2])};});
const relations=[...xml.matchAll(/<relation\b([^>]*?)>([\s\S]*?)<\/relation>/g)].map(m=>({type:'relation',id:Number(attrs(m[1]).id),members:[...m[2].matchAll(/<member\b([^>]*?)\/>/g)].map(n=>{const a=attrs(n[1]);return {type:a.type,ref:Number(a.ref),role:a.role};}),tags:tags(m[2])}));
const nodeByID=new Map(nodes.map(n=>[n.id,n]));
const foodAmenities=new Set(['restaurant','cafe','fast_food','food_court','ice_cream','bar','pub','biergarten']);
const foodShops=new Set(['bakery','pastry','confectionery','deli','cheese','coffee','tea']);
const isFood=e=>foodAmenities.has(e.tags.amenity)||foodShops.has(e.tags.shop);
const food=[...nodes,...ways,...relations].filter(isFood);
const entranceNodes=nodes.filter(n=>n.tags.entrance||n.tags.door||n.tags.amenity==='parking_entrance'||n.tags.railway==='subway_entrance'||n.tags.building==='entrance');
const foodNodeIDs=new Set(food.filter(f=>f.type==='node').map(f=>f.id));
const waysByNode=new Map();
for(const w of ways)for(const id of new Set(w.nodes)){if(!waysByNode.has(id))waysByNode.set(id,[]);waysByNode.get(id).push(w);}
const graph=buildWalkGraph(data),footGraph=buildWalkGraph(data,{pedestrianOnly:true});
const sampleID=data.sample.endpoints[0].nodeID;
const rawNodeByID=new Map(raw.elements.filter(e=>e.type==='node').map(e=>[e.id,e]));
const nodeSummary=n=>{
  const nodeWays=waysByNode.get(n.id)||[];
  const inGraph=graph.adj.has(n.id),inFootGraph=footGraph.adj.has(n.id);
  const connectedSample=inGraph?!!findWalkRoute(graph,n.id,sampleID):false;
  return {id:n.id,name:n.tags.name||n.tags['name:en']||null,coordinates:[n.lon,n.lat],coordinateSystem:'WGS84',
    tags:n.tags,sourceURL:`https://www.openstreetmap.org/node/${n.id}`,
    explicitStreet:n.tags['addr:street']||null,explicitHouseNumber:n.tags['addr:housenumber']||null,explicitFloor:n.tags.level||null,
    explicitEntrance:n.tags.entrance||null,explicitDoor:n.tags.door||null,
    rawJSONCoordinateMatch:rawNodeByID.has(n.id)?n.lon===rawNodeByID.get(n.id).lon&&n.lat===rawNodeByID.get(n.id).lat:null,
    sourceWays:nodeWays.map(w=>({id:w.id,name:w.tags.name||null,highway:w.tags.highway||null,building:w.tags.building||null,walkExclusion:w.tags.highway?wayExclusion(w.tags):'not-highway',tags:w.tags})),
    sourceHighwayWayIDs:nodeWays.filter(w=>w.tags.highway).map(w=>w.id),
    sameNodeInRoadGraph:inGraph,sameNodeInPedestrianOnlyGraph:inFootGraph,canReachTrialStartBySourceNodes:connectedSample,
    graphAcceptedWayIDs:[...new Set((graph.adj.get(n.id)||[]).map(e=>e.way))],
    sourceRelations:relations.filter(r=>r.members.some(m=>m.type==='node'&&m.ref===n.id)).map(r=>({id:r.id,tags:r.tags,matchingRoles:r.members.filter(m=>m.type==='node'&&m.ref===n.id).map(m=>m.role)}))};
};
const foods=food.map(f=>f.type==='node'?{osmType:'node',...nodeSummary(f),entranceIdentityEstablished:!!f.tags.entrance}:({osmType:f.type,id:f.id,tags:f.tags,entranceIdentityEstablished:false}));
const entrances=entranceNodes.map(n=>({osmType:'node',...nodeSummary(n),sameNodeHasFoodTags:foodNodeIDs.has(n.id),kind:n.tags.entrance?'explicit-entrance':n.tags.door?'door':n.tags.railway==='subway_entrance'?'subway-entrance':n.tags.amenity==='parking_entrance'?'parking-entrance':'building-entrance'}));
const explicitFoodEntranceRelations=relations.filter(r=>r.members.some(m=>m.type==='node'&&foodNodeIDs.has(m.ref))&&r.members.some(m=>m.type==='node'&&entranceNodes.some(n=>n.id===m.ref))).map(r=>({id:r.id,tags:r.tags,members:r.members}));
const entranceIds=new Set(entranceNodes.map(n=>n.id));
const directlySharedFoodEntranceWays=ways.filter(w=>w.nodes.some(id=>foodNodeIDs.has(id))&&w.nodes.some(id=>entranceIds.has(id))).map(w=>({id:w.id,tags:w.tags,foodNodeIDs:w.nodes.filter(id=>foodNodeIDs.has(id)),entranceNodeIDs:w.nodes.filter(id=>entranceIds.has(id)),identityEstablished:false}));
const eligible=foods.filter(f=>f.explicitEntrance&&f.explicitStreet&&f.explicitHouseNumber&&f.sameNodeInRoadGraph);
const report={inspectedOn:'2026-10-23',scope:'One pass over existing cached XML/JSON plus current walk graph; no network and no inferred nearest-neighbour connections.',source:{xml:'design/prototype-3d/data/osm-raw.xml',json:'design/prototype-3d/data/osm-raw.json',retrievedAt:source.retrievedAt,sha256,hashMatchesSource:true,hashMatchesWalkGraph:true,coordinateSystem:'WGS84'},
  selection:{foodAmenities:[...foodAmenities],foodShops:[...foodShops],entranceKinds:['entrance=*','door=*','amenity=parking_entrance','railway=subway_entrance','building=entrance'],groceryRetailExcluded:true},
  counts:{originalXMLNodes:nodes.length,originalXMLWays:ways.length,originalXMLRelations:relations.length,foodObjects:foods.length,foodNodes:foods.filter(f=>f.osmType==='node').length,explicitEntranceNodes:entrances.filter(e=>e.kind==='explicit-entrance').length,entranceLikeNodes:entrances.length,foodObjectsWithHouseNumber:foods.filter(f=>f.explicitHouseNumber).length,foodNodesWithEntranceTag:foods.filter(f=>f.explicitEntrance).length,foodNodesInAcceptedRoadGraph:foods.filter(f=>f.sameNodeInRoadGraph).length,explicitEntranceNodesInAcceptedRoadGraph:entrances.filter(e=>e.kind==='explicit-entrance'&&e.sameNodeInRoadGraph).length,explicitFoodEntranceRelations:explicitFoodEntranceRelations.length,directlySharedFoodEntranceWays:directlySharedFoodEntranceWays.length,completeFoodEntranceCandidates:eligible.length},
  graph:{default:graph.stats,pedestrianOnly:footGraph.stats,trialStartNodeID:sampleID},foods,entrances,explicitFoodEntranceRelations,directlySharedFoodEntranceWays,
  eligibleFoodEntranceNodeIDs:eligible.map(e=>e.id),
  conclusions:['No geographic distance, nearest road, same-name shop or shared building was used to establish an entrance.','Graph membership and source-node connectivity are machine-checkable source facts, not confirmation of public foot access or current business operation.','An explicit entrance node connected to the graph cannot be assigned to a restaurant unless the source explicitly establishes that identity.'],
  requiredExternalEvidence:['Current specific branch name and complete address with a dated source.','Explicit entrance coordinates in a known coordinate system and store-to-entrance identity, with supporting door-level evidence.','Walkable entrance-to-road connection, including level/stairs/access/indoor conditions, supported by an actual source line or checked field evidence.','Any onsite publication photo/video permission and branch match handled separately from source geometry.']};
await writeFile(new URL('entrance-candidate-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.counts,null,2));
console.log(JSON.stringify({foodAddress:foods.filter(f=>f.explicitStreet||f.explicitHouseNumber||f.explicitFloor).map(f=>({id:f.id,name:f.name,street:f.explicitStreet,housenumber:f.explicitHouseNumber,floor:f.explicitFloor,inGraph:f.sameNodeInRoadGraph,entrance:f.explicitEntrance})),explicitEntrancesConnected:entrances.filter(e=>e.kind==='explicit-entrance'&&e.sameNodeInRoadGraph).map(e=>({id:e.id,name:e.name,point:e.coordinates,tags:e.tags,graphAcceptedWayIDs:e.graphAcceptedWayIDs,connectedToTrialStart:e.canReachTrialStartBySourceNodes})),foodInGraph:foods.filter(f=>f.sameNodeInRoadGraph).map(f=>({id:f.id,name:f.name,tags:f.tags}))},null,2));
