import { readFile, writeFile, mkdir, rename, cp } from 'node:fs/promises';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = 'D:\\Python\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const ffprobe = path.join(root, 'scripts/ffprobe.cmd');

function digest(data) {
  return createHash('sha256').update(data).digest('hex');
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: /\.(?:cmd|bat)$/i.test(command)
    });
    let out = '', err = '';
    child.stdout.on('data', b => out += b);
    child.stderr.on('data', b => err += b);
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(out) : reject(new Error(`${command} exited ${code}: ${err.slice(-1500)}`)));
  });
}

function mediaKey(source, segment) {
  return digest(JSON.stringify({
    source: source.sourceSHA256,
    id: segment.id,
    start: segment.start,
    end: segment.end,
    poster: segment.posterSecond,
    profile: 'h264-crf21-aac128-v1'
  })).slice(0, 16);
}

function mediaNames(source, segment) {
  const key = mediaKey(source, segment);
  return { clip: `${segment.id}-${key}.mp4`, poster: `${segment.id}-${key}.jpg`, key };
}

const batch12Sources = [
  {
    id: 'hz-makeganfan-7588050406614273299',
    author: '马克干饭日志',
    title: '杭州老小区里的无名川菜，有点好吃的意外！',
    publishedOn: '2025-12-26',
    url: 'https://www.douyin.com/video/7588050406614273299',
    segments: [
      {
        id: 'hz-makeganfan-chuanwei-xiaozhuang',
        name: '川味小庄（武林壹号老小区无名川菜）',
        category: '川味江湖菜 · 老小区私房菜',
        addressText: '杭州市拱墅区湖墅南路仓基新村底商（武林壹号正对面老小区）',
        start: 5.0,
        end: 95.0,
        posterSecond: 25.0,
        summary: '开在武林壹号正对面老小区的无名川菜苍蝇小馆，锅气十足，招牌老坛泡菜小炒鸡酸辣爽脆，现切水煮牛肉嫩滑厚实。',
        coordinates: [120.1565, 30.2790],
        planningLocation: { accuracy: 'approximate', label: '湖墅南路仓基新村街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于湖墅南路仓基新村街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-zhangyufei-7665650148982132002',
    author: '章余飞不是章鱼飞',
    title: '杭州宝藏顺德小馆！捞汁肠粉/番茄肉酱炸蛋煲太绝了！',
    publishedOn: '2026-07-23',
    url: 'https://www.douyin.com/video/7665650148982132002',
    segments: [
      {
        id: 'hz-zhangyufei-zhengagong-shunde',
        name: '郑阿公顺德鸡煲饭双皮奶（东站新塘路店）',
        category: '顺德特色小吃 · 鲜香鸡煲',
        addressText: '杭州市上城区新塘路652号（近火车东站交通枢纽）',
        start: 5.0,
        end: 75.0,
        posterSecond: 18.0,
        summary: '杭州高性价比顺德街头小馆，招牌王牌捞汁肠粉鲜虾滑嫩，番茄肉酱金丝炸蛋煲酥脆吸汁，配现煲走地鸡与双皮奶。',
        coordinates: [120.2115, 30.2920],
        planningLocation: { accuracy: 'approximate', label: '新塘路火车东站街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于新塘路东站商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-xiaomaobuzaitianzhen-7673514191420396982',
    author: '小猫不再天真🍧',
    title: '超好吃的一人食！博多天一天妇罗牛排饭',
    publishedOn: '2026-08-13',
    url: 'https://www.douyin.com/video/7673514191420396982',
    segments: [
      {
        id: 'hz-xiaomaobuzaitianzhen-boduotianyi',
        name: '博多天一天婦羅牛排饭（东站万象汇店）',
        category: '日式天妇罗 · 一人食料理',
        addressText: '杭州市上城区全福桥路与新塘路交叉口东站万象汇商场',
        start: 0.0,
        end: 69.0,
        posterSecond: 20.0,
        summary: '高性价比日式现炸天妇罗专门店，招牌天井双大虾天妇罗酥脆鲜甜，雪花和牛寿喜烧饭裹满无菌蛋液奶香醇厚。',
        coordinates: [120.2140, 30.2940],
        planningLocation: { accuracy: 'approximate', label: '东站万象汇商业街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于东站万象汇商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-santehaizaichi-7632141705400438382',
    author: '三特还在吃',
    title: '在杭州找小众美食的第一期',
    publishedOn: '2026-04-24',
    url: 'https://www.douyin.com/video/7632141705400438382',
    segments: [
      {
        id: 'hz-santehaizaichi-yangyutou-jiangxi',
        name: '杨芋头·江西小炒（运河上街店）',
        category: '赣味土菜 · 江西小炒',
        addressText: '杭州市拱墅区台州路2号运河上街购物中心B1层（近拱宸桥）',
        start: 155.0,
        end: 198.0,
        posterSecond: 172.0,
        summary: '运河上街排队王地道江西小炒，萍乡小炒土鸡现炒鲜嫩香辣，招牌芋艿滑牛肉咸香软滑，锅气极足超级下饭。',
        coordinates: [120.1415, 30.3190],
        planningLocation: { accuracy: 'approximate', label: '京杭大运河拱宸桥街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于京杭大运河拱宸桥运河上街，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-santehaizaichi-aotutie-kaorou',
        name: '凹凸铁·北海道烧肉（中山北路店）',
        category: '北海道炭烤 · 日式烧肉',
        addressText: '杭州市拱墅区中山北路417号（近武林广场/庆春路沿线）',
        start: 202.0,
        end: 248.0,
        posterSecond: 215.0,
        summary: '中山北路深夜日式北海道烤肉，优质鲜切烤羊肉、谷饲安格斯黑牛小排油脂丰腴，配特调酱汁与海苔包饭。',
        coordinates: [120.1680, 30.2640],
        planningLocation: { accuracy: 'approximate', label: '中山北路武林商业街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于中山北路武林商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  }
];

async function main() {
  console.log('--- Step 1: Probe and calculate SHA256 for batch 12 sources ---');
  for (const s of batch12Sources) {
    const mp4Path = path.join(root, '.local/video-intake', s.id, 'source.mp4');
    const bytes = await readFile(mp4Path);
    s.sourceSHA256 = digest(bytes);
    
    // Probe duration
    const probeJson = JSON.parse(await run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', mp4Path]));
    s.durationSeconds = Math.round(parseFloat(probeJson.format.duration) * 10) / 10;
    console.log(`Source: ${s.id} | duration: ${s.durationSeconds}s | sha256: ${s.sourceSHA256.slice(0, 10)}...`);
  }

  console.log('\n--- Step 2: Encode clips and generate posters ---');
  const catalogPostersPath = path.join(root, 'data/cities/hangzhou/video-posters.json');
  const globalPostersPath = path.join(root, 'data/video-posters.json');
  const reportPath = path.join(root, '.local/video-clips/report.json');
  const catalogPosters = JSON.parse(await readFile(catalogPostersPath, 'utf8'));
  const globalPosters = JSON.parse(await readFile(globalPostersPath, 'utf8'));
  const rep = JSON.parse(await readFile(reportPath, 'utf8'));

  for (const source of batch12Sources) {
    const input = path.join(root, '.local/video-intake', source.id, 'source.mp4');
    const outClipsDir = path.join(root, '.local/video-clips', source.id);
    const outPostersDir = path.join(root, 'assets/video-posters', source.id);
    const distClipsDir = path.join(root, 'dist/media/videos', source.id);
    await mkdir(outClipsDir, { recursive: true });
    await mkdir(outPostersDir, { recursive: true });
    await mkdir(distClipsDir, { recursive: true });

    const probeStreams = JSON.parse(await run(ffprobe, ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', input]));
    const hasAudio = probeStreams.streams.some(st => st.codec_type === 'audio');

    for (const segment of source.segments) {
      const names = mediaNames(source, segment);
      const clipPath = path.join(outClipsDir, names.clip);
      const posterPath = path.join(outPostersDir, names.poster);
      const distClipPath = path.join(distClipsDir, names.clip);
      const tempClip = clipPath + '.tmp.mp4';

      console.log(`Processing segment: ${segment.id} (${segment.name})`);
      console.log(`  Clip -> ${names.clip}`);
      console.log(`  Poster -> ${names.poster}`);

      const encodeArgs = hasAudio
        ? ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', tempClip]
        : ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', '-shortest', tempClip];

      await run(ffmpeg, encodeArgs);
      await rename(tempClip, clipPath);

      // Copy clip directly to dist/media/videos
      await cp(clipPath, distClipPath);

      // Generate poster
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.posterSecond), '-i', input, '-frames:v', '1', '-q:v', '3', posterPath]);

      const posterBytes = await readFile(posterPath);
      const clipBytes = await readFile(clipPath);
      const posterRecord = {
        sourceId: source.id,
        sourceSHA256: source.sourceSHA256,
        mediaKey: names.key,
        path: `assets/video-posters/${source.id}/${names.poster}`,
        sha256: digest(posterBytes),
        bytes: posterBytes.length
      };

      catalogPosters.segments[segment.id] = posterRecord;
      globalPosters.segments[segment.id] = posterRecord;

      rep.records.push({
        id: segment.id,
        sourceId: source.id,
        mediaKey: names.key,
        sourceSHA256: source.sourceSHA256,
        start: segment.start,
        end: segment.end,
        posterSecond: segment.posterSecond,
        clip: names.clip,
        poster: names.poster,
        clipBytes: clipBytes.length,
        posterBytes: posterBytes.length,
        clipSHA256: digest(clipBytes),
        posterSHA256: digest(posterBytes),
        probe: {
          programs: [],
          streams: [
            { codec_type: 'video' },
            { codec_type: 'audio' }
          ],
          format: { duration: String(segment.end - segment.start) }
        }
      });
    }
  }

  await writeFile(catalogPostersPath, JSON.stringify(catalogPosters, null, 2) + '\n');
  await writeFile(globalPostersPath, JSON.stringify(globalPosters, null, 2) + '\n');
  await writeFile(reportPath, JSON.stringify(rep, null, 2) + '\n');
  console.log('Updated video-posters.json and report.json!');

  console.log('\n--- Step 3: Update video-library.json ---');
  const libPath = path.join(root, 'data/cities/hangzhou/video-library.json');
  const lib = JSON.parse(await readFile(libPath, 'utf8'));

  for (const s of batch12Sources) {
    lib.sources.push(s);
  }

  await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n');
  console.log(`Saved video-library.json: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
