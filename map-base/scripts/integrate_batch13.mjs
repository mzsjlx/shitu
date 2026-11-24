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

const batch13Sources = [
  {
    id: 'hz-fuguibuxiangshangban-7687831545180097834',
    author: '富贵不想上班',
    title: '心服口服的好吃！这小炒水平放到江西都是高手！',
    publishedOn: '2026-09-21',
    url: 'https://www.douyin.com/video/7687831545180097834',
    segments: [
      {
        id: 'hz-fuguibuxiangshangban-laxiodai-jiangxi',
        name: '辣小呆•江西小炒(萧山店)',
        category: '赣味土菜 · 江西小炒',
        addressText: '杭州市萧山区市心北路/建设三路地铁站口（近博奥路）',
        start: 0.0,
        end: 120.0,
        posterSecond: 18.0,
        summary: '萧山市心北路高人气江西小炒，招牌辣炖带皮牛肉肉质软烂回辣过瘾，蒜蓉鸡爪脱骨入味，江西特色乱炖配黄喉猪肉与米粉香浓下饭。',
        coordinates: [120.2388, 30.2068],
        planningLocation: { accuracy: 'approximate', label: '建设三路博奥路商业街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于萧山建设三路商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-shidundunya-7700912052777825983',
    author: '是吨吨呀',
    title: '真正的美食往往藏在小巷子里！ 开在巷里停车场的港式海鲜大排档',
    publishedOn: '2026-10-26',
    url: 'https://www.douyin.com/video/7700912052777825983',
    segments: [
      {
        id: 'hz-shidundunya-jinwanshimisong-haixian',
        name: '今晚食乜餸海鲜大排档·夜宵（中山北路店）',
        category: '港式茶档 · 市井海鲜大排档',
        addressText: '杭州市拱墅区中山北路二圣庙前58号（近武林广场/凤起路）',
        start: 0.0,
        end: 125.0,
        posterSecond: 88.0,
        summary: '藏在中山北路停车场巷子里的复古港式海鲜大排档，明档现捞海鲜，招牌爆膏奶油虾鲜甜弹牙，现切烧鹅叉烧色红肉亮肉汁充盈，配黑椒薯仔牛肉粒与香脆鳝鱼。',
        coordinates: [120.1672, 30.2632],
        planningLocation: { accuracy: 'approximate', label: '中山北路二圣庙前商业街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于中山北路二圣庙前停车场内，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-dazhuanchuzi-7673810051143830201',
    author: '大专厨子',
    title: '杭州老街坊小众贵州小炒，糍粑辣椒的辣子鸡和凯里风味的牛背筋是真的下饭',
    publishedOn: '2026-08-14',
    url: 'https://www.douyin.com/video/7673810051143830201',
    segments: [
      {
        id: 'hz-dazhuanchuzi-tianxianggui-guizhou',
        name: '田香贵山野贵州菜·猛火爆炒下饭菜(杭州首店)',
        category: '地方特色菜 · 云贵爆炒江湖菜',
        addressText: '杭州市萧山区钱江世纪城利丰路/奔竞大道沿线（近奥体博览中心）',
        start: 0.0,
        end: 115.0,
        posterSecond: 33.0,
        summary: '藏在老街坊里的小众平价贵州菜，招牌凯里风味猛火爆炒牛板筋外弹内糯香气十足，糍粑辣椒贵州辣子鸡干香酥脆，配猪板筋与特色土豆粑粑超级下饭。',
        coordinates: [120.2395, 30.2328],
        planningLocation: { accuracy: 'approximate', label: '钱江世纪城奥体博览中心街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于钱江世纪城利丰路商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-mixueshiji-7581492951273622810',
    author: '米雪食记',
    title: '新荣记的青春活力版，台州海鲜漂亮饭 蟹黄蟹膏饭是王炸',
    publishedOn: '2025-12-09',
    url: 'https://www.douyin.com/video/7581492951273622810',
    segments: [
      {
        id: 'hz-mixueshiji-anxiang-wildyeast',
        name: '暗香·Wild Yeast（米其林一星·台州海鲜融合菜）',
        category: '米其林星级 · 台州海鲜与现代融合菜',
        addressText: '杭州市滨江区滨盛路2077号潮上中南银座A座3楼（近长河/钱塘江岸）',
        start: 0.0,
        end: 215.0,
        posterSecond: 190.0,
        summary: '杭州米其林一星台州海鲜与现代融合大作，被誉为新荣记青春版，38只公蟹配2只母蟹的豪华黄金大闸蟹蟹粉拌饭、九层塔鸡油捞象拔蚌响螺配台州米面、清酒鲍鱼烧椒皮蛋配台州手打面、老菜干榄角斯里兰卡青蟹，碳水与海鲜鲜味极致交融。',
        coordinates: [120.1977, 30.2039],
        planningLocation: { accuracy: 'approximate', label: '滨江滨盛路中南银座街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于滨江区滨盛路潮上中南银座，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  }
];

async function main() {
  console.log('--- Step 1: Probe and calculate SHA256 for batch 13 sources ---');
  for (const s of batch13Sources) {
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

  for (const source of batch13Sources) {
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

  for (const s of batch13Sources) {
    lib.sources.push(s);
  }

  await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n');
  console.log(`Saved video-library.json: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
