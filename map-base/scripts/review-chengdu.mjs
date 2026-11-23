import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
for (const spec of [
  'playwright',
  'playwright-core',
  process.env.PLAYWRIGHT_PATH,
  'D:/nodejs/node_global/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs'
].filter(Boolean)) {
  try {
    const url = spec.startsWith('/') || spec.includes(':') ? 'file:///' + path.resolve(spec).replace(/\\/g, '/') : spec;
    const pw = await import(url);
    if (pw.chromium) {
      chromium = pw.chromium;
      break;
    }
  } catch {}
}
if (!chromium) throw new Error('Playwright not available in environment');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screenshotDir = path.resolve(root, '../output/research/chengdu/screenshots');
await fs.mkdir(screenshotDir, { recursive: true });

async function run() {
  console.log('=== Starting Upgraded Chengdu QA & Multi-City Baseline Review ===');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const results = [];
  function check(name, passed, detail = null) {
    results.push({ name, passed: Boolean(passed), detail });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name}`);
    if (!passed && detail) console.error('  Detail:', detail);
  }

  const base = process.env.FOODCITY_BASE_URL || `http://127.0.0.1:${process.env.FOODCITY_PORT || 8791}`;

  // -----------------------------------------------------------------
  // 1. Desktop Viewport (1440x960): Map Config, 3D Landmarks & Layers
  // -----------------------------------------------------------------
  console.log('\n--- 1. Testing Chengdu Map Loading & City Configuration ---');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const page = await desktopCtx.newPage();

  await page.goto(`${base}/?city=chengdu&view=food`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.foodCityMap && window.foodCityMap.ready, { timeout: 25000 });
  await page.waitForTimeout(1000);

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
  // 2. 71 Food Spots & Progressive Card Presentation
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Food Spots & Card Expansion ---');
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
  await page.waitForTimeout(500);

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
  // 3. Multi-Blogger Popover, Strict Ratio >= 2/3, & Playback / Audio Stop
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Popover, Ratio >= 2/3, Double Sampling & Audio Stoppage ---');
  const popoverOpened = await page.evaluate(() => {
    const multiEntry = window.foodCityMap.food.overlay.items.find(e => e.item.videos?.length > 1);
    if (!multiEntry) return { found: false };
    window.foodCityMap.food.overlay.showPopover(multiEntry.item, true);
    return { found: true, name: multiEntry.item.name, clipCount: multiEntry.item.videos.length };
  });

  check('Multi-blogger spot identified and popover opened', popoverOpened.found, popoverOpened);
  await page.waitForSelector('.food-inline-popover.is-shown', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Ratio assertion (Strict >= 2/3)
  const areaRatio = await page.evaluate(() => {
    const popover = document.querySelector('.food-inline-popover');
    const media = document.querySelector('.food-popover-media');
    if (!popover || !media) return null;
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

  check('Multi-blogger popover media area occupies >= 2/3 (strict >= 2/3)',
    areaRatio && areaRatio.ratio >= (2.0 / 3.0),
    areaRatio ? `Ratio: ${(areaRatio.ratio * 100).toFixed(2)}%` : 'missing'
  );

  // Play video with double sampling
  await page.evaluate(() => {
    const playBtn = document.querySelector('.food-popover-play');
    if (playBtn) playBtn.click();
  });
  await page.waitForSelector('video.food-popover-video', { timeout: 10000 });

  // Store reference to video in window
  await page.evaluate(() => {
    window.__testedVideo1 = document.querySelector('video.food-popover-video');
  });

  // Double sampling playback check
  const t1 = await page.evaluate(() => window.__testedVideo1 ? { t: window.__testedVideo1.currentTime, paused: window.__testedVideo1.paused } : null);
  await page.waitForTimeout(800);
  const t2 = await page.evaluate(() => window.__testedVideo1 ? { t: window.__testedVideo1.currentTime, paused: window.__testedVideo1.paused } : null);
  const advancing = t1 && t2 && !t2.paused && (t2.t - t1.t >= 0.2);
  check('In-popover video plays smoothly with double-sampling time advance (dt >= 0.2s)', advancing, { t1, t2, dt: t2?.t - t1?.t });

  // Test blogger switch: hold reference to old video, switch tab, assert old video is paused & hasSrc stripped
  const bloggerSwitchOk = await page.evaluate(async () => {
    const oldVideo = window.__testedVideo1;
    const clipButtons = document.querySelectorAll('.food-popover-clip');
    if (clipButtons.length < 2) return { success: false, reason: 'fewer than 2 creator tabs' };
    clipButtons[1].click();
    await new Promise(r => setTimeout(r, 400));
    const oldPaused = oldVideo.paused;
    const oldHasSrc = oldVideo.hasAttribute('src') && oldVideo.getAttribute('src') !== '';
    return {
      success: oldPaused && !oldHasSrc,
      oldPaused,
      oldHasSrc
    };
  });
  check('Switching creator tab terminates old video and strips src', bloggerSwitchOk.success, bloggerSwitchOk);

  // Test shop switch: hold reference to current video, open another shop, assert previous video paused & stripped
  await page.evaluate(() => {
    window.__testedVideo2 = document.querySelector('video.food-popover-video');
  });
  const shopSwitchOk = await page.evaluate(async () => {
    const oldVideo = window.__testedVideo2;
    const otherItem = window.foodCityMap.food.overlay.items[1]?.item;
    if (!otherItem) return { success: false, reason: 'no second shop item' };
    window.foodCityMap.food.overlay.showPopover(otherItem, true);
    await new Promise(r => setTimeout(r, 400));
    const oldPaused = !oldVideo || oldVideo.paused;
    const oldHasSrc = oldVideo && oldVideo.hasAttribute('src') && oldVideo.getAttribute('src') !== '';
    return {
      success: oldPaused && !oldHasSrc,
      oldPaused,
      oldHasSrc
    };
  });
  check('Switching to another shop terminates previous video and strips src', shopSwitchOk.success, shopSwitchOk);

  // Test close popover: hold reference to video, close, assert paused & stripped
  await page.evaluate(() => {
    const playBtn = document.querySelector('.food-popover-play');
    if (playBtn) playBtn.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    window.__testedVideo3 = document.querySelector('video.food-popover-video');
  });

  const closeStopOk = await page.evaluate(async () => {
    const oldVideo = window.__testedVideo3;
    const closeBtn = document.querySelector('.food-popover-close');
    if (closeBtn) closeBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const oldPaused = !oldVideo || oldVideo.paused;
    const oldHasSrc = oldVideo && oldVideo.hasAttribute('src') && oldVideo.getAttribute('src') !== '';
    return {
      success: oldPaused && !oldHasSrc,
      oldPaused,
      oldHasSrc
    };
  });
  check('Closing popover immediately pauses video and strips src', closeStopOk.success, closeStopOk);

  await desktopCtx.close();

  // -----------------------------------------------------------------
  // 4. Multi-Viewport Layouts: 1440x960, 390x844, 320x680, 736x414
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Multi-Viewport Layouts & Popover Ratio >= 2/3 ---');
  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 960 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'small-320', width: 320, height: 680 },
    { name: 'landscape-736', width: 736, height: 414 }
  ];

  for (const vp of viewports) {
    const isMobile = vp.width < 800;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile, hasTouch: isMobile });
    const vpPage = await ctx.newPage();
    await vpPage.goto(`${base}/?city=chengdu&view=food`, { waitUntil: 'domcontentloaded' });
    await vpPage.waitForFunction(() => window.foodCityMap && window.foodCityMap.ready, { timeout: 25000 });
    await vpPage.waitForTimeout(600);

    // Check no horizontal overflow
    const overflowCheck = await vpPage.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
      return { cardCount: cards.length, hasHorizontalOverflow };
    });
    check(`Viewport ${vp.name} (${vp.width}x${vp.height}) has 71 cards without horizontal overflow`,
      overflowCheck.cardCount === 71 && !overflowCheck.hasHorizontalOverflow,
      overflowCheck
    );

    // Open popover in this viewport and verify ratio >= 2/3 & within viewport bounds
    const popoverVpCheck = await vpPage.evaluate(() => {
      const firstItem = window.foodCityMap.food.overlay.items[0]?.item;
      if (!firstItem) return null;
      window.foodCityMap.food.overlay.showPopover(firstItem, true);
      const popover = document.querySelector('.food-inline-popover');
      const media = document.querySelector('.food-popover-media');
      if (!popover || !media) return null;
      const popRect = popover.getBoundingClientRect();
      const mediaRect = media.getBoundingClientRect();
      const popArea = popRect.width * popRect.height;
      const mediaArea = mediaRect.width * mediaRect.height;
      const inBounds = popRect.top >= -2 && popRect.left >= -2 && popRect.right <= window.innerWidth + 2 && popRect.bottom <= window.innerHeight + 2;
      return {
        ratio: mediaArea / popArea,
        inBounds,
        popRect: { width: popRect.width, height: popRect.height, top: popRect.top, left: popRect.left }
      };
    });

    check(`Viewport ${vp.name} popover in bounds and ratio >= 2/3`,
      popoverVpCheck && popoverVpCheck.inBounds && popoverVpCheck.ratio >= (2.0 / 3.0),
      popoverVpCheck ? `Ratio: ${(popoverVpCheck.ratio * 100).toFixed(2)}%, inBounds: ${popoverVpCheck.inBounds}` : 'missing'
    );

    const shotPath = path.join(screenshotDir, `chengdu-${vp.name}.png`);
    await vpPage.screenshot({ path: shotPath });
    await ctx.close();
  }

  // -----------------------------------------------------------------
  // 5. Seven-City Isolation & Zero Cross-Contamination
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Seven-City Isolation (Chongqing, Changsha, Liuzhou, Nanjing, Chaoshan, Wuhan, Zhengzhou) ---');
  const multiCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const multiPage = await multiCtx.newPage();

  // First, in Chengdu add a spot to favorites
  await multiPage.goto(`${base}/?city=chengdu&view=food`, { waitUntil: 'domcontentloaded' });
  await multiPage.waitForFunction(() => window.foodCityMap && window.foodCityMap.ready, { timeout: 25000 });
  await multiPage.waitForTimeout(500);

  const chengduSaved = await multiPage.evaluate(() => {
    const saveBtn = document.querySelector('.food-card .food-quick-save');
    if (saveBtn) saveBtn.click();
    return window.foodCityMap.food?.saved?.length || 0;
  });
  check('Chengdu spot added to saved trips', chengduSaved > 0, `Saved: ${chengduSaved}`);

  const baselineCities = [
    { id: 'chongqing', name: '重庆' },
    { id: 'changsha', name: '长沙' },
    { id: 'liuzhou', name: '柳州' },
    { id: 'nanjing', name: '南京' },
    { id: 'chaoshan', name: '潮汕' },
    { id: 'wuhan', name: '武汉' },
    { id: 'zhengzhou', name: '郑州' }
  ];

  for (const c of baselineCities) {
    await multiPage.goto(`${base}/?city=${c.id}&view=food`, { waitUntil: 'domcontentloaded' });
    await multiPage.waitForFunction(() => window.foodCityMap && window.foodCityMap.ready, { timeout: 25000 });
    await multiPage.waitForTimeout(500);

    const cityCheck = await multiPage.evaluate((targetCity) => {
      const cityName = window.foodCityMap?.city?.name;
      const allShops = window.foodCityMap.food?.records?.map(r => r.name) || [];
      const hasChengduShop = allShops.some(s => s.includes('毛记和意') || s.includes('张婆婆'));
      const savedInThisCity = window.foodCityMap.food?.saved || [];
      const hasChengduSaved = savedInThisCity.some(id => String(id).includes('cd-'));
      const foodActive = Boolean(window.foodCityMap.food?.records && window.foodCityMap.food?.overlay);
      return {
        nameMatch: cityName === targetCity.name,
        cityName,
        hasChengduShop,
        hasChengduSaved,
        foodActive
      };
    }, c);

    check(`City ${c.id} (${c.name}) isolation: correct name, 0 Chengdu spots, 0 cross-city saved trips`,
      cityCheck.nameMatch && !cityCheck.hasChengduShop && !cityCheck.hasChengduSaved && cityCheck.foodActive,
      cityCheck
    );
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
  console.error('Fatal QA error:', err);
  process.exit(1);
});
