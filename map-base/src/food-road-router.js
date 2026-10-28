import {buildWalkGraph,distanceMetres} from './walk-graph.js';
const CELL=.0025,EPS=1e-10;
const cell=(x,y)=>x+':'+y;
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;

export function buildFoodRoadRouter(data){
  if(data?.schemaVersion!==1||data.kind!=='food-road-planning-network'||data.coordinateSystem!=='WGS84'||!Array.isArray(data.nodes)||!Array.isArray(data.ways))throw new Error('道路网络资料不完整');
  const graph=buildWalkGraph(data,{planningRoads:true}),segments=[],cells=new Map(),parent=new Map(),sizes=new Map();
  const root=id=>{let r=id;while(parent.get(r)!==r)r=parent.get(r);while(id!==r){const next=parent.get(id);parent.set(id,r);id=next;}return r;};
  for(const id of graph.adj.keys()){parent.set(id,id);sizes.set(id,1);}
  for(const [from,edges]of graph.adj)for(const edge of edges){let a=root(from),b=root(edge.to);if(a===b)continue;if(sizes.get(a)<sizes.get(b))[a,b]=[b,a];parent.set(b,a);sizes.set(a,sizes.get(a)+sizes.get(b));}
  const components=new Map([...graph.adj.keys()].map(id=>[id,root(id)]));
  for(const way of graph.ways.values())for(let i=1;i<way.nodes.length;i++){
    const a=graph.nodes.get(way.nodes[i-1]),b=graph.nodes.get(way.nodes[i]);if(!a||!b)continue;
    const forward=graph.adj.get(a.id)?.find(e=>e.to===b.id&&e.way===way.id),backward=graph.adj.get(b.id)?.find(e=>e.to===a.id&&e.way===way.id);if(!forward&&!backward)continue;
    const segment={key:way.id+':'+i,way:way.id,a:a.id,b:b.id,start:a.point,end:b.point,length:(forward||backward).length,forward:!!forward,backward:!!backward,component:components.get(a.id)};
    const index=segments.push(segment)-1;
    const left=Math.floor(Math.min(a.point[0],b.point[0])/CELL),right=Math.floor(Math.max(a.point[0],b.point[0])/CELL),top=Math.floor(Math.min(a.point[1],b.point[1])/CELL),bottom=Math.floor(Math.max(a.point[1],b.point[1])/CELL);
    for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++){const key=cell(x,y);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(index);}
  }
  if(!segments.length)throw new Error('当前没有可用的沿路资料');
  return {graph,segments,cells,snapCache:new Map(),source:data.source,stats:{...graph.stats,segments:segments.length,components:new Set(components.values()).size}};
}

export function nearestRoadSnaps(router,point,maxMetres=250){
  if(!validPoint(point))return [];
  const key=point.join(',')+':'+maxMetres;if(router.snapCache.has(key))return router.snapCache.get(key);
  const latRadius=maxMetres/110000,lonRadius=latRadius/Math.cos(point[1]*Math.PI/180),ids=new Set();
  for(let x=Math.floor((point[0]-lonRadius)/CELL);x<=Math.floor((point[0]+lonRadius)/CELL);x++)for(let y=Math.floor((point[1]-latRadius)/CELL);y<=Math.floor((point[1]+latRadius)/CELL);y++)for(const id of router.cells.get(cell(x,y))||[])ids.add(id);
  const scale=Math.cos(point[1]*Math.PI/180),snaps=[];
  for(const id of ids){
    const segment=router.segments[id],a=segment.start,b=segment.end,dx=(b[0]-a[0])*scale,dy=b[1]-a[1],length=dx*dx+dy*dy;
    const t=Math.max(0,Math.min(1,((point[0]-a[0])*scale*dx+(point[1]-a[1])*dy)/length)),projected=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],offsetMetres=distanceMetres(point,projected);
    if(offsetMetres<=maxMetres)snaps.push({segment,t,point:projected,offsetMetres});
  }
  snaps.sort((a,b)=>a.offsetMetres-b.offsetMetres||a.segment.way-b.segment.way);
  const result=snaps.slice(0,16);if(router.snapCache.size>500)router.snapCache.clear();router.snapCache.set(key,result);return result;
}

class Queue{
  heap=[];
  push(item){const h=this.heap;h.push(item);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=item[0])break;h[i]=h[p];i=p;}h[i]=item;}
  pop(){const h=this.heap,first=h[0],last=h.pop();if(h.length){let i=0;while(i*2+1<h.length){let c=i*2+1;if(c+1<h.length&&h[c+1][0]<h[c][0])c++;if(h[c][0]>=last[0])break;h[i]=h[c];i=c;}h[i]=last;}return first;}
}

function findSnappedRoute(router,start,end,audit){
  const {graph}=router,S=-1,E=-2,distances=new Map([[S,0]]),previous=new Map(),queue=new Queue();
  const point=id=>id===S?start.point:id===E?end.point:graph.nodes.get(id).point;
  queue.push([distanceMetres(start.point,end.point),0,S]);
  while(queue.heap.length){
    const [,cost,id]=queue.pop();if(cost!==distances.get(id))continue;if(id===E)break;
    const edges=[];
    if(id===S){
      const s=start.segment;
      if(s.backward||start.t<=EPS)edges.push({from:S,to:s.a,way:s.way,length:s.length*start.t});
      if(s.forward||start.t>=1-EPS)edges.push({from:S,to:s.b,way:s.way,length:s.length*(1-start.t)});
      if(s.key===end.segment.key){const difference=end.t-start.t;if(Math.abs(difference)<=EPS||(difference>0&&s.forward)||(difference<0&&s.backward))edges.push({from:S,to:E,way:s.way,length:s.length*Math.abs(difference)});}
    }else{
      edges.push(...graph.adj.get(id)||[]);const s=end.segment;
      if(id===s.a&&(s.forward||end.t<=EPS))edges.push({from:id,to:E,way:s.way,length:s.length*end.t});
      if(id===s.b&&(s.backward||end.t>=1-EPS))edges.push({from:id,to:E,way:s.way,length:s.length*(1-end.t)});
    }
    for(const edge of edges){const next=cost+edge.length;if(next<(distances.get(edge.to)??Infinity)){distances.set(edge.to,next);previous.set(edge.to,edge);queue.push([next+distanceMetres(point(edge.to),end.point),next,edge.to]);}}
  }
  if(!distances.has(E))return null;
  const edges=[];for(let id=E;id!==S;){const edge=previous.get(id);if(!edge)return null;edges.push(edge);id=edge.from;}edges.reverse();
  const coordinates=[start.point];for(const edge of edges){const p=point(edge.to),last=coordinates.at(-1);if(distanceMetres(p,last)>.001)coordinates.push(p);}
  if(coordinates.length===1)coordinates.push(end.point);
  const wayIds=[...new Set(edges.map(e=>e.way))];
  return {distanceMetres:distances.get(E),coordinates,wayIds,hasSteps:wayIds.some(id=>graph.ways.get(id).tags.highway==='steps'),snaps:[start,end].map(s=>({point:s.point,offsetMetres:s.offsetMetres,wayId:s.segment.way})),...(audit?{sourceEdges:edges}: {})};
}

export function findFoodRoadRoute(router,from,to,{audit=false}={}){
  const starts=nearestRoadSnaps(router,from),ends=nearestRoadSnaps(router,to);
  if(!starts.length||!ends.length)return {status:'unavailable',reason:'outside-network'};
  // Keep the nearest source road. Do not move an endpoint to another street just
  // to force a connection or evade a one-way restriction.
  const a=starts[0],b=ends[0];
  if(a.segment.component===b.segment.component){const route=findSnappedRoute(router,a,b,audit);if(route)return {status:'ready',...route};}
  return {status:'unavailable',reason:'disconnected'};
}

export function routeMidpoint(coordinates){
  const distances=[];let total=0;for(let i=1;i<coordinates.length;i++){const d=distanceMetres(coordinates[i-1],coordinates[i]);distances.push(d);total+=d;}
  let left=total/2;
  for(let i=0;i<distances.length;i++){if(left<=distances[i]){const t=distances[i]?left/distances[i]:0,a=coordinates[i],b=coordinates[i+1];return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];}left-=distances[i];}
  return coordinates[0];
}
