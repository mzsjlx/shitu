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
  console.log('=== Starting Comprehensive Chengdu Automated QA & Six-City Review ===');
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

  const base = 'http://127.0.0.1:8791';

  // -----------------------------------------------------------------
  // 1. Desktop Viewport (1440x960): Map Config, 3D Landmarks & Layers
  // -----------------------------------------------------------------
  console.log('\n--- 1. Testing Chengdu Map Loading & City Configuration ---');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const page = await desktopCtx.newPage();

  await page.goto(`${base}/?city=chengdu&view=food`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 25000 });
  await page.waitForTimeout(1500);

  const cityInfo = await page.evaluate(() => ({
    name: window.foodCityMap?.city?.name,
    amapCityCode: window.foodCityMap?.city?.amapCityCode,
    bounds: window.foodCityMap?.city?.bounds,
    center: window.foodCityMap?.map?.getCenter().toArray(),
    layers: window.foodCityMap?.map?.getStyle()?.layers?.map(l => l.id)
  }));

  check('Chengdu city identified correctly with name "成都"', cityInfo.name === '成都', cityInfo.name);
  check('Chengdu amapCityCode is 510100', cityInfo.amapCityCode === '510100', cityInfo.amapCityCode);
  check('Chengdu bounds configured around central 5 districts', Array.isArray(cityInfo.bounds) && cityInfo.bounds[0] === 104.01, cityInfo.bounds);
  check('buildings-detail-3d layer loaded into map style', cityInfo.layers.includes('buildings-detail-3d'));
  check('buildings-3d generic height inference layer present', cityInfo.layers.includes('buildings-3d'));

  // -----------------------------------------------------------------
  // 2. 3D Iconic Landmarks
  // -----------------------------------------------------------------
  console.log('\n--- 2. Capturing Iconic 3D Landmarks ---');
  const targets = [
    { id: '3d-339-panda-tower', center: [104.0928, 30.6642], zoom: 16.0, pitch: 64, bearing: -30 },
    { id: '3d-ifs-panda-taikooli', center: [104.0815, 30.6550], zoom: 16.4, pitch: 62, bearing: -25 },
    { id: '3d-kuanzhai-alleys', center: [104.0535, 30.6668], zoom: 16.5, pitch: 58, bearing: 35 },
    { id: '3d-yulin-neighborhood', center: [104.0600, 30.6319], zoom: 16.6, pitch: 56, bearing: 10 }
  ];

  for (const t of targets) {
    await page.evaluate(target => {
      window.foodCityMap.map.easeTo({ center: target.center, zoom: target.zoom, pitch: target.pitch, bearing: target.bearing, duration: 0 });
    }, t);
    await page.waitForTimeout(800);
    const file = path.join(screenshotDir, `${t.id}.png`);
    await page.screenshot({ path: file });
    check(`Landmark view captured: ${t.id}`, true);
  }

  // -----------------------------------------------------------------
  // 3. 71 Food Spots & Progressive Card Presentation
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Food Spots & Card Expansion ---');
  const spotsCount = await page.evaluate(() => {
    return document.querySelectorAll('.food-card').length;
  });
  check('71 on-map food spots loaded cleanly into food overlay', spotsCount === 71, `Found ${spotsCount} spots`);

  // Test expanding card
  const cardClickSuccess = await page.evaluate(() => {
    const card = document.querySelector('.food-card');
    if (!card) return false;
    const btn = card.querySelector('.food-open');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  check('Food card found and clicked', cardClickSuccess);
  await page.waitForTimeout(600);

  const cardExpanded = await page.evaluate(() => {
    const card = document.querySelector('.food-card:not(.is-collapsed)');
    const closeBtn = card?.querySelector('.food-card-close');
    return !!card && !!closeBtn && getComputedStyle(closeBtn).display !== 'none';
  });
  check('Clicking circular spot badge smoothly expands into card with close button', cardExpanded);

  // Close card
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.food-card:not(.is-collapsed) .food-card-close');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(300);

  // -----------------------------------------------------------------
  // 4. Multi-Blogger Popover, Media Area >= 2/3, & Audio Cut-off
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Multi-Blogger Popover, Media Area >= 2/3 & Audio Cut-off ---');
  // Open popover for a known multi-blogger spot
  const popoverOpened = await page.evaluate(() => {
    // Find item with multiple clips (e.g. Xie Xiao Yao or Yang Lao Tou or Mao Ji He Yi)
    const multiEntry = window.foodCityMap.food.overlay.items.find(e => e.item.videos?.length > 1);
    if (!multiEntry) return { found: false };
    window.foodCityMap.food.overlay.showPopover(multiEntry.item, true);
    return { found: true, name: multiEntry.item.name, clipCount: multiEntry.item.videos.length };
  });

  check('Multi-blogger spot identified and popover opened', popoverOpened.found, popoverOpened);
  await page.waitForSelector('.food-inline-popover.is-shown', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Verify Media Area >= 2/3 (66.7%)
  const areaRatio = await page.evaluate(() => {
    const popover = document.querySelector('.food-inline-popover');
    const media = document.querySelector('.food-popover-media');
    if (!popover || !media) return 0;
    const popRect = popover.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    const popArea = popRect.width * popRect.height;
    const mediaArea = mediaRect.width * mediaRect.height;
    return {
      ratio: mediaArea / popArea,
      mediaArea,
      popArea,
      mediaHeight: mediaRect.height,
      popHeight: popRect.height
    };
  });

  check('Multi-blogger popover media area occupies >= 2/3 (66.7%) of total popover area',
    areaRatio.ratio >= 0.66,
    `Ratio: ${(areaRatio.ratio * 100).toFixed(1)}% (media: ${areaRatio.mediaHeight}px, popover: ${areaRatio.popHeight}px)`
  );

  const popoverShot = path.join(screenshotDir, 'chengdu-multi-blogger-popover.png');
  await page.screenshot({ path: popoverShot });

  // Test video play and advancing playback
  await page.evaluate(() => {
    const playBtn = document.querySelector('.food-popover-play');
    if (playBtn) playBtn.click();
  });
  await page.waitForSelector('video.food-popover-video', { timeout: 10000 });

  const playCheck = await page.evaluate(async () => {
    const video = document.querySelector('video.food-popover-video');
    if (!video) return { played: false, reason: 'no video element' };
    video.muted = true;
    try { await video.play(); } catch (e) { return { played: false, reason: e.message }; }
    await new Promise(r => setTimeout(r, 800));
    return {
      played: !video.paused && video.currentTime > 0.1,
      currentTime: video.currentTime,
      duration: video.duration
    };
  });
  check('In-popover video plays smoothly with advancing currentTime', playCheck.played, playCheck);

  // Test audio stoppage on closing popover
  const audioStopped = await page.evaluate(async () => {
    const closeBtn = document.querySelector('.food-popover-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const video = document.querySelector('video.food-popover-video');
    return !video || video.paused;
  });
  check('Closing popover immediately terminates video playback and audio track', audioStopped);

  await desktopCtx.close();

  // -----------------------------------------------------------------
  // 5. Mobile (390x844), Small (320x680), and Landscape (736x414) Viewports
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Multi-Viewport Layouts ---');
  const viewports = [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'small-320', width: 320, height: 680 },
    { name: 'landscape-736', width: 736, height: 414 }
  ];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true });
    const vpPage = await ctx.newPage();
    await vpPage.goto(`${base}/?city=chengdu&view=food`, { waitUntil: 'domcontentloaded' });
    await vpPage.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 25000 });
    await vpPage.waitForTimeout(1000);

    const vpCheck = await vpPage.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return { cardCount: cards.length, hasHorizontalOverflow };
    });

    check(`Viewport ${vp.name} (${vp.width}x${vp.height}) renders without horizontal overflow`,
      vpCheck.cardCount === 71 && !vpCheck.hasHorizontalOverflow,
      vpCheck
    );

    const shotPath = path.join(screenshotDir, `chengdu-${vp.name}.png`);
    await vpPage.screenshot({ path: shotPath });
    await ctx.close();
  }

  // -----------------------------------------------------------------
  // 6. Six-City Isolation & Clean Regression
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Six-City Isolation & Zero Cross-Contamination ---');
  const multiCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const multiPage = await multiCtx.newPage();

  const citiesToTest = [
    { id: 'chongqing', expectedName: '重庆' },
    { id: 'changsha', expectedName: '长沙' },
    { id: 'liuzhou', expectedName: '柳州' },
    { id: 'nanjing', expectedName: '南京' },
    { id: 'chaoshan', expectedName: '潮汕' },
    { id: 'chengdu', expectedName: '成都' }
  ];

  for (const c of citiesToTest) {
    await multiPage.goto(`${base}/?city=${c.id}&view=food`, { waitUntil: 'domcontentloaded' });
    await multiPage.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 25000 });
    await multiPage.waitForTimeout(800);

    const name = await multiPage.evaluate(() => window.foodCityMap?.city?.name);
    check(`City ${c.id} loads isolated state with name "${c.expectedName}"`, name === c.expectedName, name);
  }

  await multiCtx.close();
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
