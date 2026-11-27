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

async function test() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.foodCityMap?.ready === true, { timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const cardCount = await page.$$eval('.food-card', els => els.length);
  const collapsedCount = await page.$$eval('.food-card.is-collapsed', els => els.length);
  console.log('Total food cards:', cardCount, 'Collapsed (Level 1 dots):', collapsedCount);
  
  // Click the first card
  const firstCard = await page.$('.food-card button.food-open');
  if (firstCard) {
    await firstCard.click();
    await page.waitForTimeout(1000);
    const popoverVisible = await page.$eval('.video-popover', el => !el.hidden).catch(() => false);
    console.log('Popover visible after click:', popoverVisible);
    await page.screenshot({ path: 'output/research/chengdu/screenshots/test_card_clicked.png' });
  }
  
  await browser.close();
}

test().catch(console.error);
