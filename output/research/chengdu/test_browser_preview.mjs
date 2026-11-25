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
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', err => logs.push('ERROR: ' + err.message));
  
  console.log('Navigating to http://127.0.0.1:8791/?city=chengdu&view=food ...');
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food', { waitUntil: 'networkidle' });
  
  await page.waitForFunction(() => window.foodCityMap?.ready === true, { timeout: 20000 }).catch(e => console.log('Timeout waiting for ready:', e.message));
  await page.waitForTimeout(2000);
  
  const stats = await page.evaluate(() => window.foodCityMap?.getStats?.());
  console.log('Map stats:', stats);
  
  const cardCount = await page.$$eval('.food-map-card', els => els.length);
  console.log('Food card count on map:', cardCount);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const cityName = await page.$eval('#current-city-name', el => el.textContent).catch(() => '');
  console.log('City name in chip:', cityName);

  await page.screenshot({ path: 'output/research/chengdu/screenshots/browser_preview_chengdu.png' });
  console.log('Saved screenshot to output/research/chengdu/screenshots/browser_preview_chengdu.png');
  await browser.close();
}

test().catch(console.error);
