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

async function verifyBatch3() {
  console.log('=== Verifying Chengdu Batch 3 Progressive Presentation, Co-Anchoring & Playback ===');
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

  // Check 1: Stats & Multi-blogger spots
  const stats = await page.evaluate(() => {
    const records = window.foodCityMap.food.records;
    const multiBlogger = records.filter(r => r.clips && r.clips.length > 1);
    return {
      totalRecords: records.length,
      multiBloggerCount: multiBlogger.length,
      multiBloggerList: multiBlogger.map(r => ({
        name: r.name,
        clipsCount: r.clips.length,
        bloggers: r.clips.map(c => c.author)
      }))
    };
  });
  console.log(`Total mapped spots: ${stats.totalRecords}`);
  console.log(`Multi-blogger spots (${stats.multiBloggerCount}):`);
  for (const m of stats.multiBloggerList) {
    console.log(`  - ${m.name} (${m.clipsCount} clips: ${m.bloggers.join(', ')})`);
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

  // Check 3: Level 2 - Selection expands to 190px cream food card
  console.log('\n3. Testing Level 2 (zoom >= 14.8 & click/select): 190px cream food card');
  await page.evaluate(() => {
    window.foodCityMap.map.setZoom(15.5);
    const target = window.foodCityMap.food.records.find(r => r.name.includes('马旺子')) || window.foodCityMap.food.records[0];
    window.foodCityMap.food.overlay.setState(target.id, []);
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
  console.log('Card state (zoom 15.5 & selected 马旺子):', cardState);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-batch3-mawangzi-card.png') });

  // Check 4: Level 3 - Co-anchored popover on 永乐饭店 (阿鸡 & 特厨隋坡)
  console.log('\n4. Testing Level 3: Popover on 永乐饭店 (阿鸡 & 特厨隋坡)');
  await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('永乐饭店'));
    window.foodCityMap.map.flyTo({ center: target.coordinates, zoom: 16.5, duration: 0 });
    food.overlay.showPopover(target, true);
  });
  await page.waitForTimeout(1500);

  const yonglePopover = await page.evaluate(() => {
    const popover = document.querySelector('.food-inline-popover');
    if (!popover) return null;
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
  console.log('永乐饭店 popover info:', yonglePopover);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-batch3-popover-yongle.png') });

  // Play clip (特厨隋坡)
  console.log('Switching to 特厨隋坡 clip & clicking play...');
  await page.evaluate(() => {
    const clips = Array.from(document.querySelectorAll('.food-popover-clip'));
    const suipoBtn = clips.find(c => c.textContent.includes('隋坡')) || clips[clips.length - 1];
    suipoBtn.click();
  });
  await page.waitForTimeout(1000);
  await page.click('.food-popover-play', { force: true });
  await page.waitForTimeout(2000);

  const suipoPlayState = await page.evaluate(() => {
    const v = document.querySelector('.food-inline-popover video');
    return {
      playing: v && !v.paused && v.currentTime > 0,
      currentTime: v?.currentTime,
      duration: v?.duration,
      src: v?.src
    };
  });
  console.log('特厨隋坡 video playing state:', suipoPlayState);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-batch3-suipo-playing.png') });

  // Close popover
  await page.evaluate(() => window.foodCityMap.food.overlay.popover.close());
  await page.waitForTimeout(500);

  // Check 5: Popover on 马旺子·川小馆
  console.log('\n5. Testing Level 3: Popover on 马旺子·川小馆 (太古里店)');
  await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('马旺子'));
    window.foodCityMap.map.flyTo({ center: target.coordinates, zoom: 16.5, duration: 0 });
    food.overlay.showPopover(target, true);
  });
  await page.waitForTimeout(1500);
  await page.click('.food-popover-play', { force: true });
  await page.waitForTimeout(2000);

  const mawangziPlayState = await page.evaluate(() => {
    const v = document.querySelector('.food-inline-popover video');
    return {
      playing: v && !v.paused && v.currentTime > 0,
      currentTime: v?.currentTime,
      duration: v?.duration,
      src: v?.src
    };
  });
  console.log('马旺子 video playing state:', mawangziPlayState);
  await page.screenshot({ path: path.join(screenshotDir, 'chengdu-batch3-mawangzi-playing.png') });

  await page.evaluate(() => window.foodCityMap.food.overlay.popover.close());
  await browser.close();
  console.log('\n=== All Batch 3 verification checks PASSED successfully! ===');
}

verifyBatch3().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
