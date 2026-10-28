const empty=()=>({type:'FeatureCollection',features:[]});
export class VideoMapContext{
  constructor(map,{onBack,onLayout}){
    this.map=map;this.onBack=onBack;this.onLayout=onLayout;this.active=null;
    this.note=document.getElementById('video-map-note');
    document.getElementById('video-map-close').addEventListener('click',()=>{this.clear();const picker=document.getElementById('food-pick-open');(picker.getClientRects().length?picker:document.getElementById('food-entry')).focus({preventScroll:true});});
    document.getElementById('video-map-back').addEventListener('click',event=>{if(this.active)this.onBack(this.active.segmentId,event.currentTarget);});
  }
  show(context,segment,{threeD,bearing,duration}){
    const feature={type:'Feature',properties:{id:context.id,name:context.name,referenceOnly:true,shopLocated:false},geometry:context.geometry};
    if(!this.map.getSource('video-place-reference'))this.map.addSource('video-place-reference',{type:'geojson',data:empty()});
    if(!this.map.getLayer('video-place-reference-fill'))this.map.addLayer({id:'video-place-reference-fill',type:'fill',source:'video-place-reference',paint:{'fill-color':'#d7875f','fill-opacity':.13}},'selected-road-edge');
    if(!this.map.getLayer('video-place-reference-line'))this.map.addLayer({id:'video-place-reference-line',type:'line',source:'video-place-reference',paint:{'line-color':'#a96545','line-width':2,'line-opacity':.85,'line-dasharray':[3,2]}},'selected-road-edge');
    this.map.getSource('video-place-reference').setData({type:'FeatureCollection',features:[feature]});
    for(const id of ['video-place-reference-fill','video-place-reference-line'])this.map.setLayoutProperty(id,'visibility','visible');
    this.active={id:context.id,segmentId:segment.id,sourceId:context.source.id,shopLocated:false};
    document.getElementById('video-map-title').textContent=context.label;
    document.getElementById('video-map-caption').textContent=`浅色轮廓为${context.name} · 分店位置待核`;
    document.getElementById('video-map-back').textContent='回到'+segment.name+'片段 ▷';
    const source=document.getElementById('video-map-source');source.href=context.source.url;source.textContent='参考地标来源 ↗';
    this.note.hidden=false;document.querySelector('.map-shell').classList.add('video-area-mode');
    this.onLayout();
    const b=context.bounds,small=innerWidth<600,short=innerHeight<500;
    this.map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:small?{top:180,bottom:160,left:45,right:65}:short?{top:65,bottom:65,left:300,right:75}:{top:150,bottom:140,left:360,right:170},maxZoom:16.8,pitch:threeD?32:0,bearing:threeD?bearing:0,duration});
    document.getElementById('status').textContent='正在查看'+context.label+'，视频门店的具体位置仍待核对';
    return document.getElementById('video-map-back');
  }
  clear(){
    if(!this.active)return;
    this.active=null;this.note.hidden=true;document.querySelector('.map-shell').classList.remove('video-area-mode');
    for(const id of ['video-place-reference-fill','video-place-reference-line'])if(this.map.getLayer(id))this.map.setLayoutProperty(id,'visibility','none');
    this.map.getSource('video-place-reference')?.setData(empty());this.onLayout();
  }
}
