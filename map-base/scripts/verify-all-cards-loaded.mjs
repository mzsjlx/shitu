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

async function verify() {
  console.log('=== Verifying All Chengdu Food Cards & Posters ===');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://127.0.0.1:8791/?city=chengdu&view=food');
  await page.waitForFunction(() => window.foodCityMap?.ready && window.foodCityMap?.food?.active, { timeout: 25000 });
  await page.waitForTimeout(2000);

  const stats = await page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll('.food-marker'));
    const pendingCovers = Array.from(document.querySelectorAll('.food-cover-pending'));
    const photosWithImg = Array.from(document.querySelectorAll('.food-photo img'));
    const brokenImgs = photosWithImg.filter(img => !img.complete || img.naturalWidth === 0);
    return {
      totalMarkers: markers.length,
      pendingCoversCount: pendingCovers.length,
      photosCount: photosWithImg.length,
      brokenImgsCount: brokenImgs.length,
      brokenList: brokenImgs.map(i => ({ src: i.src, alt: i.alt }))
    };
  });

  console.log('Stats from live page:');
  console.log('  Total food markers on map:', stats.totalMarkers);
  console.log('  Markers with real photos:', stats.photosCount);
  console.log('  Pending covers (封面待导入):', stats.pendingCoversCount);
  console.log('  Broken images count:', stats.brokenImgsCount);
  if (stats.brokenList?.length) {
    console.log('  Broken images details:', stats.brokenList);
  }

  // Take full overview screenshot
  const screenshotDir = path.resolve('output/research/chengdu/screenshots');
  await fs.mkdir(screenshotDir, { recursive: true });
  const overviewPath = path.join(screenshotDir, 'chengdu-all-cards-fixed.png');
  await page.screenshot({ path: overviewPath });
  console.log('Saved overview screenshot:', overviewPath);

  // Focus specifically on "张婆婆香酥锅盔（北门店）"
  console.log('\nFocusing on 张婆婆香酥锅盔（北门店）...');
  const spotInfo = await page.evaluate(() => {
    const food = window.foodCityMap.food;
    const target = food.records.find(r => r.name.includes('张婆婆香酥锅盔'));
    if (!target) return { found: false };
    window.foodCityMap.map.flyTo({ center: target.coordinates, zoom: 16.5, duration: 0 });
    food.overlay.showPopover(target, true);
    return {
      found: true,
      id: target.id,
      name: target.name,
      photoURL: target.photoURL,
      localClip: target.localClip,
      localPoster: target.localPoster
    };
  });
  console.log('Target spot info:', spotInfo);
  await page.waitForTimeout(1000);

  // Check popover state
  const popoverState = await page.evaluate(() => {
    const popover = document.querySelector('.food-inline-popover');
    if (!popover) return { open: false };
    const img = popover.querySelector('.food-popover-media img');
    const playBtn = popover.querySelector('.food-popover-play');
    const missingSpan = popover.querySelector('.food-cover-pending, .food-popover-missing');
    return {
      open: true,
      hasImage: !!img,
      imgSrc: img?.src,
      imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
      hasPlayBtn: !!playBtn,
      missingText: missingSpan?.textContent
    };
  });
  console.log('Popover state before play:', popoverState);

  // Click play
  console.log('Clicking ▶ play button on popover...');
  await page.evaluate(() => {
    const play = document.querySelector('.food-popover-play');
    if (play) play.click();
  });
  await page.waitForTimeout(2000);

  const videoState = await page.evaluate(() => {
    const video = document.querySelector('.food-popover-video video, video.food-popover-video');
    return {
      hasVideo: !!video,
      src: video?.src,
      paused: video?.paused,
      currentTime: video?.currentTime,
      duration: video?.duration,
      videoWidth: video?.videoWidth,
      videoHeight: video?.videoHeight
    };
  });
  console.log('Video playback state:', videoState);

  const popoverPath = path.join(screenshotDir, 'chengdu-zhangpopo-playing-fixed.png');
  await page.screenshot({ path: popoverPath });
  console.log('Saved popover video playing screenshot:', popoverPath);

  await browser.close();

  if (stats.pendingCoversCount === 0 && popoverState.imgLoaded && videoState.hasVideo && !videoState.paused) {
    console.log('\n>>> SUCCESS: ALL CARDS & POSTERS FIXED! ZERO PENDING COVERS! <<<');
  } else {
    console.error('\n>>> WARNING: SOME CARDS STILL PENDING OR PLAYBACK FAILED! <<<');
  }
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
