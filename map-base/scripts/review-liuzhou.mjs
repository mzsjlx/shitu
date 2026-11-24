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
const port = portArg !== -1 ? process.argv[portArg + 1] : (process.env.PREVIEW_PORT || '8795');
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

  const openFirstVisiblePopover = async p => {
    await p.evaluate(() => {
      const visibleCard = Array.from(document.querySelectorAll('.food-card')).find(c => {
        const r = c.getBoundingClientRect();
        return r.left >= -20 && r.right <= window.innerWidth + 20 && r.top >= -20 && r.bottom <= window.innerHeight + 20;
      }) || document.querySelector('.food-card');
      if (visibleCard) {
        const btn = visibleCard.querySelector('.food-open') || visibleCard;
        btn.click();
      }
    });
    await p.waitForFunction(() => {
      const popover = document.querySelector('.food-inline-popover');
      return popover && !popover.hidden && popover.classList.contains('is-shown');
    }, undefined, { timeout: 10000 });
  };

  const measurePopoverRatio = async p => {
    return await p.evaluate(() => {
      const popover = document.querySelector('.food-inline-popover');
      const media = document.querySelector('.food-popover-media');
      if (!popover || !media) return null;
      const pRect = popover.getBoundingClientRect();
      const mRect = media.getBoundingClientRect();
      const pArea = pRect.width * pRect.height;
      const mArea = mRect.width * mRect.height;
      return {
        popoverWidth: pRect.width,
        popoverHeight: pRect.height,
        popoverArea: pArea,
        mediaWidth: mRect.width,
        mediaHeight: mRect.height,
        mediaArea: mArea,
        ratio: pArea > 0 ? mArea / pArea : 0
      };
    });
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
    const EXPECTED_COUNT = 51;
    check(`${EXPECTED_COUNT} food records loaded across Liuzhou`, cityInfo.recordCount === EXPECTED_COUNT, cityInfo.records.length);
    check(`All ${EXPECTED_COUNT} records have local MP4 clips and JPG posters`, cityInfo.records.every(r => r.localClip && r.localPoster), cityInfo.records.length);
    check(`All ${EXPECTED_COUNT} records have open OSM anchor references`,
      cityInfo.records.every(r => r.planningLocation?.anchor?.id && r.planningLocation?.anchor?.url?.startsWith('https://www.openstreetmap.org/')),
      cityInfo.records.map(r => r.planningLocation?.anchor?.name)
    );

    const allCollapsedInitial = await p.evaluate(cnt => {
      const cards = document.querySelectorAll('.food-card');
      return cards.length === cnt && Array.from(cards).every(c => c.classList.contains('is-collapsed'));
    }, EXPECTED_COUNT);
    check(`All ${EXPECTED_COUNT} food markers default to collapsed circular icon badges`, allCollapsedInitial);

    const shot1 = path.join(screenshotsDir, 'liuzhou-food-overview.png');
    await p.screenshot({ path: shot1 });
    report.screenshots.push(shot1);
    console.log('Saved screenshot:', shot1);

    // -------------------------------------------------------------
    // Test 2: Card Expansion, Popover Ratio, Video Playback & Retained Old Video Audio Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Card Expansion, Popover Ratio, Playback & Lifecycle ---');
    const testShop = cityInfo.records.find(r => r.id === 'video-lz-chenhe-aningmeng') || cityInfo.records[0];
    const cardSelector = `.food-card[data-food-id="${testShop.id}"]`;
    await p.waitForSelector(cardSelector, { timeout: 10000 });

    // Step 2a: Click circular badge to expand card and show popover
    await p.locator(`${cardSelector} .food-open`).click();
    await p.waitForFunction(() => {
      const popover = document.querySelector('.food-inline-popover');
      return popover && !popover.hidden && popover.classList.contains('is-shown');
    }, undefined, { timeout: 10000 });

    const cardExpanded = await p.evaluate(([sel, exp]) => {
      const card = document.querySelector(sel);
      const closeBtn = card?.querySelector('.food-card-close');
      const otherCards = Array.from(document.querySelectorAll('.food-card')).filter(c => c !== card);
      return {
        isExpanded: card && !card.classList.contains('is-collapsed'),
        hasCloseButton: !!closeBtn,
        closeButtonVisible: closeBtn && getComputedStyle(closeBtn).display !== 'none',
        otherCardsStayCollapsed: otherCards.length === (exp - 1) && otherCards.every(c => c.classList.contains('is-collapsed'))
      };
    }, [cardSelector, EXPECTED_COUNT]);

    check('Clicking circular badge expands ONLY that card into rectangle with "×" close button',
      cardExpanded.isExpanded && cardExpanded.hasCloseButton && cardExpanded.closeButtonVisible && cardExpanded.otherCardsStayCollapsed,
      cardExpanded
    );

    // Assert popover media area >= 2/3 in Desktop Viewport
    const desktopRatio = await measurePopoverRatio(p);
    check('Desktop (1440x960) popover media area >= 2/3 of border box',
      desktopRatio && desktopRatio.ratio >= (2.0 / 3.0),
      desktopRatio
    );

    const shotExpanded = path.join(screenshotsDir, 'liuzhou-card-expanded.png');
    await p.screenshot({ path: shotExpanded });
    report.screenshots.push(shotExpanded);
    console.log('Saved screenshot of expanded card:', shotExpanded);

    // Step 2b: Test closing card via "×" button collapses card back
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

    // Retain reference to old video in window for lifecycle assertions
    await p.evaluate(() => {
      window.__testedVideo1 = document.querySelector('video.food-popover-video');
    });

    // Dual-sample advance check: sample 1 -> wait 1000ms -> sample 2
    const sample1 = await p.evaluate(() => ({
      t: window.__testedVideo1?.currentTime || 0,
      paused: window.__testedVideo1?.paused ?? true
    }));
    await p.waitForTimeout(1000);
    const sample2 = await p.evaluate(() => ({
      t: window.__testedVideo1?.currentTime || 0,
      paused: window.__testedVideo1?.paused ?? true
    }));
    const advance = sample2.t - sample1.t;
    check('Video mounts and playback advances time across two samples (dt >= 0.3s)',
      advance >= 0.3 && !sample2.paused,
      { sample1, sample2, advance }
    );

    // Test Audio Lifecycle: closing popover stops video playback and cleans src
    await p.locator('.food-popover-close').click();
    await p.waitForTimeout(400);

    const oldVideoState = await p.evaluate(() => {
      const v = window.__testedVideo1;
      const popover = document.querySelector('.food-inline-popover');
      return {
        popoverHidden: popover ? popover.hidden : true,
        paused: v ? v.paused : true,
        hasSrc: v ? (v.hasAttribute('src') && v.getAttribute('src') !== '') : false,
        srcVal: v ? v.getAttribute('src') : null
      };
    });
    check('Closing popover immediately pauses old video reference, removes src, and stops sound',
      oldVideoState.popoverHidden && oldVideoState.paused && !oldVideoState.hasSrc,
      oldVideoState
    );

    // -------------------------------------------------------------
    // Test 2d: Store Switch Lifecycle (Playing Store A -> Click Store B -> Store A Video Paused & No Src)
    // -------------------------------------------------------------
    console.log('\n--- 2d. Testing Store Switch Video Lifecycle ---');
    // Open Store A again and play
    await p.locator(`${cardSelector} .food-open`).click();
    await p.waitForSelector('button.food-popover-play', { timeout: 5000 });
    await p.locator('button.food-popover-play').click();
    await p.waitForSelector('video.food-popover-video', { timeout: 5000 });
    await p.evaluate(() => {
      window.__storeVideoA = document.querySelector('video.food-popover-video');
    });

    // Switch to Store B (张记玉米汁)
    const cardBSelector = '.food-card[data-food-id="video-lz-wangzulan-zhangji"]';
    await p.locator(`${cardBSelector} .food-open`).click();
    await p.waitForFunction(() => {
      const title = document.querySelector('.food-popover-heading strong')?.textContent;
      return title && title.includes('张记');
    }, undefined, { timeout: 10000 });

    const storeASwitchState = await p.evaluate(() => {
      const vA = window.__storeVideoA;
      return {
        paused: vA ? vA.paused : true,
        hasSrc: vA ? (vA.hasAttribute('src') && vA.getAttribute('src') !== '') : false
      };
    });
    check('Switching to another store immediately stops previous store video reference and unmounts src',
      storeASwitchState.paused && !storeASwitchState.hasSrc,
      storeASwitchState
    );

    // -------------------------------------------------------------
    // Test 2e: Multi-Creator Shop Switch Lifecycle on 张记玉米汁 (王祖蓝, 刘雨鑫JASON, 卡不答)
    // -------------------------------------------------------------
    console.log('\n--- 2e. Testing Multi-Creator Shop Switch Lifecycle ---');
    const multiCreatorTest = await p.evaluate(() => {
      const clipButtons = Array.from(document.querySelectorAll('.food-popover-clip'));
      return {
        clipCount: clipButtons.length,
        authors: clipButtons.map(b => b.textContent)
      };
    });
    check('Multi-creator shop "张记玉米汁" offers multiple creator clips (>= 2)',
      multiCreatorTest.clipCount >= 2,
      multiCreatorTest
    );

    // Play Creator 1
    await p.locator('button.food-popover-play').click();
    await p.waitForSelector('video.food-popover-video', { timeout: 5000 });
    await p.evaluate(() => {
      window.__creatorVideo1 = document.querySelector('video.food-popover-video');
    });
    const c1_t1 = await p.evaluate(() => window.__creatorVideo1?.currentTime || 0);
    await p.waitForTimeout(800);
    const c1_t2 = await p.evaluate(() => window.__creatorVideo1?.currentTime || 0);
    const c1_adv = c1_t2 - c1_t1;

    // Switch to Creator 2 (click 2nd clip button)
    const clipBtns = p.locator('.food-popover-clip');
    await clipBtns.nth(1).click();
    await p.waitForTimeout(300);

    const c1_afterSwitch = await p.evaluate(() => {
      const v1 = window.__creatorVideo1;
      return {
        paused: v1 ? v1.paused : true,
        hasSrc: v1 ? (v1.hasAttribute('src') && v1.getAttribute('src') !== '') : false
      };
    });

    // Play Creator 2
    await p.locator('button.food-popover-play').click();
    await p.waitForSelector('video.food-popover-video', { timeout: 5000 });
    await p.evaluate(() => {
      window.__creatorVideo2 = document.querySelector('video.food-popover-video');
    });
    const c2_t1 = await p.evaluate(() => window.__creatorVideo2?.currentTime || 0);
    await p.waitForTimeout(800);
    const c2_t2 = await p.evaluate(() => window.__creatorVideo2?.currentTime || 0);
    const c2_adv = c2_t2 - c2_t1;

    // Close popover
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);

    const c2_afterClose = await p.evaluate(() => {
      const v2 = window.__creatorVideo2;
      return {
        paused: v2 ? v2.paused : true,
        hasSrc: v2 ? (v2.hasAttribute('src') && v2.getAttribute('src') !== '') : false
      };
    });

    const multiCreatorOk = c1_adv >= 0.2 && c1_afterSwitch.paused && !c1_afterSwitch.hasSrc &&
                           c2_adv >= 0.2 && c2_afterClose.paused && !c2_afterClose.hasSrc;
    check('Multi-creator shop switch: old creator video stops, new creator plays and advances, stops on close',
      multiCreatorOk,
      { c1_adv, c1_afterSwitch, c2_adv, c2_afterClose }
    );

    const shot2 = path.join(screenshotsDir, 'liuzhou-video-popover.png');
    await p.screenshot({ path: shot2 });
    report.screenshots.push(shot2);
    console.log('Saved screenshot:', shot2);

    // Test 2f: Test Video Library Dialog and Amap Search Link with Liuzhou code 450200
    console.log('\n--- 2f. Testing Video Library Dialog & Amap Search City Code ---');
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
    check(`Direct distance mode active with ${EXPECTED_COUNT} saved stops`, directStatus.savedCount === EXPECTED_COUNT && directStatus.caption.includes('直线约'), directStatus);

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

    console.log(`Switching to road distance mode with ${EXPECTED_COUNT} stops...`);
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

    check('Road mode handles all saved stops with OSM road topology (displays partial disconnect truthfully)',
      (roadStatus9.phase === 'ready' || roadStatus9.phase === 'partial') && (roadStatus9.caption.includes('沿路约') || roadStatus9.caption.includes('暂未连通')),
      roadStatus9
    );
    check('Local storage keys isolated to Liuzhou', roadStatus9.localStorageMode === 'road' && roadStatus9.localStorageWants.length === EXPECTED_COUNT, roadStatus9);

    // Also verify a connected sequence computes full road distance
    await p.evaluate(() => {
      const food = window.foodCityMap.food;
      food.saved = food.records.slice(0, 9).map(r => r.id);
      food.persistSaved();
      food.refreshSaved();
      food.setRouteMode('road');
    });
    await p.waitForFunction(() => {
      const preview = window.foodCityMap?.food?.routePreview;
      return preview && preview.phase === 'ready';
    }, undefined, { timeout: 15000 });
    await settle(p);

    const connectedStatus = await p.evaluate(() => {
      const food = window.foodCityMap.food;
      return {
        routeMode: food.routeMode,
        phase: food.routePreview.phase,
        caption: document.getElementById('trip-dock-caption')?.textContent,
        savedCount: food.saved.length
      };
    });
    check('Connected sequence of stops computes exact road distance with "沿路约" badge',
      connectedStatus.phase === 'ready' && connectedStatus.caption.includes('沿路约'),
      connectedStatus
    );

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
    // Test 4: Mobile Viewport (390x844) & Popover Ratio >= 2/3
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Mobile Viewport (390x844) & Popover Ratio ---');
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'zh-CN' });
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
      mobileCheck.cardCount === EXPECTED_COUNT && mobileCheck.dockVisible && !mobileCheck.hasHorizontalOverflow,
      mobileCheck
    );

    // Open popover on mobile and assert ratio >= 2/3
    await openFirstVisiblePopover(mp);
    const mobileRatio = await measurePopoverRatio(mp);
    check('Mobile (390x844) popover media area >= 2/3 of border box',
      mobileRatio && mobileRatio.ratio >= (2.0 / 3.0),
      mobileRatio
    );

    const shotMobile = path.join(screenshotsDir, 'liuzhou-mobile.png');
    await mp.screenshot({ path: shotMobile });
    report.screenshots.push(shotMobile);
    console.log('Saved screenshot:', shotMobile);
    await mobileCtx.close();

    // -------------------------------------------------------------
    // Test 5: Small Screen Viewport (320x680) & Popover Ratio >= 2/3
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Small Screen Viewport (320x680) & Popover Ratio ---');
    const smallCtx = await browser.newContext({ viewport: { width: 320, height: 680 }, isMobile: true, hasTouch: true, locale: 'zh-CN' });
    const sp = await smallCtx.newPage();
    await sp.goto(`${base}/?city=liuzhou&view=food`, { waitUntil: 'domcontentloaded' });
    await sp.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(sp);

    const smallCheck = await sp.evaluate(() => {
      const cards = document.querySelectorAll('.food-card');
      return {
        cardCount: cards.length,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    check('Small screen (320px) renders cleanly without horizontal overflow',
      smallCheck.cardCount === EXPECTED_COUNT && !smallCheck.hasHorizontalOverflow,
      smallCheck
    );

    // Open popover on small screen and assert ratio >= 2/3
    await openFirstVisiblePopover(sp);
    const smallRatio = await measurePopoverRatio(sp);
    check('Small screen (320x680) popover media area >= 2/3 of border box',
      smallRatio && smallRatio.ratio >= (2.0 / 3.0),
      smallRatio
    );

    const shotSmall = path.join(screenshotsDir, 'liuzhou-small-320.png');
    await sp.screenshot({ path: shotSmall });
    report.screenshots.push(shotSmall);
    console.log('Saved screenshot:', shotSmall);
    await smallCtx.close();

    // -------------------------------------------------------------
    // Test 6: Short Landscape Viewport (736x414) & Popover Ratio >= 2/3
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Short Landscape Viewport (736x414) & Popover Ratio ---');
    const landCtx = await browser.newContext({ viewport: { width: 736, height: 414 }, isMobile: true, hasTouch: true, locale: 'zh-CN' });
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

    // Open popover on short landscape and assert ratio >= 2/3
    await openFirstVisiblePopover(lp);
    const landRatio = await measurePopoverRatio(lp);
    check('Short landscape (736x414) popover media area >= 2/3 of border box',
      landRatio && landRatio.ratio >= (2.0 / 3.0),
      landRatio
    );

    const shotLandscape = path.join(screenshotsDir, 'liuzhou-landscape-736.png');
    await lp.screenshot({ path: shotLandscape });
    report.screenshots.push(shotLandscape);
    console.log('Saved screenshot:', shotLandscape);
    await landCtx.close();

    // -------------------------------------------------------------
    // Test 7: Multi-City Isolation & Regression (Chongqing, Changsha, Wuhan, Chaoshan, Nanjing, Zhengzhou)
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing 6-City Multi-City Isolation & Regression ---');
    const multiCtx = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const multiP = await multiCtx.newPage();

    const citiesToTest = [
      { key: 'chongqing', name: '重庆', code: '500000' },
      { key: 'changsha', name: '长沙', code: '430100' },
      { key: 'wuhan', name: '武汉', code: '420100' },
      { key: 'chaoshan', name: '潮汕', code: '440500' },
      { key: 'nanjing', name: '南京', code: '320100' },
      { key: 'zhengzhou', name: '郑州', code: '410100' }
    ];

    for (const c of citiesToTest) {
      await multiP.goto(`${base}/?city=${c.key}&view=food`, { waitUntil: 'domcontentloaded' });
      await multiP.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
      await settle(multiP);

      const info = await multiP.evaluate(() => ({
        name: window.foodCityMap.city.name,
        cityKey: window.foodCityMap.food.cityKey,
        amapCityCode: window.foodCityMap.city.amapCityCode,
        recordCount: window.foodCityMap.food.records.length,
        hasLiuzhouRecord: window.foodCityMap.food.records.some(r => r.id.includes('lz-') || r.id.includes('liuzhou'))
      }));

      check(`${c.name} city loads cleanly with code ${c.code} and zero Liuzhou pollution`,
        info.name === c.name && info.cityKey === c.key && info.amapCityCode === c.code && info.recordCount > 0 && !info.hasLiuzhouRecord,
        info
      );
    }

    await multiCtx.close();

    // -------------------------------------------------------------
    // Test 8: Single-file preview-liuzhou.html Standalone Verification
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Standalone Bundle preview-liuzhou.html ---');
    const singleCtx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const singleP = await singleCtx.newPage();
    await singleP.goto(`${base}/preview-liuzhou.html?view=food`, { waitUntil: 'domcontentloaded' });
    await singleP.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, undefined, { timeout: 35000 });
    await settle(singleP);

    const singleCards = await singleP.locator('.food-card').count();
    check('Standalone bundle preview-liuzhou.html renders exactly 51 food cards',
      singleCards === EXPECTED_COUNT,
      { singleCards }
    );
    const shotSingle = path.join(screenshotsDir, 'liuzhou-preview-bundle-1440.png');
    await singleP.screenshot({ path: shotSingle });
    report.screenshots.push(shotSingle);
    console.log('Saved screenshot:', shotSingle);
    await singleCtx.close();

  } finally {
    await browser.close();
  }

  // Save report
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log('\n=======================================');
  console.log(`QA completed! Total: ${report.checks.length}, Passed: ${report.checks.filter(c => c.passed).length}, Failed: ${report.checks.filter(c => !c.passed).length}`);
  console.log('=======================================\n');

  if (report.checks.some(c => !c.passed)) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error during QA:', err);
  process.exit(1);
});
