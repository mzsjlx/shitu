import {buildFoodRoadRouter,findFoodRoadRoute} from './food-road-router.js';
let router,latest=0;
self.onmessage=async({data})=>{
  if(data.kind==='cancel'){latest++;return;}
  if(data.kind==='init'){
    try{router=buildFoodRoadRouter(data.network);self.postMessage({kind:'ready',stats:router.stats});}
    catch(error){self.postMessage({kind:'error',message:error.message});}return;
  }
  if(data.kind!=='route'||!router)return;
  const generation=++latest,routes=[];
  try{
    for(let i=1;i<data.points.length;i++){
      if(generation!==latest)return;
      routes.push(findFoodRoadRoute(router,data.points[i-1],data.points[i]));
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(generation===latest)self.postMessage({kind:'result',id:data.id,routes});
  }catch(error){self.postMessage({kind:'error',id:data.id,message:error.message});}
};
