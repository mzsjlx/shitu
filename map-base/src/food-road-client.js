export class FoodRoadClient{
  constructor({loadNetwork,workerURL}){Object.assign(this,{loadNetwork,workerURL});this.generation=0;this.pending=new Map();this.serial=0;}
  cancel(){this.generation++;this.worker?.postMessage({kind:'cancel'});for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(new DOMException('路线已更新','AbortError'));}this.pending.clear();}
  load(){
    if(this.ready)return this.ready;
    this.ready=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
      try{
        const network=await this.loadNetwork(controller.signal);
        await new Promise((resolve,reject)=>{
          this.initialReject=reject;this.worker=new Worker(this.workerURL);
          const initTimer=setTimeout(()=>this.fail(new Error('道路网络展开超时')),15000);
          this.worker.onerror=event=>{event.preventDefault();clearTimeout(initTimer);this.fail(new Error('道路计算暂不可用'));};
          this.worker.onmessage=({data})=>{
            if(data.kind==='ready'){clearTimeout(initTimer);this.initialReject=null;resolve();return;}
            if(data.kind==='error'){clearTimeout(initTimer);this.fail(new Error(data.message||'道路计算失败'));return;}
            if(data.kind==='result'){const task=this.pending.get(data.id);if(!task)return;clearTimeout(task.timer);this.pending.delete(data.id);task.resolve(data.routes);}
          };
          this.worker.postMessage({kind:'init',network});
        });
      }finally{clearTimeout(timer);}
    })().catch(error=>{this.ready=null;throw error;});return this.ready;
  }
  fail(error){this.worker?.terminate();this.worker=null;this.ready=null;this.initialReject?.(error);this.initialReject=null;for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(error);}this.pending.clear();}
  async calculate(points){
    this.cancel();const generation=this.generation;await this.load();if(generation!==this.generation)throw new DOMException('路线已更新','AbortError');
    return new Promise((resolve,reject)=>{const id=++this.serial,timer=setTimeout(()=>this.fail(new Error('道路计算超时')),15000);this.pending.set(id,{resolve,reject,timer});this.worker.postMessage({kind:'route',id,points});});
  }
}
