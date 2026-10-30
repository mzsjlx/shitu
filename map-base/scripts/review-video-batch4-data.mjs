import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {validateVideoLibrary} from '../src/video-library-model.js';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const catalog=validateVideoLibrary(await json('data/video-library.json'));
const intake=await json('data/video-intake-batch-20261030.json');
const anchors=(await json('data/video-batch4-open-anchors.json')).anchors;
let before;try{before=await json('.local/batch4-review/catalog-before.json');}catch(error){if(error.code!=='ENOENT')throw error;before=JSON.parse(execFileSync('git',['show','95c88b8:map-base/data/video-library.json'],{encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true}));}
const reports=await json('.local/video-clips/report.json');
const checks=[];
async function check(name,fn){try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.message});}}
const added=catalog.sources.filter(s=>intake.sources.some(x=>x.id===s.id)),segments=added.flatMap(s=>s.segments);
await check('4 distinct works, duplicate ignored, authorization retained',()=>{assert.equal(intake.inputCount,5);assert.equal(intake.distinctWorks,4);assert.equal(added.length,4);assert.equal(new Set(added.map(s=>s.url)).size,4);for(const s of added)assert.equal(s.rights.confirmedOn,'2026-10-30');});
await check('Existing sources and 93 clips remain unchanged',()=>{for(const old of before.sources)assert.deepEqual(catalog.sources.find(s=>s.id===old.id),old);assert.equal(before.sources.reduce((n,s)=>n+s.segments.length,0),93);});
await check('Video count and unlocated content',()=>{assert.equal(segments.length,24);assert.equal(segments.filter(s=>s.coordinates).length,19);assert.equal(segments.filter(s=>!s.coordinates).length,5);});
await check('Approximate nodes agree with original OpenStreetMap records',()=>{for(const s of segments.filter(s=>s.coordinates)){const a=anchors.find(a=>a.id===s.planningLocation.anchor.id);assert(a);assert.deepEqual(s.coordinates,a.coordinates);assert.equal(s.planningLocation.accuracy,'approximate');assert.match(s.planningLocation.note,/待确认|待核/);}});
await check('2025 footage keeps year and current-status qualifier',()=>{for(const s of added.find(s=>s.publishedOn==='2025-07-29').segments)assert.match(s.footageNote,/2025年.*待确认/);});
await check('No name-only merge across different stalls',()=>{assert(segments.every(s=>!s.placeId));assert.notEqual(segments.find(s=>s.id.endsWith('xinyang-guobaorou')).id,segments.find(s=>s.id.endsWith('guobaorou')&&s.id.includes('suisui')).id);});
await check('Every new segment has matching encoded media and poster record',()=>{for(const s of segments){const rec=reports.records.find(r=>r.id===s.id);assert(rec);assert.equal(rec.start,s.start);assert.equal(rec.end,s.end);assert(rec.clipBytes>0&&rec.posterBytes>0);assert(rec.probe.streams.some(v=>v.codec_type==='video'&&v.codec_name==='h264'));assert(rec.probe.streams.some(v=>v.codec_type==='audio'&&v.codec_name==='aac'));}});
const result={executedOn:'2026-10-30',passed:checks.every(x=>x.passed),checks,summary:{sources:added.length,segments:segments.length,located:segments.filter(s=>s.coordinates).length,unlocated:segments.filter(s=>!s.coordinates).length}};
await writeFile('VIDEO-BATCH4-DATA-QA.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
