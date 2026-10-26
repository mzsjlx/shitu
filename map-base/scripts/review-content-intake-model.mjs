import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {analyzeDescription,createIntakeMaterial} from '../src/content-intake-model.js';
import {createDraft,validateDraft,assessRecord} from '../src/content-review-model.js';

const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
const catalog=JSON.parse(await read('data/content-review-catalog.json')),catalogBefore=JSON.stringify(catalog);
const sourceBefore=await read('data/food-records.json'),checks=[];
const check=(name,fn)=>{fn();checks.push({name,passed:true});};
const first=catalog.candidates[0],second=catalog.candidates[1];
const text='普通介绍，不推断口味。\r\n\r\n0:40 '+first.name+'\r\n地址：重庆市渝中区朝千路41号\r\n9:20 未匹配新店\r\n不包含地址或时间的尾注。';
const input={title:'合成QA简介 · 非门店证据',url:'https://example.org/creator?video=qa',author:'QA合成作者',observedOn:'2026-10-25',publishedOn:'2024-02-29',text};
const make=(change={},ids=['line-3','line-4'],candidate=first.id)=>createIntakeMaterial({...input,...change},ids,candidate,catalog,'material-qa-check');

check('Literal lines retain original CRLF/blank-line indices, text and separate clue kinds',()=>{
  const lines=analyzeDescription(text,catalog);assert.deepEqual(lines.map(l=>l.lineNumber),[3,4,5]);
  assert.deepEqual(lines[0].kinds,['timecode','name']);assert.equal(lines[0].text,'0:40 '+first.name);assert.deepEqual(lines[1].kinds,['address']);assert.equal(lines[1].matchedCandidateIds.length,0);
});
check('An unknown restaurant timecode does not create candidate matches',()=>assert.deepEqual(analyzeDescription('9:20 未匹配新店',catalog)[0].matchedCandidateIds,[]));
check('A street-number clue without a known name remains an unassigned address',()=>{const line=analyzeDescription('途经重庆朝千路41号',catalog)[0];assert.deepEqual(line.kinds,['address']);assert.deepEqual(line.matchedCandidateIds,[]);});
check('Ordinary text, incomplete addresses and invalid seconds are not invented as clues',()=>assert.deepEqual(analyzeDescription('今天吃一顿\n地址是什么\n25:99 错误时间\n99:99:40 错误时间',catalog),[]));
check('Valid hour/minute timecodes and full-width colon are recognized literally',()=>assert.equal(analyzeDescription('1:09:40 甲\n0：40 乙\n120:59 丙',catalog).length,3));
check('Empty and oversized descriptions are rejected',()=>{for(const text of ['', '  ', 'x'.repeat(12001)])assert.throws(()=>analyzeDescription(text,catalog));});
check('A recognized source line longer than 400 characters is rejected rather than clipped',()=>assert.throws(()=>analyzeDescription('地址：'+''.padEnd(400,'甲'),catalog),/400/));
check('More than 40 clue lines are rejected for segmented review',()=>assert.throws(()=>analyzeDescription(Array(41).fill('0:40 合成章节').join('\n'),catalog),/40/));
check('Only explicitly selected clues are saved and source order wins over click order',()=>{
  const material=make({},['line-4','line-3']);assert.ok(material.evidence.note.indexOf('第3行')<material.evidence.note.indexOf('第4行'));assert.ok(!material.evidence.note.includes('第5行'));assert.equal(material.evidence.reference,'');
});
check('Manual candidate choice is retained even when another known name occurs',()=>{const material=make({},['line-3'],second.id);assert.equal(material.candidateId,second.id);assert.ok(material.evidence.note.includes('手动归入'));assert.ok(material.evidence.note.includes('不确认分店'));});
check('Observed and published dates remain distinct and valid leap-day dates survive',()=>{const {evidence}=make();assert.equal(evidence.observedOn,'2026-10-25');assert.equal(evidence.publishedOn,'2024-02-29');});
check('No selection is rejected',()=>assert.throws(()=>make({},[]),/勾选/));
check('Unknown and duplicate selections are rejected',()=>{assert.throws(()=>make({},['line-999']));assert.throws(()=>make({},['line-3','line-3']));});
check('Only current candidate IDs can receive material',()=>assert.throws(()=>make({},['line-3'],'invented-candidate'),/已有候选/));
check('HTTPS source URLs reject credentials and executable or local schemes',()=>{for(const url of ['http://example.org/','https://user:pass@example.org/','javascript:alert(1)','data:text/html,hi','file:///tmp/x','not a URL'])assert.throws(()=>make({url}));});
check('Titles and authors obey material limits',()=>{assert.throws(()=>make({title:' '}));assert.throws(()=>make({title:'甲'.repeat(181)}));assert.throws(()=>make({author:'甲'.repeat(101)}));});
check('Invalid observed or published calendar dates are rejected',()=>{for(const observedOn of ['2026-02-29','2026-13-01','bad',''])assert.throws(()=>make({observedOn}));assert.throws(()=>make({publishedOn:'2025-02-29'}));});
check('An unknown publication date can remain empty',()=>assert.equal(make({publishedOn:''}).evidence.publishedOn,''));
check('Oversized selected excerpts are rejected before creating a material',()=>{const text=Array.from({length:6},(_,i)=>'地址：第'+i+'行'+''.padEnd(380,'甲')).join('\n');assert.throws(()=>make({text},Array.from({length:6},(_,i)=>'line-'+(i+1))),/2000/);});
check('Markup remains literal material text without HTML interpretation',()=>{const value=make({text:'地址：<img src=x onerror="alert(1)">朝千路41号'},['line-1']);assert.ok(value.evidence.note.includes('<img src=x'));assert.ok(value.evidence.note.includes('onerror='));});
check('Saving a material does not change checks, branch, entrance, media or route prerequisites',()=>{
  const draft=createDraft(catalog,'2026-10-25T00:00:00.000Z'),before=structuredClone(draft.records[0]),material=make();draft.records[0].evidence.push(material.evidence);validateDraft(draft,catalog);
  for(const key of ['checks','branch','entrance','connection','media'])assert.deepEqual(draft.records[0][key],before[key]);assert.equal(assessRecord(draft.records[0],catalog,draft.baseVersion).status,'incomplete');
});
check('Existing 50-material cap still rejects the proposed 51st material on a copy',()=>{
  const original=createDraft(catalog,'2026-10-25T00:00:00.000Z'),draft=structuredClone(original),record=draft.records[0];
  while(record.evidence.length<50)record.evidence.push({...make().evidence,id:'filler-'+record.evidence.length});validateDraft(draft,catalog);const copy=structuredClone(draft);copy.records[0].evidence.push(make().evidence);assert.throws(()=>validateDraft(copy,catalog),/50/);assert.equal(record.evidence.length,50);assert.equal(original.records[0].evidence.length,catalog.candidates[0].seed.evidence.length);
});
check('Catalog and public candidate file stay unchanged',()=>assert.equal(JSON.stringify(catalog),catalogBefore));
assert.equal(await read('data/food-records.json'),sourceBefore);
const report={date:'2026-10-25',scope:'Pure model checks use synthetic description text. They do not supply real branch, entry, rights or playback evidence.',passed:true,checks,publicFoodSHA256:createHash('sha256').update(sourceBefore).digest('hex')};
await writeFile(new URL('CONTENT-INTAKE-MODEL-QA.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,publicFoodSHA256:report.publicFoodSHA256}));
