import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const facts=JSON.parse(await readFile(path.join(root,'../output/research/video-primary-address-evidence-20261027.json'),'utf8'));
const library=JSON.parse(await readFile(path.join(root,'data/video-library.json'),'utf8'));
const reviewPath=path.join(root,'data/video-location-reviews.json'),data=JSON.parse(await readFile(reviewPath,'utf8'));
const normalize=s=>s.normalize('NFKC').replace(/[\s，,（）()·]/g,'');
for(const fact of facts.records){
 const source=library.sources.find(s=>s.segments.some(r=>r.id===fact.segmentId)),segment=source?.segments.find(r=>r.id===fact.segmentId);
 if(!segment||!segment.addressText||segment.coordinates!==null||segment.routeEligible!==false||fact.readState!=='article-body'||!['government-publication','brand-contact-page'].includes(fact.kind))throw new Error('地址交叉核对需要已读的政府或品牌正文，且不能升级门店坐标');
 const url=new URL(fact.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error('地址来源链接不正确');
 if(!fact.addressMatchParts.length||!fact.nameMatchParts.length||!fact.addressMatchParts.every(p=>normalize(segment.addressText).includes(normalize(p))&&normalize(fact.addressText).includes(normalize(p)))||!fact.nameMatchParts.every(p=>normalize(segment.name).includes(normalize(p))&&normalize(fact.operatorName).includes(normalize(p))))throw new Error('原片与主来源的名称或门牌不相符');
 const review={segmentId:segment.id,decision:'needs-branch-location-evidence',branchMatch:'unconfirmed',entranceMatch:'unconfirmed',routeEligible:false,addressMatch:'primary-source-crosschecked',summary:fact.summary,detail:fact.detail,sources:[{id:'creator-address-card',label:'原视频片尾地址卡',url:source.url,publishedOn:source.publishedOn,observedOn:facts.observedOn,readState:'local-video-frame',frameSeconds:320,addressText:segment.addressText,conclusion:'creator-address-lead'},{id:fact.sourceId,label:fact.label,url:fact.url,publishedOn:fact.publishedOn,observedOn:facts.observedOn,readState:fact.readState,kind:fact.kind,addressText:fact.addressText,operatorName:fact.operatorName,conclusion:'address-text-crosscheck-only'}]};
 const existing=data.reviews.findIndex(r=>r.segmentId===segment.id);if(existing===-1)data.reviews.push(review);else data.reviews[existing]=review;
}
data.reviewedOn=facts.observedOn;await writeFile(reviewPath,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({primaryAddressReviews:facts.records.map(r=>r.segmentId),coordinatesAdopted:0}));
