import {buildWalkGraph,findWalkRoute} from './walk-graph.js';
const $=id=>document.getElementById(id);
export class WalkPreview{
  constructor(map,Marker,{path,readJSON,onFocus,onAppearance,onView}){
    Object.assign(this,{map,Marker,path,readJSON,onFocus,onAppearance,onView});this.phase='unloaded';this.active=false;this.generation=0;this.markers=[];this.pedestrianOnly=false;
    $('walk-entry').addEventListener('click',()=>this.show());
    $('walk-retry').addEventListener('click',()=>this.show());
    $('walk-option').addEventListener('change',e=>e.target.checked?this.show():this.hide());
    $('walk-close').addEventListener('click',()=>{this.hide();$('food-entry').focus({preventScroll:true});});
    $('walk-info').addEventListener('click',()=>{if(!$('walk-dialog').open)$('walk-dialog').showModal();});
    $('walk-dialog-close').addEventListener('click',()=>$('walk-dialog').close());
    $('walk-dialog').addEventListener('close',()=>{if(this.active)$('walk-info').focus({preventScroll:true});});
    $('walk-strict').addEventListener('change',e=>{this.pedestrianOnly=e.target.checked;this.calculate();});
    $('walk-flat').addEventListener('click',()=>this.onView(this.map.getPitch()<5));
    map.on('movestart',e=>{if(e.originalEvent)this.cancelFocus();});
    map.on('moveend',()=>{$('walk-flat').textContent=this.map.getPitch()<5?'立体':'俯瞰';});
  }
  cancelFocus(){this.generation++;if(!this.active)$('walk-option').checked=false;}
  async load(){
    if(this.phase==='loaded')return;if(this.pending)return this.pending;
    this.phase='loading';this.error=null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new Error('道路试算资料读取超时')),12000);
    this.pending=this.readJSON(this.path,{signal:controller.signal}).then(data=>{
      if(data.city!=='chongqing'||!Array.isArray(data.nodes)||!Array.isArray(data.ways)||data.sample?.status!=='road-topology-trial'||data.sample.entrancesConnected!==false||data.sample.endpoints.length!==2)throw new Error('道路样板资料不完整');
      const graph=buildWalkGraph(data);if(data.sample.endpoints.some(e=>!graph.nodes.has(e.nodeID)))throw new Error('样板缺少原始道路端点');
      this.data=data;this.baseGraph=graph;this.phase='loaded';
    }).catch(e=>{this.phase='error';this.error=e.message;$('walk-option').checked=false;$('walk-load-note').hidden=false;}).finally(()=>{clearTimeout(timer);this.pending=null;});
    return this.pending;
  }
  async show(){
    const generation=++this.generation;this.onFocus();$('walk-entry').setAttribute('aria-busy','true');
    await this.load();$('walk-entry').removeAttribute('aria-busy');
    if(generation!==this.generation||this.phase!=='loaded')return;
    this.active=true;$('walk-option').checked=true;$('walk-panel').hidden=false;$('walk-load-note').hidden=true;
    document.querySelector('.map-shell').classList.add('walk-mode');this.onAppearance(true);
    this.calculate();this.map.resize();
    const points=this.endpoints.map(e=>e.point),{width,height}=this.map.getContainer().getBoundingClientRect();
    this.map.fitBounds([[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]],{padding:{top:Math.min(50,height*.1),bottom:Math.min(innerWidth<600?230:160,height*.38),left:Math.min(width*.2,270),right:Math.min(width*.2,270)},pitch:40,bearing:-20,maxZoom:16.5,duration:matchMedia('(prefers-reduced-motion:reduce)').matches?0:900});
  }
  calculate(){
    if(!this.data)return;
    const graph=this.pedestrianOnly?(this.strictGraph??=buildWalkGraph(this.data,{pedestrianOnly:true})):this.baseGraph;this.graph=graph;
    const [a,b]=this.data.sample.endpoints;this.route=findWalkRoute(graph,a.nodeID,b.nodeID);
    this.endpoints=[a,b].map(e=>({...e,point:graph.nodes.get(e.nodeID).point}));
    const geo={type:'FeatureCollection',features:this.route?[{type:'Feature',properties:{kind:'road-topology-trial'},geometry:{type:'LineString',coordinates:this.route.coordinates}}]:[]};
    if(!this.map.getSource('walk-trial')){
      this.map.addSource('walk-trial',{type:'geojson',data:geo});
      this.map.addLayer({id:'walk-trial-halo',type:'line',source:'walk-trial',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffaf0','line-width':10,'line-opacity':.95}});
      this.map.addLayer({id:'walk-trial-line',type:'line',source:'walk-trial',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f37451','line-width':5,'line-dasharray':[2,1]}});
    }else this.map.getSource('walk-trial').setData(geo);
    for(const id of ['walk-trial-halo','walk-trial-line'])this.map.setLayoutProperty(id,'visibility',this.active?'visible':'none');
    for(const marker of this.markers)marker.remove();this.markers=[];
    if(this.active)for(const [i,e] of this.endpoints.entries()){
      const element=document.createElement('span');element.className='walk-endpoint';element.textContent=String(i+1);element.setAttribute('role','img');element.setAttribute('aria-label',(i===0?'起点：':'终点：')+e.label);
      this.markers.push(new this.Marker({element,anchor:'center',pitchAlignment:'viewport'}).setLngLat(e.point).addTo(this.map));
    }
    $('walk-title').textContent='朝千路 → 解放东路';
    $('walk-distance').textContent=this.route?'约 '+(this.route.distanceMetres/1000).toFixed(2)+' 公里':'暂未连通';
    $('walk-caption').textContent=this.route?'道路试算 · 未接门店入口':'仅步行类资料不足，未画连接线';
    $('walk-result-note').textContent=this.route?'按源道路节点累加的二维长度，不含门店入口连接，也没有计算步行时间。当前样板有 '+this.route.assumedAccessWays+' 段普通道路缺少显式步行许可，需另行确认通行。':'现有资料不能在这两个固定道路节点间找到仅由步行类道路构成的路径；这不代表现实中没有路，也不会自动跨过缺口连线。';
    $('walk-data-date').textContent='道路来源：OpenStreetMap · '+this.data.source.date+'，仅重庆局部缓存。';
    const list=$('walk-legs');list.replaceChildren();
    for(const leg of this.route?.legs||[]){const row=document.createElement('li'),link=document.createElement('a'),note=document.createElement('small');link.textContent=leg.name;link.href='https://www.openstreetmap.org/way/'+leg.wayID;link.target='_blank';link.rel='noopener noreferrer';note.textContent=Math.round(leg.distanceMetres)+' 米'+(leg.assumedFootAccess?' · 步行条件待核':' · 步行类源记录');row.append(link,note);list.append(row);}
    $('walk-strict').checked=this.pedestrianOnly;
  }
  hide(){
    this.cancelFocus();this.active=false;$('walk-option').checked=false;$('walk-panel').hidden=true;$('walk-load-note').hidden=true;
    document.querySelector('.map-shell').classList.remove('walk-mode');this.onAppearance(false);
    for(const id of ['walk-trial-halo','walk-trial-line'])if(this.map.getLayer(id))this.map.setLayoutProperty(id,'visibility','none');
    for(const marker of this.markers)marker.remove();this.markers=[];
  }
  inspect(point){
    if(!this.active||!this.route||!this.map.getLayer('walk-trial-line'))return false;
    const hits=this.map.queryRenderedFeatures([[point.x-8,point.y-8],[point.x+8,point.y+8]],{layers:['walk-trial-line']});
    if(!hits.length)return false;if(!$('walk-dialog').open)$('walk-dialog').showModal();return true;
  }
  getStats(){return {phase:this.phase,active:this.active,pedestrianOnly:this.pedestrianOnly,hasRoute:!!this.route,distanceMetres:this.route?.distanceMetres||null,segments:this.route?.edges.length||0,assumedAccessWays:this.route?.assumedAccessWays||0,entrancesConnected:false,error:this.error||null};}
}
