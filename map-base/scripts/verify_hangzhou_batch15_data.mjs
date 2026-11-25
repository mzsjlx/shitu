import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateVideoLibrary } from '../src/video-library-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function distMeters(lon1, lat1, lon2, lat2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function main() {
  console.log('=== Hangzhou Batch 15 Comprehensive Verification ===\n');

  const libPath = path.join(root, 'data/cities/hangzhou/video-library.json');
  const lib = JSON.parse(await readFile(libPath, 'utf8'));
  validateVideoLibrary(lib, 'hangzhou');
  console.log(`[PASS] 1. video-library.json schema valid: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);

  const postersPath = path.join(root, 'data/cities/hangzhou/video-posters.json');
  const posters = JSON.parse(await readFile(postersPath, 'utf8'));
  let missingPosters = 0;
  for (const s of lib.sources) {
    for (const seg of s.segments) {
      if (!posters.segments[seg.id]) {
        console.error(`Missing poster record for ${seg.id}`);
        missingPosters++;
      }
      const posterDisk = path.join(root, posters.segments[seg.id]?.path || '');
      if (!existsSync(posterDisk) || statSync(posterDisk).size < 1000) {
        console.error(`Poster file missing or invalid on disk: ${posterDisk}`);
        missingPosters++;
      }
    }
  }
  if (missingPosters === 0) {
    console.log(`[PASS] 2. All ${Object.keys(posters.segments).length} posters exist on disk and in catalog.`);
  } else {
    throw new Error(`Failed poster verification: ${missingPosters} missing.`);
  }

  const netPath = path.join(root, 'data/cities/hangzhou/food-road-network.json');
  const net = JSON.parse(await readFile(netPath, 'utf8'));
  const nodes = Object.values(net.nodes);

  const batch15Ids = [
    'hz-mailejin-gaoyinjie-taifen',
    'hz-mailejin-mokpo-zhajiangmian',
    'hz-dadadawanzi-guihe-xiaoguan',
    'hz-wasabeibei-didao-hangbangcai',
    'hz-wasabeibei-jiangshan-bingjiang',
    'hz-wasabeibei-chenyong-shipindian',
    'hz-ppchaonengxuan-laoma-youduner',
    'hz-ppchaonengxuan-xiaolin-naicha',
    'hz-ppchaonengxuan-silimei-tianpin',
    'hz-ppchaonengxuan-wangshi-shaobing',
    'hz-ppchaonengxuan-hangge-youbaoxia',
    'hz-ppchaonengxuan-caihe-guangtou',
    'hz-ppchaonengxuan-zhonger-mianguan',
    'hz-ppchaonengxuan-zhujia-sanjiemei'
  ];

  console.log('\n[Checking Batch 15 OSM Road Snapping Distances]');
  for (const segId of batch15Ids) {
    const seg = lib.sources.flatMap(s => s.segments).find(s => s.id === segId);
    if (!seg) throw new Error(`Segment not found: ${segId}`);
    
    let bestDist = Infinity, bestNode = null;
    for (const n of nodes) {
      const d = distMeters(seg.coordinates[0], seg.coordinates[1], n[1], n[2]);
      if (d < bestDist) { bestDist = d; bestNode = n; }
    }
    const pass = bestDist <= 250;
    console.log(`  ${pass ? '[PASS]' : '[FAIL]'} ${seg.name}: ${bestDist.toFixed(1)}m (node: ${bestNode[0]} ${bestNode[3]?.name || ''})`);
    if (!pass) throw new Error(`Exceeded snapping limit: ${bestDist}m`);
  }

  console.log('\n[Checking Local MP4 Clip Serving]');
  for (const segId of batch15Ids) {
    const posterRec = posters.segments[segId];
    const clipName = `${segId}-${posterRec.mediaKey}.mp4`;
    const clipDisk = path.join(root, 'dist/media/videos', posterRec.sourceId, clipName);
    if (!existsSync(clipDisk) || statSync(clipDisk).size < 100000) {
      throw new Error(`Clip not found in dist/media/videos: ${clipDisk}`);
    }
    console.log(`  [PASS] Clip verified: ${clipName} (${(statSync(clipDisk).size / 1024 / 1024).toFixed(1)}MB)`);
  }

  console.log('\n=== All Hangzhou Batch 15 Verifications: PASS ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
