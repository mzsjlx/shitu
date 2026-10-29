// Source-topology research graph. This is not an entrance or navigation validator.
const yes=value=>['yes','designated','permissive','official'].includes(value);
const no=value=>['no','private','customers','delivery','destination','permit','agricultural','forestry'].includes(value);
const absentOrNo=value=>!value||['no','false','0'].includes(value);
const pedestrian=new Set(['footway','path','pedestrian','steps']);
const ordinary=new Set(['residential','living_street','service','unclassified','tertiary','secondary','tertiary_link','secondary_link']);
const conditional=tags=>Object.keys(tags).some(k=>k.includes('conditional')&&(k.startsWith('access')||k.startsWith('foot')||k.startsWith('oneway')));
export function wayExclusion(tags,{pedestrianOnly=false,avoidSteps=false,planningRoads=false}={}){
  const h=tags.highway,explicit=yes(tags.foot);
  if(!pedestrian.has(h)&&!ordinary.has(h)&&!(planningRoads&&['primary','primary_link'].includes(h))&&!(explicit&&['primary','primary_link','cycleway','bridleway'].includes(h)))return 'unsupported-highway';
  if(tags.foot&&!explicit)return 'foot-not-permitted';
  if(no(tags.access)&&!explicit)return 'access-restricted';
  if(tags.access&&!no(tags.access)&&!yes(tags.access)&&!explicit)return 'unknown-access';
  if(conditional(tags))return 'conditional-access';
  if(!planningRoads&&(!absentOrNo(tags.bridge)||!absentOrNo(tags.tunnel)||!absentOrNo(tags.layer)))return 'grade-separated';
  if(tags.area==='yes'||!absentOrNo(tags.indoor)||!absentOrNo(tags.level))return 'indoor-or-area';
  if(['construction','proposed','disused','abandoned'].some(k=>!absentOrNo(tags[k])))return 'inactive';
  if(pedestrianOnly&&!pedestrian.has(h)&&!explicit)return 'ordinary-road-excluded';
  if(avoidSteps&&h==='steps')return 'steps-excluded';
  if(tags['oneway:foot']&&!['yes','1','true','-1','no','0','false'].includes(tags['oneway:foot']))return 'unknown-foot-direction';
  return null;
}
export function distanceMetres(a,b){
  const rad=Math.PI/180,lat=(b[1]-a[1])*rad,lon=(b[0]-a[0])*rad;
  const q=Math.sin(lat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(lon/2)**2;
  return 12742000*Math.asin(Math.sqrt(Math.min(1,q)));
}
function blockedNode(tags){
  if(tags.foot&&!yes(tags.foot))return true;
  if(no(tags.access)&&!yes(tags.foot))return true;
  if(conditional(tags))return true;
  return !!tags.barrier&&tags.barrier!=='bollard'&&!yes(tags.foot);
}
export function buildWalkGraph(data,options={}){
  const nodes=new Map(data.nodes.map(([id,lon,lat,tags={}])=>[id,{id,point:[lon,lat],tags}])),adj=new Map(),ways=new Map(),excluded={};
  let segments=0;
  const blockedWays=new Set(data.excludedFootRestrictionWays||[]);
  const add=(from,to,way,length)=>{if(!adj.has(from))adj.set(from,[]);adj.get(from).push({from,to,way,length});if(!adj.has(to))adj.set(to,[]);};
  for(const way of data.ways){
    const reason=blockedWays.has(way.id)?'foot-restriction-relation':wayExclusion(way.tags,options);
    if(reason){excluded[reason]=(excluded[reason]||0)+1;continue;}
    ways.set(way.id,way);
    const direction=way.tags['oneway:foot'];
    for(let i=1;i<way.nodes.length;i++){
      const a=nodes.get(way.nodes[i-1]),b=nodes.get(way.nodes[i]);
      // Missing nodes break the way. Coordinate intersections never create links.
      if(!a||!b||blockedNode(a.tags)||blockedNode(b.tags))continue;
      const length=distanceMetres(a.point,b.point);if(!Number.isFinite(length)||length<=0)continue;
      if(direction!=='-1'&&(!way.tags['foot:forward']||yes(way.tags['foot:forward'])))add(a.id,b.id,way.id,length);
      if(!['yes','1','true'].includes(direction)&&(!way.tags['foot:backward']||yes(way.tags['foot:backward'])))add(b.id,a.id,way.id,length);
      segments++;
    }
  }
  return {nodes,ways,adj,stats:{nodes:adj.size,ways:ways.size,segments,excluded},options};
}
class Queue{
  heap=[];
  push(item){const h=this.heap;h.push(item);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=item[0])break;h[i]=h[p];i=p;}h[i]=item;}
  pop(){const h=this.heap,first=h[0],last=h.pop();if(h.length){let i=0;while(i*2+1<h.length){let c=i*2+1;if(c+1<h.length&&h[c+1][0]<h[c][0])c++;if(h[c][0]>=last[0])break;h[i]=h[c];i=c;}h[i]=last;}return first;}
}
export function findWalkRoute(graph,start,end){
  if(!graph.adj.has(start)||!graph.adj.has(end))return null;
  const distances=new Map([[start,0]]),previous=new Map(),queue=new Queue();queue.push([0,start]);
  while(queue.heap.length){
    const [distance,id]=queue.pop();if(distance!==distances.get(id))continue;if(id===end)break;
    for(const edge of graph.adj.get(id)||[]){
      const next=distance+edge.length;if(next<(distances.get(edge.to)??Infinity)){distances.set(edge.to,next);previous.set(edge.to,edge);queue.push([next,edge.to]);}
    }
  }
  if(!distances.has(end))return null;
  const edges=[];for(let id=end;id!==start;){const edge=previous.get(id);if(!edge)return null;edges.unshift(edge);id=edge.from;}
  const nodeIDs=[start,...edges.map(e=>e.to)],coordinates=nodeIDs.map(id=>graph.nodes.get(id).point),legs=[];
  for(const edge of edges){const way=graph.ways.get(edge.way);let leg=legs.at(-1);if(!leg||leg.wayID!==way.id){leg={wayID:way.id,name:way.tags.name||'未命名步行通道',highway:way.tags.highway,distanceMetres:0,assumedFootAccess:!pedestrian.has(way.tags.highway)&&!yes(way.tags.foot),nodeIDs:[edge.from]};legs.push(leg);}leg.distanceMetres+=edge.length;leg.nodeIDs.push(edge.to);}
  return {distanceMetres:distances.get(end),nodeIDs,coordinates,edges,legs,assumedAccessWays:legs.filter(l=>l.assumedFootAccess).length,hasSteps:legs.some(l=>l.highway==='steps')};
}
