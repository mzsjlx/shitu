import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch {
  const fallback = 'file:///D:/nodejs/node_global/node_modules/@playwright/cli/node_modules/playwright-core/index.mjs';
  const pwFallback = await import(fallback);
  chromium = pwFallback.chromium;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = path.resolve(root, 'output/research/chengdu/screenshots');
await fs.mkdir(outDir, { recursive: true });

async function run() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to Chengdu Food view...');
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food');
  await page.waitForFunction(() => window.foodCityMap?.map?.areTilesLoaded(), { timeout: 25000 });
  await page.waitForTimeout(2000);

  // Activate food experience explicitly
  await page.evaluate(async () => {
    if (window.foodCityMap?.food) {
      await window.foodCityMap.food.activate();
    }
  });
  await page.waitForTimeout(2500);

  // 1. Food markers overview
  const fileOverview = path.join(outDir, '01_chengdu_food_map_overview.png');
  await page.screenshot({ path: fileOverview });
  console.log('Captured overview:', fileOverview);

  // 2. Zoom into Chunxi Rd / Taikoo Li where multiple food cards expand
  await page.evaluate(() => {
    window.foodCityMap.map.easeTo({
      center: [104.0815, 30.6550],
      zoom: 15.8,
      pitch: 52,
      bearing: -18,
      duration: 0
    });
  });
  await page.waitForTimeout(2000);

  const fileCards = path.join(outDir, '02_chengdu_cards_expanded.png');
  await page.screenshot({ path: fileCards });
  console.log('Captured expanded cards:', fileCards);

  // 3. Click one of the food cards to trigger video popover
  const cardsCount = await page.evaluate(() => {
    const cards = document.querySelectorAll('.food-open');
    return cards.length;
  });
  console.log(`Rendered food cards in DOM: ${cardsCount}`);

  if (cardsCount > 0) {
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.food-open')];
      const target = buttons.find(b => b.textContent.includes('杨老头') || b.textContent.includes('肥肠粉') || b.textContent.includes('冒菜')) || buttons[0];
      target.click();
    });
    await page.waitForTimeout(2500);

    const filePopover = path.join(outDir, '03_chengdu_video_popover.png');
    await page.screenshot({ path: filePopover });
    console.log('Captured video popover:', filePopover);
  }

  // 4. Capture 3D Panda Tower & Wangping Street food vibe
  await page.evaluate(() => {
    window.foodCityMap.map.easeTo({
      center: [104.0928, 30.6642],
      zoom: 16.2,
      pitch: 62,
      bearing: -25,
      duration: 0
    });
  });
  await page.waitForTimeout(2000);
  const filePanda = path.join(outDir, '04_chengdu_panda_tower_339.png');
  await page.screenshot({ path: filePanda });
  console.log('Captured Panda Tower:', filePanda);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(console.error);
