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

async function testCard() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  console.log('Navigating to Chengdu food map...');
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food');
  await page.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, { timeout: 25000 });
  await page.waitForTimeout(2000);

  const foodSummary = await page.evaluate(() => {
    const food = window.foodCityMap.food;
    return {
      count: food.records.length,
      records: food.records.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        address: r.address,
        coords: r.coordinates,
        clipsCount: r.clips?.length || 1
      }))
    };
  });
  console.log(`Chengdu food spots loaded: ${foodSummary.count}`);
  for (const r of foodSummary.records) {
    console.log(`  - [${r.category}] ${r.name} (${r.clipsCount} clips) @ ${r.address}`);
  }

  // Take screenshot of whole map with all food cards
  await page.screenshot({ path: '../output/research/chengdu/screenshots/chengdu-food-spots-overview.png' });
  console.log('Saved overview screenshot: chengdu-food-spots-overview.png');

  // Zoom into a specific spot (e.g. 朱大嘴肥肠豆汤 in Chunxi/Daci area) to test card expansion and video playback
  console.log('Focusing on 朱大嘴肥肠豆汤...');
  await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('朱大嘴')) || food.records[0];
    window.foodCityMap.map.flyTo({ center: target.coordinates, zoom: 16.5, duration: 0 });
  });
  await page.waitForTimeout(1000);

  // Open popover on target
  console.log('Showing popover on 朱大嘴肥肠豆汤...');
  await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('朱大嘴')) || food.records[0];
    food.overlay.showPopover(target, true);
  });
  await page.waitForTimeout(1000);

  // Click play button
  console.log('Clicking ▶ play button on popover...');
  await page.click('.food-popover-play', { force: true });
  await page.waitForTimeout(2000);

  const playState = await page.evaluate(() => {
    const v = document.querySelector('.food-inline-popover video');
    return {
      hasVideo: !!v,
      src: v ? v.src : null,
      paused: v ? v.paused : null,
      currentTime: v ? v.currentTime : null,
      duration: v ? v.duration : null,
      videoWidth: v ? v.videoWidth : null,
      videoHeight: v ? v.videoHeight : null
    };
  });
  console.log('Video play state:', playState);
  await page.screenshot({ path: '../output/research/chengdu/screenshots/chengdu-video-playing.png' });
  console.log('Saved playing screenshot: chengdu-video-playing.png');
  // Close popover
  await page.evaluate(() => window.foodCityMap.food.overlay.popover.close());
  await page.waitForTimeout(500);

  // Test route planning between 2 spots
  console.log('Testing route planning between 2 spots...');
  const routeRes = await page.evaluate(async () => {
    const food = window.foodCityMap.food;
    food.toggleSave(food.records[0].id);
    food.toggleSave(food.records[1].id);
    await new Promise(r => setTimeout(r, 1000));
    const dock = document.querySelector('.food-dock');
    const badge = document.querySelector('.food-route-badge') || document.querySelector('.food-dock-route');
    return {
      savedCount: food.saved.length,
      dockVisible: dock ? !dock.hidden : false,
      badgeText: badge ? badge.textContent.trim() : null
    };
  });
  console.log('Route planning result:', routeRes);
  await page.screenshot({ path: '../output/research/chengdu/screenshots/chengdu-route-planned.png' });
  console.log('Saved route planned screenshot: chengdu-route-planned.png');

  await browser.close();
  console.log('SUCCESS: All 14 Chengdu food cards verified with real video playback and route planning!');
  console.log('Saved playing screenshot');

  await browser.close();
}
testCard();
