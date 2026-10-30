import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {groupVideoPlaces} from '../src/video-places.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const catalog=validateVideoLibrary(await read('data/video-library.json')),intake=await read('data/video-intake-batch-20261029.json');
const snapshot=await read('data/video-batch3-open-anchors.json'),config=await read('config/cities.json'),posters=await read('data/video-posters.json');
const rows=new Map(catalog.sources.flatMap(s=>s.segments).map(s=>[s.id,s]));
const sources=catalog.sources.filter(s=>intake.sources.some(t=>t.id===s.id)),groups=groupVideoPlaces(catalog),checks=[];
const check=async(name,body)=>{try{const details=await body();checks.push({name,passed:true,...(details?{details}:{})});}catch(e){checks.push({name,passed:false,error:e.message});}};
await check('The four supplied works preserve stable URLs, authorization dates and original hashes',()=>{
 assert.equal(sources.length,4);assert.deepEqual(new Set(sources.map(s=>s.url.split('/').at(-1))),new Set(['7602232743804036730','7666393424492268852','7583215165723266354','7692311805913784713']));
 for(const s of sources){const prior=intake.sources.find(t=>t.id===s.id);assert.equal(s.sourceSHA256,prior.sourceSHA256);assert.equal(s.url,prior.url);assert.equal(s.rights.status,'user-confirmed');assert.equal(s.rights.confirmedOn,'2026-10-29');assert.equal(s.durationSeconds,prior.durationSeconds);}
});
await check('All pre-existing sources and their 38 segments are preserved without edits',()=>{
 let clips=0;for(const item of intake.baselineSources){const s=catalog.sources.find(s=>s.id===item.id);assert(s);assert.equal(digest(JSON.stringify(s)),item.canonicalSHA256);clips+=s.segments.length;}assert.equal(clips,38);
});
await check('The registered single-venue ranges and cover seconds match the reviewed intake',()=>{
 let count=0;for(const s of intake.sources)for(const t of s.segments){const live=rows.get(t.id);assert(live);for(const field of ['start','end','posterSecond'])assert.equal(live[field],t[field]);count++;}assert.equal(count,55);return {newClips:count};
});
await check('Matched dumpling shop has one point and two independent creator clips',()=>{
 const primary=rows.get('cq-kaizi-yikoutangjiao'),blue=rows.get('lanmei-yikou');assert.equal(blue.placeId,primary.id);assert.deepEqual(blue.coordinates,primary.coordinates);assert.equal(blue.name,primary.name);assert.equal(blue.category,primary.category);
 const group=groups.find(g=>g.id==='video-'+primary.id);assert(group);assert.equal(group.clips.length,2);
});
await check('Zhu Er retains one point and all three creators',()=>{const group=groups.find(g=>g.id==='video-jiankang-zhuer');assert(group);assert.equal(group.clips.length,3);assert(group.clips.some(c=>c.segment.id==='cq-kaizi-zhuer'));});
await check('Uncertain same-name Cai Ji and same-brand hotpot are not forced into one branch',()=>{assert(!rows.get('cq-kaizi-caijibaozi').placeId);assert(!rows.get('cq-pp-7583215165723266354-caiji').placeId);assert(!rows.get('lanmei-xidajiang').placeId);});
await check('Every new placed clip uses a retained open object inside expanded coverage',()=>{
 const b=config.cities.chongqing.bounds,objects=new Map(snapshot.anchors.map(a=>[a.type+':'+a.id,a]));let count=0;
 for(const s of sources)for(const t of s.segments)if(t.coordinates){
  const p=t.planningLocation,a=p.anchor,type=a.kind.replace('osm-','');
  // Zhu Er reuses a prior frozen street object; all other references are in this batch snapshot.
  if(t.placeId==='jiankang-zhuer'){assert.equal(a.id,297743112);assert.deepEqual(t.coordinates,rows.get('jiankang-zhuer').coordinates);}
  else{const source=objects.get(type+':'+a.id);assert(source,`Missing open object ${a.id}`);assert(source.coordinates.every((v,i)=>Math.abs(v-t.coordinates[i])<=.00000051));assert.equal(a.url,`https://www.openstreetmap.org/${type}/${a.id}`);}
  assert.equal(p.accuracy,'approximate');assert.equal(t.coordinateSystem,'WGS84');assert.equal(t.routeEligible,false);assert(t.coordinates[0]>=b[0]&&t.coordinates[0]<=b[2]&&t.coordinates[1]>=b[1]&&t.coordinates[1]<=b[3]);count++;
 }
 return {placedClips:count,retainedObjects:snapshot.anchors.length};
});
await check('Unlocated clips remain available as evidence rather than fabricated coordinates',()=>{for(const s of sources)for(const t of s.segments)if(!t.coordinates){assert.equal(t.coordinates,null);assert.equal(t.locationStatus,'needs-location');assert(t.addressNote);assert.equal(t.routeEligible,false);}});
await check('PP 2025 footage keeps the historical date and business-status caveat',()=>{const source=sources.find(s=>s.id==='cq-pp-7583215165723266354');assert.equal(source.publishedOn,'2025-12-13');assert(source.segments.every(s=>s.footageNote.includes('2025年')&&s.footageNote.includes('营业情况待确认')));});
await check('Every new cover is a present, frozen local original-video image',async()=>{
 for(const s of sources)for(const t of s.segments){const p=posters.segments[t.id];assert(p);assert.equal(p.sourceId,s.id);assert.equal(p.sourceSHA256,s.sourceSHA256);const bytes=await readFile(new URL(p.path,root));assert.equal(bytes.length,p.bytes);assert.equal(digest(bytes),p.sha256);assert.equal(bytes[0],255);assert.equal(bytes[1],216);}
});
await check('Planning review IDs stay unique after incremental adoption',async()=>{const planning=await read('data/video-planning-locations.json');assert.equal(new Set(planning.reviews.map(r=>r.segmentId)).size,planning.reviews.length);});
const report={verifiedOn:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),scope:'New-source identities, reviewed ranges, explicit same-store merges, original cover bytes and independently retained approximate open-map references; not full listening or current-business verification.',counts:{sources:catalog.sources.length,clips:catalog.sources.reduce((n,s)=>n+s.segments.length,0),mapPoints:groups.filter(g=>g.primary.segment.coordinates).length},checks,passed:checks.every(c=>c.passed)};
await writeFile(new URL('VIDEO-BATCH3-DATA-QA.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
