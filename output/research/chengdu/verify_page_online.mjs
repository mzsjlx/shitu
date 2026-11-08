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

async function verify() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const chipText = await page.$eval('.city-chip', el => el.textContent.trim());
  const searchPlaceholder = await page.$eval('#search-input', el => el.getAttribute('placeholder'));
  const title = await page.title();
  const errorHidden = await page.$eval('#map-error', el => el.hidden);
  const loadingHidden = await page.$eval('#loading', el => el.hidden);
  
  console.log('Chip text:', chipText);
  console.log('Search placeholder:', searchPlaceholder);
  console.log('Title:', title);
  console.log('Error hidden:', errorHidden);
  console.log('Loading hidden:', loadingHidden);

  // Take screenshot of current page
  await page.screenshot({ path: 'output/research/chengdu/screenshots/chengdu_current_fixed.png' });
  console.log('Screenshot saved to output/research/chengdu/screenshots/chengdu_current_fixed.png');
  
  await browser.close();
}

verify().catch(console.error);
