import { chromium } from 'file:///D:/nodejs/node_global/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const base = 'http://127.0.0.1:8791';
  const report = {
    verifiedOn: new Date().toISOString(),
    city: 'liuzhou',
    source: 'lz-wangzulan-7575112557141898601',
    checks: [],
    errors: [],
    screenshots: []
  };

  const check = (name, passed, detail) => {
    report.checks.push({ name, passed: !!passed, ...(detail !== undefined ? { detail } : {}) });
    console.log((passed ? '✓ PASS: ' : '✗ FAIL: ') + name);
  };

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const settle = async p => {
    await p.waitForFunction(() => {
      const map = window.foodCityMap?.map;
      return map && !map.isMoving() && map.isSourceLoaded('city') && map.areTilesLoaded();
    }, undefined, { timeout: 20000 }).catch(() => {});
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Liuzhou Desktop View
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Liuzhou Desktop Map ---');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', err => report.errors.push({ stage: 'liuzhou-desktop', error: err.message }));

    console.log('Navigating to Liuzhou map...');
    await p.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(p);

    const cityInfo = await p.evaluate(() => ({
      name: window.foodCityMap.city.name,
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
        localPoster: r.localPoster
      }))
    }));

    check('Liuzhou city identified correctly', cityInfo.name === '柳州' && cityInfo.cityKey === 'liuzhou', cityInfo);
    check('3 food records loaded at Qingyun Market', cityInfo.recordCount === 3, cityInfo.records);
    check('All 3 records have local MP4 clips and JPG posters', cityInfo.records.every(r => r.localClip && r.localPoster), cityInfo.records);

    const allCollapsedInitial = await p.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      return cards.length === 3 && Array.from(cards).every(c => c.classList.contains('is-collapsed'));
    });
    check('All food markers default to collapsed circular icon badges', allCollapsedInitial);

    const shot1 = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-food-overview.png';
    await p.screenshot({ path: shot1 });
    report.screenshots.push(shot1);
    console.log('Saved screenshot:', shot1);

    // -------------------------------------------------------------
    // Test 2: Card Expansion, Close Button & Video Playback
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Card Expansion, Close Button & Video Playback ---');
    const firstShop = cityInfo.records[0];
    const cardSelector = `.food-card[data-food-id="${firstShop.id}"]`;
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
        otherCardsStayCollapsed: otherCards.length === 2 && otherCards.every(c => c.classList.contains('is-collapsed'))
      };
    }, cardSelector);

    check('Clicking circular badge expands ONLY that card into rectangle with "×" close button',
      cardExpanded.isExpanded && cardExpanded.hasCloseButton && cardExpanded.closeButtonVisible && cardExpanded.otherCardsStayCollapsed,
      cardExpanded
    );

    const shotExpanded = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-card-expanded.png';
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

    check('Popover opened and video is playing with advancing playback', videoState.found && !videoState.paused && videoState.currentTime > 0.1, videoState);

    const shot2 = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-video-popover.png';
    await p.screenshot({ path: shot2 });
    report.screenshots.push(shot2);
    console.log('Saved screenshot:', shot2);

    // -------------------------------------------------------------
    // Test 3: Dual Distance Routing (Direct & Road)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Dual Distance Routing ---');
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
    check('Direct distance mode active with 3 saved stops', directStatus.savedCount === 3 && directStatus.caption.includes('直线约'), directStatus);

    // Test distance badge zoom threshold (hidden when zoom < 16.5, visible when zoom >= 16.5)
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

    console.log('Switching to road distance mode...');
    await p.evaluate(() => window.foodCityMap.food.setRouteMode('road'));
    await p.waitForFunction(() => {
      const preview = window.foodCityMap?.food?.routePreview;
      return preview && preview.phase === 'ready';
    }, undefined, { timeout: 15000 });
    await settle(p);

    const roadStatus = await p.evaluate(() => {
      const food = window.foodCityMap.food;
      const preview = food.routePreview;
      return {
        routeMode: food.routeMode,
        phase: preview.phase,
        total: preview.total,
        caption: document.getElementById('trip-dock-caption')?.textContent,
        roadPointsCount: preview.roadPoints?.length || 0,
        localStorageMode: localStorage.getItem('foodcity:distance-mode:liuzhou:v1'),
        localStorageWants: JSON.parse(localStorage.getItem('foodcity:wants:liuzhou:v1') || '[]')
      };
    });

    check('Road mode computed realistic route using Liuzhou road network', roadStatus.phase === 'ready' && roadStatus.total < 200 && roadStatus.caption.includes('沿路约'), roadStatus);
    check('Local storage keys isolated to Liuzhou', roadStatus.localStorageMode === 'road' && roadStatus.localStorageWants.length === 3, roadStatus);

    const shot3 = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-road-distance.png';
    await p.screenshot({ path: shot3 });
    report.screenshots.push(shot3);
    console.log('Saved screenshot:', shot3);

    // Open wants list dialog using the trip dock manage button
    await p.locator('#trip-manage').click();
    await p.waitForSelector('#wants-dialog[open]', { timeout: 5000 });
    const shotWants = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-wants-dialog.png';
    await p.screenshot({ path: shotWants });
    report.screenshots.push(shotWants);
    console.log('Saved screenshot:', shotWants);
    await p.locator('#wants-close').click();

    await ctx.close();

    // -------------------------------------------------------------
    // Test 4: Mobile Viewport (390x844)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Mobile Viewport ---');
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
        dockVisible: dock && !dock.hidden
      };
    });
    check('Mobile layout renders cards and trip dock', mobileCheck.cardCount === 3 && mobileCheck.dockVisible, mobileCheck);

    const shotMobile = 'D:/Antigravity/地图/output/research/liuzhou/screenshots/liuzhou-mobile.png';
    await mp.screenshot({ path: shotMobile });
    report.screenshots.push(shotMobile);
    console.log('Saved screenshot:', shotMobile);
    await mobileCtx.close();

    // -------------------------------------------------------------
    // Test 5: Chongqing Backward Compatibility & Data Isolation
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Chongqing Compatibility ---');
    const cqCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const cqp = await cqCtx.newPage();
    await cqp.goto(`${base}/?city=chongqing&view=food`, { waitUntil: 'domcontentloaded' });
    await cqp.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(cqp);

    const cqInfo = await cqp.evaluate(() => ({
      name: window.foodCityMap.city.name,
      cityKey: window.foodCityMap.food.cityKey,
      recordCount: window.foodCityMap.food.records.length,
      hasLiuzhouRecord: window.foodCityMap.food.records.some(r => r.id.includes('lz-') || r.id.includes('liuzhou'))
    }));

    check('Chongqing city loads with correct city name', cqInfo.name === '重庆' && cqInfo.cityKey === 'chongqing', cqInfo);
    check('Chongqing records are not polluted by Liuzhou records', cqInfo.recordCount > 0 && !cqInfo.hasLiuzhouRecord, cqInfo);
    await cqCtx.close();

  } finally {
    await browser.close();
  }

  // Save report
  await fs.writeFile('D:/Antigravity/地图/output/research/liuzhou/QA-LIUZHOU-INTAKE.json', JSON.stringify(report, null, 2) + '\n');
  console.log('\n=======================================');
  console.log(`QA completed! Total: ${report.checks.length}, Passed: ${report.checks.filter(c => c.passed).length}, Failed: ${report.checks.filter(c => !c.passed).length}`);
  console.log('=======================================\n');
}

main().catch(err => {
  console.error('Fatal error during QA:', err);
  process.exit(1);
});