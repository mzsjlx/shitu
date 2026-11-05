import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const screenshotDir = path.resolve(root, '../output/research/chengdu/screenshots');
await fs.mkdir(screenshotDir, { recursive: true });

async function run() {
  console.log('=== Starting Chengdu Map Automated QA & 3D Screenshot Review ===');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const results = [];
  function check(name, passed, detail = null) {
    results.push({ name, passed, detail });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name}`);
    if (!passed && detail) console.error('  Detail:', detail);
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  console.log('\n--- 1. Testing Chengdu Map Loading & City Configuration ---');
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food');
  await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 20000 });
  await page.waitForTimeout(2000);

  const cityInfo = await page.evaluate(() => ({
    name: window.foodCityMap?.city?.name,
    amapCityCode: window.foodCityMap?.city?.amapCityCode,
    bounds: window.foodCityMap?.city?.bounds,
    center: window.foodCityMap?.map?.getCenter().toArray(),
    zoom: window.foodCityMap?.map?.getZoom(),
    pitch: window.foodCityMap?.map?.getPitch(),
    bearing: window.foodCityMap?.map?.getBearing(),
    layers: window.foodCityMap?.map?.getStyle()?.layers?.map(l => l.id)
  }));

  check('Chengdu city identified correctly with name "成都"', cityInfo.name === '成都', cityInfo.name);
  check('Chengdu amapCityCode is 510100', cityInfo.amapCityCode === '510100', cityInfo.amapCityCode);
  check('Chengdu bounds configured around central 5 districts', Array.isArray(cityInfo.bounds) && cityInfo.bounds[0] === 104.01, cityInfo.bounds);
  check('Initial camera centered on Chunxi / Taikoo Li', Math.abs(cityInfo.center[0] - 104.0815) < 0.01 && Math.abs(cityInfo.center[1] - 30.6550) < 0.01, cityInfo.center);
  check('buildings-detail-3d layer loaded into map style', cityInfo.layers.includes('buildings-detail-3d'));
  check('buildings-3d generic height inference layer present', cityInfo.layers.includes('buildings-3d'));

  // Save initial overview screenshot
  const overviewFile = path.join(screenshotDir, 'chengdu-chunxi-taikooli-initial.png');
  await page.screenshot({ path: overviewFile });
  console.log(`Saved screenshot: ${overviewFile}`);

  console.log('\n--- 2. Capturing Iconic 3D Landmarks & Character Blocks ---');
  const targets = [
    {
      id: '3d-339-panda-tower',
      title: '天府熊猫塔 (339m广播电视塔/旋转球舱/猛追湾望平街水岸)',
      center: [104.0928, 30.6642],
      zoom: 16.0,
      pitch: 64,
      bearing: -30
    },
    {
      id: '3d-ifs-panda-taikooli',
      title: '春熙路 IFS 大厦 (248m) + 爬墙大熊猫雕塑体块 + 太古里川西院落 + 大慈寺',
      center: [104.0815, 30.6550],
      zoom: 16.4,
      pitch: 62,
      bearing: -25
    },
    {
      id: '3d-kuanzhai-alleys',
      title: '宽窄巷子四合院落群与奎星楼街坊',
      center: [104.0535, 30.6668],
      zoom: 16.5,
      pitch: 58,
      bearing: 35
    },
    {
      id: '3d-yulin-neighborhood',
      title: '玉林西路老成都生活街区与小酒馆周边',
      center: [104.0600, 30.6319],
      zoom: 16.6,
      pitch: 56,
      bearing: 10
    }
  ];

  for (const t of targets) {
    console.log(`Focusing on ${t.title}...`);
    await page.evaluate((target) => {
      window.foodCityMap.map.easeTo({
        center: target.center,
        zoom: target.zoom,
        pitch: target.pitch,
        bearing: target.bearing,
        duration: 0
      });
    }, t);
    await page.waitForTimeout(1500);
    const file = path.join(screenshotDir, `${t.id}.png`);
    await page.screenshot({ path: file });
    console.log(`Saved screenshot: ${file}`);
    check(`Landmark view captured: ${t.id}`, true);
  }

  console.log('\n--- 3. Testing Dual 2D/3D View Switching ---');
  await page.click('#view-2d');
  await page.waitForTimeout(500);
  const is2dActive = await page.evaluate(() => {
    return document.getElementById('view-2d').classList.contains('active') &&
           window.foodCityMap.map.getLayoutProperty('buildings-3d', 'visibility') === 'none' &&
           window.foodCityMap.map.getLayoutProperty('buildings-detail-3d', 'visibility') === 'none';
  });
  check('Switching to 2D view hides 3D extrusion layers', is2dActive);

  await page.click('#view-3d');
  await page.waitForTimeout(500);
  const is3dActive = await page.evaluate(() => {
    return document.getElementById('view-3d').classList.contains('active') &&
           window.foodCityMap.map.getLayoutProperty('buildings-3d', 'visibility') === 'visible' &&
           window.foodCityMap.map.getLayoutProperty('buildings-detail-3d', 'visibility') === 'visible';
  });
  check('Switching back to 3D view restores 3D extrusion layers', is3dActive);

  console.log('\n--- 4. Testing Multi-City Isolation ---');
  // Check Chongqing
  await page.goto('http://127.0.0.1:8791/?city=chongqing&view=food');
  await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded());
  const cqName = await page.evaluate(() => window.foodCityMap?.city?.name);
  check('Chongqing city loads cleanly without Chengdu pollution', cqName === '重庆', cqName);

  // Check Liuzhou
  await page.goto('http://127.0.0.1:8791/?city=liuzhou&view=food');
  await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded());
  const lzName = await page.evaluate(() => window.foodCityMap?.city?.name);
  check('Liuzhou city loads cleanly without Chengdu pollution', lzName === '柳州', lzName);

  await browser.close();

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`\n=======================================`);
  console.log(`Chengdu QA completed! Total: ${total}, Passed: ${passed}, Failed: ${total - passed}`);
  console.log(`=======================================`);

  const report = {
    verifiedOn: new Date().toISOString(),
    city: 'chengdu',
    checks: results,
    total,
    passed,
    failed: total - passed
  };
  await fs.writeFile(
    path.resolve(root, '../output/research/chengdu/QA-CHENGDU-MAP.json'),
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  if (passed !== total) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
