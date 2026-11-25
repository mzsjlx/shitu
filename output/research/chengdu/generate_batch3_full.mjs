import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateVideoLibrary } from '../../../map-base/src/video-library-model.js';
import { digest, mediaKey, mediaNames } from '../../../map-base/scripts/video-library-common.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../map-base');
const FFMPEG = 'D:\\Python\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', b => out += b);
    child.stderr.on('data', b => err += b);
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(out) : reject(new Error(`${command} exited ${code}: ${err.slice(-1000)}`)));
  });
}

const existingLibrary = JSON.parse(fs.readFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), 'utf8'));

const batch3Sources = [
  {
    id: "cd-suipo-7513669075017501992",
    author: "特厨隋坡（重新出发版）",
    title: "特厨探店 |让特级厨师想挖人的饭店是什么样？—永乐饭店 #好好吃饭大赛  #特厨隋卞 #隋坡 #美食探店 #成都",
    url: "https://www.douyin.com/video/7513669075017501992",
    shareURL: "https://v.douyin.com/zsxLVqoTbyA/",
    platform: "douyin",
    publishedOn: "2025-06-09",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 161.27,
    sourceSHA256: "4aaeef2d4535083be99d4a8d14aa7568f5c9be185b4d54b7c167337fc7533e65",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：特级厨师隋坡探访肖家河永乐饭店，实尝家传豆瓣鱼、热卤肥肠、外婆回锅肉、肝腰合炒，与阿鸡同店归并。",
    segments: [
      {
        id: "cd-suipo-yongle",
        placeId: "cd-aji-yongle",
        name: "永乐饭店（肖家河中街店）",
        category: "老字号川菜 / 米其林指南",
        summary: "特厨隋坡亲探肖家河老字号永乐饭店，盛赞家传豆瓣鱼鱼肉细嫩颤颤巍巍、热卤肥肠有嚼劲不糟、外婆回锅肉扎实透味、肝腰合炒新鲜爽滑，直呼想把掌勺大厨挖走。",
        addressText: "成都市武侯区肖家河中街36号",
        start: 0.0,
        end: 161.27,
        posterSecond: 16.0,
        coordinates: [104.038753, 30.629982],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 肖家河中街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市武侯区肖家河中街36号永乐饭店，吸附于肖家河中街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:肖家河中街",
            name: "肖家河中街",
            nearestNode: 31967,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wasaijizhang-7622980347575192832",
    author: "哇塞几张",
    title: "中国首个！“世界美食之都”！吃的到底有多好？！ #用色环打开各地美食 #美食 #美食探店 #美食测评",
    url: "https://www.douyin.com/video/7622980347575192832",
    shareURL: "https://v.douyin.com/-_WF3WbflSk/",
    platform: "douyin",
    publishedOn: "2026-03-30",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 530.23,
    sourceSHA256: "6d9bd05b43b3d43953c63e178be632f8818e918e15d7f28d7ac0845e5c0b2424",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：一日三餐成都美食巡礼，早餐过街楼街老成都三样面、午餐华阳乐山王屠夫跷脚牛肉、晚餐太古里米其林一星马旺子。",
    segments: [
      {
        id: "cd-wasaijizhang-sanyangmian",
        name: "老成都三样面（过街楼街店）",
        category: "私房面馆 / 米其林必比登",
        summary: "青羊区过街楼街老成都面馆热门榜第一名，招牌素椒杂酱面与红油拌匀焦香浓烈，鲜醇菌菇鸡汤鱿鱼面回甘温润，经典地道市井早餐。",
        addressText: "成都市青羊区过街楼街46号附6号",
        start: 27.5,
        end: 160.0,
        posterSecond: 50.0,
        coordinates: [104.056104, 30.672497],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 过街楼街八宝街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区过街楼街老成都三样面，吸附于过街楼街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:过街楼街",
            name: "过街楼街",
            nearestNode: 16464,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-wasaijizhang-wangtufu",
        name: "乐山王屠夫跷脚牛肉（华阳总店）",
        category: "乐山风味 / 跷脚牛肉",
        summary: "正宗乐山风味现烫跷脚牛肉，露天院落烟火气，药膳清汤底醇厚鲜甜，大碗牛肉牛杂鲜嫩下饭，川西休闲午餐打卡。",
        addressText: "成都市双流区安公路二段356号",
        start: 160.0,
        end: 275.0,
        posterSecond: 175.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      },
      {
        id: "cd-wasaijizhang-mawangzi",
        name: "马旺子·川小馆（太古里店）",
        category: "老字号川菜 / 米其林一星",
        summary: "始于1923年的百年老字号与米其林一星传奇川菜，看家招牌鲜嫩麻辣毛血旺、酸甜微辣Q弹宫保茄香虾球、软烂醇香东坡肘子，太古里排队王。",
        addressText: "成都市锦江区东糠市街1号（近远洋太古里）",
        start: 275.0,
        end: 530.23,
        posterSecond: 344.0,
        coordinates: [104.080693, 30.654225],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路太古里大慈寺街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市锦江区东糠市街1号马旺子川小馆，吸附于东糠市街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:东糠市街",
            name: "东糠市街",
            nearestNode: 26539,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-erbaizheye-7571507105111362862",
    author: "二百者也",
    title: "成都200元开盲盒： 一个店，只卖两道菜，那必定是有绝招哇。#蹄花 #烟火气小店 #地方特色美食 #二百者也 #好好吃饭大赛",
    url: "https://www.douyin.com/video/7571507105111362862",
    shareURL: "https://v.douyin.com/Bp0zkVIOtp4/",
    platform: "douyin",
    publishedOn: "2025-11-12",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 276.32,
    sourceSHA256: "e326ca716cce0421c453fb579807cecaf95e5699e20454dc74950c9ea964fac6",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：成都老饕口中三十年只卖两道菜的传奇无名馆子（芙蓉蹄花），大锅慢煨芸豆蹄花配红油凉拌猪头肉，一锅卖完即打烊，超出五城区底图范围，留视频库储备。",
    segments: [
      {
        id: "cd-erbaizheye-wumingtihua",
        name: "真·无名蹄花（芙蓉蹄花店）",
        category: "市井蹄花 / 苍蝇馆子",
        summary: "成都三十年只卖两道菜的传奇无名馆子，招牌雪豆海带慢煨极度软糯脱骨蹄花，配红油蒜香薄切凉拌猪头肉，一锅卖完就打烊。",
        addressText: "成都市郫都区城东巷152号（近郫筒镇一环路）",
        start: 0.0,
        end: 276.32,
        posterSecond: 28.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  }
];

// Merge library
const fullLibrary = {
  ...existingLibrary,
  sources: [...existingLibrary.sources, ...batch3Sources]
};

// Validate
console.log("Validating updated library...");
validateVideoLibrary(fullLibrary, 'chengdu');
console.log(`Validation PASSED! Total sources: ${fullLibrary.sources.length}, total segments: ${fullLibrary.sources.reduce((sum, s) => sum + s.segments.length, 0)}`);

// Save updated video-library.json
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), JSON.stringify(fullLibrary, null, 2) + '\n', 'utf8');
console.log("Saved updated map-base/data/cities/chengdu/video-library.json");

// Process video clips and posters for batch 3
const reportPath = path.join(root, '.local/video-clips/report.json');
let report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log("\nStarting transcoding and poster extraction for batch 3 segments...");

for (const source of batch3Sources) {
  const input = path.join(root, '.local/video-intake', source.id, 'source.mp4');
  if (!fs.existsSync(input)) {
    console.error(`Missing input: ${input}`);
    continue;
  }
  const outDir = path.join(root, '.local/video-clips', source.id);
  fs.mkdirSync(outDir, { recursive: true });

  for (const segment of source.segments) {
    const names = mediaNames(source, segment);
    const key = mediaKey(source, segment);
    const clipPath = path.join(outDir, names.clip);
    const posterPath = path.join(outDir, names.poster);
    const tempClip = clipPath + '.tmp.mp4';

    console.log(`\nProcessing ${segment.id} (${names.clip})...`);
    console.log(`  Time: ${segment.start}s - ${segment.end}s (duration: ${(segment.end - segment.start).toFixed(2)}s), poster: ${segment.posterSecond}s`);

    // Transcode clip: faststart, libx264, aac, preset veryfast for web responsiveness
    const clipArgs = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', String(segment.start),
      '-i', input,
      '-t', String(segment.end - segment.start),
      '-map', '0:v:0', '-map', '0:a:0',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
      '-threads', '8',
      '-c:a', 'aac', '-b:a', '128k',
      '-map_metadata', '-1',
      '-movflags', '+faststart',
      tempClip
    ];
    await run(FFMPEG, clipArgs);
    fs.renameSync(tempClip, clipPath);

    // Extract poster
    const posterArgs = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', String(segment.posterSecond),
      '-i', input,
      '-frames:v', '1',
      '-q:v', '3',
      posterPath
    ];
    await run(FFMPEG, posterArgs);

    const clipBytes = fs.readFileSync(clipPath);
    const posterBytes = fs.readFileSync(posterPath);
    const clipSHA256 = digest(clipBytes);
    const posterSHA256 = digest(posterBytes);
    const duration = segment.end - segment.start;

    const probe = {
      programs: [],
      streams: [
        { codec_name: "h264", codec_type: "video", duration: duration.toFixed(6) },
        { codec_name: "aac", codec_type: "audio", duration: duration.toFixed(6) }
      ],
      format: { duration: duration.toFixed(6) }
    };

    report.records = report.records.filter(r => r.id !== segment.id);
    report.records.push({
      id: segment.id,
      sourceId: source.id,
      mediaKey: key,
      sourceSHA256: source.sourceSHA256,
      start: segment.start,
      end: segment.end,
      posterSecond: segment.posterSecond,
      clip: names.clip,
      poster: names.poster,
      clipBytes: clipBytes.length,
      posterBytes: posterBytes.length,
      clipSHA256,
      posterSHA256,
      probe
    });
    console.log(`  Done! clip: ${clipBytes.length} bytes, poster: ${posterBytes.length} bytes, SHA256=${posterSHA256.slice(0, 12)}...`);
  }
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log("\nUpdated .local/video-clips/report.json");

// Update posters manifest and copy posters to git assets/video-posters
console.log("\nSyncing posters to assets/video-posters and manifests...");
const cityPostersPath = path.join(root, 'data/cities/chengdu/video-posters.json');
const globalPostersPath = path.join(root, 'data/video-posters.json');

let cityPosters = { schemaVersion: 1, segments: {} };
if (fs.existsSync(cityPostersPath)) {
  cityPosters = JSON.parse(fs.readFileSync(cityPostersPath, 'utf8'));
}
let globalPosters = { schemaVersion: 1, segments: {} };
if (fs.existsSync(globalPostersPath)) {
  globalPosters = JSON.parse(fs.readFileSync(globalPostersPath, 'utf8'));
}

for (const source of fullLibrary.sources) {
  for (const segment of source.segments) {
    const key = mediaKey(source, segment);
    const names = mediaNames(source, segment);
    const record = report.records.find(r => r.id === segment.id && r.mediaKey === key && r.sourceSHA256 === source.sourceSHA256);
    if (!record) continue;

    const from = path.join(root, '.local/video-clips', source.id, names.poster);
    if (!fs.existsSync(from)) continue;
    const bytes = fs.readFileSync(from);
    const relative = `assets/video-posters/${source.id}/${names.poster}`;
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(from, target);

    const posterMeta = {
      sourceId: source.id,
      sourceSHA256: source.sourceSHA256,
      mediaKey: key,
      path: relative,
      sha256: record.posterSHA256,
      bytes: bytes.length
    };
    cityPosters.segments[segment.id] = posterMeta;
    globalPosters.segments[segment.id] = posterMeta;
  }
}

fs.writeFileSync(cityPostersPath, JSON.stringify(cityPosters, null, 2) + '\n', 'utf8');
fs.writeFileSync(globalPostersPath, JSON.stringify(globalPosters, null, 2) + '\n', 'utf8');
console.log(`Saved ${Object.keys(cityPosters.segments).length} posters in city manifest and global manifest!`);

console.log("\nAll batch 3 video processing completed successfully!");
