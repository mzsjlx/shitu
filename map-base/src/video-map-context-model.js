const safeId=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(value);
export function validateVideoMapContexts(data,library,bounds=[106.49,29.49,106.65,29.65]){
  if(data?.schemaVersion!==1||data.city!=='chongqing'||!Array.isArray(data.contexts)||!Array.isArray(data.reviews))throw new Error('视频周边资料格式不正确');
  const segments=new Map(library.sources.flatMap(s=>s.segments).map(s=>[s.id,s]));
  const contextIds=new Set(),reviewIds=new Set();
  for(const context of data.contexts){
    if(!safeId(context.id)||contextIds.has(context.id)||context.kind!=='landmark-reference'||context.referenceOnly!==true||context.shopLocated!==false||context.routeEligible!==false||context.coordinateSystem!=='WGS84')throw new Error('周边参考不能被当作分店位置或到店路线');
    contextIds.add(context.id);
    if(typeof context.name!=='string'||!context.name||typeof context.label!=='string'||!Array.isArray(context.segmentIds)||!context.segmentIds.length)throw new Error('视频周边参考缺少地名或片段关系');
    for(const id of context.segmentIds){const s=segments.get(id);if(!s||s.routeEligible!==false||!s.addressText?.includes(context.name))throw new Error('周边地标与原作者地址线索不匹配');}
    const source=context.source;
    if(source?.kind!=='osm-way'||!Number.isSafeInteger(source.id)||source.id<=0||source.url!==`https://www.openstreetmap.org/way/${source.id}`||source.tags?.name!==context.name||source.tags?.amenity!=='place_of_worship'||!/^[a-f0-9]{64}$/.test(source.sourceSHA256||''))throw new Error('周边地标缺少可追溯的原始轮廓来源');
    const rings=context.geometry?.coordinates,ring=rings?.[0];
    if(context.geometry?.type!=='Polygon'||!Array.isArray(rings)||rings.length!==1||!Array.isArray(ring)||ring.length<4||ring.length>500||ring.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<bounds[0]||p[0]>bounds[2]||p[1]<bounds[1]||p[1]>bounds[3])||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw new Error('周边参考轮廓不正确或超出地图范围');
    const actual=[Math.min(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[1]))];
    if(JSON.stringify(actual)!==JSON.stringify(context.bounds))throw new Error('参考范围与原始轮廓不一致');
  }
  for(const review of data.reviews){
    if(!segments.has(review.segmentId)||reviewIds.has(review.segmentId)||review.decision!=='needs-branch-location-evidence'||review.branchMatch!=='unconfirmed'||review.entranceMatch!=='unconfirmed'||review.routeEligible!==false||typeof review.summary!=='string'||typeof review.detail!=='string'||!Array.isArray(review.sources))throw new Error('分店核对记录不能升级地点状态');
    reviewIds.add(review.segmentId);
    for(const source of review.sources){const u=new URL(source.url);if(u.protocol!=='https:'||u.username||u.password||typeof source.label!=='string')throw new Error('店址资料需要安全的HTTPS出处');}
    if(review.addressMatch!==undefined){
      const s=segments.get(review.segmentId),primary=review.sources.filter(source=>['government-publication','brand-contact-page'].includes(source.kind));
      if(review.addressMatch!=='primary-source-crosschecked'||!s.addressText||primary.length!==1||primary[0].readState!=='article-body'||primary[0].conclusion!=='address-text-crosscheck-only')throw new Error('官方地址对照不能由搜索摘要或未知来源代替');
    }
  }
  return data;
}
