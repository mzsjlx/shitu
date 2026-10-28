// A visual connection between chosen places, not a walkable route.
export function directDistance(a,b){
  const radians=Math.PI/180,lat1=a[1]*radians,lat2=b[1]*radians;
  const dLat=(b[1]-a[1])*radians,dLng=(b[0]-a[0])*radians;
  const value=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 6371008.8*2*Math.atan2(Math.sqrt(value),Math.sqrt(Math.max(0,1-value)));
}
export function directDistanceText(metres){return metres<1000?Math.round(metres/10)*10+' 米':(metres/1000).toFixed(1)+' 公里';}
export class FoodRoutePreview{
  constructor(map,Marker){this.map=map;this.Marker=Marker;this.labels=[];this.signature='';}
  update(records,enabled){
    const points=enabled?records.map(item=>item.coordinates):[];
    const signature=JSON.stringify(points);if(signature===this.signature)return;
    this.signature=signature;
    for(const label of this.labels)label.remove();this.labels=[];
    const features=[];let total=0;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],distance=directDistance(a,b);total+=distance;
      features.push({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:[a,b]}});
      const badge=document.createElement('span');badge.className='food-distance-badge';badge.textContent='直线约 '+directDistanceText(distance);
      badge.setAttribute('aria-label','两店直线距离约 '+directDistanceText(distance)+'，不是步行路线');
      this.labels.push(new this.Marker({element:badge,anchor:'center',pitchAlignment:'viewport'}).setLngLat([(a[0]+b[0])/2,(a[1]+b[1])/2]).addTo(this.map));
    }
    const data={type:'FeatureCollection',features};
    if(!this.map.getSource('food-direct-preview')&&features.length){
      this.map.addSource('food-direct-preview',{type:'geojson',data});
      this.map.addLayer({id:'food-direct-preview-halo',type:'line',source:'food-direct-preview',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fffaf0','line-width':9,'line-opacity':.95}});
      this.map.addLayer({id:'food-direct-preview-line',type:'line',source:'food-direct-preview',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#f56848','line-width':5,'line-dasharray':[2,1]}});
    }else this.map.getSource('food-direct-preview')?.setData(data);
    this.total=total;this.count=features.length;
  }
}
