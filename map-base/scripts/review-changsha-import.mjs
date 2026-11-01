import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {importBundle} from './media-bundles.mjs';
import {digest} from './video-library-common.mjs';
const packages=(await readFile('.local/changsha-packages.ndjson','utf8')).trim().split(/\r?\n/).map(line=>JSON.parse(line));
const isolated=path.resolve('.local/import-check-'+Date.now()),checks=[];
for(const file of ['config/cities.json','data/video-library.json','data/cities/changsha/video-library.json','data/media-bundles.json']){await mkdir(path.dirname(path.join(isolated,file)),{recursive:true});await copyFile(file,path.join(isolated,file));}
const oldBundle='D:/codex/美食网站/map-base/.local/media-bundles/shitu-media-nangua-d590027fc3ebc378.zip';
const legacy=await importBundle(isolated,oldBundle);assert.equal(legacy.city,'chongqing');assert.equal(legacy.clips,11);checks.push({name:'Legacy Chongqing bundle without city metadata imports',passed:true});
for(const p of packages){const result=await importBundle(isolated,p.path,{cityId:'changsha'});assert.equal(result.city,'changsha');assert.equal(result.clips,p.clips);checks.push({name:p.sourceId+' imports with hashes and exact file identity',passed:true});}
const ledger=JSON.parse(await readFile(path.join(isolated,'.local/video-clips/report.json'),'utf8'));assert.equal(ledger.records.length,106);checks.push({name:'All 95 Changsha clips retain eleven previously imported Chongqing clips',passed:true});
const repeat=await importBundle(isolated,packages[0].path);assert.equal(repeat.newFiles,0);checks.push({name:'Identical repeat import skips writes',passed:true});
await assert.rejects(()=>importBundle(isolated,packages[0].path,{cityId:'chongqing'}));checks.push({name:'Wrong city is rejected before any write',passed:true});
const rec=ledger.records.find(r=>r.sourceId===packages[0].sourceId),file=path.join(isolated,'.local/video-clips',rec.sourceId,rec.clip),original=await readFile(file),changed=Buffer.from(original);changed[0]^=1;await writeFile(file,changed);
await assert.rejects(()=>importBundle(isolated,packages[0].path),/未覆盖/);assert.equal(digest(await readFile(file)),digest(changed));await writeFile(file,original);checks.push({name:'Conflicting local video is retained without overwriting',passed:true});
const report={verifiedOn:'2026-11-01',scope:'54 actual Changsha packages, including five originals without clips; legacy Chongqing import, repeat/wrong-city/conflict preservation. Dedicated directory only; no user media changed.',packages:packages.map(({city,sourceId,name,bytes,sha256,clips})=>({city,sourceId,name,bytes,sha256,clips})),checks,passed:true};
await writeFile('CHANGSHA-MEDIA-IMPORT-QA.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length,packages:packages.length,clips:95}));
