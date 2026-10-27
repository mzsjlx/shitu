const idPattern=/^[a-z][a-z0-9-]{0,79}$/;
export function validateVideoLibrary(data){
  if(data?.schemaVersion!==1||data.city!=='chongqing'||!Array.isArray(data.sources)||data.sources.length!==3||data.rights?.status!=='user-confirmed')throw new Error('视频资料格式不正确');
  const ids=new Set();
  for(const source of data.sources){
    if(!idPattern.test(source.id)||ids.has(source.id))throw new Error('视频来源ID无效');
    ids.add(source.id);
    const url=new URL(source.url);
    if(url.protocol!=='https:'||url.hostname!=='www.douyin.com'||!/^\/video\/\d+$/.test(url.pathname))throw new Error('视频原页无效');
    if(typeof source.author!=='string'||!source.author||typeof source.title!=='string'||!Number.isFinite(source.durationSeconds)||source.durationSeconds<=0||!Array.isArray(source.segments))throw new Error('视频来源缺少信息');
    if(source.segments.length&&!/^[a-f0-9]{64}$/.test(source.sourceSHA256||''))throw new Error('本地视频缺少来源哈希');
    let previous=0;
    for(const segment of source.segments){
      if(!idPattern.test(segment.id)||ids.has(segment.id))throw new Error('片段ID无效或重复');
      ids.add(segment.id);
      if(typeof segment.name!=='string'||!segment.name.trim()||typeof segment.category!=='string'||typeof segment.summary!=='string'||(segment.addressText!==null&&typeof segment.addressText!=='string'))throw new Error('门店片段缺少信息');
      if(![segment.start,segment.end,segment.posterSecond].every(Number.isFinite)||segment.start<previous||segment.end<=segment.start||segment.end>source.durationSeconds||segment.posterSecond<segment.start||segment.posterSecond>=segment.end)throw new Error('视频分段时间无效或重叠');
      previous=segment.end;
      if(segment.coordinates!==null||segment.routeEligible!==false)throw new Error('这一批视频店址尚未核对，不可附加地图位置或路线资格');
    }
  }
  return data;
}
export function clockText(seconds){const n=Math.floor(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
export function amapSearchUrl(name){
  const url=new URL('https://uri.amap.com/search');
  url.searchParams.set('keyword',name.trim());url.searchParams.set('city','500000');url.searchParams.set('view','list');url.searchParams.set('src','shitu');url.searchParams.set('callnative','0');
  return url.href;
}
