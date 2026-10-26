import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,cp,realpath,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCreatorGuides} from './build-creator-guides.mjs';
import {createDraft,assessRecord} from '../src/content-review-model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),research=path.join(root,'../output/research');
const read=p=>readFile(path.join(root,p),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex');
const guides=JSON.parse(await read('data/creator-guides.json')),foods=JSON.parse(await read('data/food-records.json')),catalog=JSON.parse(await read('data/content-review-catalog.json'));
const metadata=JSON.parse(await readFile(path.join(research,'chiichan-2026-10-25.metadata.json'),'utf8')),html=await readFile(path.join(research,metadata.htmlFile));
const checks=[],check=async(name,fn)=>{await fn();checks.push({name,passed:true});};
function parseState(source){
  const marker='window.__INITIAL_STATE__=',offset=source.indexOf(marker);assert(offset>=0);
  let start=offset+marker.length;while(/\s/.test(source[start]))start++;assert.equal(source[start],'{');
  let depth=0,quoted=false,escaped=false;
  for(let i=start;i<source.length;i++){
    const c=source[i];
    if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;continue;}if(c==='{')depth++;if(c==='}'&&--depth===0)return JSON.parse(source.slice(start,i+1));
  }
  throw new Error('Original state JSON incomplete');
}
await check('Frozen creator HTML SHA256 agrees with retrieval manifest',()=>assert.equal(hash(html),metadata.sha256));
const state=parseState(html.toString('utf8')),video=state.videoData,guide=guides.guides[0];
await check('Video identity, author and full title agree with original JSON without executing page code',()=>{assert.equal(video.bvid,guide.videoId);assert.equal(video.owner.name,guide.author);assert.equal(video.title,guide.title);});
await check('Publication date comes from source timestamp and differs from observed/prepared date',()=>{assert.equal(new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date(video.pubdate*1000)),guide.publishedOn);assert.equal(guide.observedOn,metadata.observedDate);assert.notEqual(guide.publishedOn,guides.preparedOn);});
await check('All six exact Chinese names, addresses and chapters occur in original description',()=>{
  assert.equal(guide.restaurants.length,6);
  for(const item of guide.restaurants){assert(video.desc.includes(item.name),item.name);assert(video.desc.includes(item.addressText),item.addressText);assert(video.desc.includes(item.chapterText+' '+item.name),item.chapterText);}
  assert(guide.restaurants.some(r=>r.name==='抄姐老火锅'));assert(guide.restaurants.some(r=>r.name==='牛莫王串串王'));assert(guide.restaurants.some(r=>r.name==='轻松空间･虾蟹馆专注十年'));
});
await check('Exactly one related existing candidate and five unlocated clues contain no invented coordinates',()=>{
  assert.equal(guide.restaurants.filter(r=>r.relatedCandidateId).length,1);
  for(const r of guide.restaurants){for(const key of ['coordinates','longitude','latitude','routeEligible','verificationStatus'])assert(!Object.hasOwn(r,key));if(r.relatedCandidateId){const f=foods.records.find(f=>f.id===r.relatedCandidateId);assert(f&&f.name===r.name);}}
});
await check('Existing two source points and non-route qualifications remain unchanged',()=>{assert.deepEqual(foods.records.map(r=>r.id),['osm-node-13649952401','osm-node-4460519589']);for(const r of foods.records){assert.equal(r.verificationStatus,'source-record');assert.equal(r.entranceStatus,'unverified');assert.equal(r.routeEligible,false);}});
await check('Latest noodles link agrees with guide; historical 2020 link remains',()=>{
  const videos=foods.records[0].videos;assert.equal(videos.length,2);assert.equal(videos[0].url,guide.url);assert.equal(videos[0].author,guide.author);assert.equal(videos[0].chapterText,'0:40');assert.equal(videos[0].observedOn,'2026-10-25');assert.equal(videos[1].publishedOn,'2020-04-20');for(const v of videos){assert.equal(v.branchMatch,'unconfirmed');assert.equal(v.playbackStatus,'not-tested');}
});
await check('Workbench seed uses individual 25 October/22 October source reading dates',()=>{const list=catalog.candidates[0].seed.evidence;assert.equal(list.find(e=>e.id==='video-0').observedOn,'2026-10-25');assert.equal(list.find(e=>e.id==='video-1').observedOn,'2026-10-22');assert.equal(list.find(e=>e.id==='osm').observedOn,'2026-10-19');});
await check('Old workbench base stays stale and cannot become review-ready after content update',()=>{const draft=createDraft(catalog);draft.baseVersion='182c8dec629440ea2b19c3c1e8b696e38f55191558c8d76582a44209877e1e9f';assert.notEqual(draft.baseVersion,catalog.baseVersion);const a=assessRecord(draft.records[0],catalog,draft.baseVersion);assert.equal(a.stale,true);assert.equal(a.status,'incomplete');});

const local=path.join(root,'.local');await mkdir(local,{recursive:true});const temp=await mkdtemp(path.join(local,'guides-qa-'));
try{
  await mkdir(path.join(temp,'data'));await mkdir(path.join(temp,'src'));await cp(path.join(root,'src/creator-guides.css'),path.join(temp,'src/creator-guides.css'));
  const save=async(data=guides,food=foods)=>{await writeFile(path.join(temp,'data/creator-guides.json'),JSON.stringify(data));await writeFile(path.join(temp,'data/food-records.json'),JSON.stringify(food));};
  await save();await buildCreatorGuides(temp);const output=await readFile(path.join(temp,'dist/videos.html'),'utf8');
  await check('Static output has one related map link, five pending markers and no scripts, iframe or seek parameter',()=>{assert.equal((output.match(/class="candidate-link"/g)||[]).length,1);assert.equal((output.match(/class="pending-location"/g)||[]).length,5);assert(!/<script|<iframe|[?&](?:t|start_progress)=/i.test(output));});
  const reject=async change=>{const data=structuredClone(guides),food=structuredClone(foods);change(data,food);await save(data,food);await assert.rejects(()=>buildCreatorGuides(temp));assert.equal(await readFile(path.join(temp,'dist/videos.html'),'utf8'),output);};
  await check('Unsafe source protocols and credential URLs reject before overwriting output',async()=>{for(const url of ['javascript:alert(1)','https://user:pass@example.org/'])await reject(data=>data.guides[0].url=url);});
  await check('Wrong candidate name, missing candidate or elevated map eligibility reject before output changes',async()=>{await reject(data=>data.guides[0].restaurants[0].relatedCandidateId=foods.records[1].id);await reject(data=>data.guides[0].restaurants[0].relatedCandidateId='missing');await reject((data,food)=>food.records[0].routeEligible=true);});
  await check('Duplicate IDs, mismatched chapter seconds and invalid source dates reject before output changes',async()=>{await reject(data=>data.guides[0].restaurants[1].id=data.guides[0].restaurants[0].id);await reject(data=>data.guides[0].restaurants[0].chapterSeconds=41);await reject(data=>data.guides[0].observedOn='2026-02-29');});
  await check('Changed playback status requires wording review instead of silently claiming playback tested',async()=>reject(data=>data.guides[0].playbackStatus='tested'));
  await check('Source title HTML is escaped in generated page',async()=>{const data=structuredClone(guides);data.guides[0].title='<img src=x onerror=alert(1)>';await save(data);await buildCreatorGuides(temp);const safe=await readFile(path.join(temp,'dist/videos.html'),'utf8');assert(safe.includes('&lt;img'));assert(!safe.includes('<img src=x'));});
}finally{
  const actual=await realpath(temp),allowed=await realpath(local);if(!actual.startsWith(allowed+path.sep)||!path.basename(actual).startsWith('guides-qa-'))throw new Error('Unexpected QA cleanup path');await rm(actual,{recursive:true,force:true});
}
const report={date:'2026-10-25',passed:true,scope:'Original public-page text/metadata and isolated static build checks; no video watching, business, branch, entrance or media-use approval.',checks,sourceHTMLSHA256:metadata.sha256,publicFoodSHA256:hash(await read('data/food-records.json'))};
await writeFile(path.join(root,'CREATOR-GUIDES-DATA-QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,publicFoodSHA256:report.publicFoodSHA256}));
