import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validateVideoLibrary} from '../src/video-library-model.js';
import {groupVideoPlaces,withinMapBounds} from '../src/video-places.js';
import {buildFoodRoadRouter,nearestRoadSnaps,findFoodRoadRoute} from '../src/food-road-router.js';
import {digest,mediaKey,mediaNames} from './video-library-common.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),checks=[];
process.chdir(root);
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

await check('Nanjing catalog has 79 sources and 164 segments',()=>{
  assert.equal(catalog.sources.length,79);
  const total=catalog.sources.reduce((sum,s)=>sum+s.segments.length,0);
  assert.equal(total,164);
});

const groups=groupVideoPlaces(catalog);
const cityBounds=[118.70, 31.98, 118.88, 32.12];
const locatedGroups=groups.filter(g=>g.primary.segment.coordinates&&withinMapBounds(g.primary.segment,cityBounds));

await check('Catalog groups into 155 items (104 map stops + 51 pending-expansion) with 7 multi-blogger merges',()=>{
  assert.equal(groups.length,155);
  assert.equal(locatedGroups.length,104);

  const liji=groups.find(g=>g.primary.segment.name==='李记清真馆');
  assert(liji&&liji.clips.length===4,'李记清真馆 should have 4 clips (铁蛋儿, 猴哥说车, Sasaaaaa, 特别乌啦啦)');

  const yexin=groups.find(g=>g.primary.segment.name==='叶新小吃(来凤小区总店)');
  assert(yexin&&yexin.clips.length===2,'叶新小吃 should have 2 clips (猴哥说车, 恩恩的地图)');

  const liuchangxing=groups.find(g=>g.primary.segment.name==='刘长兴(高楼门店)');
  assert(liuchangxing&&liuchangxing.clips.length===2,'刘长兴(高楼门店) should have 2 clips (飞飞有点饿, 关小婕)');

  const maxingfa=groups.find(g=>g.primary.segment.name.includes('麻兴发'));
  assert(maxingfa&&maxingfa.clips.length===2,'麻兴发 should have 2 clips (心脏是蓝的, 王炸炸炸炸！！)');

  const banshannan=groups.find(g=>g.primary.segment.name.includes('半山南'));
  assert(banshannan&&banshannan.clips.length===2,'半山南 should have 2 clips (吕六叶, 心脏是蓝的)');

  const dongsheng=groups.find(g=>g.primary.segment.name==='東盛自助料理(新百店)');
  assert(dongsheng&&dongsheng.clips.length===2,'東盛(新百店) should have 2 clips (小红同学, 隔壁的鱼某)');

  const caiting=groups.find(g=>g.primary.segment.name.includes('彩亭精致料理'));
  assert(caiting&&caiting.clips.length===2,'彩亭 should have 2 clips (糊糊大饿, 南京小港姐)');
});

await check('Every located Nanjing segment has a frozen OSM way and node anchor',()=>{
  for(const source of catalog.sources)for(const seg of source.segments){
    if(seg.coordinates){
      assert(seg.coordinates.length===2);
      assert.equal(seg.coordinateSystem,'WGS84');
      assert.equal(seg.routeEligible,false);
      const anchor=seg.planningLocation?.anchor;
      assert(anchor&&anchor.id&&anchor.url.startsWith('https://www.openstreetmap.org/'));
      assert(['original-way-node','nearby-original-way-node'].includes(anchor.method));
      if(anchor.method==='nearby-original-way-node')assert(anchor.coordinates?.length===2&&Number.isFinite(anchor.offsetMetres)&&anchor.offsetMetres<=60);
      assert(Number.isSafeInteger(anchor.nodeId));
    } else {
      assert.equal(seg.routeEligible,false);
      assert(seg.addressText.includes('当前地图范围外') || seg.addressText.includes('待扩图') || seg.addressText.includes('留视频库不上图'));
    }
  }
});

const router=buildFoodRoadRouter(JSON.parse(await readFile('data/cities/nanjing/food-road-network.json','utf8')));
await check('All 104 map stops snap directly to walkable OSM roads within 25m',()=>{
  for(const g of locatedGroups){
    const coords=g.primary.segment.coordinates;
    const snaps=nearestRoadSnaps(router,coords);
    assert(snaps.length>0&&snaps[0].offsetMetres<=25,`${g.primary.segment.name} snap distance ${snaps[0]?.offsetMetres}m exceeds 25m`);
  }
});

await check('All original videos, 164 clips and public posters match their media identities, SHA256 and audio/video duration',async()=>{
  const report=JSON.parse(await readFile('.local/video-clips/report.json','utf8'));
  const posters=JSON.parse(await readFile('data/cities/nanjing/video-posters.json','utf8'));
  for(const source of catalog.sources){
    assert.equal(digest(await readFile(path.join('.local/video-intake',source.id,'source.mp4'))),source.sourceSHA256,`Original hash: ${source.id}`);
    for(const seg of source.segments){
      const names=mediaNames(source,seg);
      const record=report.records.find(r=>r.id===seg.id&&r.mediaKey===mediaKey(source,seg));
      assert(record,`Missing ledger: ${seg.id}`);
      assert.equal(record.sourceSHA256,source.sourceSHA256);
      assert.equal(record.clip,names.clip);assert.equal(record.poster,names.poster);
      const folder=path.join('.local/video-clips',source.id),clipPath=path.join(folder,names.clip);
      assert.equal(digest(await readFile(clipPath)),record.clipSHA256,`Clip hash: ${seg.id}`);
      assert.equal(digest(await readFile(path.join(folder,names.poster))),record.posterSHA256,`Local poster hash: ${seg.id}`);
      const poster=posters.segments[seg.id];
      assert.equal(poster.mediaKey,record.mediaKey);assert.equal(poster.sourceSHA256,source.sourceSHA256);
      assert.equal(poster.path,`assets/video-posters/${source.id}/${names.poster}`);
      assert.equal(digest(await readFile(poster.path)),poster.sha256,`Public poster hash: ${seg.id}`);
      assert.equal(poster.sha256,record.posterSHA256);
      const probe=JSON.parse(execFileSync(process.env.FOODCITY_FFPROBE||'ffprobe',['-v','error','-show_streams','-show_format','-of','json',clipPath],{encoding:'utf8',windowsHide:true}));
      assert(probe.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'),`Video codec: ${seg.id}`);
      assert(probe.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),`Audio codec: ${seg.id}`);
      assert(Math.abs(Number(probe.format.duration)-(seg.end-seg.start))<0.35,`Duration: ${seg.id}`);
    }
  }
});

await check('Walking route between Xinjiekou (GuGu Bistro) and Mingwalang connects along road network',()=>{
  const gugu=groups.find(g=>g.primary.segment.id==='nj-tiansha-gugu');
  const qianduoduo=groups.find(g=>g.primary.segment.id==='nj-tiansha-qianduoduo');
  assert(gugu&&qianduoduo);
  const route=findFoodRoadRoute(router,gugu.primary.segment.coordinates,qianduoduo.primary.segment.coordinates);
  assert.equal(route.status,'ready');
  assert(route.distanceMetres>0&&route.distanceMetres<3000,'Route distance realistic');
  assert(route.coordinates.length>=2,'Route path has points');
});

await check('Walking route between Youfangqiao (Eat Burger) and Yurun Street (Li Ji Noodles) connects along road network',()=>{
  const burger=groups.find(g=>g.primary.segment.id==='nj-feifei-eatburger');
  const noodles=groups.find(g=>g.primary.segment.id==='nj-feifei-lijishouganmian');
  assert(burger&&noodles);
  const route=findFoodRoadRoute(router,burger.primary.segment.coordinates,noodles.primary.segment.coordinates);
  assert.equal(route.status,'ready');
  assert(route.distanceMetres>1000&&route.distanceMetres<5000,'Realistic walking distance along Line 2 corridor');
  assert(route.coordinates.length>=2);
});

const report={verifiedOn:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),scope:'Catalog, approximate references, source/clip/poster SHA256, ffprobe streams/durations and two source-road routes. No shop entrance or current business verification.',checks,passed:checks.every(c=>c.passed)};
console.log(JSON.stringify(report,null,2));
const outDir=path.resolve(root,'../output/research/nanjing');
await mkdir(outDir,{recursive:true});
await writeFile(path.join(outDir,'nanjing-data-qa.json'),JSON.stringify(report,null,2)+'\n','utf8');
if(!report.passed)process.exitCode=1;
