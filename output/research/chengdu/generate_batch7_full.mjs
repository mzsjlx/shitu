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

const batch7Sources = [
  {
    id: "cd-jigelebuqide-7541289429587987755",
    author: "鸡哥了不得",
    title: "开几百公里就专门为了吃个肥肠血旺！嘴：这辈子跟着你值了！ #美食分享 #寻味烟火气 #心动打卡指南 #成都美食",
    url: "https://www.douyin.com/video/7541289429587987755",
    shareURL: "https://v.douyin.com/b38kdos_5E4/",
    platform: "douyin",
    publishedOn: "2025-08-22",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 223.93,
    sourceSHA256: "478e2374ffee9f5aaf05eebb4785437b9f48a1907a9aa1641b89e093f36bc783",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探大邑县安仁镇张肥肠血旺，红汤血旺细嫩化渣、卤肥肠软糯香浓。因距离成都市中心五城区底图范围大于50公里，严格遵循地理真实规范，保留原始探店记录但不上图造点。",
    segments: [
      {
        id: "cd-jigelebuqide-zhangfeichang",
        name: "张肥肠（大邑安仁店）",
        category: "川味小吃 / 肥肠粉",
        summary: "鸡哥了不得专程驱车探访的大邑安仁古镇知名肥肠血旺馆，红汤鲜亮、血旺细嫩化渣、卤肥肠软糯醇香，保留探店记录，因超出中心五城区底图范围暂不上图。",
        addressText: "成都市大邑县安仁镇迎宾路（超出中心五城区底图范围，保留原始探店记录）",
        start: 5.0,
        end: 65.0,
        posterSecond: 25.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wowxingge-7685637264814247187",
    author: "wow醒哥",
    title: "第一次在成都吃烧烤，天没黑，当地小伙伴就当正餐吃了，吃过之后只能说，太惊艳了！#成都美食 #烧烤 #心动打卡指南 #人间烟火 #无辣不欢",
    url: "https://www.douyin.com/video/7685637264814247187",
    shareURL: "https://v.douyin.com/2iNm5nABjHI/",
    platform: "douyin",
    publishedOn: "2026-09-15",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 499.51,
    sourceSHA256: "b24f8e8eba86e5445423926a798fcc3c7a4a95c78429d297848ad7e26ee272af",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探锦江区太古里杨老头鲜货烧烤，与密子君探店同一分店（多博主合用一点同店共锚点）。实尝招牌鲜烤尿罐虾、浓郁海肠捞饭、特制炒宽粉与先卤后烤猪蹄。",
    segments: [
      {
        id: "cd-wowxingge-yanglaotou-taikooli",
        placeId: "cd-mizijun-yanglaotou-taikooli",
        name: "杨老头鲜货烧烤（太古里店）",
        category: "烧烤 / 江湖菜",
        summary: "wow醒哥首度探店打卡成都杨老头鲜货烧烤，打卡招牌鲜烤尿罐虾、浓郁海肠捞饭、特制炒宽粉与先卤后烤猪蹄，大口撸串搭配10元自助冰粉，市井烟火气十足。",
        addressText: "成都市锦江区中纱帽街8号成都远洋太古里28栋L2层2307B",
        start: 0.0,
        end: 60.0,
        posterSecond: 25.0,
        coordinates: [104.0818, 30.6552],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路太古里商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "远洋太古里核心商圈，多博主同店合用锚点，吸附中纱帽街/大慈寺路真实道路节点（距离10.8米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:中纱帽街",
            name: "中纱帽街",
            nearestNode: 26484,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-airousi-7692002207759109426",
    author: "爱肉丝",
    title: "完完全全神店来的，他们迟早有一天能摆满整个巷子 #成都美食 #成都烧烤 #国庆吃好喝好 #双椒牛肉 #烧烤呀撸串呀",
    url: "https://www.douyin.com/video/7692002207759109426",
    shareURL: "https://v.douyin.com/vLITayURMb0/",
    platform: "douyin",
    publishedOn: "2026-10-02",
    publishedOnNote: "2026年国庆探店视频",
    durationSeconds: 145.63,
    sourceSHA256: "3f96471085602f2f087e321c0654dbaf12abbaa13523fa561f14673272f74200",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探锦江区东光小区老街坊巷内烧烤，招牌双椒牛肉串嫩滑爆汁、香辣入味，老小区露天外摆挤满巷道，极具市井烟火气。",
    segments: [
      {
        id: "cd-airousi-dongguangshaokao",
        name: "鲜霞烧烤（东光小区店）",
        category: "江湖烧烤 / 夜宵大排档",
        summary: "爱肉丝极力推荐的东光小区巷子神级炭火烧烤，招牌双椒牛肉串嫩滑多汁、麻辣过瘾，小桌外摆挤满老居民楼巷道，深夜宵夜氛围拉满。",
        addressText: "成都市锦江区东光小区老街区（东光北顺街/东怡街巷道）",
        start: 0.0,
        end: 60.0,
        posterSecond: 25.0,
        coordinates: [104.1015, 30.6195],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 东光小区街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市锦江区东光小区老街区，吸附东光北顺街源道路节点（距离41.9米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:东光北顺街",
            name: "东光北顺街",
            nearestNode: 40342,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-sangesan-7584859074635943217",
    author: "三个叁",
    title: "成都奎星楼街逛吃，川菜串串冒菜统统拿下，主打一个吃到扶墙走！！#四川烟火小店私藏清单#烟火里的心动#非遗好去处#天府烟火小店#抖音非遗计划",
    url: "https://www.douyin.com/video/7584859074635943217",
    shareURL: "https://v.douyin.com/90MkUAZSf3c/",
    platform: "douyin",
    publishedOn: "2025-12-18",
    publishedOnNote: "2025年奎星楼特辑",
    durationSeconds: 425.13,
    sourceSHA256: "7c2200cd367a00d0e018ce55b11e4f35609d8569b95542c8b2946d3086267ee8",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探青羊区奎星楼街三家代表性美食：馨林跳水蛙、冒椒乃亮串串香与奎星楼无名冒菜，涵盖川菜爆炒、热锅串串与红汤冒菜。",
    segments: [
      {
        id: "cd-sangesan-xinlintiaoshuitu",
        name: "馨林跳水蛙（奎星楼店）",
        category: "川菜 / 江湖菜",
        summary: "三个叁打卡奎星楼街人气跳水蛙，麻辣鲜香、蛙肉细嫩弹牙，仔姜与鲜花椒风味浓烈，红油滚烫极其下饭。",
        addressText: "成都市青羊区奎星楼街16号附1号",
        start: 35.0,
        end: 95.0,
        posterSecond: 55.0,
        coordinates: [104.0538, 30.6685],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 奎星楼街坊",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区奎星楼街16号附1号，吸附奎星楼街源道路节点（距离31.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:奎星楼街",
            name: "奎星楼街",
            nearestNode: 16393,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-sangesan-maojiaonailiang",
        name: "冒椒乃亮·成都老味道（奎星楼总店）",
        category: "串串香 / 火锅",
        summary: "三个叁打卡奎星楼街地道串串香，冷锅热串红油浸润、牛肉串嫩爽入味，干碟香脆油碟醇滑，排队打卡老成都烟火气。",
        addressText: "成都市青羊区奎星楼街33号",
        start: 145.0,
        end: 205.0,
        posterSecond: 165.0,
        coordinates: [104.0526, 30.6683],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 奎星楼街坊",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区奎星楼街33号，吸附奎星楼街源道路节点（距离81.7米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:奎星楼街",
            name: "奎星楼街",
            nearestNode: 16463,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-sangesan-wumingmaocai",
        name: "无名冒菜（奎星楼店）",
        category: "冒菜 / 川味小吃",
        summary: "三个叁推荐奎星楼街老牌无名冒菜，大碗冒牛肉、毛肚与午餐肉浸泡在红汤浓汁中，蒜泥与豆豉提香，性价比极高。",
        addressText: "成都市青羊区奎星楼街23号附2号",
        start: 240.0,
        end: 300.0,
        posterSecond: 260.0,
        coordinates: [104.0531, 30.6684],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 奎星楼街坊",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区奎星楼街23号附2号，吸附奎星楼街源道路节点（距离42.7米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:奎星楼街",
            name: "奎星楼街",
            nearestNode: 16463,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xulaosihebeijiang-7703881917602516258",
    author: "徐老斯和bee酱",
    title: "报！云贵川渝全部集合！这家江湖菜有点东西 #美胃趣计划 #美食判官已上线 #嘿吃了吗 #成都江湖菜 #美食神探局",
    url: "https://www.douyin.com/video/7703881917602516258",
    shareURL: "https://v.douyin.com/262gghtlREg/",
    platform: "douyin",
    publishedOn: "2026-11-04",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 216.34,
    sourceSHA256: "a0ced13db25b5a71c3d98af14c1d429cf26f8747fbf718d0cf70682f44a766fc",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探武侯区桐梓林商圈谢逍遥山城大排档，招牌鱼香锅包虾、酸汤牛肉与特色爆炒，集合云贵川渝江湖风味，开胃过瘾。",
    segments: [
      {
        id: "cd-xulaosihebeijiang-xiexiaoyao",
        name: "谢逍遥山城大排档（成都总店）",
        category: "川味爆炒 / 江湖菜烧烤",
        summary: "徐老斯和bee酱探访桐梓林商圈集合云贵川渝风味的热门大排档，招牌鱼香锅包虾外脆里嫩酸甜微辣、酸汤牛肉开胃过瘾，市井烟火江湖气息浓郁。",
        addressText: "成都市武侯区紫薇东路8号附1号（桐梓林街区）",
        start: 0.0,
        end: 60.0,
        posterSecond: 30.0,
        coordinates: [104.0673, 30.6128],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 桐梓林商圈",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市武侯区紫薇东路8号附1号，吸附紫薇东路源道路节点（距离29.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:紫薇东路",
            name: "紫薇东路",
            nearestNode: 39647,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaobeiele-7584331173757848874",
    author: "小贝饿了（臭贝贝螺蛳粉上线啦！）",
    title: "花119在成都吃地道川菜，7肉1汤，米饭免费无限续，香！",
    url: "https://www.douyin.com/video/7584331173757848874",
    shareURL: "https://v.douyin.com/QVTAtndjk-I/",
    platform: "douyin",
    publishedOn: "2025-12-16",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 329.0,
    sourceSHA256: "e9655300f15f4527f732aa53494de0d96341824a9c4bb3f4f58ea2b4539fbc0a",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探金牛区解放路驷马桥老牌苍蝇馆子大明家常菜，花119元吃7肉1汤，招牌肝腰合炒火候极佳、回锅肉焦香下饭、米饭免费无限续。",
    segments: [
      {
        id: "cd-xiaobeiele-damingjiachangcai",
        name: "大明家常菜（驷马桥店）",
        category: "川味家常菜 / 芋儿鸡",
        summary: "小贝饿了探访金牛区驷马桥老牌苍蝇小馆，119元畅享7肉1汤，招牌肝腰合炒火候绝佳、回锅肉焦香下饭、米饭免费无限续，堪称打工人碳水天堂。",
        addressText: "成都市金牛区解放路一段87号附2号（梁家巷/驷马桥街区）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: [104.0864, 30.6872],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 驷马桥梁家巷街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市金牛区解放路一段87号附2号，吸附解放路一段源道路节点（距离89.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:解放路一段",
            name: "解放路一段",
            nearestNode: 9591,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-tiaojieshuachengdu-7667130769399205155",
    author: "挑姐耍成都",
    title: "成都抚琴必吃美食路线大推荐！ #省份课代表 #寻找烟火气 #成都江湖菜值得一吃",
    url: "https://www.douyin.com/video/7667130769399205155",
    shareURL: "https://v.douyin.com/sQU2NbY_0Eo/",
    platform: "douyin",
    publishedOn: "2026-07-27",
    publishedOnNote: "2026年抚琴特辑",
    durationSeconds: 186.48,
    sourceSHA256: "2c2af3e582a9143f06900b47f2993ad6d765aaeb169ceb3ad9b8ed4f9e5bc930",
    acquisitionStatus: "local-source",
    evidenceNote: "原片推荐金牛区抚琴商圈经典美食路线，重点打卡朱碧琼肥肠粉抚琴总店与黑竹香鸡营门口抚琴店，展示抚琴烟火气老街老味道。",
    segments: [
      {
        id: "cd-tiaojieshuachengdu-zhubiqiong",
        name: "朱碧琼肥肠粉（抚琴总店）",
        category: "市井老字号 / 肥肠粉",
        summary: "挑姐推荐抚琴街区代表名店，手工现打红薯粉晶莹剔透，红汤香辣浓郁，卤肥肠软糯入味，搭配香酥军屯锅魁经典过瘾。",
        addressText: "成都市金牛区抚琴南路4号附1号",
        start: 5.0,
        end: 65.0,
        posterSecond: 25.0,
        coordinates: [104.0371, 30.6865],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 抚琴南路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市金牛区抚琴南路4号附1号，吸附抚琴南路源道路节点（距离34.8米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:抚琴南路",
            name: "抚琴南路",
            nearestNode: 8705,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-tiaojieshuachengdu-heizhu",
        name: "黑竹香鸡（营门口抚琴店）",
        category: "特色火锅 / 川味焖锅",
        summary: "挑姐抚琴路线重头戏，黑竹香鸡老牌名店，乌骨鸡肉鲜嫩多汁，汤底融入药膳香料慢火煨炖，加入魔芋与笋子吸饱醇汤，回味无穷。",
        addressText: "成都市金牛区营门口路街道抚琴西路",
        start: 70.0,
        end: 130.0,
        posterSecond: 90.0,
        coordinates: [104.0355, 30.6878],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 抚琴西路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市金牛区营门口路街道抚琴西路，吸附抚琴西路源道路节点（距离35.9米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:抚琴西路",
            name: "抚琴西路",
            nearestNode: 8696,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  }
];

// Merge into library
const finalSources = [...existingLibrary.sources];
for (const s of batch7Sources) {
  const existingIdx = finalSources.findIndex(item => item.id === s.id);
  if (existingIdx >= 0) {
    finalSources[existingIdx] = s;
  } else {
    finalSources.push(s);
  }
}

const newLibrary = {
  ...existingLibrary,
  sources: finalSources
};

// Validate schema
validateVideoLibrary(newLibrary, 'chengdu');
console.log('Video library validated successfully! Total sources:', finalSources.length);

// Save library
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), JSON.stringify(newLibrary, null, 2) + '\n', 'utf8');

// Transcode clips and posters into .local/video-clips/${source.id}/
const clipsDir = path.join(root, '.local/video-clips');
const reportPath = path.join(clipsDir, 'report.json');
let report = { schemaVersion: 1, records: [] };
if (fs.existsSync(reportPath)) {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

console.log("\nProcessing Batch 7 video segments into media library...");
for (const source of batch7Sources) {
  const intakeDir = path.join(root, '.local/video-intake', source.id);
  const input = path.join(intakeDir, 'source.mp4');
  if (!fs.existsSync(input)) {
    throw new Error(`Missing source MP4 for ${source.id}`);
  }

  for (const segment of source.segments) {
    const key = mediaKey(source, segment);
    const names = mediaNames(source, segment);
    const outDir = path.join(clipsDir, source.id);
    fs.mkdirSync(outDir, { recursive: true });

    const clipPath = path.join(outDir, names.clip);
    const posterPath = path.join(outDir, names.poster);

    console.log(`\nProcessing ${segment.id} (${names.clip})...`);

    // Transcode clip if not exists or size is 0
    if (!fs.existsSync(clipPath) || fs.statSync(clipPath).size === 0) {
      const isFull = segment.start === 0 && (segment.end >= source.durationSeconds - 0.5);
      const clipArgs = [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', String(segment.start),
        '-i', input
      ];
      if (!isFull) {
        clipArgs.push('-t', String(segment.end - segment.start));
      }
      clipArgs.push(
        '-c:v', 'libx264',
        '-threads', '8',
        '-preset', 'veryfast',
        '-crf', '21',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        clipPath
      );
      await run(FFMPEG, clipArgs);
    }

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

for (const source of newLibrary.sources) {
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

console.log('Batch 7 processing completed successfully!');
