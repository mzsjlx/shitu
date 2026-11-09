import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const worktreeRoot = 'D:/codex/美食网站/.local/worktrees/chaoshan';
const libPath = path.join(worktreeRoot, 'map-base/data/cities/chaoshan/video-library.json');
const lib = JSON.parse(await readFile(libPath, 'utf8'));

// 1. Update rights scope
lib.rights.scope = "前七批共57条抖音探店链接经用户在会话中明确提供；视频剪辑与画面使用按用户提供范围记录，原片保留在.local，小封面与公开元数据纳入仓库。五支外地视频（广州养牛邓、大连海之乡、佛山吃货码头、杭州洪阿福、深圳满柜寿喜烧）已如实审查并剔除。";

// 2. New sources for Batch 7 (9 valid Chaoshan local sources)
const newSources = [
  {
    id: "chaoshan-xiaozhang-7549096682836626746",
    author: "小张一人食",
    title: "在汕头体验112/位的潮汕牛肉火锅自助，看看到底有多快乐",
    url: "https://www.douyin.com/video/7549096682836626746",
    shareURL: "https://v.douyin.com/8GNhbZy7i4k/",
    publishedOn: "2025-09-12",
    durationSeconds: 417,
    sourceSHA256: "0ab8dc012059d3949d014685d6a4ff61a3ddd6c90f3002fce91108f6d0bef2ac",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头市井鲜牛肉火锅自助，112元全包，自选现切全牛、鲜毛肚与手打牛丸牛筋丸。",
    segments: [
      {
        id: "chaoshan-xiaozhang-niurouzizhu",
        name: "汕头市井牛肉火锅自助（112元品质自助）",
        category: "潮汕牛肉火锅 / 112元鲜牛肉自助",
        addressText: "汕头市区核心美食圈（博主未公开具体店名）",
        start: 9,
        end: 38,
        posterSecond: 20,
        summary: "小张实探汕头112元鲜牛肉火锅自助，自取现切全牛各部位、鲜毛肚、手打牛肉丸牛筋丸，每桌赠送牛舌与胸口油，蘸特调沙茶酱蒜酥，纯鲜原汁原味。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-qiqiba-7635580399539993690",
    author: "778潮汕寻食小分队",
    title: "普宁能找到比这个更划算的牛排自助吗！来了就当自己家一样～",
    url: "https://www.douyin.com/video/7635580399539993690",
    shareURL: "https://v.douyin.com/gHK18cepOt0/",
    publishedOn: "2026-05-03",
    durationSeconds: 42,
    sourceSHA256: "b6d6b2438b84db558cd49aab4c82cbc6a0b68100850971f31d6a1b779ad60561",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍普宁广场万泰汇哈根牛牛，现煎原切牛排配丰富热菜熟食、精美寿司与小龙虾甜品。",
    segments: [
      {
        id: "chaoshan-qiqiba-hagenniuniu",
        name: "哈根牛牛牛排自助（普宁万泰汇店）",
        category: "西式牛排自助 / 原切牛排与热菜熟食",
        addressText: "揭阳市普宁市流沙北环大道西陇路段普宁广场万泰汇购物中心L6层",
        start: 0,
        end: 30,
        posterSecond: 15,
        summary: "778实拍普宁万泰汇哈根牛牛牛排自助，现煎大块原切牛排，搭配上百种熟食热菜、精美寿司、麻辣小龙虾、炸物与蛋糕饮品，人均亲民性价比极高。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-dengxuan-7610819549272737979",
    author: "邓炫疯疯",
    title: "2000元潮汕市场火锅自助！牛肉抡盘生吃？巨无霸青龙盘一整条鱼加巨型虾滑 遭全场打假",
    url: "https://www.douyin.com/video/7610819549272737979",
    shareURL: "https://v.douyin.com/JPb7C9m9s4U/",
    publishedOn: "2026-02-26",
    durationSeconds: 401,
    sourceSHA256: "8e6e40af7ffcc0014f52b44995c7174881dcdd5dc89a86a15d0034c32c1c3471",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍潮汕海鲜市场自选火锅大排档，生猛海鱼、小青龙、雪花牛肉与大盘鹅肝现涮。",
    segments: [
      {
        id: "chaoshan-dengxuan-shichanghuoguo",
        name: "潮汕沉浸式海鲜市场火锅（自选盘菜海鲜火锅）",
        category: "潮汕火锅 / 市场自选式海鲜与现切全牛",
        addressText: "潮汕地区海鲜市场火锅排档（博主未公开具体店招）",
        start: 58,
        end: 88,
        posterSecond: 75,
        summary: "邓炫挑战潮汕沉浸式海鲜市场火锅，按盘自取生猛大鱼、鲜活海虾、手作巨型虾滑、鲜切雪花牛肉与大盘鹅肝，食材新鲜生猛镬气十足。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-qiqiba-7403338600563084583",
    author: "778潮汕寻食小分队",
    title: "汕头也有巴西烤肉自助了，不用自己烤，只等投喂也太满足了吧",
    url: "https://www.douyin.com/video/7403338600563084583",
    shareURL: "https://v.douyin.com/9DybVhD4Xjk/",
    publishedOn: "2024-08-15",
    durationSeconds: 34,
    sourceSHA256: "37fa1383296300e1d847cacbab042eb4ceab11f176a3bc0c9ff3d4e96408dd43",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头龙湖苏宁广场熹烤巴西烤肉，明火大串现烤现切、披萨寿司无限量任吃。",
    segments: [
      {
        id: "chaoshan-qiqiba-xikaobaxi",
        name: "熹烤·巴西烤肉自助餐厅（苏宁广场店）",
        category: "巴西烤肉自助 / 明火炭烤现切大肉串",
        addressText: "汕头市龙湖区长平路90号苏宁广场7楼701号",
        start: 0,
        end: 28,
        posterSecond: 10,
        summary: "778实拍长平路苏宁广场熹烤巴西烤肉自助，十几款巴西风味大肉串明火炭烤、师傅大签到桌现切，上百种熟食披萨寿司无限量任吃。",
        coordinates: [
          116.7075,
          23.3615
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "长平路苏宁广场7楼熹烤巴西烤肉",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位长平路苏宁广场7楼熹烤巴西烤肉。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-qiqiba-7679371908013984922",
    author: "778潮汕寻食小分队",
    title: "汕头居然有活牛蛙，活鱼无限量自助，只要不浪费，老板说随便敞开吃！",
    url: "https://www.douyin.com/video/7679371908013984922",
    shareURL: "https://v.douyin.com/ROHEFnc8_bI/",
    publishedOn: "2026-08-29",
    durationSeconds: 43,
    sourceSHA256: "a2e1fecbb02957e0934bf483c57eacf6659f184909bf3bc2faaa9a333af4c9d7",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍练江路来只蛙鱼蛙火锅自助，现捞现杀鲜活牛蛙与生猛活鱼，无限畅吃畅喝。",
    segments: [
      {
        id: "chaoshan-qiqiba-laizhiwa",
        name: "来只蛙·鱼蛙自助火锅（信基华庭店）",
        category: "鱼蛙火锅自助 / 现捞现杀生猛牛蛙与活鱼",
        addressText: "汕头市龙湖区练江路30号信基华庭南区101号",
        start: 0,
        end: 26,
        posterSecond: 8,
        summary: "778实探练江路来只蛙鱼蛙火锅自助，现捞现杀鲜活牛蛙、生猛活鱼现点现切，搭配上百种火锅涮菜、饮品雪糕无限量供应，鲜嫩弹牙。",
        coordinates: [
          116.7150,
          23.3785
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "练江路信基华庭南区来只蛙",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位练江路信基华庭南区来只蛙鱼蛙自助火锅。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-daya-7635515159809306021",
    author: "大椰吖",
    title: "在汕头，我唯一能吃回本的自助诞生了...",
    url: "https://www.douyin.com/video/7635515159809306021",
    shareURL: "https://v.douyin.com/5rG8hSe1AG0/",
    publishedOn: "2026-05-03",
    durationSeconds: 17,
    sourceSHA256: "f784323b03af5ff7a32d8edc89a67b3c7cfe36c7d5ec3bd67a9f2a885f75e0ec",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头万象城花菊融合料理铁板烧放题，法式铁板现煎大虾牛排与刺身放题。",
    segments: [
      {
        id: "chaoshan-daya-huaju",
        name: "花菊融合料理·铁板烧（汕头万象城店）",
        category: "日式铁板烧自助 / 精致融合料理放题",
        addressText: "汕头市龙湖区金霞街道金环南路华润万象城二楼L254",
        start: 0,
        end: 16,
        posterSecond: 8,
        summary: "大椰吖实拍汕头万象城花菊融合料理铁板烧放题，法式铁板现煎大虾牛排、刺身拼盘、鲍鱼、甜品与精酿饮品，高端精致回本之选。",
        coordinates: [
          116.7085,
          23.3625
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金环南路华润万象城二楼花菊",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位金环南路华润万象城二楼花菊融合料理。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-xiaozhen-7569124913328442633",
    author: "小珍来咯…",
    title: "24块8就可以吃顿火锅自助 菜品新鲜锅底太下饭了",
    url: "https://www.douyin.com/video/7569124913328442633",
    shareURL: "https://v.douyin.com/mpXjt8RbBUc/",
    publishedOn: "2025-11-05",
    durationSeconds: 484,
    sourceSHA256: "d697ce66f1853b019faae48c7e49291009ddc60604c51373525e613aade04da9",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍胖墩墩地摊火锅自助，24.8元券后畅吃，自炒豆豉锅底配鲜切猪瘦肉、板筋、豆腐。",
    segments: [
      {
        id: "chaoshan-xiaozhen-pangdunduan",
        name: "胖墩墩地摊火锅自助（平价鲜肉地摊火锅）",
        category: "地摊火锅自助 / 24元现炒锅底平价火锅",
        addressText: "潮汕地区地摊火锅街区（胖墩墩地摊火锅）",
        start: 42,
        end: 72,
        posterSecond: 55,
        summary: "小珍实探超划算胖墩墩地摊火锅自助，券后仅需24.8元一位，自己动手现炒豆豉微辣锅底，自取鲜切猪瘦肉、肉丸、长板筋与新鲜蔬菜，香气四溢超级下饭。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-qiqiba-7492345872357887273",
    author: "778潮汕寻食小分队",
    title: "和牛爱好者真的要来啊，轻松实现和牛自由",
    url: "https://www.douyin.com/video/7492345872357887273",
    shareURL: "https://v.douyin.com/UExsEN2v8WU/",
    publishedOn: "2025-04-12",
    durationSeconds: 37,
    sourceSHA256: "dd3f30df63146ba4f793f2c1f4e3475139bee16a4b0bb398e9cc2212f31ef47b",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍龙湖丹霞庄元酱寿喜烧，不到200元畅吃澳洲品质M9/M7和牛放题与精美日料甜品。",
    segments: [
      {
        id: "chaoshan-qiqiba-yuanjiangshouxishao",
        name: "元酱寿喜烧·和牛放题（丹霞庄店）",
        category: "和牛寿喜烧 / 澳洲M9现切和牛放题",
        addressText: "汕头市龙湖区丹霞庄西区37栋119 (丹苑南街与华山南路交叉口西60米)",
        start: 0,
        end: 28,
        posterSecond: 13,
        summary: "778实拍丹霞庄西区元酱寿喜烧，不到200元畅享澳洲品质M9/M7级和牛放题、精美日式寿司、手工冰激凌与高品质饮品，肉质油润奶香浓郁。",
        coordinates: [
          116.7112,
          23.3630
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "丹霞庄西区元酱寿喜烧",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位丹霞庄西区元酱寿喜烧和牛自助。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-xiaolin-7619257133960300197",
    author: "小林探",
    title: "谁懂潮汕自助鲜烤牛肉有多好卷！无限畅吃",
    url: "https://www.douyin.com/video/7619257133960300197",
    shareURL: "https://v.douyin.com/QmXGOWKj0XA/",
    publishedOn: "2026-03-20",
    durationSeconds: 16,
    sourceSHA256: "9bd806d72091614c82630b04f8e52ea0d722f54ed513f7f68143535dedf1dcef",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍潮阳金顺优品旁潮汕牛骨馆，大盆新鲜现切牛肉炭火现烤无限畅吃。",
    segments: [
      {
        id: "chaoshan-xiaolin-chaoshanniuguguan",
        name: "潮汕牛骨馆·鲜烤牛肉自助（潮阳金顺店）",
        category: "潮汕烤肉自助 / 现切鲜牛肉炭火烤肉",
        addressText: "汕头市潮阳区金顺优品客房隔壁",
        start: 0,
        end: 15,
        posterSecond: 6,
        summary: "小林实拍潮阳金顺旁潮汕牛骨馆，大盆现切新鲜牛肉无限量自取炭火现烤，卷生菜蒜片大口炫肉，市井烟火气十足。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  }
];

// Append new sources (skip if already present)
for (const src of newSources) {
  const existingIdx = lib.sources.findIndex(s => s.id === src.id);
  if (existingIdx >= 0) {
    lib.sources[existingIdx] = src;
    console.log(`Updated existing source: ${src.id}`);
  } else {
    lib.sources.push(src);
    console.log(`Added new source: ${src.id}`);
  }
}

await writeFile(libPath, JSON.stringify(lib, null, 2) + '\n', 'utf8');
console.log(`Successfully wrote ${lib.sources.length} sources and ${lib.sources.flatMap(s => s.segments).length} segments to video-library.json`);
