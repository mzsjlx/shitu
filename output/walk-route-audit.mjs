import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const data=await load('design/prototype-3d/data/osm-raw.json');
const source=await load('design/prototype-3d/data/osm-source.json');
const foods=await load('map-base/data/food-records.json');
const xml=await readFile(new URL('design/prototype-3d/data/osm-raw.xml',root));
const actualHash=createHash('sha256').update(xml).digest('hex');
if(actualHash!==source.sha256)throw new Error('Source hash mismatch');
const nodes=new Map(data.elements.filter(e=>e.type==='node').map(n=>[n.id,n]));
for(const m of xml.toString('utf8').matchAll(/<node\b([^>]*?)(?:\/>|>)/g)){
  const a=Object.fromEntries([...m[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(v=>[v[1],v[2]]));
  if(!nodes.has(+a.id))nodes.set(+a.id,{id:+a.id,lon:+a.lon,lat:+a.lat});
}
const ways=data.elements.filter(e=>e.type==='way'&&e.tags?.highway);
const relations=data.elements.filter(e=>e.type==='relation');
const truthy=v=>v&&v!=='no'&&v!=='0'&&v!=='false';
const permitted=new Set(['yes','designated','permissive','official']);
const footClasses=new Set(['footway','pedestrian','path','steps','crossing']);
const normalClasses=new Set(['living_street','residential','service','unclassified','road','tertiary','tertiary_link','secondary','secondary_link','primary','primary_link','track']);
const limitedClasses=new Set(['motorway','motorway_link','trunk','trunk_link','cycleway']);
const counts={inputWays:ways.length,missingNodes:0,incompleteWays:0,footForbidden:0,accessForbidden:0,indoorOrLevel:0,conditional:0,unsupported:0,gradeSeparated:0};
const accepted=[];
for(const w of ways){
  const t=w.tags,missing=w.nodes.filter(id=>!nodes.has(id));
  if(missing.length){counts.incompleteWays++;counts.missingNodes+=missing.length;continue;}
  if(['no','private'].includes(t.foot)){counts.footForbidden++;continue;}
  if(['no','private','customers','destination','permit','delivery','agricultural','forestry'].includes(t.access)&&!permitted.has(t.foot)){counts.accessForbidden++;continue;}
  if(truthy(t.indoor)||t.highway==='corridor'||(t.level&&t.level!=='0')){counts.indoorOrLevel++;continue;}
  if(t['foot:conditional']||t['access:conditional']){counts.conditional++;continue;}
  const explicit=permitted.has(t.foot)||footClasses.has(t.highway);
  if(!explicit&&!normalClasses.has(t.highway)){counts.unsupported++;continue;}
  if(limitedClasses.has(t.highway)&&!permitted.has(t.foot)){counts.unsupported++;continue;}
  const grade=!!truthy(t.bridge)||!!truthy(t.tunnel)||(t.layer&&Number(t.layer)!==0);
  if(grade)counts.gradeSeparated++;
  accepted.push({...w,grade:!!grade,explicitFoot:explicit});
}
const mperlon=111320*Math.cos(29.565*Math.PI/180),mperlat=111320;
const xy=n=>[n.lon*mperlon,n.lat*mperlat];
const meters=(a,b)=>{const x=xy(nodes.get(a)),y=xy(nodes.get(b));return Math.hypot(x[0]-y[0],x[1]-y[1]);};
const haversine=(a,b)=>{const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
const blockedNodes=[...nodes.values()].filter(n=>['no','private'].includes(n.tags?.foot)||(['no','private'].includes(n.tags?.access)&&!permitted.has(n.tags?.foot)));
const blocked=new Set(blockedNodes.map(n=>n.id));
const barrierNodes=[...nodes.values()].filter(n=>n.tags?.barrier);
function graphOf(list){
  const graph=new Map(),edgeList=[];
  const add=(a,b,w)=>{if(!graph.has(a))graph.set(a,[]);graph.get(a).push({to:b,way:w.id,length:meters(a,b)});};
  for(const w of list){
    const t=w.tags;
    for(let i=1;i<w.nodes.length;i++){
      const a=w.nodes[i-1],b=w.nodes[i];if(a===b||blocked.has(a)||blocked.has(b))continue;
      if(t['foot:forward']!=='no'&&!['-1','reverse'].includes(t['oneway:foot']))add(a,b,w);
      if(t['foot:backward']!=='no'&&!['yes','1','true'].includes(t['oneway:foot']))add(b,a,w);
      edgeList.push({a,b,way:w});
    }
  }
  const components=new Map();let component=0;
  // Weak connectivity used only for audit; Dijkstra below respects directed edges.
  const weak=new Map();for(const [a,edges]of graph)for(const e of edges){if(!weak.has(a))weak.set(a,[]);if(!weak.has(e.to))weak.set(e.to,[]);weak.get(a).push(e.to);weak.get(e.to).push(a);}
  const sizes=[];
  for(const id of weak.keys())if(!components.has(id)){let q=[id],size=0;components.set(id,component);for(let at=0;at<q.length;at++){size++;for(const n of weak.get(q[at])||[])if(!components.has(n)){components.set(n,component);q.push(n);}}sizes.push(size);component++;}
  return {graph,edgeList,components,sizes:sizes.sort((a,b)=>b-a)};
}
function nearest(food,g){
  const p={lon:food.coordinates[0],lat:food.coordinates[1]},[px,py]=xy(p);
  return g.edgeList.map(({a,b,way})=>{
    const u=xy(nodes.get(a)),v=xy(nodes.get(b)),dx=v[0]-u[0],dy=v[1]-u[1],s=dx*dx+dy*dy;
    const t=s?Math.max(0,Math.min(1,((px-u[0])*dx+(py-u[1])*dy)/s)):0;
    const q=[u[0]+t*dx,u[1]+t*dy];
    return {distanceMetres:Math.hypot(px-q[0],py-q[1]),way:way.id,name:way.tags.name||'',highway:way.tags.highway,foot:way.tags.foot||null,access:way.tags.access||null,sidewalk:way.tags.sidewalk||null,bridge:way.tags.bridge||null,tunnel:way.tags.tunnel||null,layer:way.tags.layer||null,a,b,t,projection:[q[0]/mperlon,q[1]/mperlat],component:g.components.get(a),sourceTags:way.tags};
  }).sort((a,b)=>a.distanceMetres-b.distanceMetres).filter((r,i,arr)=>arr.findIndex(s=>s.way===r.way)===i).slice(0,8);
}
function dijkstra(g,start,end){
  const d=new Map([[start,0]]),prev=new Map(),todo=new Set([start]);
  while(todo.size){let u=null;for(const id of todo)if(u===null||d.get(id)<d.get(u))u=id;todo.delete(u);if(u===end)break;for(const e of g.graph.get(u)||[]){const n=d.get(u)+e.length;if(n<(d.get(e.to)??Infinity)){d.set(e.to,n);prev.set(e.to,{from:u,...e});todo.add(e.to);}}}
  if(!d.has(end))return null;
  const edges=[];let at=end;while(at!==start){const p=prev.get(at);if(!p)return null;edges.push(p);at=p.from;}edges.reverse();
  const ids=[...new Set(edges.map(e=>e.way))],byID=new Map(accepted.map(w=>[w.id,w]));
  const nodeIDs=[start,...edges.map(e=>e.to)],path=nodeIDs.map(id=>nodes.get(id));
  return {graphDistanceMetres:d.get(end),distanceMethod:'Equirectangular metres, local latitude 29.565; no elevation/entrance distance',haversineGraphMetres:nodeIDs.slice(1).reduce((s,id,i)=>s+haversine(nodes.get(nodeIDs[i]),nodes.get(id)),0),edges:edges.length,nodeIDs,endpointCoordinates:[[path[0].lon,path[0].lat],[path.at(-1).lon,path.at(-1).lat]],pathBounds:[Math.min(...path.map(n=>n.lon)),Math.min(...path.map(n=>n.lat)),Math.max(...path.map(n=>n.lon)),Math.max(...path.map(n=>n.lat))],sourceWays:ids.map(id=>({id,tags:byID.get(id).tags})),warnings:{usesSteps:ids.some(id=>byID.get(id).tags.highway==='steps'),usesGradeSeparated:ids.some(id=>byID.get(id).grade),assumesFootAccessOnOrdinaryRoads:ids.filter(id=>!byID.get(id).explicitFoot).length}};
}
const models={};
for(const [key,list]of Object.entries({groundAndOrdinary:accepted.filter(w=>!w.grade),allGradeAndOrdinary:accepted,explicitPedestrianOnly:accepted.filter(w=>w.explicitFoot)})){
  const g=graphOf(list),near=foods.records.map(f=>({food:f.name,sourceNode:f.coordinateEvidence.id,point:f.coordinates,attachedToGraph:g.components.has(f.coordinateEvidence.id),nearest:nearest(f,g)}));
  const endpoints=near.map(f=>f.nearest[0]);
  const endpointsPresent=endpoints.every(Boolean);
  let route=null;
  if(endpointsPresent){
    // Node endpoints only; the offset is explicitly not an entrance connection.
    const a=endpoints[0].t<.5?endpoints[0].a:endpoints[0].b,b=endpoints[1].t<.5?endpoints[1].a:endpoints[1].b;
    route=dijkstra(g,a,b);
  }
  models[key]={acceptedWays:list.length,graphNodes:g.components.size,segments:g.edgeList.length,weakComponents:g.sizes.length,largestComponentNodes:g.sizes.slice(0,10),foods:near,nearestRoadNodeRoute:route};
}
const restrictionRelations=relations.filter(r=>r.tags?.type==='restriction');
const report={date:'2026-10-22',scope:'Read-only retained source graph audit, not a verified walking route or current merchant entrance.',source:{...source,hashMatches:true,totalNodes:nodes.size,JSONTaggedNodes:data.elements.filter(e=>e.type==='node').length,relations:relations.length},counts,barriers:{total:barrierNodes.length,explicitlyBlocked:blockedNodes.length,nearby:barrierNodes.map(n=>({id:n.id,tags:n.tags,coordinates:[n.lon,n.lat]}))},restrictionRelations,models,recommendation:'Can support a local source-derived road-connectivity research preview. Do not draw an entrance connection or claim navigable shop-to-shop walking directions until branch/entrance/access checks pass. Use original node IDs, retain foot direction/access semantics, and preserve bridge/tunnel layers; do not connect based on projected 2D proximity.'};
report.notes=['Both POI nodes are absent from the walking road graph. Nearest segment projection is a geometric observation, not an entrance connector.','Do not join 2D line intersections or points with nearby XY coordinates unless original node IDs provide topology.','Source bbox is a retrieval scope, not a completeness guarantee. Near-boundary shortest paths may be distorted by unreturned links; no country-wide shortest-path claim.','Street rendering features and visual lane separators are not routing topology. Use raw ways, node IDs and permission/direction tags.','The path below is a local node-to-node trial with unverified foot access on ordinary road centre lines; no walking ETA or door-to-door distance.'];
await writeFile(new URL('output/walk-route-audit.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts,source:{nodes:nodes.size,relations:relations.length,restrictionRelations:restrictionRelations.length,barriers:barrierNodes.length,blocked:blockedNodes.length},models:Object.fromEntries(Object.entries(models).map(([k,m])=>[k,{ways:m.acceptedWays,nodes:m.graphNodes,components:m.weakComponents,foods:m.foods.map(f=>({food:f.food,attached:f.attachedToGraph,nearest:f.nearest.slice(0,3).map(r=>({way:r.way,name:r.name,highway:r.highway,distance:r.distanceMetres,component:r.component}))})),route:m.nearestRoadNodeRoute?{metres:m.nearestRoadNodeRoute.graphDistanceMetres,edges:m.nearestRoadNodeRoute.edges,warnings:m.nearestRoadNodeRoute.warnings,ways:m.nearestRoadNodeRoute.sourceWays}:null}]))},null,2));
