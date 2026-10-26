// Preserve source paths. Only the optional lane illustration derives visual widths.
export const typeNames={sidewalk:'人行道',crossing:'过街通道',steps:'台阶通道',pedestrian:'步行街',footpath:'步行小径','raw-road':'道路'};
const radians=Math.PI/180;
const distance=(a,b)=>Math.hypot((b[0]-a[0])*111320*Math.cos((a[1]+b[1])*.5*radians),(b[1]-a[1])*111320);
function trimLine(points,trim){
  const lengths=points.slice(1).map((p,i)=>distance(points[i],p));
  const total=lengths.reduce((a,b)=>a+b,0);
  if(total<trim*2+5)return null;
  const output=[];let at=0;
  for(let i=0;i<lengths.length;i++){
    const len=lengths[i],start=Math.max(trim,at),end=Math.min(total-trim,at+len);
    if(len>0&&end>start){
      const interpolate=s=>points[i].map((value,k)=>value+(points[i+1][k]-value)*(s-at)/len);
      const a=interpolate(start),b=interpolate(end);
      if(!output.length||distance(output.at(-1),a)>.02)output.push(a);
      output.push(b);
    }
    at+=len;
  }
  return output.length>=2?output:null;
}
export function prepareStreetView(collection){
  if(collection?.type!=='FeatureCollection'||!Array.isArray(collection.features))throw new Error('街道资料格式不正确');
  const features=collection.features.filter(f=>{
    const p=f.properties,c=f.geometry?.coordinates;
    return p&&typeNames[p.type]&&f.geometry.type==='LineString'&&Array.isArray(c)&&c.length>=2&&c.every(x=>x.length>=2&&x.every(Number.isFinite))&&
      !p.restricted&&!p.isElevated&&!p.isUnderground&&Number(p.layer||0)===0&&
      !['yes','true','1'].includes(p.indoor)&&p.area!=='yes'&&p.highway!=='corridor'&&
      !['private','no'].includes(p.access)&&(p.type==='raw-road'||!['private','no'].includes(p.foot));
  }).map(f=>({...f,properties:{...f.properties}}));
  const neighbours=new Map();
  for(const f of features){
    const ids=f.properties.nodeIds||[];
    for(let i=1;i<ids.length;i++){
      for(const [a,b] of [[ids[i-1],ids[i]],[ids[i],ids[i-1]]]){
        if(!neighbours.has(a))neighbours.set(a,new Set());
        neighbours.get(a).add(b);
      }
    }
  }
  let illustratedRoads=0,separators=0;
  const derived=[];
  for(const f of features){
    const p=f.properties,n=p.lanes;
    // Unknown two-way allocations and grade-separated roads stay simplified.
    p.illustrated=p.type==='raw-road'&&Number.isInteger(n)&&n>=2&&n<=8&&['yes','1','true','-1'].includes(p.oneway);
    p.modelWidthM=p.illustrated?n*3.2:0;
    if(!p.illustrated)continue;
    illustratedRoads++;
    const coords=f.geometry.coordinates,ids=p.nodeIds||[];
    const cuts=[0,...ids.flatMap((id,i)=>i>0&&i<ids.length-1&&neighbours.get(id)?.size>=3?[i]:[]),coords.length-1];
    for(let part=1;part<cuts.length;part++){
      const trimmed=trimLine(coords.slice(cuts[part-1],cuts[part]+1),Math.max(9,p.modelWidthM*.9));
      if(!trimmed)continue;
      for(let divider=1;divider<n;divider++){
        derived.push({type:'Feature',id:'lane-'+p.osmId+'-'+part+'-'+divider,
          properties:{type:'lane-separator',osmId:p.osmId,name:p.name,offsetM:(divider-n/2)*3.2,illustration:true},
          geometry:{type:'LineString',coordinates:trimmed}});separators++;
      }
    }
  }
  return {data:{type:'FeatureCollection',features:[...features,...derived]},stats:{sourceFeatures:collection.features.length,visibleSourceFeatures:features.length,illustratedRoads,separators,counts:features.reduce((s,f)=>(s[f.properties.type]=(s[f.properties.type]||0)+1,s),{})}};
}
