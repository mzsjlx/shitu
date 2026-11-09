import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const worktreeRoot = 'D:/codex/美食网站/.local/worktrees/chaoshan';
const libPath = path.join(worktreeRoot, 'map-base/data/cities/chaoshan/video-library.json');
const lib = JSON.parse(await readFile(libPath, 'utf8'));

// 1. Update rights scope
lib.rights.scope = "前四批共31条抖音探店链接经用户在会话中明确提供；视频剪辑与画面使用按用户提供范围记录，原片保留在.local，小封面与公开元数据纳入仓库。";

// 2. Ensure chaoshan-zhizhi-linsanman has placeId
for (const s of lib.sources) {
  for (const seg of s.segments) {
    if (seg.id === 'chaoshan-zhizhi-linsanman') {
      seg.placeId = 'chaoshan-zhizhi-linsanman';
    }
  }
}

// 3. New sources for Batch 4
const newSources = [
  {
    id: "chaoshan-dage-7571045085338270154",
    author: "达哥在上海",
    title: "在潮汕揭阳下架山镇村里喝“普宁早茶”全是个位数的茶点好吃又实惠，吃东西全靠抢！",
    url: "https://www.douyin.com/video/7571045085338270154",
    shareURL: "https://v.douyin.com/Zbrpjl27mxg/",
    publishedOn: "2025-11-10",
    durationSeconds: 596,
    sourceSHA256: "5c7e2fb53451f1c2dbeb9df059054f2c4b1c6a9a73ea5130df334b885db476e0",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳普宁下架山镇乡村大棚早茶集市，全是个位数蒸点、凤爪、排骨、干蒸烧卖与肠粉。",
    segments: [
      {
        id: "chaoshan-dage-xiajiashanzaocha",
        name: "下架山大棚普宁早茶（普宁传统早茶）",
        category: "潮汕早茶 / 乡村市集平价茶点",
        addressText: "揭阳市普宁市下架山镇乡村集市大棚",
        start: 0,
        end: 24,
        posterSecond: 6,
        summary: "揭阳普宁下架山镇乡村大棚早茶，极具市井烟火气，全是个位数蒸点、凤爪、排骨、干蒸烧卖与热腾腾的肠粉，大清早人头攒动座无虚席。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-tiedan-7602104576711429376",
    author: "吃货老外铁蛋儿",
    title: "潮汕生腌，一口沦陷",
    url: "https://www.douyin.com/video/7602104576711429376",
    shareURL: "https://v.douyin.com/V1Nd96-WrKg/",
    publishedOn: "2026-02-02",
    durationSeconds: 279,
    sourceSHA256: "f2bf71d2cbce1ed55fc83787d695451d34d583ea33c4797ff50f15981d2520eb",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头金平老城生腌海鲜大排档，膏蟹、小青龙、皮皮虾、三文鱼与生蚝鲍鱼等潮汕海鲜毒药。",
    segments: [
      {
        id: "chaoshan-tiedan-chaoshanshengyan",
        name: "老牌潮汕生腌大排档（汕头老城店）",
        category: "潮汕生腌 / 潮汕海鲜毒药",
        addressText: "汕头市金平区海滨路老市区街区",
        start: 12,
        end: 36,
        posterSecond: 28,
        summary: "老外铁蛋儿打卡潮汕生腌海鲜排档，冰淇淋口感的膏蟹、小青龙、皮皮虾、鲜三文鱼与生蚝鲍鱼，淋上特制酸辣蒜香生腌汁，鲜甜入魂一口沦陷。",
        coordinates: [
          116.678,
          23.355
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "海滨路老市区街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍金平老城区海滨路与生腌排档招牌大致定位街区，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-dongmai-7574041681944807601",
    author: "东麦",
    title: "潮汕“居民楼下的平价大排档”做了十几年 本地人的第二食堂！",
    url: "https://www.douyin.com/video/7574041681944807601",
    shareURL: "https://v.douyin.com/J8MH91mm0QA/",
    publishedOn: "2025-11-19",
    durationSeconds: 184,
    sourceSHA256: "6f720c1bb641e266939e71713fe5f7a6f8d7111fcfdc2e0d0c9c50005a0a65a7",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头澄海区老城区居民楼下平价大排档，半煎炸猪油酥香蚝烙、炒猪肚与酸菜海鲜汤。",
    segments: [
      {
        id: "chaoshan-dongmai-chenghaidapaidang",
        name: "澄海居民楼平价大排档（澄海老店）",
        category: "潮汕排档 / 澄海地道家常菜",
        addressText: "汕头市澄海区老城区居民楼下街区",
        start: 0,
        end: 23,
        posterSecond: 10,
        summary: "澄海居民楼下开了十几年的本地第二食堂，特色半煎炸猪油酥香蚝烙、荷兰豆炒猪肚、爆炒腰花与酸菜海鲜汤，5个硬菜仅164元，镬气十足街坊最爱。",
        coordinates: [
          116.762,
          23.468
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "澄海老城区生活街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍澄海老城区居民楼底商大排档实景大致定位街区，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-wangdingyi-7542075948003233033",
    author: "王丁亿Dean",
    title: "在汕头吃粉丝安利鸡煲+鹅肝猪腰组合！谁懂啊？这是潮汕才敢给的“温柔毒药”",
    url: "https://www.douyin.com/video/7542075948003233033",
    shareURL: "https://v.douyin.com/Gxio9Orx1SA/",
    publishedOn: "2025-08-24",
    durationSeconds: 178,
    sourceSHA256: "5bf6f38c5c4bf11693978775b3d6ed5eb27e0b53e78c14e11393266ee10c07b2",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头金平光华老街阿洲炭炉鸡煲，生鲜现斩现炒鸡肉配厚切生猪腰与卤水鹅肝。",
    segments: [
      {
        id: "chaoshan-wangdingyi-azhoujibao",
        name: "阿洲炭炉鸡煲·特色猪腰鹅肝（金平店）",
        category: "广式鸡煲 / 潮式炭炉鲜鸡鹅肝猪腰",
        addressText: "汕头市金平区金砂西路光华老街区",
        start: 13,
        end: 38,
        posterSecond: 25,
        summary: "汕头金平区阿洲炭炉鸡煲，生鲜现点现斩现炒鸡肉，搭配潮汕特色厚切生猪腰与粉糯卤水鹅肝下煲焖煮，浓郁酱汁下饭绝配，炭火热气温润诱人。",
        coordinates: [
          116.672,
          23.376
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "光华街道老街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍阿洲鸡煲店面与金平光华老街区环境大致定位，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-xili-7639585049512016882",
    author: "犀利广州",
    title: "潮汕潮州藏着一家人均30多的大排档，既有锅气又有性价比！",
    url: "https://www.douyin.com/video/7639585049512016882",
    shareURL: "https://v.douyin.com/tWSoj8PsSGE/",
    publishedOn: "2026-05-14",
    durationSeconds: 131,
    sourceSHA256: "29489da882cc00de42de8abe15b2287a308eb611054f150373902ee71008e0c8",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍潮州枫溪夫妻档铁棚大排档，酸菜牛肉、金不换牛筋、蘑菇鲜虾仁与焖火花甲。",
    segments: [
      {
        id: "chaoshan-xili-tiepengdapaidang",
        name: "铁棚大排档（潮州枫溪店）",
        category: "潮州大排档 / 平价镬气家常小炒",
        addressText: "潮州市枫溪区潮枫路与绿榕西路交界",
        start: 12,
        end: 36,
        posterSecond: 25,
        summary: "潮州枫溪夫妻档铁棚大排档，人均30元极致性价比与镬气，招牌酸菜牛肉滑嫩多汁、金不换炒牛筋软糯入味、蘑菇鲜虾仁鲜香回甘，五菜一汤仅130元。",
        coordinates: [
          116.621,
          23.662
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "枫溪区潮枫路生活街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍潮州枫溪铁棚大排档及周边街景大致定位，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-dongmai-7695564387985637474",
    author: "东麦",
    title: "40多年老店 潮汕烧烤千千万 古早味烧烤不到一半",
    url: "https://www.douyin.com/video/7695564387985637474",
    shareURL: "https://v.douyin.com/idMph6JbI1E/",
    publishedOn: "2026-10-12",
    durationSeconds: 173,
    sourceSHA256: "c3002055b0d9e407bc77f9c76e13bd6289c6b59db4b8b9fd82070d8be06179c9",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头老城区长平路40年古早味炭火干烤，新鲜现穿牛肉串、青椒烤潮式豆干与烤鱼丸。",
    segments: [
      {
        id: "chaoshan-dongmai-guzaoweishaokao",
        name: "四十载古早味炭火烧烤（汕头老店）",
        category: "潮式烧烤 / 炭火古早味干烤",
        addressText: "汕头市金平区长平路与金新路老城区街区",
        start: 0,
        end: 22,
        posterSecond: 15,
        summary: "汕头老城开了40余年的古早味炭火烧烤，从地摊做到小店，只做炭火干烤，新鲜现穿牛肉串、青椒烤潮式豆干、烤鱼丸与烤茄子配灵魂菜脯碎，怀旧纯正。",
        coordinates: [
          116.698,
          23.364
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金新路与长平路老街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍汕头老城区40年炭火烧烤门面与街景大致定位，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-dameng-7679854650506155749",
    author: "大猛每一餐🍜",
    title: "开在汕头市的林三满农贸工厂火锅🎉🎉🎉",
    url: "https://www.douyin.com/video/7679854650506155749",
    shareURL: "https://v.douyin.com/nuKDWA4Uc6g/",
    publishedOn: "2026-08-30",
    durationSeconds: 140,
    sourceSHA256: "3449011fd93f36d716194c51537de6e6df61405a26439de7e36ccc5dcbc3216c",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头林三满农贸工厂火锅，沉浸式菜市场自选档口、现切鲜牛肉配潮汕卤水锅底。",
    segments: [
      {
        id: "chaoshan-dameng-linsanman",
        name: "林三满农贸工厂火锅·卤水传承（万象城店）",
        category: "潮汕火锅 / 农贸市场沉浸火锅",
        addressText: "汕头市龙湖区金砂东路与丹霞西街交叉口",
        start: 0,
        end: 23,
        posterSecond: 7,
        summary: "大猛实探汕头林三满农贸工厂火锅，超大沉浸式菜市场自选档口，现切吊龙牛肉配潮汕卤水锅底与九宫格料台，肉质鲜嫩卤味浓郁，夜生活聚餐极具排场。",
        coordinates: [
          116.7145,
          23.3646
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金砂东路与丹霞西街商圈",
          basis: "video-address",
          branchMatch: "confirmed",
          note: "多博主同店归并：与汁汁冰激凌共用林三满农贸工厂火锅坐标点位。",
          reviewedOn: "2026-11-09"
        },
        placeId: "chaoshan-zhizhi-linsanman"
      }
    ]
  },
  {
    id: "chaoshan-hexiaowan-7615550323881496165",
    author: "何小丸",
    title: "在汕头村里路边下顿馆子！菊花炭烤鲜牛肉，现切现烤油花在炭火上滋滋冒香！",
    url: "https://www.douyin.com/video/7615550323881496165",
    shareURL: "https://v.douyin.com/CkRl8CLLGCs/",
    publishedOn: "2026-03-10",
    durationSeconds: 360,
    sourceSHA256: "f9f0913c512a92d79b6b66100d6a4f5bfca602a5e5fe9b0e8eef19d1f45f9b15",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头村落路边菊花炭火烤肉，现切鲜牛肉、吊龙、牛舌、胸口油配金不换与潮汕酸菜。",
    segments: [
      {
        id: "chaoshan-hexiaowan-juhuataniniurou",
        name: "乡村菊花炭烤鲜牛肉（村头烤肉店）",
        category: "潮汕烤肉 / 菊花炭现切鲜牛肉",
        addressText: "汕头市龙湖区外砂街道近郊村落",
        start: 10,
        end: 32,
        posterSecond: 25,
        summary: "汕头村头路边无招牌平价炭火烤肉，选用高级菊花炭与新鲜现切鲜牛肉，雪花、吊龙、牛舌、胸口油在炭火上滋滋作响，搭配金不换与潮汕自制酸菜香气扑鼻。",
        coordinates: [
          116.782,
          23.412
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "外砂街道近郊村落",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍汕头村落路边菊花炭烤牛肉现场大致定位街区，非店门实测。",
          reviewedOn: "2026-11-09"
        }
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
