import {FoodRoadClient} from './food-road-client.js';
import {routeMidpoint} from './food-road-router.js';
// Distances use the approximate planning positions already shown on the map.
export function directDistance(a,b){
  const radians=Math.PI/180,lat1=a[1]*radians,lat2=b[1]*radians;
  const dLat=(b[1]-a[1])*radians,dLng=(b[0]-a[0])*radians;
  const value=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(value),Math.sqrt(Math.max(0,1-value)));
}
export function directDistanceText(metres){return metres<1000?Math.round(metres/10)*10+' 米':(metres/1000).toFixed(1)+' 公里';}
export class FoodRoutePreview{
  constructor(map,Marker,{loadNetwork,workerURL,onChange=()=>{}}={}){
    Object.assign(this,{map,Marker,onChange});this.labels=[];this.signature='';this.generation=0;this.phase='idle';this.mode='direct';this.total=0;this.count=0;this.missing=0;
    this.roadClient=new FoodRoadClient({loadNetwork,workerURL});
  }
  clear(){
    for(const label of this.labels)label.remove();this.labels=[];
    for(const id of ['food-direct-preview','food-road-preview'])this.map.getSource(id)?.setData({type:'FeatureCollection',features:[]});
    this.total=0;this.count=0;this.missing=0;this.roadPoints=[];
  }
  setLines(id,features,road=false){
    const data={type:'FeatureCollection',features};
    if(!this.map.getSource(id)&&features.length){
      this.map.addSource(id,{type:'geojson',data});
      const filter=road?['==',['get','kind'],'road']:undefined;
      this.map.addLayer({id:id+'-halo',type:'line',source:id,...(filter?{filter}:{}),layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffaf0','line-width':9,'line-opacity':.95}});
      this.map.addLayer({id:id+'-line',type:'line',source:id,...(filter?{filter}:{}),layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f56848','line-width':5,...(!road?{'line-dasharray':[2,1]}:{})}});
      if(road)this.map.addLayer({id:id+'-connections',type:'line',source:id,filter:['==',['get','kind'],'connection'],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#a79782','line-width':2,'line-dasharray':[2,2],'line-opacity':.8}});
    }else this.map.getSource(id)?.setData(data);
  }
  addLabel(point,distance,road=false){
    const badge=document.createElement('span');badge.className='food-distance-badge';badge.textContent=(road?'沿路约 ':'直线约 ')+directDistanceText(distance);
    badge.setAttribute('aria-label',road?'沿道路约 '+directDistanceText(distance)+'，按步行参考估算，不含街区点到道路的短虚线连接':'两店直线距离约 '+directDistanceText(distance));
    this.labels.push(new this.Marker({element:badge,anchor:'center',pitchAlignment:'viewport'}).setLngLat(point).addTo(this.map));
  }
  retry(){this.signature='';}
  update(records,enabled,mode='direct'){
    const points=enabled?records.map(item=>item.coordinates):[],signature=JSON.stringify({mode,points});if(signature===this.signature)return;
    this.signature=signature;const generation=++this.generation;this.roadClient.cancel();this.mode=mode;this.clear();this.phase='idle';
    if(points.length<2){this.onChange();return;}
    if(mode==='direct'){
      const features=[];
      for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],distance=directDistance(a,b);this.total+=distance;features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[a,b]}});this.addLabel([(a[0]+b[0])/2,(a[1]+b[1])/2],distance);}
      this.setLines('food-direct-preview',features);this.count=features.length;this.phase='ready';this.onChange();return;
    }
    this.phase='loading';this.onChange();
    this.roadClient.calculate(points).then(routes=>{
      if(generation!==this.generation)return;
      const features=[];
      routes.forEach((route,index)=>{
        if(route.status!=='ready'){this.missing++;return;}
        features.push({type:'Feature',properties:{kind:'road',leg:index},geometry:{type:'LineString',coordinates:route.coordinates}});
        route.snaps.forEach((snap,side)=>{if(snap.offsetMetres>1)features.push({type:'Feature',properties:{kind:'connection',leg:index},geometry:{type:'LineString',coordinates:[points[index+side],snap.point]}});});
        this.total+=route.distanceMetres;this.count++;this.addLabel(routeMidpoint(route.coordinates),route.distanceMetres,true);
      });
      this.roadPoints=features.filter(f=>f.properties.kind==='road').flatMap(f=>f.geometry.coordinates);
      this.setLines('food-road-preview',features,true);this.phase=this.missing?'partial':'ready';this.onChange();
    }).catch(error=>{if(generation!==this.generation||error.name==='AbortError')return;this.clear();this.phase='error';this.onChange();});
  }
  getStats(){return {mode:this.mode,phase:this.phase,total:this.total,count:this.count,missing:this.missing};}
}
