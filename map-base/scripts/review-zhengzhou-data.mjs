import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFoodRoadRouter, findFoodRoadRoute, nearestRoadSnaps } from '../src/food-road-router.js';
import { validateVideoLibrary } from '../src/video-library-model.js';
import { withinMapBounds, groupVideoPlaces } from '../src/video-places.js';
import { allCityCatalogs } from './city-catalogs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, passed: true, details: result || 'OK' });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error: error.message });
    console.error(`[FAIL] ${name}: ${error.message}`);
  }
}

// 1. Config check
await check('1. config/cities.json includes valid zhengzhou entry preserving existing cities', async () => {
  const content = JSON.parse(await readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const zz = content.cities.zhengzhou;
  assert(zz, 'zhengzhou key exists');
  assert.equal(zz.name, '郑州');
  assert.equal(zz.amapCityCode, '410100');
  assert.deepEqual(zz.bounds, [113.58, 34.7, 113.78, 34.83]);
  assert.deepEqual(zz.center, [113.665, 34.753]);
  assert.equal(zz.tiles, 'data/cities/zhengzhou/zhengzhou.pmtiles');
  assert.equal(content.activeCity, 'chongqing', 'activeCity preserved as chongqing');
  assert(content.cities.chongqing, 'chongqing preserved');
  assert(content.cities.changsha, 'changsha preserved');
  assert(content.cities.liuzhou, 'liuzhou preserved');
  assert(content.cities.nanjing, 'nanjing preserved');
  assert(content.cities.chaoshan, 'chaoshan preserved');
  assert(content.cities.wuhan, 'wuhan preserved');
  return { zhengzhouConfig: zz };
});

// 2. PMTiles file check
await check('2. data/cities/zhengzhou/zhengzhou.pmtiles exists, size and sha256 match manifest', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/zhengzhou/zhengzhou.pmtiles'));
  const meta = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/source-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, meta.bytes);
  assert.equal(sha256, meta.sha256);
  assert.equal(bytes.length, 4171880);
  assert.equal(sha256, 'd0c92b0598b8549627aaea9d0919efe348d9166e5242eebc538c6dde52c99a71');
  return { bytes: bytes.length, sha256 };
});

// 3. Data audit check
await check('3. data/cities/zhengzhou/data-audit.json verifies all 285 tiles extracted', async () => {
  const audit = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/data-audit.json'), 'utf8'));
  assert.equal(audit.counters.requestedTiles, 285);
  assert.equal(audit.counters.presentTiles, 285);
  assert(audit.counters.roadLineFragments > 4000);
  assert(audit.counters.buildingPolygonFragments > 18000);
  return { requestedTiles: audit.counters.requestedTiles, presentTiles: audit.counters.presentTiles };
});

// 4. Roads index check
await check('4. data/cities/zhengzhou/roads-index.json has valid groups within bounds', async () => {
  const roads = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/roads-index.json'), 'utf8'));
  assert(roads.roads.length >= 600, `Expected >=600 road groups, got ${roads.roads.length}`);
  const [minLng, minLat, maxLng, maxLat] = roads.bounds;
  assert.equal(minLng, 113.58);
  assert.equal(minLat, 34.7);
  assert.equal(maxLng, 113.78);
  assert.equal(maxLat, 34.83);
  return { roadCount: roads.roads.length, bounds: roads.bounds };
});

// 5. Road network data check and LF line endings check
await check('5. data/cities/zhengzhou/food-road-network.json has valid topological nodes and ways with strict LF line endings', async () => {
  const bytes = await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'));
  const manifest = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network-manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(sha256, manifest.networkSHA256);
  assert.equal(bytes.length, 4184356);
  assert.equal(sha256, '42840c5cecc8a4a9e973c9f9893d81bba134d406c1e60869b4a46bda5525f70e');
  
  // LF line ending verification
  assert(!bytes.includes(Buffer.from('\r\n')), 'Road network JSON must not contain CRLF');
  
  const net = JSON.parse(bytes.toString('utf8'));
  assert.equal(net.city, 'zhengzhou');
  assert.equal(net.nodes.length, manifest.nodes);
  assert.equal(net.ways.length, manifest.ways);
  assert.equal(net.nodes.length, 64780);
  assert.equal(net.ways.length, 10536);
  
  return {
    nodes: net.nodes.length,
    ways: net.ways.length,
    bytes: bytes.length,
    sha256
  };
});

// 6. Terrain data check
await check('6. data/cities/zhengzhou/terrain-manifest.json and 97 DEM tiles exist', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/terrain-manifest.json'), 'utf8'));
  assert.equal(manifest.tiles.length, 97);
  let totalBytes = 0;
  for (const t of manifest.tiles) {
    const tilePath = path.join(root, `data/cities/zhengzhou/terrain/${t.z}/${t.x}/${t.y}.png`);
    const b = await readFile(tilePath);
    totalBytes += b.length;
    const h = crypto.createHash('sha256').update(b).digest('hex');
    assert.equal(h, t.sha256, `Tile ${t.z}/${t.x}/${t.y} sha mismatch`);
  }
  return { tileCount: manifest.tiles.length, totalBytes };
});

// 7. Router connectivity test on real Zhengzhou streets
await check('7. food-road-router calculates genuine Zhengzhou routes and distance between food stops', async () => {
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  assert(router.segments.length > 50000, `Expected >50000 road segments, got ${router.segments.length}`);
  
  // Route 1: 知青老食堂 (沙口路) 到 老蔡记蒸饺 (德化美食街)
  const p1 = [113.6353, 34.7689];
  const p2 = [113.6625, 34.7505];
  const route1 = findFoodRoadRoute(router, p1, p2);
  assert.equal(route1.status, 'ready', 'Route 1 must be ready');
  assert(route1.distanceMetres > 3000 && route1.distanceMetres < 7000, `Expected 3km-7km, got ${route1.distanceMetres}`);
  assert(route1.coordinates.length >= 10, 'Route coordinates present');
  
  // Route 2: 老蔡记 到 合记烩面 (人民路丹尼斯旁)
  const p3 = [113.6625, 34.7505];
  const p4 = [113.6705, 34.7575];
  const route2 = findFoodRoadRoute(router, p3, p4);
  assert.equal(route2.status, 'ready', 'Route 2 must be ready');
  assert(route2.distanceMetres > 900 && route2.distanceMetres < 2500, `Expected 900m-2500m, got ${route2.distanceMetres}`);

  // Out of reach test: point beyond 250m max snap distance returns empty
  const faraway = [112.0, 33.0];
  const snaps = nearestRoadSnaps(router, faraway, 250);
  assert.equal(snaps.length, 0, 'Faraway point must not snap');

  return {
    route1Distance: route1.distanceMetres,
    route2Distance: route2.distanceMetres,
    segments: router.segments.length
  };
});

// 8. Video library validation check
await check('8. data/cities/zhengzhou/video-library.json validates cleanly with 88 user sources and 169 segments', async () => {
  const raw = await readFile(path.join(root, 'data/cities/zhengzhou/video-library.json'), 'utf8');
  const catalog = JSON.parse(raw);
  const validated = validateVideoLibrary(catalog, 'zhengzhou');
  assert.equal(validated.city, 'zhengzhou');
  assert.equal(validated.sources.length, 88, 'Must have 88 sources from user batches');
  
  const allSegments = validated.sources.flatMap(s => s.segments);
  assert.equal(allSegments.length, 169, 'Must have 169 total segments');
  
  const authors = new Set(validated.sources.map(s => s.author));
  assert.equal(authors.size, 67, 'Must have 67 distinct authors');
  
  // Multi-creator deduplication check: 合记烩面
  const hejiSegments = allSegments.filter(s => s.name.includes('合记烩面'));
  assert.equal(hejiSegments.length, 2, '合记烩面 must have 2 segments from 2 creators');
  const secondaryHeji = hejiSegments.find(s => s.placeId);
  assert.equal(secondaryHeji.placeId, 'zz-shiwu-heji', 'Secondary heji must point to primary zz-shiwu-heji');

  // Multi-creator deduplication check: 唐风阁肉夹馍
  const tangfenggeSegments = allSegments.filter(s => s.name.includes('唐风阁肉夹馍'));
  assert.equal(tangfenggeSegments.length, 2, '唐风阁肉夹馍 must have 2 segments from 2 creators');
  const secondaryTangfengge = tangfenggeSegments.find(s => s.placeId);
  assert.equal(secondaryTangfengge.placeId, 'zz-lijiongjiong-tangfengge', 'Secondary tangfengge must point to primary zz-lijiongjiong-tangfengge');

  // Multi-creator deduplication check: 五福油泼面
  const wufuSegments = allSegments.filter(s => s.name.includes('五福油泼面'));
  assert.equal(wufuSegments.length, 2, '五福油泼面 must have 2 segments from 2 creators');
  const secondaryWufu = wufuSegments.find(s => s.placeId);
  assert.equal(secondaryWufu.placeId, 'zz-maikou-wufu', 'Secondary wufu must point to primary zz-maikou-wufu');

  // Multi-creator deduplication check: 买买江新疆大盘鸡
  const maimaijiangSegments = allSegments.filter(s => s.name.includes('买买江新疆大盘鸡'));
  assert.equal(maimaijiangSegments.length, 2, '买买江新疆大盘鸡 must have 2 segments from 2 creators');
  const secondaryMaimaijiang = maimaijiangSegments.find(s => s.placeId);
  assert.equal(secondaryMaimaijiang.placeId, 'zz-wanzitou-maimaijiang', 'Secondary maimaijiang must point to primary zz-wanzitou-maimaijiang');

  // Multi-creator deduplication check: 清真老李牛肉丸子汤
  const laoliSegments = allSegments.filter(s => s.name.includes('老李牛肉丸子汤'));
  assert.equal(laoliSegments.length, 2, '老李牛肉丸子汤 must have 2 segments from 2 creators');
  const secondaryLaoli = laoliSegments.find(s => s.placeId);
  assert.equal(secondaryLaoli.placeId, 'zz-shiwu-laoli', 'Secondary laoli must point to primary zz-shiwu-laoli');

  // Multi-creator deduplication check: 换利小吃
  const huanliSegments = allSegments.filter(s => s.name.includes('换利小吃'));
  assert.equal(huanliSegments.length, 2, '换利小吃 must have 2 segments from 2 creators');
  const secondaryHuanli = huanliSegments.find(s => s.placeId);
  assert.equal(secondaryHuanli.placeId, 'zz-chichi-huanli', 'Secondary huanli must point to primary zz-chichi-huanli');

  // Multi-creator deduplication check: 东三马路小吃街 (银河小强 + 蛋壳Danke)
  const dongsanSegments = allSegments.filter(s => s.name.includes('东三马路小吃街'));
  assert.equal(dongsanSegments.length, 2, '东三马路小吃街 must have 2 segments from 2 creators');
  const secondaryDongsan = dongsanSegments.find(s => s.placeId);
  assert.equal(secondaryDongsan.placeId, 'zz-yinhe-dongsanmalu', 'Secondary dongsanmalu must point to primary zz-yinhe-dongsanmalu');

  // Multi-creator deduplication check: 延庆祥炸鸡（伏牛路店） (迈扣来了 + 盗月社食遇记)
  const yanqingxiangSegments = allSegments.filter(s => s.name.includes('延庆祥炸鸡'));
  assert.equal(yanqingxiangSegments.length, 2, '延庆祥炸鸡 must have 2 segments from 2 creators');
  const secondaryYanqingxiang = yanqingxiangSegments.find(s => s.placeId);
  assert.equal(secondaryYanqingxiang.placeId, 'zz-maikou-yanqingxiang', 'Secondary yanqingxiang must point to primary zz-maikou-yanqingxiang');

  // Multi-creator deduplication check: 可口斋烩面（冉屯东路店） (樱桃大婉子 + 盗月社食遇记)
  const kekouzhaiSegments = allSegments.filter(s => s.name.includes('可口斋烩面'));
  assert.equal(kekouzhaiSegments.length, 2, '可口斋烩面 must have 2 segments from 2 creators');
  const secondaryKekouzhai = kekouzhaiSegments.find(s => s.placeId);
  assert.equal(secondaryKekouzhai.placeId, 'zz-yingtao-kekouzhai', 'Secondary kekouzhai must point to primary zz-yingtao-kekouzhai');

  // Multi-creator deduplication check: 老马家烧烤（保全街店） (香香美食 + 蛋壳Danke)
  const baoquanSegments = allSegments.filter(s => s.name.includes('老马家烧烤'));
  assert.equal(baoquanSegments.length, 2, '老马家烧烤 must have 2 segments from 2 creators');
  const secondaryBaoquan = baoquanSegments.find(s => s.placeId);
  assert.equal(secondaryBaoquan.placeId, 'zz-xiangxiang-jingguang', 'Secondary baoquan must point to primary zz-xiangxiang-jingguang');

  // Multi-creator deduplication check: 齐八两功夫炸海鱼 (百变小樱 + 胖头鱼鱼)
  const zhahaiyuSegments = allSegments.filter(s => s.name.includes('齐八两功夫炸海鱼'));
  assert.equal(zhahaiyuSegments.length, 2, '齐八两功夫炸海鱼 must have 2 segments from 2 creators');
  const secondaryZhahaiyu = zhahaiyuSegments.find(s => s.placeId);
  assert.equal(secondaryZhahaiyu.placeId, 'zz-xiaoying-zhahaiyu', 'Secondary zhahaiyu must point to primary zz-xiaoying-zhahaiyu');

  // Multi-creator deduplication check: 四川凉面 (百变小樱 + 胖头鱼鱼)
  const sichuanliangmianSegments = allSegments.filter(s => s.name.includes('四川凉面'));
  assert.equal(sichuanliangmianSegments.length, 2, '四川凉面 must have 2 segments from 2 creators');
  const secondarySichuanliangmian = sichuanliangmianSegments.find(s => s.placeId);
  assert.equal(secondarySichuanliangmian.placeId, 'zz-xiaoying-sichuanliangmian', 'Secondary sichuanliangmian must point to primary zz-xiaoying-sichuanliangmian');

  // Multi-creator deduplication check: Wood&Fire 意大利自助牛排烤肉披萨餐厅 (饭桶弟弟 + 大韩同学呀)
  const woodfireSegments = allSegments.filter(s => s.name.includes('Wood&Fire'));
  assert.equal(woodfireSegments.length, 2, 'Wood&Fire must have 2 segments from 2 creators');
  const secondaryWoodfire = woodfireSegments.find(s => s.placeId);
  assert.equal(secondaryWoodfire.placeId, 'zz-fantongdidi-woodfire', 'Secondary woodfire must point to primary zz-fantongdidi-woodfire');

  // Multi-creator deduplication check: 穆彦华逍遥镇胡辣汤 (15再吃亿点儿 + 特别乌啦啦)
  const muyanhuaSegments = allSegments.filter(s => s.name.includes('穆彦华逍遥镇胡辣汤'));
  assert.equal(muyanhuaSegments.length, 2, '穆彦华逍遥镇胡辣汤 must have 2 segments from 2 creators');
  const secondaryMuyanhua = muyanhuaSegments.find(s => s.placeId);
  assert.equal(secondaryMuyanhua.placeId, 'zz-shiwu-muyanhu', 'Secondary muyanhua must point to primary zz-shiwu-muyanhu');

  // Single-creator multi-clip check: 石记百花面鱼 / 炒凉粉
  const shijiSegments = allSegments.filter(s => s.id === 'zz-maikou-shiji' || s.id === 'zz-maikou-chaoliangfen');
  assert.equal(shijiSegments.length, 2, '石记百花面鱼 and 炒凉粉 must share location');
  const secondaryShiji = shijiSegments.find(s => s.placeId);
  assert.equal(secondaryShiji.placeId, 'zz-maikou-shiji');

  // Single-creator multi-clip check: 农大牛奶 / 酸奶卷
  const nongdaSegments = allSegments.filter(s => s.id === 'zz-maikou-nongda-niunai' || s.id === 'zz-maikou-nongda-suannaijuan');
  assert.equal(nongdaSegments.length, 2, '农大牛奶 and 酸奶卷 must share location');
  const secondaryNongda = nongdaSegments.find(s => s.placeId);
  assert.equal(secondaryNongda.placeId, 'zz-maikou-nongda-niunai');

  // Groups and stops check
  const bounds = [113.58, 34.7, 113.78, 34.83];
  const groups = groupVideoPlaces(catalog);
  assert.equal(groups.length, 153, '169 segments deduplicate into 153 places');
  
  const inBoundsGroups = groups.filter(g => withinMapBounds(g.primary.segment, bounds));
  assert.equal(inBoundsGroups.length, 140, 'Must have 140 in-bounds distinct map stops');
  
  // Verify every in-bounds segment has valid OSM anchor and connected main-component route, plus media-bundles clips parity
  const net = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/food-road-network.json'), 'utf8'));
  const router = buildFoodRoadRouter(net);
  const wayMap = new Map(net.ways.map(w => [w.id, w]));
  for (const s of allSegments.filter(seg => withinMapBounds(seg, bounds))) {
    const a = s.planningLocation?.anchor;
    assert(a && typeof a.id === 'number' && typeof a.nodeId === 'number', `Valid numeric anchor/nodeId for ${s.id}`);
    if (a.kind === 'osm-way') {
      assert.notEqual(a.id, a.nodeId, `wayId must not equal nodeId for ${s.id}`);
      const w = wayMap.get(a.id);
      assert(w && w.nodes.includes(a.nodeId), `nodeId ${a.nodeId} must belong to way ${a.id} for ${s.id}`);
    }
    assert(router.graph.nodes.has(a.nodeId), `nodeId ${a.nodeId} in network for ${s.id}`);
    const rt = findFoodRoadRoute(router, s.coordinates, [113.6625, 34.7505]);
    assert.equal(rt.status, 'ready', `Stop ${s.id} must route without isolation/disconnection`);
  }
  const bundles = JSON.parse(await readFile(path.join(root, 'data/media-bundles.json'), 'utf8'));
  for (const src of validated.sources) {
    const b = bundles.sources.find(item => item.city === 'zhengzhou' && item.sourceId === src.id);
    assert(b && b.clips === src.segments.length, `Bundle clips parity for ${src.id}`);
  }
  
  const outOfBoundsSegments = allSegments.filter(s => !withinMapBounds(s, bounds));
  assert.equal(outOfBoundsSegments.length, 14, 'Must have 14 out-of-bounds segments (换利小吃x2 & 郑三指固始鹅块 & 刘新生羊肉炝锅面 & 郑大松园餐厅火锅粉 & 傻子张大盘鸡 & 磨李夜市 & 北大学城夜市 & 晓蓉城 & 清真·陈三抖自助火锅 & 喜樽牛寿喜烧 & 北岛烤肉吧 & 欣记快餐 & 米小盒自助餐)');
  
  return {
    sources: validated.sources.length,
    segments: allSegments.length,
    authors: authors.size,
    dedupPlaces: groups.length,
    inBoundsMapStops: inBoundsGroups.length,
    outOfBoundsSegments: outOfBoundsSegments.length
  };
});

// 9. Poster files existence and SHA256 integrity
await check('9. data/cities/zhengzhou/video-posters.json records all 169 posters matching disk files', async () => {
  const postersData = JSON.parse(await readFile(path.join(root, 'data/cities/zhengzhou/video-posters.json'), 'utf8'));
  const segments = Object.entries(postersData.segments);
  assert.equal(segments.length, 169, 'Must have 169 poster entries');
  
  for (const [segId, entry] of segments) {
    const filePath = path.join(root, entry.path);
    const bytes = await readFile(filePath);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha, entry.sha256, `Poster hash mismatch for ${segId}`);
    assert.equal(bytes.length, entry.bytes, `Poster size mismatch for ${segId}`);
  }
  return { posterCount: segments.length };
});

// 10. All city catalogs check
await check('10. allCityCatalogs passes without duplicate source or segment IDs across all 7 cities', async () => {
  const catalogs = await allCityCatalogs(root);
  const zz = catalogs.find(c => c.cityId === 'zhengzhou');
  assert(zz, 'zhengzhou catalog loaded');
  assert.equal(catalogs.length, 7, `Expected 7 cities, got ${catalogs.length}`);
  return { cities: catalogs.map(c => c.cityId) };
});

const passed = checks.filter(c => c.passed).length;
console.log(`\nZhengzhou Data Review Summary: ${passed}/${checks.length} passed.`);
if (passed !== checks.length) {
  process.exitCode = 1;
}
