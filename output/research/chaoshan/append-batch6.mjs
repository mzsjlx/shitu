import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {fileURLToPath} from 'node:url';
const worktreeRoot = fileURLToPath(new URL('../../../',import.meta.url));
const libPath = path.join(worktreeRoot, 'map-base/data/cities/chaoshan/video-library.json');
const lib = JSON.parse(await readFile(libPath, 'utf8'));

// 1. Update rights scope
lib.rights.scope = "前六批共48条抖音探店链接经用户在会话中明确提供；视频剪辑与画面使用按用户提供范围记录，原片保留在.local，小封面与公开元数据纳入仓库。两支外地视频（广州养牛邓、大连海之乡）已如实审查并剔除。";

// 2. New sources for Batch 6 (7 valid Chaoshan sources)
const newSources = [
  {
    id: "chaoshan-zhuzhanggui-7646828573487025454",
    author: "北京一家五口（猪掌柜）",
    title: "潮汕这夜市美女好多好多！也好吃也好吃",
    url: "https://www.douyin.com/video/7646828573487025454",
    shareURL: "https://v.douyin.com/cZ_Az4rT6SY/",
    publishedOn: "2026-06-03",
    durationSeconds: 336,
    sourceSHA256: "e9279847527cabbef023e9fb2512018fe9e69ec2dae6b936103d5035fed36d42",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳东山二奶街夜市，汇集现炸普宁豆干、手打柠檬茶、传统炒粉与各色夜市小吃。",
    segments: [
      {
        id: "chaoshan-zhuzhanggui-ernaijie",
        name: "揭阳东山夜市街（二奶街夜市）",
        category: "潮汕夜市 / 揭阳市井街头小吃集市",
        addressText: "揭阳市榕城区东山二奶街夜市街区",
        start: 0,
        end: 30,
        posterSecond: 15,
        summary: "猪掌柜探访揭阳东山二奶街夜市，市井烟火气浓郁，汇集现炸普宁豆干、鲜炒传统粿条炒粉、手打香水柠檬茶与各类生猛特色小吃排档。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-donggua-7688313917848199759",
    author: "冬瓜_🍒",
    title: "来北环夜市不知道吃什么？ 看这条视频就够啦！！",
    url: "https://www.douyin.com/video/7688313917848199759",
    shareURL: "https://v.douyin.com/nhuB0MphWsI/",
    publishedOn: "2026-09-22",
    durationSeconds: 115,
    sourceSHA256: "9ef3e8438a9259d92400679e4d0a641211eadb4e77a121df99e24b0f457f593d",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍潮南峡山北环夜市，金牌蜜汁臭豆腐、酸辣馄饨、单车烤鸡翅与十二冰室爆冰。",
    segments: [
      {
        id: "chaoshan-donggua-beihuanye",
        name: "潮南峡山北环夜市",
        category: "潮汕夜市 / 潮南夜生活美食地标",
        addressText: "汕头市潮南区峡山街道北环路夜市",
        start: 8,
        end: 38,
        posterSecond: 20,
        summary: "冬瓜实探潮南峡山北环夜市宝藏小摊：外酥里嫩的金牌秘汁臭豆腐、皮薄馅大的带汤鲜肉酸辣馄饨、焦香多汁的单车烤鸡翅以及十二冰室特调爆冰。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-shaofeng-7132683898735119623",
    author: "少锋📸",
    title: "汕头花城夜市一条街竖屏版本，即使有很多不好的评价，花城夜市依然火爆",
    url: "https://www.douyin.com/video/7132683898735119623",
    shareURL: "https://v.douyin.com/I7RgynZ7bgI/",
    publishedOn: "2022-08-17",
    durationSeconds: 11,
    sourceSHA256: "955e71283029d223ce0027455c7514ea9fd181cd7d7b6c9270bd461a44a3c540",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头龙湖区嵩山北路官埭段花城夜市长街全景与市井夜宵排档。",
    segments: [
      {
        id: "chaoshan-shaofeng-huachengye",
        name: "汕头花城夜市美食街",
        category: "潮汕夜市 / 龙湖长街市集小吃聚集地",
        addressText: "汕头市龙湖区嵩山北路官埭段11号",
        start: 0,
        end: 10,
        posterSecond: 5,
        summary: "少锋实拍汕头龙湖花城夜市长街全景，夜幕降临百摊灯火璀璨，汇集烤生蚝、炸串、海鲜砂锅粥、柠檬茶等丰富市井夜宵排档。",
        coordinates: [
          116.7195,
          23.3980
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "嵩山北路官埭段花城夜市长街",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位龙湖嵩山北路花城夜市长街点位。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-jiajun-7492356941012831522",
    author: "嘉俊和黄斯",
    title: "广东汕头的牛肉火锅自助，来看看到底怎么样",
    url: "https://www.douyin.com/video/7492356941012831522",
    shareURL: "https://v.douyin.com/E7oXoDHnflk/",
    publishedOn: "2025-04-12",
    durationSeconds: 170,
    sourceSHA256: "4289127faf4df5d8a511efc673fb45eebf73b4802164b4627f014110240f88c1",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头好味道鲜牛肉火锅自助，119元一口价，红酒啤酒饮料畅饮，现切牛肉丸牛筋丸脚筋毛肚管饱。",
    segments: [
      {
        id: "chaoshan-jiajun-haoweidao",
        name: "汕头好味道鲜牛肉自助火锅",
        category: "潮汕牛肉火锅 / 119元鲜全牛自助",
        addressText: "汕头市龙湖区美食街区",
        start: 33,
        end: 64,
        posterSecond: 48,
        summary: "嘉俊实探汕头好味道鲜牛肉火锅自助，119元一口价全包无其他附加费，红酒啤酒饮料畅饮，现切鲜牛肉、手打牛肉丸牛筋丸、脚筋、新鲜毛肚与牛杂无限量供应。",
        coordinates: [
          116.7135,
          23.3665
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "龙湖区核心美食圈好味道牛肉火锅",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍好味道牛肉自助火锅门店及龙湖美食商圈近似定位。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-dongmai-7464524395424304434",
    author: "东麦",
    title: "汕头“农贸工厂火锅自助”一家店几乎把潮汕的美食都搬过来了",
    url: "https://www.douyin.com/video/7464524395424304434",
    shareURL: "https://v.douyin.com/vFv5-ViCWAg/",
    publishedOn: "2025-01-27",
    durationSeconds: 247,
    sourceSHA256: "c203d8809e9fa45b816d5c425d794b72073a7db80e1c763cd68334658ac2ba5b",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头林三满农贸工厂火锅万象城店，自选海鲜盘菜活虾、现切雪花牛肉与正宗卤水火锅。",
    segments: [
      {
        id: "chaoshan-dongmai-linsanman",
        placeId: "chaoshan-zhizhi-linsanman",
        name: "林三满农贸工厂火锅·卤水传承（万象城店）",
        category: "潮汕火锅 / 农贸市场沉浸火锅",
        addressText: "汕头市龙湖区金砂东路与丹霞庄交汇街区",
        start: 30,
        end: 64,
        posterSecond: 38,
        summary: "东麦实拍汕头林三满农贸工厂火锅万象城店，如置身海鲜农贸市场，按盘自选生猛活虾、鲜鱼、现切高品质雪花牛肉与吊龙，搭配正宗卤水与双汤锅底，性价比极高。",
        coordinates: [
          116.7145,
          23.3646
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金砂东路与丹霞庄商圈",
          basis: "video-address",
          branchMatch: "confirmed",
          note: "多博主同店归并：东麦与汁汁冰激凌、大猛每一餐实探同一林三满农贸工厂火锅点位。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-qiqiba-7650060271294256370",
    author: "778潮汕寻食小分队",
    title: "汕头居然有活鳗鱼鲜虾烤肉自助，只要不浪费，不限时不限量",
    url: "https://www.douyin.com/video/7650060271294256370",
    shareURL: "https://v.douyin.com/J49u2u91Iu4/",
    publishedOn: "2026-06-11",
    durationSeconds: 38,
    sourceSHA256: "45e5a6dadd30a45dbfae4a36e7c405905cb8f62cc98708234b0742dfb961ea5c",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍金环路薪滋滋烤肉自助，活鳗鱼现捞、鲜虾活烤、现切鲜牛肉，无合成肉。",
    segments: [
      {
        id: "chaoshan-qiqiba-xinzizi",
        name: "薪滋滋·潮汕鲜烤牛肉·鳗鱼·活虾自助",
        category: "海鲜烤肉自助 / 鲜活鳗鱼鲜虾现烤",
        addressText: "汕头市龙湖区金环路东侧万商楼西侧建设大厦南侧二楼201房",
        start: 0,
        end: 28,
        posterSecond: 10,
        summary: "778实拍金环路薪滋滋烤肉自助，65元不限时不限量，主打鲜活鳗鱼现捞、鲜虾活烤、现切鲜牛肉，无合成肉，海鲜肉品丰富多样。",
        coordinates: [
          116.7062,
          23.3680
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金环南路建设大厦二楼薪滋滋",
          basis: "poi",
          branchMatch: "confirmed",
          note: "根据高德POI及视频定位金环南路建设大厦二楼薪滋滋烤肉自助。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-zhuzhanggui-7506073404165328155",
    author: "北京一家五口（猪掌柜）",
    title: "从来不拍自助的我超级喜欢这家！菜品种类少但是质量高！ 真心推荐！",
    url: "https://www.douyin.com/video/7506073404165328155",
    shareURL: "https://v.douyin.com/Suhqt_9_HXM/",
    publishedOn: "2025-05-19",
    durationSeconds: 571,
    sourceSHA256: "89b7c0af1d1602c2cf5ff583c90a40016d53b0a5cf108fb70483c09c62be358a",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头和牛寿喜烧自助，188元一位老板亲自手切澳洲M9/M7和牛板腱，寿喜烧锅底配高品质雪糕酒水。",
    segments: [
      {
        id: "chaoshan-zhuzhanggui-heniuzizhu",
        name: "汕头和牛寿喜烧专门店（品质和牛自助）",
        category: "和牛寿喜烧 / 澳洲M9现切和牛畅吃",
        addressText: "汕头市区美食商圈（博主未公开店名，依和牛榜单收录）",
        start: 10,
        end: 40,
        posterSecond: 28,
        summary: "猪掌柜实探汕头高质和牛自助，188元一位老板亲自手切澳洲M9/M7和牛板腱，肉质如大理石纹理油润甘香，寿喜烧汤底搭配免费甜品酒水，专做高品质回头客。",
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
