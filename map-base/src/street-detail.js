import {prepareStreetView,typeNames} from './street-geometry.js';
import {streetLayers,streetHitLayers} from './street-style.js';
export class StreetDetail{
  constructor(map,{config,readJSON,onInspect,onAppearance,onFocus}){
    this.map=map;this.config=config;this.readJSON=readJSON;this.onInspect=onInspect;this.onAppearance=onAppearance;this.onFocus=onFocus;
    this.enabled=true;this.active=false;this.phase='unloaded';this.layerIds=[];this.stats=null;this.error=null;this.focusGeneration=0;
    this.entry=document.getElementById('street-entry');this.note=document.getElementById('street-note');
    this.entry.addEventListener('click',()=>this.focus());
    document.getElementById('street-info').addEventListener('click',()=>document.getElementById('street-dialog').showModal());
    document.getElementById('street-close').addEventListener('click',()=>document.getElementById('street-dialog').close());
    document.getElementById('street-option').addEventListener('change',event=>{this.cancelFocus();this.enabled=event.target.checked;this.update();});
    map.on('movestart',event=>{if(event.originalEvent)this.cancelFocus();});
    map.on('zoom',()=>this.update());map.on('moveend',()=>this.update());this.update();
  }
  inSample(){const c=this.map.getCenter(),b=this.config.bounds;return c.lng>=b[0]&&c.lat>=b[1]&&c.lng<=b[2]&&c.lat<=b[3];}
  async load(){
    if(this.phase==='loaded')return;
    if(this.pending)return this.pending;
    this.phase='loading';this.error=null;
    this.entry.textContent='正在打开街道…';
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(new Error('街道资料加载超时，请重试。')),12000);
    this.pending=(async()=>{
      const [collection,manifest]=await Promise.all([this.readJSON(this.config.data,{signal:controller.signal}),this.readJSON(this.config.manifest,{signal:controller.signal})]);
      const prepared=prepareStreetView(collection);this.manifest=manifest;this.stats=prepared.stats;
      if(!this.map.getSource('street-detail')){
        this.map.addSource('street-detail',{type:'geojson',data:prepared.data,maxzoom:20,tolerance:.1,attribution:'Street detail: © OpenStreetMap contributors'});
        for(const layer of streetLayers()){layer.layout={...layer.layout,visibility:'none'};this.map.addLayer(layer,'selected-road-edge');this.layerIds.push(layer.id);}
      }
      this.phase='loaded';this.entry.textContent='街道近景 ↗';
      document.getElementById('street-source-summary').textContent='此样板使用 '+manifest.source.retrievedAt.slice(0,10)+' 的开放资料，保留 '+prepared.stats.visibleSourceFeatures+' 条地面源记录。车道示意覆盖其中 '+prepared.stats.illustratedRoads+' 条有明确车道数和单向记录的路段。';
      this.update();
    })().catch(error=>{
      this.phase='error';this.error=error.message;this.entry.textContent='重试街道近景 ↗';
      this.note.hidden=false;this.note.textContent='街道样板暂未载入，城市地图仍可使用。';
    }).finally(()=>{clearTimeout(timer);this.pending=null;});
    return this.pending;
  }
  async focus(){
    const generation=++this.focusGeneration;
    this.onFocus();
    this.enabled=true;document.getElementById('street-option').checked=true;
    await this.load();if(this.phase!=='loaded'||!this.enabled||generation!==this.focusGeneration)return;
    const v=this.manifest.recommendedView;
    this.map.easeTo({center:v.center,zoom:v.zoom,pitch:v.pitch,bearing:v.bearing,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1150});
  }
  cancelFocus(){this.focusGeneration++;}
  update(){
    const near=this.enabled&&!this.suppressed&&this.inSample()&&this.map.getZoom()>=16.9;
    if(near&&this.phase==='unloaded')void this.load();
    const active=near&&this.phase==='loaded';
    if(active!==this.active){
      this.active=active;
      for(const id of this.layerIds)this.map.setLayoutProperty(id,'visibility',active?'visible':'none');
      this.onAppearance(active);
    }
    if(this.phase==='loaded'){
      this.note.hidden=!active;
      this.note.textContent='街道样板 · 路宽与标线示意 · 楼体压低显示';
      this.entry.classList.toggle('is-near',active);
    }
  }
  inspect(point){
    if(!this.active||this.map.getZoom()<17.25)return false;
    const p=point,hits=this.map.queryRenderedFeatures([[p.x-5,p.y-5],[p.x+5,p.y+5]],{layers:streetHitLayers});
    const feature=hits.find(f=>f.properties.type!=='raw-road')||hits[0];
    if(!feature)return false;
    const p2=feature.properties;
    this.map.setFilter('street-selected',['==',['get','osmId'],p2.osmId]);
    this.onInspect({...p2,typeName:typeNames[p2.type]});return true;
  }
  clearSelection(){if(this.map.getLayer('street-selected'))this.map.setFilter('street-selected',['==',['get','osmId'],-1]);}
  setSuppressed(value){this.suppressed=value;this.update();}
  setLabels(visible){if(this.map.getLayer('street-names'))this.map.setLayoutProperty('street-names','visibility',this.active&&visible?'visible':'none');}
  getStats(){return {phase:this.phase,enabled:this.enabled,active:this.active,error:this.error,...this.stats,renderedFeatures:this.active?this.map.queryRenderedFeatures({layers:streetHitLayers}).length:0};}
}
