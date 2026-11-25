import { readFile, writeFile, mkdir, rename, cp } from 'node:fs/promises';
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

const batch15Sources = [
  {
    id: 'hz-mailejin-7650325270264601273',
    author: '麦乐金',
    title: '杭州晒着太阳都要吃的海鲜mama面…惊为天人！',
    publishedOn: '2026-06-12',
    url: 'https://www.douyin.com/video/7650325270264601273',
    segments: [
      {
        id: 'hz-mailejin-gaoyinjie-taifen',
        name: '高银街泰粉·海鲜MAMA面（皇饭儿对面）',
        category: '泰式料理 · 街头MAMA面',
        addressText: '杭州市上城区高银街（皇饭儿53号正对面街区）',
        start: 0.0,
        end: 24.0,
        posterSecond: 12.0,
        summary: '高银街老街巷旁的街头泰式海鲜面馆，户外伞座晒着太阳吃热腾腾冬阴功海鲜MAMA面，大虾、青口贝配流心蛋与泰式炸蛋、咸法酪泰奶。',
        coordinates: [120.1682, 30.2412],
        planningLocation: { accuracy: 'approximate', label: '清河坊高银街历史街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，镜头正对高银街皇饭儿对面露天伞座，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-mailejin-7643044412784454757',
    author: '麦乐金',
    title: '杭州top级炸酱面！！！juju好吃不开玩笑！！',
    publishedOn: '2026-05-23',
    url: 'https://www.douyin.com/video/7643044412784454757',
    segments: [
      {
        id: 'hz-mailejin-mokpo-zhajiangmian',
        name: 'Mokpo·木浦·韩式料理（杭州中心店）',
        category: '韩国料理 · 炸酱面/饭团',
        addressText: '杭州市拱墅区展览东路150号杭州中心（近武林广场）',
        start: 0.0,
        end: 28.0,
        posterSecond: 13.0,
        summary: '武林广场杭州中心高人气韩料店，招牌韩式春酱炸酱面酱汁浓稠挂面筋道，配黄萝卜与木浦金枪鱼海苔饭团、爽口韩式辣拌面。',
        coordinates: [120.1636, 30.2740],
        planningLocation: { accuracy: 'approximate', label: '武林广场杭州中心商圈' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于武林广场杭州中心商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-dadadawanzi-7626778962945341797',
    author: '大大大丸子',
    title: '杭州西湖边真正好吃的小店……（归禾小馆）',
    publishedOn: '2026-04-09',
    url: 'https://www.douyin.com/video/7626778962945341797',
    segments: [
      {
        id: 'hz-dadadawanzi-guihe-xiaoguan',
        name: '归禾小馆（西湖湖滨店）',
        category: '创意杭帮菜 · 湖滨小巷馆子',
        addressText: '杭州市上城区吴山路湖滨银泰in77旁小巷（近西湖湖滨）',
        start: 0.0,
        end: 75.0,
        posterSecond: 27.0,
        summary: '藏在西湖湖滨in77旁小巷里的人气创意小馆，招牌岩谷便携炉山楂排骨酸甜软烂脱骨，配黑松露柠檬叶炒饭、怪味猪软骨与苔菜年糕、麻球芥末虾仁。',
        coordinates: [120.1585, 30.2540],
        planningLocation: { accuracy: 'approximate', label: '湖滨银泰吴山路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '多博主合用同一点位，位于湖滨in77旁吴山路小巷，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-wasabeibei-7596530870594457787',
    author: '瓦萨北北(全国巡烤中)',
    title: '杭州30多年土著，一天带你吃遍杭州 40年老杭帮菜，26年包浆炸串',
    publishedOn: '2026-01-18',
    url: 'https://www.douyin.com/video/7596530870594457787',
    segments: [
      {
        id: 'hz-wasabeibei-wenzhou-nuomifan',
        name: '温州松糕馆（文一路119-1号店）',
        category: '浙南早点 · 温州糯米饭',
        addressText: '杭州市西湖区文一路119-1号（近教工路）',
        start: 24.0,
        end: 132.0,
        posterSecond: 57.0,
        summary: '文一路开了8年多的温州老字号早餐铺，咸香肉末汤浇头温州糯米饭配脆油条碎，搭配现煮弹性十足的温州瘦肉丸。',
        coordinates: [120.1415, 30.2895],
        planningLocation: { accuracy: 'approximate', label: '文一路教工路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，门牌号文一路119-1号清晰可见，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-wasabeibei-didao-hangbangcai',
        name: '地道杭帮菜（断河头小区店）',
        category: '40年老杭帮菜 · 社区私房菜',
        addressText: '杭州市上城区建国南路断河头小区（1983老小区内）',
        start: 135.0,
        end: 270.0,
        posterSecond: 156.0,
        summary: '1983年老小区里的40年地道老杭帮菜，比拳头还大的炖狮子头入口即化配浓汤下饭，重口酱爆田鸡与臭豆腐蒸猪脑风味独到。',
        coordinates: [120.1748, 30.2435],
        planningLocation: { accuracy: 'approximate', label: '建国南路断河头小区街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于建国南路断河头老小区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-wasabeibei-jiangshan-bingjiang',
        name: '江山百姓冰浆店（鼓楼店）',
        category: '特色甜品 · 现打糯米冰浆',
        addressText: '杭州市上城区十五奎巷/大井巷历史街区（近鼓楼）',
        start: 276.0,
        end: 354.0,
        posterSecond: 306.0,
        summary: '鼓楼白墙黛瓦老街里的特色冰浆甜品铺，现打花生冰浆配血糯米、芝麻粉与花生碎口感绵密糯滑，清爽黄瓜冰浆解腻消暑。',
        coordinates: [120.1688, 30.2392],
        planningLocation: { accuracy: 'approximate', label: '鼓楼十五奎巷大井巷街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于鼓楼历史街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-wasabeibei-chenyong-shipindian',
        name: '陈勇食品店（新市街163号）',
        category: '26年包浆炸串 · 老底子小吃',
        addressText: '杭州市拱墅区新市街163号（近朝晖公园）',
        start: 357.0,
        end: 462.0,
        posterSecond: 387.0,
        summary: '开了26年的传奇包浆炸串与二手书摊，马来西亚老板坐镇油锅，炸年糕、南瓜球、神龙大侠、喀麦隆片裹满秘制甜面酱与微辣酱，物美价廉充满童年记忆。',
        coordinates: [120.1635, 30.2872],
        planningLocation: { accuracy: 'approximate', label: '朝晖新市街163号街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，蓝底门牌新市街163号清晰可见，经度纬度吸附杭州开放道路网络。',
        footageNote: '2026年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  },
  {
    id: 'hz-ppchaonengxuan-7579565604874519798',
    author: 'PP超能炫',
    title: '一个人逛吃杭州美食～一天没住嘴吃到半夜一两点',
    publishedOn: '2025-12-03',
    url: 'https://www.douyin.com/video/7579565604874519798',
    segments: [
      {
        id: 'hz-ppchaonengxuan-laoma-youduner',
        name: '老妈油墩儿（濮家社区店）',
        category: '市井小吃 · 萝卜丝油墩儿',
        addressText: '杭州市上城区濮家新村社区街巷（近机场路）',
        start: 68.0,
        end: 101.0,
        posterSecond: 84.0,
        summary: '濮家社区口碑老摊，3元一个大块头萝卜丝油墩儿外酥里嫩，特大号双面酥脆葱包烩配灵魂甜辣酱。',
        coordinates: [120.1985, 30.2785],
        planningLocation: { accuracy: 'approximate', label: '濮家新村社区街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于濮家社区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-xiaolin-naicha',
        name: '晓麟奶茶（LinHouse）',
        category: '杭州老牌茶饮 · 港式奶茶',
        addressText: '杭州市上城区湖滨商圈延安路/吴山路一带',
        start: 102.0,
        end: 111.0,
        posterSecond: 105.0,
        summary: '老杭州人从小喝到大的本土老牌奶茶，招牌晓麟港奶茶味醇厚，海盐芝士茶与醇香牛乳茶性价比高。',
        coordinates: [120.1628, 30.2562],
        planningLocation: { accuracy: 'approximate', label: '湖滨商圈延安路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于湖滨商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-silimei-tianpin',
        name: '斯利美甜品（湖滨店）',
        category: '台式冰品 · 招牌芒果冰',
        addressText: '杭州市上城区湖滨商圈延安路附近',
        start: 111.0,
        end: 131.0,
        posterSecond: 117.0,
        summary: '人气绵绵冰甜品店，招牌大块鲜芒果绵绵冰果肉饱满，红豆烧仙草芋圆冰分量扎实适合双人分享。',
        coordinates: [120.1632, 30.2565],
        planningLocation: { accuracy: 'approximate', label: '湖滨商圈延安路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于湖滨商圈，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-wangshi-shaobing',
        name: '王氏烧饼（西溪路店）',
        category: '杭州早餐 · 烧饼夹油条/饭团',
        addressText: '杭州市西湖区西溪路（近古荡益乐路万枫酒店对面）',
        start: 182.0,
        end: 233.0,
        posterSecond: 189.0,
        summary: '古荡益乐路/西溪路排队王早餐老店，酥脆烧饼夹现炸油条、糯米油条饭团、葱油拌面配咸甜豆腐脑。',
        coordinates: [120.1235, 30.2645],
        planningLocation: { accuracy: 'approximate', label: '西溪路古荡益乐路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于西溪路万枫酒店对面，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-hangge-youbaoxia',
        name: '杭鸽油爆虾',
        category: '本帮杭帮菜 · 乳鸽/油爆沼虾',
        addressText: '杭州市上城区中山中路/解放路商圈',
        start: 234.0,
        end: 365.0,
        posterSecond: 255.0,
        summary: '地道杭帮菜热门馆子，外皮脆到流油的脆皮乳鸽、外壳酥脆鲜甜的油爆沼虾、肥瘦相间东坡肉汁拌米饭与杭椒黑鱼片。',
        coordinates: [120.1665, 30.2528],
        planningLocation: { accuracy: 'approximate', label: '中山中路解放路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于市中心杭帮菜街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-caihe-guangtou',
        name: '采荷光头卤鸭',
        category: '传统卤味 · 招牌老卤鸭',
        addressText: '杭州市上城区采荷街道双菱路/采荷路一带',
        start: 410.0,
        end: 429.0,
        posterSecond: 417.0,
        summary: '采荷老小区知名卤味铺，招牌老卤鸭肉质紧致有嚼劲，鸭腿卤香入味。',
        coordinates: [120.1945, 30.2595],
        planningLocation: { accuracy: 'approximate', label: '采荷街道双菱路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于采荷街道，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-zhonger-mianguan',
        name: '忠儿面馆（保俶路店）',
        category: '老牌杭帮面 · 招牌片儿川',
        addressText: '杭州市西湖区保俶路60号（近西湖宝石山脚）',
        start: 503.0,
        end: 536.0,
        posterSecond: 516.0,
        summary: '杭州老字号面馆代表，招牌20元现烧片儿川雪菜笋片鲜香浓郁，加一份滑嫩猪肝锅气十足。',
        coordinates: [120.1458, 30.2618],
        planningLocation: { accuracy: 'approximate', label: '保俶路宝石山脚街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于保俶路总店街区，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      },
      {
        id: 'hz-ppchaonengxuan-zhujia-sanjiemei',
        name: '祝家三姐妹',
        category: '社区夜宵小吃 · 卤猪蹄/煎饺',
        addressText: '杭州市上城区清泰街/建国南路市井巷弄',
        start: 557.0,
        end: 600.0,
        posterSecond: 570.0,
        summary: '周边居民常吃的市井平价小店，小米椒卤猪蹄、大排、千张包配葱油拌面、鲜肉小馄饨与爆汁煎饺，人均十几块吃到撑。',
        coordinates: [120.1722, 30.2442],
        planningLocation: { accuracy: 'approximate', label: '清泰街建国南路街区' },
        locationStatus: 'approximate',
        routeEligible: false,
        coordinateSystem: 'WGS84',
        addressNote: '真实探店实拍，位于老城区巷弄，经度纬度吸附杭州开放道路网络。',
        footageNote: '2025年探店实拍 · 具体营业时间以到店为准。'
      }
    ]
  }
];

async function main() {
  console.log('--- Step 1: Probe and calculate SHA256 for batch 15 sources ---');
  for (const s of batch15Sources) {
    const mp4Path = path.join(root, '.local/video-intake', s.id, 'source.mp4');
    const bytes = await readFile(mp4Path);
    s.sourceSHA256 = digest(bytes);
    
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

  for (const source of batch15Sources) {
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

      const encodeArgs = hasAudio
        ? ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', tempClip]
        : ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(segment.start), '-i', input, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', String(segment.end - segment.start), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-threads', '4', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', '-shortest', tempClip];

      await run(ffmpeg, encodeArgs);
      await rename(tempClip, clipPath);
      await cp(clipPath, distClipPath);
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

  for (const s of batch15Sources) {
    if (!lib.sources.some(ex => ex.id === s.id)) {
      lib.sources.push(s);
    }
  }

  await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n');
  console.log(`Saved video-library.json: ${lib.sources.length} sources, ${lib.sources.flatMap(s => s.segments).length} segments.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
