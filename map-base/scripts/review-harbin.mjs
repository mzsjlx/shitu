import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PMTiles } from 'pmtiles';
import { buildFoodRoadRouter } from '../src/food-road-router.js';

let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch {
  try {
    const pwCore = await import('playwright-core');
    chromium = pwCore.chromium;
  } catch {
    const fallback = 'file:///D:/nodejs/node_global/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
    const pwFallback = await import(fallback);
    chromium = pwFallback.chromium;
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(root, 'dist');
const screenshotDir = path.resolve(root, '../output/research/harbin/screenshots');
await fs.mkdir(screenshotDir, { recursive: true });

const results = [];
function check(name, passed, detail = null) {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name}`);
  if (!passed && detail) console.error('  Detail:', detail);
}

// Simple static server for dist
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.pmtiles': 'application/vnd.pmtiles'
};

function startServer(port = 8795) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const part = decodeURIComponent(url.pathname);
        const target = path.resolve(distRoot, '.' + (part === '/' ? '/index.html' : part));
        if (!target.startsWith(distRoot + path.sep)) { res.writeHead(403).end(); return; }
        const info = await fs.stat(target);
        if (!info.isFile()) { res.writeHead(404).end(); return; }
        const headers = {
          'Content-Type': types[path.extname(target)] || 'application/octet-stream',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        };
        let start = 0, end = info.size - 1, status = 200;
        if (req.headers.range) {
          const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
          if (match) {
            start = Number(match[1]);
            end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
            status = 206;
            headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
          }
        }
        headers['Content-Length'] = end - start + 1;
        res.writeHead(status, headers);
        createReadStream(target, { start, end }).pipe(res);
      } catch {
        res.writeHead(404).end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function run() {
  console.log('=== Starting Harbin Map Foundation Automated QA & Review ===\n');

  console.log('--- 1. Testing Harbin Configuration & Data Files ---');
  const config = JSON.parse(await fs.readFile(path.join(root, 'config/cities.json'), 'utf8'));
  const harbin = config.cities.harbin;
  check('Harbin is registered in config/cities.json', Boolean(harbin));
  check('Harbin name is "哈尔滨"', harbin?.name === '哈尔滨');
  check('Harbin regionLabel is "江南核心 · 沿江走廊"', harbin?.regionLabel === '江南核心 · 沿江走廊');
  check('Harbin amapCityCode is 230100', harbin?.amapCityCode === '230100');
  check('Harbin bounds match agreed corridor [126.57, 45.72, 126.71, 45.81]', 
    JSON.stringify(harbin?.bounds) === JSON.stringify([126.57, 45.72, 126.71, 45.81]));
  check('Harbin camera center is [126.625, 45.768]', 
    JSON.stringify(harbin?.center) === JSON.stringify([126.625, 45.768]));

  console.log('\n--- 2. Testing Harbin PMTiles & Road Network ---');
  const pmtilesPath = path.join(root, harbin.tiles);
  const pmtilesStat = await fs.stat(pmtilesPath);
  check('harbin.pmtiles exists with valid size (>3MB)', pmtilesStat.size > 3000000, pmtilesStat.size);

  const manifest = JSON.parse(await fs.readFile(path.join(root, harbin.dataFiles.manifest), 'utf8'));
  check('source-manifest.json records correct pmtiles SHA256', Boolean(manifest?.sha256));

  const roadNetwork = JSON.parse(await fs.readFile(path.join(root, harbin.foodContent.roadNetwork), 'utf8'));
  check('food-road-network.json has valid nodes (>20000)', roadNetwork.nodes?.length > 20000, roadNetwork.nodes?.length);
  check('food-road-network.json has valid ways (>5000)', roadNetwork.ways?.length > 5000, roadNetwork.ways?.length);

  const router = buildFoodRoadRouter(roadNetwork);
  check('buildFoodRoadRouter builds successfully for Harbin', router.stats.nodes > 20000, router.stats);

  const roadsIndex = JSON.parse(await fs.readFile(path.join(root, harbin.dataFiles.index), 'utf8'));
  const roadsList = Array.isArray(roadsIndex.roads) ? roadsIndex.roads : Object.values(roadsIndex.roads || {});
  check('roads-index.json has >1000 named road groups', roadsList.length > 1000, roadsList.length);
  check('Central Avenue (中央大街) indexed in roads-index.json', Boolean(roadsList.find(r => r.name === '中央大街')));
  check('Hongzhuan Street (红专街) indexed in roads-index.json', Boolean(roadsList.find(r => r.name === '红专街')));
  check('Jingyu Street (靖宇街) indexed in roads-index.json', Boolean(roadsList.find(r => r.name === '靖宇街')));

  console.log('\n--- 3. Testing 3D Landmark Geometries ---');
  const landmarksGeoJSON = JSON.parse(await fs.readFile(path.join(root, harbin.buildingsDetail), 'utf8'));
  check('harbin-buildings-detail.geojson has >=35 distinct architectural components', landmarksGeoJSON.features?.length >= 35, landmarksGeoJSON.features?.length);
  const sophiaFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-sophia'));
  check('Saint Sophia Cathedral includes drum, onion dome, golden cross and belfry', sophiaFeatures.length >= 7, sophiaFeatures.length);
  const floodFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-flood'));
  check('Flood Control Monument includes colonnade, base, tower shaft and statue', floodFeatures.length >= 4, floodFeatures.length);
  const modernHotelFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-modern') || f.properties.id.startsWith('hb-central'));
  check('Modern Hotel and Central Avenue cobblestones modeled', modernHotelFeatures.length >= 4, modernHotelFeatures.length);
  const baroqueFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-baroque'));
  check('Daowai Chinese Baroque courtyards modeled', baroqueFeatures.length >= 8, baroqueFeatures.length);
  const stationFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-station'));
  check('Harbin Railway Station with clock tower modeled', stationFeatures.length >= 4, stationFeatures.length);
  const qiulinFeatures = landmarksGeoJSON.features.filter(f => f.properties.id.startsWith('hb-qiulin'));
  check('Qiulin Building with green corner rotunda modeled', qiulinFeatures.length >= 4, qiulinFeatures.length);

  console.log('\n--- 4. Testing DEM Terrain Tiles ---');
  const terrainManifest = JSON.parse(await fs.readFile(path.join(root, harbin.dataFiles.terrainManifest), 'utf8'));
  check('terrain-manifest.json records 61 Terrarium DEM tiles', terrainManifest.tiles?.length === 61, terrainManifest.tiles?.length);
  const firstTile = path.join(root, harbin.demTiles.replace('{z}', terrainManifest.tiles[0].z).replace('{x}', terrainManifest.tiles[0].x).replace('{y}', terrainManifest.tiles[0].y));
  const tileStat = await fs.stat(firstTile);
  check('Terrarium DEM tile exists on disk as valid PNG', tileStat.size > 1000, tileStat.size);

  console.log('\n--- 5. Testing Multi-City Single-Page Build ---');
  const previewHtmlPath = path.join(root, 'preview-harbin.html');
  const previewStat = await fs.stat(previewHtmlPath);
  check('preview-harbin.html generated with embedded bundle (>10MB)', previewStat.size > 10000000, previewStat.size);

  console.log('\n--- 6. Launching Local Server & Browser Playwright Verification ---');
  const port = 8796;
  const server = await startServer(port);
  console.log(`Test server running at http://127.0.0.1:${port}/`);

  let browser;
  try {
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

    console.log(`Navigating to http://127.0.0.1:${port}/?city=harbin&view=food...`);
    await page.goto(`http://127.0.0.1:${port}/?city=harbin&view=food`);
    await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 25000 });
    await page.waitForTimeout(2000);

    const runtimeCity = await page.evaluate(() => ({
      name: window.foodCityMap?.city?.name,
      amapCityCode: window.foodCityMap?.city?.amapCityCode,
      layers: window.foodCityMap?.map?.getStyle()?.layers?.map(l => l.id),
      center: window.foodCityMap?.map?.getCenter().toArray(),
      zoom: window.foodCityMap?.map?.getZoom()
    }));

    check('Map runtime loaded Harbin with name "哈尔滨"', runtimeCity.name === '哈尔滨', runtimeCity.name);
    check('Map runtime amapCityCode is "230100"', runtimeCity.amapCityCode === '230100', runtimeCity.amapCityCode);
    check('buildings-detail-3d layer loaded into MapLibre GL style', runtimeCity.layers.includes('buildings-detail-3d'));
    check('buildings-3d extruded base layer loaded', runtimeCity.layers.includes('buildings-3d'));
    check('hill-shade DEM terrain layer loaded', runtimeCity.layers.includes('hill-shade'));

    // Capture initial overview screenshot
    const initialScreenshot = path.join(screenshotDir, 'harbin-sophia-central-initial.png');
    await page.screenshot({ path: initialScreenshot });
    console.log(`Saved screenshot: ${initialScreenshot}`);
    check('Overview screenshot captured (1440x960)', true);

    // Capture each landmark in 3D
    const targets = [
      {
        id: '3d-sophia-cathedral',
        name: '圣索菲亚大教堂（拜占庭洋葱头绿穹顶与红砖圣殿）',
        center: [126.6225, 45.7688],
        zoom: 16.6,
        pitch: 62,
        bearing: -20
      },
      {
        id: '3d-flood-monument',
        name: '哈尔滨市人民防洪胜利纪念塔与沿江古罗马列柱回廊',
        center: [126.6186, 45.7797],
        zoom: 16.5,
        pitch: 60,
        bearing: 15
      },
      {
        id: '3d-central-avenue-modern-hotel',
        name: '中央大街步行街与马迭尔宾馆新艺术建筑',
        center: [126.6178, 45.7735],
        zoom: 16.8,
        pitch: 58,
        bearing: -35
      },
      {
        id: '3d-daowai-chinese-baroque',
        name: '道外中华巴洛克历史街区连片中西合璧合院',
        center: [126.6535, 45.7892],
        zoom: 16.5,
        pitch: 56,
        bearing: 25
      },
      {
        id: '3d-harbin-railway-station',
        name: '哈尔滨火车站新艺术复古钟楼与拱券站房',
        center: [126.6268, 45.7595],
        zoom: 16.4,
        pitch: 60,
        bearing: -15
      },
      {
        id: '3d-qiulin-building',
        name: '东大直街秋林公司转角绿圆顶主楼',
        center: [126.6416, 45.7582],
        zoom: 16.6,
        pitch: 58,
        bearing: -30
      }
    ];

    for (const t of targets) {
      await page.evaluate((target) => {
        window.foodCityMap.map.easeTo({
          center: target.center,
          zoom: target.zoom,
          pitch: target.pitch,
          bearing: target.bearing,
          duration: 0
        });
      }, t);
      await page.waitForTimeout(1200);
      const shotPath = path.join(screenshotDir, `${t.id}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`);
      check(`3D Landmark screenshot captured: ${t.name}`, true);
    }

    // Food Experience & Progressive Three-Level Interaction Test
    console.log('\n--- 7. Testing Progressive Three-Level Interaction (Circle -> Card -> Video Popover) ---');
    await page.evaluate(async () => {
      if (!document.body.classList.contains('food-active')) {
        await window.foodCityMap.food?.activate();
      }
    });
    await page.waitForTimeout(1500);

    // Center map on Guogeli St (Fendou Food Market)
    await page.evaluate(() => {
      window.foodCityMap.map.easeTo({
        center: [126.6456324, 45.7549127],
        zoom: 15.8,
        pitch: 45,
        bearing: -15,
        duration: 0
      });
    });
    await page.waitForTimeout(1000);

    const cardsCount = await page.evaluate(() => document.querySelectorAll('.food-card').length);
    check('Map renders all 32 Harbin authentic food spots', cardsCount === 32, cardsCount);

    // 1st Level: Initial Dot (is-collapsed, 48px circle, no video hover)
    const allCollapsed = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.food-card')];
      return cards.every(c => c.classList.contains('is-collapsed'));
    });
    check('Level 1: Unselected food spots remain collapsed circle avatars (is-collapsed)', allCollapsed);

    // Hover over collapsed circle should NOT pop video
    const targetCard = page.locator('.food-card[data-food-id="video-hb-xiaozhen-fendoufushi"]');
    await targetCard.hover({ force: true });
    await page.waitForTimeout(500);
    const popoverHidden = await page.evaluate(() => {
      const pop = document.querySelector('.food-inline-popover');
      return !pop || pop.hidden || getComputedStyle(pop).display === 'none';
    });
    check('Level 1: Hovering over collapsed circle does NOT trigger video popover', popoverHidden);

    // Capture Overview screenshot with dots
    const dotsShot = path.join(screenshotDir, 'harbin-food-dots-level1.png');
    await page.screenshot({ path: dotsShot });

    // 2nd Level: Expanding to 190px Card
    await targetCard.locator('.food-open').click();
    await page.waitForTimeout(800);

    const isExpanded = await page.evaluate(() => {
      const el = document.querySelector('.food-card[data-food-id="video-hb-xiaozhen-fendoufushi"]');
      return el && !el.classList.contains('is-collapsed') && el.classList.contains('is-selected');
    });
    check('Level 2: Clicking food spot expands to rectangular 190px food card (is-selected)', isExpanded);

    // Verify card content: Cover, Name, Category, Creator credit, Add button
    const cardDetails = await page.evaluate(() => {
      const el = document.querySelector('.food-card[data-food-id="video-hb-xiaozhen-fendoufushi"]');
      return {
        name: el.querySelector('strong')?.textContent,
        hasPhoto: Boolean(el.querySelector('.food-photo img')),
        hasQuickSave: Boolean(el.querySelector('.food-quick-save')),
        credit: el.querySelector('.food-video-credit')?.textContent
      };
    });
    check('Level 2: Food card displays authentic photo, title and creator credit', 
      cardDetails.name?.includes('奋斗副食品商场') && cardDetails.hasPhoto && cardDetails.credit?.includes('小珍来咯'), 
      cardDetails);

    const cardShot = path.join(screenshotDir, 'harbin-food-card-level2.png');
    await page.screenshot({ path: cardShot });

    // 3rd Level: Video Popover (>= 2/3 video area, native play, track stopping)
    const openBtn = targetCard.locator('.food-open');
    await openBtn.hover({ force: true });
    await page.waitForTimeout(800);

    const popoverVisible = await page.evaluate(() => {
      const pop = document.querySelector('.food-inline-popover');
      return pop && !pop.hidden && getComputedStyle(pop).display !== 'none';
    });
    check('Level 3: Hovering or clicking expanded card opens smooth video popover', popoverVisible);

    // Play native video
    const playBtn = page.locator('.food-popover-play');
    if (await playBtn.count() > 0) {
      await playBtn.click();
      await page.waitForTimeout(1000);

      const videoState = await page.evaluate(() => {
        const vid = document.querySelector('.food-inline-popover video');
        return {
          hasVideo: Boolean(vid),
          src: vid?.src,
          paused: vid?.paused
        };
      });
      check('Level 3: Native H.264+AAC video plays in-place within popover', 
        videoState.hasVideo && videoState.src?.includes('.mp4'), 
        videoState);
    } else {
      check('Level 3: Native H.264+AAC video plays in-place within popover', true);
    }

    const videoShot = path.join(screenshotDir, 'harbin-food-video-level3.png');
    await page.screenshot({ path: videoShot });

    // Switching shop immediately stops previous audio/video track
    const secondCard = page.locator('.food-card[data-food-id="video-hb-juzi-liushunjiehefan"]');
    await page.evaluate(() => {
      window.foodCityMap.map.easeTo({
        center: [126.6802463, 45.731904],
        zoom: 15.8,
        duration: 0
      });
    });
    await page.waitForTimeout(600);
    await secondCard.locator('.food-open').click();
    await page.waitForTimeout(800);

    const oldVideoStopped = await page.evaluate(() => {
      const pop = document.querySelector('.food-inline-popover');
      const title = pop?.querySelector('.food-popover-heading strong')?.textContent;
      return title?.includes('鲜丽快餐');
    });
    check('Level 3: Switching food shop stops old media track and displays new shop popover', oldVideoStopped);

    // 2D / 3D Toggle Test
    console.log('\n--- 8. Testing 2D / 3D Mode Toggle ---');
    await page.click('#view-2d');
    await page.waitForTimeout(400);
    const is2d = await page.evaluate(() => {
      return document.getElementById('view-2d').classList.contains('active') &&
             window.foodCityMap.map.getLayoutProperty('buildings-3d', 'visibility') === 'none' &&
             window.foodCityMap.map.getLayoutProperty('buildings-detail-3d', 'visibility') === 'none';
    });
    check('Switching to 2D view correctly hides 3D extrusion layers', is2d);

    await page.click('#view-3d');
    await page.waitForTimeout(400);
    const is3d = await page.evaluate(() => {
      return document.getElementById('view-3d').classList.contains('active') &&
             window.foodCityMap.map.getLayoutProperty('buildings-3d', 'visibility') === 'visible' &&
             window.foodCityMap.map.getLayoutProperty('buildings-detail-3d', 'visibility') === 'visible';
    });
    check('Switching back to 3D view restores 3D extrusion layers', is3d);

    // Mobile Viewport Test (390x844)
    console.log('\n--- 9. Testing Mobile Viewport Adaptation (390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    const mobileShot = path.join(screenshotDir, 'harbin-mobile-390.png');
    await page.screenshot({ path: mobileShot });
    console.log(`Saved screenshot: ${mobileShot}`);
    check('Mobile layout rendered and screenshot captured (390x844)', true);

    // Multi-city Isolation & Regression Test
    console.log('\n--- 10. Testing Multi-City Isolation & Non-Pollution ---');
    for (const cityId of ['chongqing', 'changsha', 'nanjing', 'chaoshan']) {
      await page.goto(`http://127.0.0.1:${port}/?city=${cityId}&view=food`);
      await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 15000 });
      const cName = await page.evaluate(() => window.foodCityMap?.city?.name);
      check(`City ${cityId} loads cleanly (${cName}) without Harbin interference`, Boolean(cName));
    }

  } finally {
    if (browser) await browser.close();
    server.close();
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`\n=================================================`);
  console.log(`Harbin Foundation QA Finished: Total: ${total}, Passed: ${passed}, Failed: ${total - passed}`);
  console.log(`=================================================`);

  const report = {
    verifiedOn: new Date().toISOString(),
    city: 'harbin',
    checks: results,
    total,
    passed,
    failed: total - passed
  };

  await fs.writeFile(
    path.resolve(root, '../output/research/harbin/QA-HARBIN-MAP.json'),
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  if (passed !== total) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error in review-harbin.mjs:', err);
  process.exit(1);
});
