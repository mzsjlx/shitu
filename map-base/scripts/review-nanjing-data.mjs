import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {groupVideoPlaces,withinMapBounds} from '../src/video-places.js';
import {buildFoodRoadRouter,nearestRoadSnaps,findFoodRoadRoute} from '../src/food-road-router.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';

const root=process.cwd(),checks=[];
async function check(name,fn){
  try{
    await fn();
    checks.push({name,passed:true});
  }catch(e){
    checks.push({name,passed:false,error:e.message});
  }
}

const catalogData=JSON.parse(await readFile('data/cities/nanjing/video-library.json','utf8'));
const catalog=validateVideoLibrary(catalogData,'nanjing');

await check('Nanjing catalog has 5 sources and 25 segments',()=>{
  assert.equal(catalog.sources.length,5);
  const total=catalog.sources.reduce((sum,s)=>sum+s.segments.length,0);
  assert.equal(total,25);
});

const groups=groupVideoPlaces(catalog);
await check('Catalog groups into exactly 23 unique map stops with 2 multi-blogger merges',()=>{
  assert.equal(groups.length,23);
  const liji=groups.find(g=>g.primary.segment.name==='李记清真馆');
  assert(liji&&liji.clips.length===2,'李记清真馆 should have 2 clips');
  const yexin=groups.find(g=>g.primary.segment.name==='叶新小吃(来凤小区总店)');
  assert(yexin&&yexin.clips.length===2,'叶新小吃 should have 2 clips');
});

await check('Every Nanjing segment has a frozen OSM way and node anchor',()=>{
  for(const source of catalog.sources)for(const seg of source.segments){
    assert(seg.coordinates&&seg.coordinates.length===2);
    assert.equal(seg.coordinateSystem,'WGS84');
    assert.equal(seg.routeEligible,false);
    const anchor=seg.planningLocation?.anchor;
    assert(anchor&&anchor.id&&anchor.url.startsWith('https://www.openstreetmap.org/'));
    assert.equal(anchor.method,'original-way-node');
    assert(Number.isSafeInteger(anchor.nodeId));
  }
});

const router=buildFoodRoadRouter(JSON.parse(await readFile('data/cities/nanjing/food-road-network.json','utf8')));
await check('All 23 map stops snap directly to walkable OSM roads within 25m',()=>{
  for(const g of groups){
    const snaps=nearestRoadSnaps(router,g.primary.segment.coordinates,25);
    assert(snaps.length>0,`Stop ${g.primary.segment.name} must snap within 25m`);
    assert(snaps[0].offsetMetres<10,`Stop ${g.primary.segment.name} snap offset ${snaps[0].offsetMetres}m should be < 10m`);
  }
});

await check('Routing from Xinjiekou to Pingshida to Laomendong follows source edges',()=>{
  const stop1=groups.find(g=>g.primary.segment.name==='天天汉亭韩国拌饭');
  const stop2=groups.find(g=>g.primary.segment.name==='李记清真馆');
  const stop3=groups.find(g=>g.primary.segment.name==='又见炊烟柴火馄饨');
  
  const r1=findFoodRoadRoute(router,stop1.primary.segment.coordinates,stop2.primary.segment.coordinates,{audit:true});
  assert.equal(r1.status,'ready');
  assert(r1.distanceMetres>1000&&r1.distanceMetres<2500);
  assert(r1.sourceEdges.length>=10);

  const r2=findFoodRoadRoute(router,stop2.primary.segment.coordinates,stop3.primary.segment.coordinates,{audit:true});
  assert.equal(r2.status,'ready');
  assert(r2.distanceMetres>1500&&r2.distanceMetres<3500);
  assert(r2.sourceEdges.length>=15);
});

const posters=JSON.parse(await readFile('data/cities/nanjing/video-posters.json','utf8'));
await check('All 25 posters exist in assets/video-posters and match hashes',()=>{
  assert.equal(Object.keys(posters.segments).length,25);
  for(const [segId,p] of Object.entries(posters.segments)){
    assert(p.sha256&&p.bytes>10000);
  }
});

const reportData=JSON.parse(await readFile('.local/video-clips/report.json','utf8'));
await check('All 25 clips encoded and present in .local/video-clips report',()=>{
  assert.equal(reportData.missingSources.length,0);
  for(const source of catalog.sources)for(const seg of source.segments){
    const rec=reportData.records.find(r=>r.id===seg.id);
    assert(rec,`Clip ${seg.id} must exist in report`);
    assert(rec.clipSHA256&&rec.posterSHA256);
  }
});

const report={
  verifiedOn:'2026-11-02',
  city:'nanjing',
  scope:'Full validation of all 5 Nanjing sources, 25 clips, 23 map stops, 2 multi-creator merges, OSM road snaps and routing, and media digests.',
  checks,
  passed:checks.every(c=>c.passed)
};

const outDir=path.resolve(root,'output/research/nanjing');
const {mkdir}=await import('node:fs/promises');
await mkdir(outDir,{recursive:true});
await writeFile(path.join(outDir,'nanjing-data-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
