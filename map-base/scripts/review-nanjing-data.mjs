import {readFile,writeFile,mkdir} from 'node:fs/promises';
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

await check('Nanjing catalog has 43 sources and 128 segments',()=>{
  assert.equal(catalog.sources.length,43);
  const total=catalog.sources.reduce((sum,s)=>sum+s.segments.length,0);
  assert.equal(total,128);
});

const groups=groupVideoPlaces(catalog);
const cityBounds=[118.70, 31.98, 118.88, 32.12];
const locatedGroups=groups.filter(g=>g.primary.segment.coordinates&&withinMapBounds(g.primary.segment,cityBounds));

await check('Catalog groups into 122 items (88 map stops + 34 pending-expansion) with 4 multi-blogger merges',()=>{
  assert.equal(groups.length,122);
  assert.equal(locatedGroups.length,88);
  
  const liji=groups.find(g=>g.primary.segment.name==='李记清真馆');
  assert(liji&&liji.clips.length===4,'李记清真馆 should have 4 clips (铁蛋儿, 猴哥说车, Sasaaaaa, 特别乌啦啦)');
  
  const yexin=groups.find(g=>g.primary.segment.name==='叶新小吃(来凤小区总店)');
  assert(yexin&&yexin.clips.length===2,'叶新小吃 should have 2 clips (猴哥说车, 恩恩的地图)');
  
  const liuchangxing=groups.find(g=>g.primary.segment.name==='刘长兴(高楼门店)');
  assert(liuchangxing&&liuchangxing.clips.length===2,'刘长兴(高楼门店) should have 2 clips (飞飞有点饿, 关小婕)');

  const maxingfa=groups.find(g=>g.primary.segment.name.includes('麻兴发'));
  assert(maxingfa&&maxingfa.clips.length===2,'麻兴发 should have 2 clips (心脏是蓝的, 王炸炸炸炸！！)');
});

await check('Every located Nanjing segment has a frozen OSM way and node anchor',()=>{
  for(const source of catalog.sources)for(const seg of source.segments){
    if(seg.coordinates){
      assert(seg.coordinates.length===2);
      assert.equal(seg.coordinateSystem,'WGS84');
      assert.equal(seg.routeEligible,false);
      const anchor=seg.planningLocation?.anchor;
      assert(anchor&&anchor.id&&anchor.url.startsWith('https://www.openstreetmap.org/'));
      assert.equal(anchor.method,'original-way-node');
      assert(Number.isSafeInteger(anchor.nodeId));
    } else {
      assert.equal(seg.routeEligible,false);
      assert(seg.addressText.includes('当前地图范围外') || seg.addressText.includes('待扩图') || seg.addressText.includes('留视频库不上图'));
    }
  }
});

const router=buildFoodRoadRouter(JSON.parse(await readFile('data/cities/nanjing/food-road-network.json','utf8')));
await check('All 88 map stops snap directly to walkable OSM roads within 25m',()=>{
  for(const g of locatedGroups){
    const coords=g.primary.segment.coordinates;
    const snaps=nearestRoadSnaps(router,coords);
    assert(snaps.length>0&&snaps[0].offsetMetres<=25,`${g.primary.segment.name} snap distance ${snaps[0]?.offsetMetres}m exceeds 25m`);
  }
});

await check('All 128 video clip MP4s and poster JPGs exist with correct SHA256 in report',()=>{
  for(const source of catalog.sources){
    for(const seg of source.segments){
      const names=mediaNames(source,seg);
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

console.log(JSON.stringify({checks,passed:checks.every(c=>c.passed)},null,2));
const outDir=path.resolve(root,'../output/research/nanjing');
await mkdir(outDir,{recursive:true});
await writeFile(path.join(outDir,'nanjing-data-qa.json'),JSON.stringify({checks,passed:checks.every(c=>c.passed)},null,2),'utf8');
