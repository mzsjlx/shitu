import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildFoodRoadRouter,findFoodRoadRoute,nearestRoadSnaps,routeMidpoint} from '../src/food-road-router.js';
import {buildWalkGraph,findWalkRoute,distanceMetres} from '../src/walk-graph.js';
import {groupVideoPlaces} from '../src/video-places.js';

const load=async name=>JSON.parse(await readFile(new URL('../'+name,import.meta.url),'utf8'));
const reportOption=process.argv.indexOf('--report');
const reportName=reportOption>=0?process.argv[reportOption+1]:'FOOD-ROAD-DATA-QA.json';
if(!/^[A-Za-z0-9_-]+\.json$/.test(reportName))throw new Error('Invalid report filename');
const report={verifiedOn:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),scope:'Source road topology and approximate walking-reference distances; no entrance, live access or navigation validation.',checks:[]};
const check=(name,body)=>{try{const details=body();report.checks.push({name,passed:true,...(details?{details}:{})});}catch(error){report.checks.push({name,passed:false,error:error.message});}};
const way=(id,nodes,tags={})=>({id,nodes,tags:{highway:'residential',...tags}});
const fixture=(nodes,ways,extra={})=>({schemaVersion:1,kind:'food-road-planning-network',coordinateSystem:'WGS84',nodes,ways,...extra});
const line=[[1,106,29],[2,106.01,29],[3,106.02,29]];
const sum=coords=>coords.slice(1).reduce((total,p,i)=>total+distanceMetres(coords[i],p),0);
const independentDistance=(a,b)=>{const r=Math.PI/180,h=Math.sin((b[1]-a[1])*r/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin((b[0]-a[0])*r/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};

check('A U-shaped road follows all source corners instead of a direct line',()=>{
  const nodes=[[1,106,29],[2,106,29.01],[3,106.01,29.01],[4,106.01,29]],r=buildFoodRoadRouter(fixture(nodes,[way(10,[1,2,3,4])]));
  const route=findFoodRoadRoute(r,[106,29],[106.01,29]);assert.equal(route.status,'ready');assert.deepEqual(route.coordinates,nodes.map(n=>n.slice(1)));assert(route.distanceMetres>distanceMetres([106,29],[106.01,29])*2.5);assert(Math.abs(sum(route.coordinates)-route.distanceMetres)<.001);
});
check('Projected endpoints count only the used part of a source segment',()=>{
  const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2,3])])),route=findFoodRoadRoute(r,[106.002,29.0001],[106.008,29.0001]);assert.equal(route.status,'ready');assert.equal(route.coordinates.length,2);assert(route.snaps.every(s=>s.offsetMetres>10));assert(Math.abs(route.distanceMetres-distanceMetres(line[0].slice(1),line[1].slice(1))*.6)<.001);assert(route.distanceMetres<sum(route.coordinates)+.01);
});
check('Foot one-way forbids reverse travel even between projected endpoints',()=>{
  for(const direction of ['yes','-1']){const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2],{'oneway:foot':direction})]));const a=[106.002,29],b=[106.008,29];assert.equal(findFoodRoadRoute(r,...(direction==='yes'?[a,b]:[b,a])).status,'ready');assert.equal(findFoodRoadRoute(r,...(direction==='yes'?[b,a]:[a,b])).status,'unavailable');}
});
check('An exact endpoint may leave through a different adjacent road',()=>{
  const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2],{'oneway:foot':'yes'}),way(20,[1,3])])),route=findFoodRoadRoute(r,[106,29],[106.018,29]);assert.equal(route.status,'ready');assert(route.wayIds.includes(20));
});
check('Vehicle one-way does not block pedestrian reverse travel',()=>{
  const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2],{oneway:'yes'})]));assert.equal(findFoodRoadRoute(r,[106.008,29],[106.002,29]).status,'ready');
});
check('Crossing geometries remain disconnected without a shared source node ID',()=>{
  const nodes=[[1,106,29],[2,106.02,29],[3,106.01,28.99],[4,106.01,29.01]],r=buildFoodRoadRouter(fixture(nodes,[way(10,[1,2]),way(20,[3,4],{bridge:'yes',layer:'1'})]));assert.equal(findFoodRoadRoute(r,[106,29],[106.01,29.01]).reason,'disconnected');
});
check('Source-connected bridges and tunnels work only in the planning profile',()=>{
  for(const tags of [{bridge:'yes',layer:'1'},{tunnel:'yes',layer:'-1'},{highway:'primary'}]){const data=fixture(line,[way(10,[1,2,3],tags)]);assert.equal(findFoodRoadRoute(buildFoodRoadRouter(data),[106,29],[106.02,29]).status,'ready');assert.equal(findWalkRoute(buildWalkGraph(data),1,3),null);}
});
check('Foot/access prohibitions and conditional restrictions are excluded',()=>{
  for(const tags of [{foot:'no'},{access:'private'},{'foot:conditional':'yes @ (08:00-18:00)'},{highway:'motorway'},{highway:'trunk'}]){const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2],tags),way(20,[2,3])]));assert.equal(findFoodRoadRoute(r,[106,29],[106.02,29]).status,'unavailable');}
});
check('Blocked nodes, absent nodes and foot-restriction relations break connectivity',()=>{
  for(const data of [fixture([[1,106,29],[2,106.01,29,{barrier:'gate'}],[3,106.02,29]],[way(10,[1,2,3]),way(20,[1,3],{foot:'no'})]),fixture([line[0],line[2]],[way(10,[1,2,3])]),fixture(line,[way(10,[1,2]),way(20,[2,3])],{excludedFootRestrictionWays:[10]})]){
    try{const r=buildFoodRoadRouter(data);assert.equal(findFoodRoadRoute(r,[106,29],[106.02,29]).status,'unavailable');}catch(e){assert.match(e.message,/没有可用/);}
  }
});
check('Steps retain their source geometry and flag',()=>{
  const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2,3],{highway:'steps'})]));assert.equal(findFoodRoadRoute(r,[106,29],[106.02,29]).hasSteps,true);
});
check('Out-of-coverage and invalid endpoints do not create connectors',()=>{
  const r=buildFoodRoadRouter(fixture(line,[way(10,[1,2])])),outside=findFoodRoadRoute(r,[107,30],[106,29]);assert.equal(outside.reason,'outside-network');for(const p of [null,[NaN,29],[181,29]])assert.deepEqual(nearestRoadSnaps(r,p),[]);
});
check('Empty and incompatible datasets fail explicitly',()=>{
  for(const data of [{},fixture([],[]),{...fixture(line,[way(10,[1,2])]),coordinateSystem:'GCJ02'}])assert.throws(()=>buildFoodRoadRouter(data));
});
check('Distance labels use the midpoint along road geometry',()=>{
  const coords=[[106,29],[106,29.01],[106.02,29.01]],mid=routeMidpoint(coords);assert(mid[0]>106&&Math.abs(mid[1]-29.01)<1e-10);
});

const bytes=await readFile(new URL('../data/food-road-network.json',import.meta.url)),data=JSON.parse(bytes),manifest=await load('data/food-road-network-manifest.json'),router=buildFoodRoadRouter(data);
const groups=groupVideoPlaces(await load('data/video-library.json')).filter(g=>g.primary.segment.coordinates),byID=new Map(groups.map(g=>[g.id.replace(/^video-/,''),g.primary.segment.coordinates]));
check('Frozen network bytes and original extract provenance match the manifest',()=>{
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.networkSHA256);assert.equal(bytes.length,manifest.bytes);assert.deepEqual(data.source,manifest.source);assert.equal(data.nodes.length,manifest.nodes);assert.equal(data.ways.length,manifest.ways);assert.equal(data.source.sha256,'ea1bd60ca0a71231f6ec62bb5ff270594e56559c88d483e25c7e60bcc6fd20ba');return {sourceDate:data.source.date,nodes:data.nodes.length,ways:data.ways.length,segments:router.segments.length};
});
check('Every displayed food point snaps to a nearby source road',()=>{
  const offsets=groups.map(g=>nearestRoadSnaps(router,g.primary.segment.coordinates)[0]?.offsetMetres);assert(offsets.every(v=>Number.isFinite(v)&&v<250));return {points:groups.length,maxOffsetMetres:Math.max(...offsets)};
});
const pairs=[['nangua-nendouya','nangua-cailanzi'],['nangua-sanyangzi','bailong-chunhong'],['tiedan-gangzi','jiankang-zhuer'],['nangua-jeju','manbei-hongjiuge'],['nangua-set-coffee','nangua-sanyangzi'],['nangua-jiachang','nangua-daling']];
const sourceWays=new Map(data.ways.map(w=>[w.id,w]));
for(const [from,to]of pairs)check('Real route: '+from+' → '+to,()=>{
  const route=findFoodRoadRoute(router,byID.get(from),byID.get(to),{audit:true});assert.equal(route.status,'ready');assert(route.coordinates.length>2);
  let independent=0;for(let i=1;i<route.coordinates.length;i++)independent+=independentDistance(route.coordinates[i-1],route.coordinates[i]);assert(Math.abs(independent-route.distanceMetres)<.1);
  for(const e of route.sourceEdges){const w=sourceWays.get(e.way);assert(w);if(e.from<0||e.to<0)continue;assert(w.nodes.some((n,i)=>i&&((n===e.from&&w.nodes[i-1]===e.to)||(n===e.to&&w.nodes[i-1]===e.from))));assert(router.graph.adj.get(e.from).some(edge=>edge.to===e.to&&edge.way===e.way));}
  assert(Math.abs(route.sourceEdges.reduce((t,e)=>t+e.length,0)-route.distanceMetres)<.001);return {distanceMetres:route.distanceMetres,geometryPoints:route.coordinates.length,originalWays:route.wayIds.length,offsetsMetres:route.snaps.map(s=>s.offsetMetres),independentDifferenceMetres:Math.abs(independent-route.distanceMetres)};
});
report.passed=report.checks.every(c=>c.passed);await writeFile(new URL('../'+reportName,import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,passed:report.passed,failures:report.checks.filter(c=>!c.passed)}));if(!report.passed)process.exitCode=1;
