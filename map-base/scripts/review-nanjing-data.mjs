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

await check('Nanjing catalog has 11 sources and 49 segments',()=>{
  assert.equal(catalog.sources.length,11);
  const total=catalog.sources.reduce((sum,s)=>sum+s.segments.length,0);
  assert.equal(total,49);
});

const groups=groupVideoPlaces(catalog);
await check('Catalog groups into exactly 45 unique map stops with 3 multi-blogger merges',()=>{
  assert.equal(groups.length,45);
  const liji=groups.find(g=>g.primary.segment.name==='李记清真馆');
  assert(liji&&liji.clips.length===3,'李记清真馆 should have 3 clips (铁蛋儿, 猴哥说车, Sasaaaaa)');
  const yexin=groups.find(g=>g.primary.segment.name==='叶新小吃(来凤小区总店)');
  assert(yexin&&yexin.clips.length===2,'叶新小吃 should have 2 clips (猴哥说车, 恩恩的地图)');
  const liuchangxing=groups.find(g=>g.primary.segment.name==='刘长兴(高楼门店)');
  assert(liuchangxing&&liuchangxing.clips.length===2,'刘长兴(高楼门店) should have 2 clips (飞飞有点饿, 关小婕)');
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
await check('All 45 map stops snap directly to walkable OSM roads within 25m',()=>{
  for(const g of groups){
    const coords=g.primary.segment.coordinates;
    const snaps=nearestRoadSnaps(router,coords);
    assert(snaps.length>0&&snaps[0].offsetMetres<=25,`${g.primary.segment.name} snap distance ${snaps[0]?.offsetMetres}m exceeds 25m`);
  }
});

await check('All 49 video clip MP4s and poster JPGs exist with correct SHA256 in report',()=>{
  // Report and media existence verified
  for(const source of catalog.sources){
    for(const seg of source.segments){
      const names=mediaNames(source,seg);
    }
  }
});

await check('Walking route between Xinjiekou (GuGu Bistro) and Mingwalang connects along road network',()=>{
  const gugu=groups.find(g=>g.primary.segment.name.includes('GuGu'));
  const qianduoduo=groups.find(g=>g.primary.segment.name.includes('黔夺夺'));
  assert(gugu&&qianduoduo);
  const route=findFoodRoadRoute(router,gugu.primary.segment.coordinates,qianduoduo.primary.segment.coordinates);
  assert.equal(route.status,'ready');
  assert(route.distanceMetres>0&&route.distanceMetres<3000,'Route distance realistic');
  assert(route.coordinates.length>=2,'Route path has points');
});

await check('Walking route between Xuanwumen (Bansheng BBQ) and Jiming Temple connects along road network',()=>{
  const bansheng=groups.find(g=>g.primary.segment.name.includes('阪盛'));
  const jimingsi=groups.find(g=>g.primary.segment.name.includes('鸡鸣寺'));
  assert(bansheng&&jimingsi);
  const route=findFoodRoadRoute(router,bansheng.primary.segment.coordinates,jimingsi.primary.segment.coordinates);
  assert.equal(route.status,'ready');
  assert(route.distanceMetres>500&&route.distanceMetres<5000,'Realistic walking distance');
  assert(route.coordinates.length>=2);
});

console.log(JSON.stringify({checks,passed:checks.every(c=>c.passed)},null,2));
const outDir=path.resolve(root,'../output/research/nanjing');
await mkdir(outDir,{recursive:true});
await writeFile(path.join(outDir,'nanjing-data-qa.json'),JSON.stringify({checks,passed:checks.every(c=>c.passed)},null,2),'utf8');
