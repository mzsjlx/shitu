import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
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

const batch11Sources = [
  {
    id: 'hz-jinsechuanshuo-7675626701770001714',
    author: '金色传说_刘芳池',
    title: '吃遍20家只推5家！杭州自助封神 姐妹们！',
    publishedOn: '2026-08-19',
    originalUrl: 'https://v.douyin.com/g8EP7TmquKs/',
    segments: [
      {
        id: 'hz-jinsechuanshuo-niunew-shouxishao',
        name: '牛new寿喜烧（湖滨银泰in77店）',
        category: '寿喜烧自助 · 和牛料理',
        addressText: '杭州市上城区延安路258号湖滨银泰in77 C区B1层（地铁龙翔桥站D1口）',
        start: 28.0,
        end: 74.0,
        posterSecond: 36.0,
        summary: '杭州和牛寿喜烧自助标杆，M级冰山和牛、无菌蛋液裹肉奶香浓郁，配黑毛肚、烤榴莲与皮皮虾。',
        coordinates: [120.1632, 30.2542],
        planningLocation: { accuracy: 'approximate', label: '湖滨银泰in77街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于延安路湖滨商圈核心，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-jinsechuanshuo-dongsheng-kaorou',
        name: '东盛炭烤自助（工联CC龙翔桥店）',
        category: '炭火烤肉自助 · 延安路市井潮牌',
        addressText: '杭州市上城区延安路292号工联CC 5楼（近龙翔桥地铁站D口）',
        start: 152.0,
        end: 194.0,
        posterSecond: 168.0,
        summary: '龙翔桥百元价位炭烤自助天花板，现切牛肋条蘸孜然香脆焦嫩，独创烤梅花肉夹菠萝与肥牛卷泡菜。',
        coordinates: [120.1636, 30.2550],
        planningLocation: { accuracy: 'approximate', label: '龙翔桥工联CC街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于工联CC延安路街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-ayufadiansha-7707536598476524826',
    author: '阿喻发点啥',
    title: '谁说漂亮饭没有回头客？我一年去10遍的都在这了~',
    publishedOn: '2026-11-13',
    originalUrl: 'https://v.douyin.com/qFeoY-Lcz8s/',
    segments: [
      {
        id: 'hz-ayufadiansha-you-xiaohaixian',
        name: '友·小海鲜Bistro（庆春路浙一店）',
        category: '海鲜餐酒馆 · 氛围感Bistro',
        addressText: '杭州市上城区庆春路136号（近大学路口、浙一医院）',
        start: 39.0,
        end: 118.0,
        posterSecond: 66.0,
        summary: '庆春路极具氛围感的街边海鲜小酒馆，招牌三杯笔管鱿鱼、九层塔泰国小泡椒、芹菜鳗干与草莓巴菲。',
        coordinates: [120.1795, 30.2588],
        planningLocation: { accuracy: 'approximate', label: '庆春路浙一医院街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于庆春路大学路口街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ayufadiansha-lagauche-bistro',
        name: 'La Gauche·Bistro & Bar（定安路店）',
        category: '法式复古小酒馆 · 巷弄Bistro',
        addressText: '杭州市上城区定安路后市街108号巷内（近吴山广场/河坊街）',
        start: 208.0,
        end: 264.0,
        posterSecond: 234.0,
        summary: '定安路深巷里的法式复古自然木质风小酒馆，入选中国百佳Bistro，主打乌鸡Taco、水煎牛蛙与生牛肉果冻鞑靼。',
        coordinates: [120.1685, 30.2450],
        planningLocation: { accuracy: 'approximate', label: '定安路后市街街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于定安路吴山街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ayufadiansha-koyo-izakaya',
        name: 'Koyo·izakaya·Fine（武林广场店）',
        category: '日法融合料理 · 极简Bistro',
        addressText: '杭州市拱墅区体育场路356号（近武林广场地铁站）',
        start: 358.0,
        end: 422.0,
        posterSecond: 378.0,
        summary: '武林广场高口碑日法融合餐酒馆，仪式感拉满，招牌熟成马友鱼、碳烤低温18小时牛排配卢布松土豆泥。',
        coordinates: [120.1620, 30.2740],
        planningLocation: { accuracy: 'approximate', label: '武林广场体育场路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于武林广场核心街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-qqjintianchisha-7666065018354680164',
    author: 'qq今天吃啥',
    title: '今天带你们吃一家杭州宝藏烧鸟小馆！！深夜食堂太对味了',
    publishedOn: '2026-07-24',
    originalUrl: 'https://v.douyin.com/Q5xliLH5y0Q/',
    segments: [
      {
        id: 'hz-qqjintianchisha-fugui-shaoniao',
        name: '富贵烧鸟·餐集酒肆小馆（滨江中赢国际店）',
        category: '日式烧鸟 · 深夜食堂',
        addressText: '杭州市滨江区江汉路1785号中赢国际生活广场1262号',
        start: 0.0,
        end: 88.0,
        posterSecond: 30.0,
        summary: '滨江中赢国际深夜烧鸟人气榜首，熟成黄油鸡串、炭火焦香活烤鳗鱼、鱼子酱提鲜烧鸟配焦糖凤梨。',
        coordinates: [120.2016, 30.2045],
        planningLocation: { accuracy: 'approximate', label: '滨江中赢国际生活广场街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于滨江区江汉路中赢国际，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-dazhuanchuzi-7626687127867105765',
    author: '大专厨子',
    title: '杭州街头一人食宝岛卤肉饭❗️咸甜交织有点上头，宝岛小吃吃起来也是蛮正的',
    publishedOn: '2026-04-09',
    originalUrl: 'https://v.douyin.com/r6RERO_aT9Q/',
    segments: [
      {
        id: 'hz-dazhuanchuzi-youjin-taiwanluroufan',
        name: '酉今·台粤小食堂（萧山万象汇店）',
        category: '台式小吃 · 秘制卤肉饭',
        addressText: '杭州市萧山区北干街道市心中路万象汇外街1楼890-31号',
        start: 0.0,
        end: 114.0,
        posterSecond: 52.0,
        summary: '萧山万象汇外街排队王台粤小食堂，慢火细炖黑金卤肉饭肥瘦适中，配酥脆台式盐酥鸡与广式叉烧。',
        coordinates: [120.2354, 30.2079],
        planningLocation: { accuracy: 'approximate', label: '钱塘江南岸市心中路万象汇街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，经度纬度吸附钱塘江南岸路网节点。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  }
];

async function main() {
  console.log('--- Step 1: Probe and calculate SHA256 for sources ---');
  for (const s of batch11Sources) {
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
  const catalogPosters = JSON.parse(await readFile(catalogPostersPath, 'utf8'));
  const globalPosters = JSON.parse(await readFile(globalPostersPath, 'utf8'));

  for (const source of batch11Sources) {
    const input = path.join(root, '.local/video-intake', source.id, 'source.mp4');
    const outClipsDir = path.join(root, '.local/video-clips', source.id);
    const outPostersDir = path.join(root, 'assets/video-posters', source.id);
    await mkdir(outClipsDir, { recursive: true });
    await mkdir(outPostersDir, { recursive: true });

    const probeStreams = JSON.parse(await run(ffprobe, ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', input]));
    const hasAudio = probeStreams.streams.some(st => st.codec_type === 'audio');

    for (const segment of source.segments) {
      const names = mediaNames(source, segment);
      const clipPath = path.join(outClipsDir, names.clip);
      const posterPath = path.join(outPostersDir, names.poster);
      const tempClip = clipPath + '.tmp.mp4';

      console.log(`Processing segment: ${segment.id} (${segment.name})`);
      console.log(`  Clip -> ${names.clip}`);
      console.log(`  Poster -> ${names.poster}`);

      const encodeArgs = hasAudio
        ? ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', tempClip]
        : ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', '-shortest', tempClip];

      await run(ffmpeg, encodeArgs);
      await rename(tempClip, clipPath);

      // Generate poster
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.posterSecond), '-i', input, '-frames:v', '1', '-q:v', '3', posterPath]);

      const posterBytes = await readFile(posterPath);
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
    }
  }

  await writeFile(catalogPostersPath, JSON.stringify(catalogPosters, null, 2) + '\n');
  await writeFile(globalPostersPath, JSON.stringify(globalPosters, null, 2) + '\n');
  console.log('Updated video-posters.json in both city and global!');

  console.log('\n--- Step 3: Update video-library.json ---');
  const libPath = path.join(root, 'data/cities/hangzhou/video-library.json');
  const lib = JSON.parse(await readFile(libPath, 'utf8'));

  for (const s of batch11Sources) {
    lib.sources.push(s);
  }

  await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n');
  console.log(`Saved video-library.json: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
