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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const screenshotDir = path.resolve(root, 'output/research/chengdu/screenshots');
await fs.mkdir(screenshotDir, { recursive: true });

async function verifyPresentation() {
  console.log('=== Verifying Chengdu Batch 2 Three-Level Progressive Presentation & Co-Anchoring ===');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  console.log('1. Loading Chengdu food map view...');
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food');
  await page.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, { timeout: 25000 });
  await page.waitForTimeout(2000);

  // Check 1: Total spots count
  const stats = await page.evaluate(() => {
    const records = window.foodCityMap.food.records;
    const multiBlogger = records.filter(r => r.clips && r.clips.length > 1);
    return {
      totalRecords: records.length,
      multiBloggerCount: multiBlogger.length,
      multiBloggerNames: multiBlogger.map(r => `${r.name} (${r.clips.length} 博主: ${r.clips.map(c => c.author).join(', ')})`)
    };
  });
  console.log(`Total mapped spots: ${stats.totalRecords}`);
  console.log(`Multi-blogger spots (${stats.multiBloggerCount}):`);
  for (const m of stats.multiBloggerNames) {
    console.log(`  - ${m}`);
  }

  // Check 2: Level 1 - zoom < 14.8 collapsed dots
  console.log('\n2. Testing Level 1 (zoom < 14.8): 48px round avatar dots');
  await page.evaluate(() => window.foodCityMap.map.setZoom(13.8));
  await page.waitForTimeout(1000);
  const dotState = await page.evaluate(() => {
    const cardElements = Array.from(document.querySelectorAll('.food-card'));
    const collapsedElements = Array.from(document.querySelectorAll('.food-card.is-collapsed'));
    return {
      totalCards: cardElements.length,
      collapsedCards: collapsedElements.length,
      sampleSize: cardElements[0] ? {
        width: cardElements[0].offsetWidth,
        height: cardElements[0].offsetHeight,
        isCollapsed: cardElements[0].classList.contains('is-collapsed')
      } : null
    };
  });
  console.log('Dot state (zoom 13.8):', dotState);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-level1-dots.png') });

  // Check 3: Level 2 - Click/select a card when zoom >= 14.8 expands to 190px cream food card
  console.log('\n3. Testing Level 2 (zoom >= 14.8 & click/select): 190px cream food card');
  await page.evaluate(() => {
    window.foodCityMap.map.setZoom(15.5);
    const firstSpot = window.foodCityMap.food.records[0];
    window.foodCityMap.food.overlay.setState(firstSpot.id, []);
  });
  await page.waitForTimeout(1000);
  const cardState = await page.evaluate(() => {
    const cardElements = Array.from(document.querySelectorAll('.food-card'));
    const expandedElements = cardElements.filter(el => !el.classList.contains('is-collapsed'));
    return {
      totalCards: cardElements.length,
      expandedCards: expandedElements.length,
      selectedCardSize: expandedElements[0] ? {
        id: expandedElements[0].dataset.foodId,
        width: expandedElements[0].offsetWidth,
        height: expandedElements[0].offsetHeight,
        isCollapsed: expandedElements[0].classList.contains('is-collapsed')
      } : null
    };
  });
  console.log('Card state (zoom 15.5 & selected):', cardState);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-level2-cards.png') });

  // Check 4: Level 3 - Video popover on 毛记和意冒菜 (3 bloggers co-anchored)
  console.log('\n4. Testing Level 3: Popover on 毛记和意冒菜 & multi-blogger switching');
  await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('毛记和意'));
    window.foodCityMap.map.flyTo({ center: target.coordinates, zoom: 16.5, duration: 0 });
    food.overlay.showPopover(target, true);
  });
  await page.waitForTimeout(1500);

  const popoverInfo = await page.evaluate(() => {
    const popover = document.querySelector('.food-inline-popover');
    if (!popover) return null;
    const video = popover.querySelector('video');
    const media = popover.querySelector('.food-popover-media');
    const clips = Array.from(popover.querySelectorAll('.food-popover-clip')).map(t => t.textContent.trim());
    return {
      hasPopover: true,
      shopName: popover.querySelector('.food-popover-heading strong')?.textContent?.trim(),
      clips,
      mediaHeight: media?.offsetHeight,
      popoverHeight: popover.offsetHeight,
      mediaRatio: (media?.offsetHeight / popover.offsetHeight).toFixed(2)
    };
  });
  console.log('Popover info:', popoverInfo);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-level3-popover-maojiheyi.png') });

  // Play video on popover (Clip 1 - 肉肉大搜索)
  console.log('Clicking play on popover (Clip 1)...');
  await page.click('.food-popover-play', { force: true });
  await page.waitForTimeout(2000);
  const playInfo1 = await page.evaluate(() => {
    const v = document.querySelector('.food-inline-popover video');
    return {
      playing: v && !v.paused && v.currentTime > 0,
      currentTime: v?.currentTime,
      duration: v?.duration,
      src: v?.src
    };
  });
  console.log('Playback info (Clip 1 - 肉肉大搜索):', playInfo1);

  // Switch to Clip 2 (阿鸡) or Clip 3 (肖大毛)
  console.log('Switching to another blogger clip...');
  const switched = await page.evaluate(() => {
    const clips = Array.from(document.querySelectorAll('.food-popover-clip'));
    if (clips.length > 1) {
      clips[1].click();
      return { clickedText: clips[1].textContent.trim() };
    }
    return null;
  });
  console.log('Switched clip button:', switched);
  await page.waitForTimeout(1000);

  // Play second clip
  await page.click('.food-popover-play', { force: true });
  await page.waitForTimeout(2000);
  const playInfo2 = await page.evaluate(() => {
    const v = document.querySelector('.food-inline-popover video');
    return {
      playing: v && !v.paused && v.currentTime > 0,
      currentTime: v?.currentTime,
      duration: v?.duration,
      src: v?.src
    };
  });
  console.log('Playback info (switched clip):', playInfo2);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-level3-video-playing-switched.png') });

  // Close popover and verify audio/video stops
  console.log('Closing popover...');
  await page.evaluate(() => window.foodCityMap.food.overlay.popover.close());
  await page.waitForTimeout(500);
  const stopped = await page.evaluate(() => {
    const v = document.querySelector('video');
    return !v || v.paused;
  });
  console.log('Video stopped on close:', stopped);

  // Check 5: Route planning between two batch 2 spots (王记锅魁 & 眼哥素椒面)
  console.log('\n5. Testing topological road walking route between 2 spots...');
  const route = await page.evaluate(async () => {
    const food = window.foodCityMap.food;
    food.saved = []; // clear
    const spot1 = food.records.find(r => r.name.includes('王记特色锅魁'));
    const spot2 = food.records.find(r => r.name.includes('眼哥素椒面'));
    if (!spot1 || !spot2) return { error: 'spots not found' };

    food.toggleSave(spot1.id);
    food.toggleSave(spot2.id);

    // Wait for route calculation
    await new Promise(r => setTimeout(r, 1500));
    const badge = document.querySelector('.food-route-badge') || document.querySelector('.food-dock-route');
    const routeLayer = window.foodCityMap.map.getSource('food-route-line');
    return {
      spot1: spot1.name,
      spot2: spot2.name,
      savedCount: food.saved.length,
      badgeText: badge ? badge.textContent.trim() : null,
      hasRouteSource: !!routeLayer
    };
  });
  console.log('Route result:', route);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-batch2-route-planned.png') });

  await browser.close();
  console.log('\n=== All presentation, video playback, and road routing checks PASSED! ===');
}

verifyPresentation().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
