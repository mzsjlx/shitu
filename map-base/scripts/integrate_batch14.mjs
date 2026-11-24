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

const batch14Sources = [
  {
    id: 'hz-zuichanxiaochi-7619734579469901306',
    author: '嘴馋小迟',
    title: '03健身男大挑战24小时吃遍杭州｜第一站打卡大马弄早市！！',
    publishedOn: '2026-03-21',
    url: 'https://www.douyin.com/video/7619734579469901306',
    segments: [
      {
        id: 'hz-zuichanxiaochi-damalong-zaoshi',
        name: '大马弄市井早市（周萍粽子/老底子葱包烩）',
        category: '市井小吃 · 老底子早市',
        addressText: '杭州市上城区大马弄与城隍牌楼巷交汇处（吴山脚下近鼓楼）',
        start: 0.0,
        end: 175.0,
        posterSecond: 135.0,
        summary: '吴山脚下烟火气最旺的百年老街早市，20年老字号周萍粽子大块肥肉流油，老底子葱包烩夹素烧鹅双面金黄焦香刷甜面酱，配现包金元宝蛋饺与葱油拌面。',
        coordinates: [120.1695, 30.2365],
        planningLocation: { accuracy: 'approximate', label: '紫阳街道大马弄城隍牌楼街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于大马弄市井早市核心段，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-shangguanchenfugui-7593386410715925802',
    author: '上官陈富贵',
    title: '杭州6年美食博主私藏宝藏店铺！大姨娘面馆红烧大排拌川',
    publishedOn: '2026-01-10',
    url: 'https://www.douyin.com/video/7593386410715925802',
    segments: [
      {
        id: 'hz-shangguanchenfugui-dayiniang-mianguan',
        name: '大姨娘面馆（复兴南街店）',
        category: '传统杭帮面 · 市井老面馆',
        addressText: '杭州市上城区复兴南街147-2号（复兴南苑近南星桥）',
        start: 70.0,
        end: 135.0,
        posterSecond: 115.0,
        summary: '城南南星桥烧面世家老字号，灶头现烧地道杭帮面，招牌红烧大排卤香浓郁肉质扎实多汁，生滚拌川裹满酱汁，双雪菜片儿川锅气四溢。',
        coordinates: [120.1612, 30.2116],
        planningLocation: { accuracy: 'approximate', label: '复兴南街复兴南苑商住街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于复兴南街复兴南苑底商，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-dazhuanchuzi-7644115311814038778',
    author: '大专厨子',
    title: '杭州街头平价景德镇小吃馆，鲜辣浓郁的江西水煮空心粉',
    publishedOn: '2026-05-26',
    url: 'https://www.douyin.com/video/7644115311814038778',
    segments: [
      {
        id: 'hz-dazhuanchuzi-qianfengwei-jindefen',
        name: '千丰味·景德粉馆（克拉天玺店）',
        category: '赣味米粉 · 景德镇特色小吃',
        addressText: '杭州市上城区笕桥街道恒祺商务中心克拉天玺5号楼底商11-1',
        start: 0.0,
        end: 120.0,
        posterSecond: 32.5,
        summary: '藏在街边的平价景德镇特色粉馆，江西水煮空心粉每一根都吸饱了鲜辣浓郁的高汤与肉丝蛋花，配干香景德镇炒粉与微酥糖霜炸香蕉。',
        coordinates: [120.210334, 30.298652],
        planningLocation: { accuracy: 'approximate', label: '笕桥街道克拉天玺商务街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于笕桥克拉天玺商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-dazhuanchuzi-7626311014576835067',
    author: '大专厨子',
    title: '杭州巷子平价意面小铺❗️芝士肉酱丝滑，青酱意面浓郁',
    publishedOn: '2026-04-08',
    url: 'https://www.douyin.com/video/7626311014576835067',
    segments: [
      {
        id: 'hz-dazhuanchuzi-eatingpasta-guoda',
        name: 'EatingPasta意起意大利面(杭州国大店)',
        category: '西餐料理 · 巷子平价意面',
        addressText: '杭州市拱墅区万寿亭街2号2幢116室（近武林广场/国大城市广场）',
        start: 0.0,
        end: 125.0,
        posterSecond: 105.0,
        summary: '藏在武林广场附近巷子里的高性价比平价意面小店，经典罗勒青酱意面醇厚浓郁配墨鱼肠，芝士金枪鱼焗千层面拉丝软滑油香四溢，黑啤酒慢炖牛肋肉番茄通管面酸甜解腻。',
        coordinates: [120.156553, 30.271241],
        planningLocation: { accuracy: 'approximate', label: '武林广场万寿亭商业街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于万寿亭街国大商圈巷内，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  }
];

async function main() {
  console.log('--- Step 1: Probe and calculate SHA256 for batch 14 sources ---');
  for (const s of batch14Sources) {
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

  for (const source of batch14Sources) {
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

  for (const s of batch14Sources) {
    lib.sources.push(s);
  }

  await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n');
  console.log(`Saved video-library.json: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
