import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// -------------------------------------------------------------
// Cross-machine portable Playwright resolution
// -------------------------------------------------------------
let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch {
  try {
    const pwCore = await import('playwright-core');
    chromium = pwCore.chromium;
  } catch {
    try {
      const fallback = 'file:///D:/nodejs/node_global/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
      const pwFallback = await import(fallback);
      chromium = pwFallback.chromium;
    } catch (e) {
      console.error('Failed to resolve Playwright:', e.message);
      throw new Error('Playwright is required to run review-liuzhou.mjs. Please install playwright or playwright-core.');
    }
  }
}

// -------------------------------------------------------------
// Portable paths and configurable preview URL
// -------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');
const screenshotsDir = path.join(repoRoot, 'output/research/liuzhou/screenshots');
const reportPath = path.join(repoRoot, 'output/research/liuzhou/QA-LIUZHOU-INTAKE.json');

const portArg = process.argv.indexOf('--port');
const port = portArg !== -1 ? process.argv[portArg + 1] : (process.env.PREVIEW_PORT || '8791');
const baseArg = process.argv.find(a => a.startsWith('--base='));
const base = process.env.PREVIEW_URL || (baseArg ? baseArg.slice(7) : `http://127.0.0.1:${port}`);

async function main() {
  await fs.mkdir(screenshotsDir, { recursive: true });

  const report = {
    verifiedOn: new Date().toISOString(),
    city: 'liuzhou',
    environment: {
      platform: os.platform(),
      release: os.release(),
      node: process.version,
      previewUrl: base
    },
    viewportsCovered: ['1440x960 (desktop)', '390x844 (mobile)', '320x680 (small)', '736x414 (short-landscape)'],
    checks: [],
    errors: [],
    screenshots: []
  };

  const check = (name, passed, detail) => {
    report.checks.push({ name, passed: !!passed, ...(detail !== undefined ? { detail } : {}) });
    console.log((passed ? '✓ PASS: ' : '✗ FAIL: ') + name);
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const settle = async p => {
    await p.waitForFunction(() => {
      const map = window.foodCityMap?.map;
      return map && !map.isMoving() && map.isSourceLoaded('city') && map.areTilesLoaded();
    }, undefined, { timeout: 20000 }).catch(() => {});
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Liuzhou Desktop View (1440x960) & Basic Setup
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Liuzhou Desktop Map (1440x960) ---');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', err => report.errors.push({ stage: 'liuzhou-desktop', error: err.message }));

    console.log(`Navigating to Liuzhou map on ${base}...`);
    await p.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(p);

    const cityInfo = await p.evaluate(() => ({
      name: window.foodCityMap.city.name,
      amapCityCode: window.foodCityMap.city.amapCityCode,
      center: window.foodCityMap.map.getCenter().toArray(),
      zoom: window.foodCityMap.map.getZoom(),
      cityKey: window.foodCityMap.food.cityKey,
      recordCount: window.foodCityMap.food.records.length,
      records: window.foodCityMap.food.records.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        coordinates: r.coordinates,
        localClip: r.localClip,
        localPoster: r.localPoster,
        clipAuthor: r.clipAuthor,
        planningLocation: r.planningLocation
      }))
    }));

    check('Liuzhou city identified correctly with amapCityCode 450200',
      cityInfo.name === '柳州' && cityInfo.cityKey === 'liuzhou' && cityInfo.amapCityCode === '450200',
      { name: cityInfo.name, amapCityCode: cityInfo.amapCityCode }
    );
    check('9 food records loaded across Liuzhou', cityInfo.recordCount === 9, cityInfo.records.length);
    check('All 9 records have local MP4 clips and JPG posters', cityInfo.records.every(r => r.localClip && r.localPoster), cityInfo.records.length);
    check('All 9 records have open OSM anchor references',
      cityInfo.records.every(r => r.planningLocation?.anchor?.id && r.planningLocation?.anchor?.url?.startsWith('https://www.openstreetmap.org/')),
      cityInfo.records.map(r => r.planningLocation?.anchor?.name)
    );

    const allCollapsedInitial = await p.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      return cards.length === 9 && Array.from(cards).every(c => c.classList.contains('is-collapsed'));
    });
    check('All 9 food markers default to collapsed circular icon badges', allCollapsedInitial);

    const shot1 = path.join(screenshotsDir, 'liuzhou-food-overview.png');
    await p.screenshot({ path: shot1 });
    report.screenshots.push(shot1);
    console.log('Saved screenshot:', shot1);

    // -------------------------------------------------------------
    // Test 2: Card Expansion, Close Button & Video Playback & Audio Stop Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Card Expansion, Close Button & Video Audio Lifecycle ---');
    const testShop = cityInfo.records.find(r => r.id === 'video-lz-chenhe-aningmeng') || cityInfo.records[0];
    const cardSelector = `.food-card[data-food-id="${testShop.id}"]`;
    await p.waitForSelector(cardSelector, { timeout: 10000 });

    // Step 2a: Click circular badge to expand card
    await p.locator(`${cardSelector} .food-open`).click();
    await p.waitForFunction(sel => {
      const card = document.querySelector(sel);
      return card && !card.classList.contains('is-collapsed');
    }, cardSelector, { timeout: 5000 });

    const cardExpanded = await p.evaluate(sel => {
      const card = document.querySelector(sel);
      const closeBtn = card?.querySelector('.food-card-close');
      const otherCards = Array.from(document.querySelectorAll('.food-card')).filter(c => c !== card);
      return {
        isExpanded: card && !card.classList.contains('is-collapsed'),
        hasCloseButton: !!closeBtn,
        closeButtonVisible: closeBtn && getComputedStyle(closeBtn).display !== 'none',
        otherCardsStayCollapsed: otherCards.length === 8 && otherCards.every(c => c.classList.contains('is-collapsed'))
      };
    }, cardSelector);

    check('Clicking circular badge expands ONLY that card into rectangle with "×" close button',
      cardExpanded.isExpanded && cardExpanded.hasCloseButton && cardExpanded.closeButtonVisible && cardExpanded.otherCardsStayCollapsed,
      cardExpanded
    );

    const shotExpanded = path.join(screenshotsDir, 'liuzhou-card-expanded.png');
    await p.screenshot({ path: shotExpanded });
    report.screenshots.push(shotExpanded);
    console.log('Saved screenshot of expanded card:', shotExpanded);

    // Step 2b: Test closing card via "×" button
    await p.locator(`${cardSelector} .food-card-close`).click();
    await p.waitForFunction(sel => {
      const card = document.querySelector(sel);
      return card && card.classList.contains('is-collapsed');
    }, cardSelector, { timeout: 5000 });

    const cardCollapsedAgain = await p.evaluate(sel => {
      const card = document.querySelector(sel);
      return card && card.classList.contains('is-collapsed');
    }, cardSelector);

    check('Clicking "×" close button collapses card back into circular icon badge', cardCollapsedAgain);

    // Step 2c: Click again to open card and video popover
    await p.locator(`${cardSelector} .food-open`).click();
    await p.waitForFunction(() => {
      const popover = document.querySelector('.food-inline-popover');
      return popover && !popover.hidden && popover.classList.contains('is-shown');
    }, undefined, { timeout: 10000 });

    // Verify original video link in popover
    const originalVideoHref = await p.evaluate(() => {
      const link = document.querySelector('.food-popover-links a');
      return link ? link.href : '';
    });
    check('Popover contains original video link', originalVideoHref.includes('douyin.com') || originalVideoHref.startsWith('http'), originalVideoHref);

    // Click play button to start video playback
    await p.locator('.food-popover-play').click();
    await p.waitForSelector('video.food-popover-video', { timeout: 10000 });

    const videoState = await p.evaluate(async () => {
      const video = document.querySelector('video.food-popover-video');
      if (!video) return { found: false };
      video.muted = true;
      try { await video.play(); } catch (e) { return { found: true, error: e.message }; }
      await new Promise(r => setTimeout(r, 800));
      return {
        found: true,
        src: video.currentSrc,
        currentTime: video.currentTime,
        paused: video.paused,
        duration: video.duration
      };
    });

    check('Popover opened and video is playing with advancing playback',
      videoState.found && !videoState.paused && videoState.currentTime > 0.1,
      videoState
    );

    // Test Audio Lifecycle: closing popover stops video playback and sound
    const audioStoppedOnClose = await p.evaluate(async () => {
      const closeBtn = document.querySelector('.food-popover-close');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const video = document.querySelector('video.food-popover-video');
      return !video || video.paused;
    });
    check('Closing popover immediately stops video playback and old audio track', audioStoppedOnClose);

    const shot2 = path.join(screenshotsDir, 'liuzhou-video-popover.png');
    await p.screenshot({ path: shot2 });
    report.screenshots.push(shot2);
    console.log('Saved screenshot:', shot2);

    // Test 2b: Test Video Library Dialog and Amap Search Link with Liuzhou code 450200
    console.log('\n--- 2b. Testing Video Library Dialog & Amap Search City Code ---');
    await p.evaluate(() => window.foodCityMap.videoLibrary.open());
    await p.waitForSelector('#video-library-dialog[open]', { timeout: 10000 });
    await p.waitForSelector('.video-map-search', { timeout: 10000 });
    const amapSearchHref = await p.evaluate(() => {
      const link = document.querySelector('.video-map-search');
      return link ? link.href : '';
    });
    check('Amap search link in video library targets Liuzhou (city=450200)',
      amapSearchHref.includes('city=450200'),
      amapSearchHref
    );
    await p.evaluate(() => window.foodCityMap.videoLibrary.dialog.close());
    await p.waitForFunction(() => !document.querySelector('#video-library-dialog')?.open);

    // -------------------------------------------------------------
    // Test 3: Dual Distance Routing (Direct & Road with OSM Network)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Dual Distance Routing with Raw OSM Network ---');
    await p.evaluate(() => {
      const food = window.foodCityMap.food;
      food.saved = food.records.map(r => r.id);
      food.persistSaved();
      food.refreshSaved();
    });
    await settle(p);

    const directStatus = await p.evaluate(() => {
      const food = window.foodCityMap.food;
      return {
        routeMode: food.routeMode,
        caption: document.getElementById('trip-dock-caption')?.textContent,
        savedCount: food.saved.length,
        phase: food.routePreview.phase
      };
    });
    check('Direct distance mode active with 9 saved stops', directStatus.savedCount === 9 && directStatus.caption.includes('直线约'), directStatus);

    // Test distance badge zoom threshold
    await p.evaluate(() => window.foodCityMap.map.setZoom(15));
    await p.waitForTimeout(300);
    const badgesHiddenZoomedOut = await p.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.food-distance-badge'));
      return badges.length > 0 && badges.every(b => b.classList.contains('is-zoom-hidden'));
    });
    check('Distance badge auto-hides when zoomed out (< 16.5) to avoid obstructing icons', badgesHiddenZoomedOut);

    await p.evaluate(() => window.foodCityMap.map.setZoom(17.5));
    await p.waitForTimeout(300);
    const badgesVisibleZoomedIn = await p.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.food-distance-badge'));
      return badges.length > 0 && badges.every(b => !b.classList.contains('is-zoom-hidden'));
    });
    check('Distance badge smoothly appears when zoomed in (>= 16.5) at street level', badgesVisibleZoomedIn);

    console.log('Switching to road distance mode with 9 stops...');
    await p.evaluate(() => window.foodCityMap.food.setRouteMode('road'));
    await p.waitForFunction(() => {
      const preview = window.foodCityMap?.food?.routePreview;
      return preview && (preview.phase === 'ready' || preview.phase === 'partial');
    }, undefined, { timeout: 20000 });
    await settle(p);

    const roadStatus9 = await p.evaluate(() => {
      const food = window.foodCityMap.food;
      const preview = food.routePreview;
      return {
        routeMode: food.routeMode,
        phase: preview.phase,
        caption: document.getElementById('trip-dock-caption')?.textContent,
        localStorageMode: localStorage.getItem('foodcity:distance-mode:liuzhou:v1'),
        localStorageWants: JSON.parse(localStorage.getItem('foodcity:wants:liuzhou:v1') || '[]')
      };
    });

    check('Road mode computes connected route across Liuzhou with OSM road topology',
      roadStatus9.phase === 'ready' && roadStatus9.caption.includes('沿路约'),
      roadStatus9
    );
    check('Local storage keys isolated to Liuzhou', roadStatus9.localStorageMode === 'road' && roadStatus9.localStorageWants.length === 9, roadStatus9);

    const shot3 = path.join(screenshotsDir, 'liuzhou-road-distance.png');
    await p.screenshot({ path: shot3 });
    report.screenshots.push(shot3);
    console.log('Saved screenshot:', shot3);

    // Open wants list dialog
    await p.locator('#trip-manage').click();
    await p.waitForSelector('#wants-dialog[open]', { timeout: 5000 });
    const shotWants = path.join(screenshotsDir, 'liuzhou-wants-dialog.png');
    await p.screenshot({ path: shotWants });
    report.screenshots.push(shotWants);
    console.log('Saved screenshot:', shotWants);
    await p.locator('#wants-close').click();

    await ctx.close();

    // -------------------------------------------------------------
    // Test 4: Mobile Viewport (390x844)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Mobile Viewport (390x844) ---');
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mp = await mobileCtx.newPage();
    await mp.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await mp.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(mp);

    const mobileCheck = await mp.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      const dock = document.getElementById('trip-dock');
      return {
        cardCount: cards.length,
        dockVisible: dock && !dock.hidden,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    check('Mobile layout renders cards and trip dock without overflow',
      mobileCheck.cardCount === 9 && mobileCheck.dockVisible && !mobileCheck.hasHorizontalOverflow,
      mobileCheck
    );

    const shotMobile = path.join(screenshotsDir, 'liuzhou-mobile.png');
    await mp.screenshot({ path: shotMobile });
    report.screenshots.push(shotMobile);
    console.log('Saved screenshot:', shotMobile);
    await mobileCtx.close();

    // -------------------------------------------------------------
    // Test 5: Small Screen Viewport (320x680)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Small Screen Viewport (320x680) ---');
    const smallCtx = await browser.newContext({ viewport: { width: 320, height: 680 }, isMobile: true, hasTouch: true });
    const sp = await smallCtx.newPage();
    await sp.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await sp.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(sp);

    const smallCheck = await sp.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      const dock = document.getElementById('trip-dock');
      return {
        cardCount: cards.length,
        dockVisible: dock && !dock.hidden,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    check('Small screen (320px) renders cleanly without horizontal overflow',
      smallCheck.cardCount === 9 && !smallCheck.hasHorizontalOverflow,
      smallCheck
    );

    const shotSmall = path.join(screenshotsDir, 'liuzhou-small-320.png');
    await sp.screenshot({ path: shotSmall });
    report.screenshots.push(shotSmall);
    console.log('Saved screenshot:', shotSmall);
    await smallCtx.close();

    // -------------------------------------------------------------
    // Test 6: Short Landscape Viewport (736x414)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Short Landscape Viewport (736x414) ---');
    const landCtx = await browser.newContext({ viewport: { width: 736, height: 414 }, isMobile: true, hasTouch: true });
    const lp = await landCtx.newPage();
    await lp.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await lp.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(lp);

    const landCheck = await lp.evaluate(() => {
      const dock = document.getElementById('trip-dock');
      const entry = document.getElementById('food-entry');
      return {
        dockVisible: dock && !dock.hidden,
        entryVisible: entry && !entry.hidden
      };
    });
    check('Short landscape (736x414) maintains dock and header visibility',
      landCheck.dockVisible && landCheck.entryVisible,
      landCheck
    );

    const shotLandscape = path.join(screenshotsDir, 'liuzhou-landscape-736.png');
    await lp.screenshot({ path: shotLandscape });
    report.screenshots.push(shotLandscape);
    console.log('Saved screenshot:', shotLandscape);
    await landCtx.close();

    // -------------------------------------------------------------
    // Test 7: Chongqing & Changsha Regression & Isolation
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Chongqing & Changsha Multi-City Isolation ---');
    const multiCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const multiP = await multiCtx.newPage();

    // Chongqing check
    await multiP.goto(`${base}/?city=chongqing&view=food`, { waitUntil: 'domcontentloaded' });
    await multiP.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(multiP);

    const cqInfo = await multiP.evaluate(() => ({
      name: window.foodCityMap.city.name,
      cityKey: window.foodCityMap.food.cityKey,
      amapCityCode: window.foodCityMap.city.amapCityCode,
      recordCount: window.foodCityMap.food.records.length,
      hasLiuzhouRecord: window.foodCityMap.food.records.some(r => r.id.includes('lz-') || r.id.includes('liuzhou'))
    }));
    check('Chongqing city loads cleanly with code 500000 and zero Liuzhou pollution',
      cqInfo.name === '重庆' && cqInfo.cityKey === 'chongqing' && cqInfo.amapCityCode === '500000' && !cqInfo.hasLiuzhouRecord,
      cqInfo
    );

    // Changsha check
    await multiP.goto(`${base}/?city=changsha&view=food`, { waitUntil: 'domcontentloaded' });
    await multiP.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(multiP);

    const csInfo = await multiP.evaluate(() => ({
      name: window.foodCityMap.city.name,
      cityKey: window.foodCityMap.food.cityKey,
      amapCityCode: window.foodCityMap.city.amapCityCode,
      recordCount: window.foodCityMap.food.records.length,
      hasLiuzhouRecord: window.foodCityMap.food.records.some(r => r.id.includes('lz-') || r.id.includes('liuzhou'))
    }));
    check('Changsha city loads cleanly with code 430100 and zero Liuzhou pollution',
      csInfo.name === '长沙' && csInfo.cityKey === 'changsha' && csInfo.amapCityCode === '430100' && !csInfo.hasLiuzhouRecord,
      csInfo
    );

    await multiCtx.close();

  } finally {
    await browser.close();
  }

  // Save report
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log('\n=======================================');
  console.log(`QA completed! Total: ${report.checks.length}, Passed: ${report.checks.filter(c => c.passed).length}, Failed: ${report.checks.filter(c => !c.passed).length}`);
  console.log('=======================================\n');
}

main().catch(err => {
  console.error('Fatal error during QA:', err);
  process.exit(1);
});
