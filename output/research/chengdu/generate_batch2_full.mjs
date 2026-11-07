import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateVideoLibrary } from '../../../map-base/src/video-library-model.js';
import { digest, mediaKey, mediaNames } from '../../../map-base/scripts/video-library-common.mjs';

const root = path.resolve('map-base');
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

// 1. Load existing library
const existingLibrary = JSON.parse(fs.readFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), 'utf8'));

// 2. Define batch 2 sources & segments
const batch2Sources = [
  {
    id: "cd-rourou-7087095583428693261",
    author: "肉肉大搜索",
    title: "成都街边15元自助餐，20道菜让“打工人”吃饱又吃好，85岁老人吃饭不要钱",
    url: "https://www.douyin.com/video/7087095583428693261",
    shareURL: "https://v.douyin.com/u14sw86QcaQ/",
    platform: "douyin",
    publishedOn: "2022-04-16",
    publishedOnNote: "2022年探店视频 · 营业情况待核实",
    durationSeconds: 271.49,
    sourceSHA256: "03de1439bc9c575ef4340ddb947429136e1952d18ff2f8f0d1963252640ae903",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市金牛区城隍庙滴滴自助餐，15元20余道荤素炒菜无限续，米饭热汤畅饮，打工人街边食堂。",
    segments: [
      {
        id: "cd-rourou-didizizhucan",
        name: "滴滴自助餐（城隍庙店）",
        category: "快餐便当 / 市井自助餐",
        summary: "成都金牛区城隍庙街边15元自助餐，20余道荤素现炒热菜无限续添，米饭例汤畅饮，份量扎实充满市井人情味，打工人的宝藏食堂。",
        addressText: "成都市金牛区城隍庙街区",
        start: 0.0,
        end: 271.49,
        posterSecond: 2.0,
        coordinates: [104.076033, 30.671733],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 城隍庙街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市金牛区城隍庙街区滴滴自助餐，吸附于城隍庙街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:城隍庙街",
            name: "城隍庙街",
            nearestNode: 17097,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-fengwei-7561724633356569913",
    author: "锋味",
    title: "#谢霆锋探店 在成都尋找小吃，巴適得板。#心动打卡指南 #寻味烟火气",
    url: "https://www.douyin.com/video/7561724633356569913",
    shareURL: "https://v.douyin.com/3n9JS0qI3-s/",
    platform: "douyin",
    publishedOn: "2025-10-17",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 151.28,
    sourceSHA256: "ededb24052b75606e5aa27ca3c0ef19d4c18d466c1aa90cf66d0fbb2de411cba",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：谢霆锋打卡青羊区泡桐树街王记特色锅魁，以及金丝街眼哥素椒面，亲尝素椒杂酱面与红油抄手。",
    segments: [
      {
        id: "cd-fengwei-wangjiguokui",
        name: "王记特色锅魁（泡桐树街店）",
        category: "锅魁 / 川味小吃",
        summary: "谢霆锋打卡的成都经典现烤牛肉锅魁，老面外皮酥脆掉渣，内馅牛肉麻辣鲜香、麻椒层次浓烈，刚出炉滋滋烫口。",
        addressText: "成都市青羊区泡桐树街（近宽窄巷子）",
        start: 0.0,
        end: 31.0,
        posterSecond: 11.0,
        coordinates: [104.05072, 30.664941],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 宽窄巷子街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区泡桐树街王记特色锅魁，吸附于泡桐树街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:泡桐树街",
            name: "泡桐树街",
            nearestNode: 21193,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-fengwei-yangesujiaomian",
        name: "眼哥素椒面（文殊院店）",
        category: "面馆 / 川味面食",
        summary: "谢霆锋亲测称赞的文殊院老面馆，招牌素椒杂酱面干拌劲道十足，秘制慢炸熟油辣子焦香浓烈，底料肉臊醇厚微辣回甘。",
        addressText: "成都市青羊区金丝街22号（近文殊院）",
        start: 31.0,
        end: 151.28,
        posterSecond: 52.0,
        coordinates: [104.077609, 30.667122],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 金丝街文殊院街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区金丝街22号眼哥素椒面，吸附于金丝街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:金丝街",
            name: "金丝街",
            nearestNode: 17089,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-huganpian-7671860289092325737",
    author: "变成护肝片",
    title: "成都太好吃了！ #成都 #留学生",
    url: "https://www.douyin.com/video/7671860289092325737",
    shareURL: "https://v.douyin.com/VWEjB8kdj7o/",
    platform: "douyin",
    publishedOn: "2026-08-09",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 185.47,
    sourceSHA256: "5c34311e1296ab26e7ee46fc56b3fd7f4a43297529228f42fa819f15f0dcc9eb",
    acquisitionStatus: "local-source",
    evidenceNote: "原片内容：留学生初来成都街头打卡老妈蹄花配梅菜扣肉、红油冒烤鸭配方便面、夜市兔头与烤猪蹄，暂无具体招牌POI门牌，留视频库建档储备不上图造点。",
    segments: [
      {
        id: "cd-huganpian-tihua",
        name: "老妈蹄花配梅菜扣肉",
        category: "蹄花 / 川味小炒",
        summary: "留学生初来成都第一顿打卡老妈蹄花与梅菜扣肉、粉蒸肉，蹄花软糯不油腻、猪油梅菜拌饭极香。",
        addressText: null,
        start: 14.0,
        end: 78.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      },
      {
        id: "cd-huganpian-maokaoya",
        name: "川味红油冒烤鸭",
        category: "冒烤鸭 / 川味冒菜",
        summary: "红油浸透的大碗冒烤鸭搭配方便面、鸭肠、宽粉与冰豆花豆奶，麻辣浓烈汗流浃背。",
        addressText: null,
        start: 85.0,
        end: 146.0,
        posterSecond: 94.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      },
      {
        id: "cd-huganpian-yezi",
        name: "成都夜市小吃与冷吃兔",
        category: "夜市小吃 / 兔头",
        summary: "成都深夜路边摊夜宵，兔头、五香兔腿、烤猪蹄、霉豆腐与爽口冰粉凉虾。",
        addressText: null,
        start: 146.0,
        end: 185.47,
        posterSecond: 155.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danninini-7506781052174634250",
    author: "丹妮妮妮妮",
    title: "跟姐妹的夏日烧烤局！糯鸡爪、耙猪蹄！太棒啦！！",
    url: "https://www.douyin.com/video/7506781052174634250",
    shareURL: "https://v.douyin.com/3Ewdzuv_Z94/",
    platform: "douyin",
    publishedOn: "2025-05-21",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 660.72,
    sourceSHA256: "f847ab1d5f300455595ef928fea8ea05f54b8293b53980e05e21c1c927abb202",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市锦江区中粮鸿云商业街杨老头鲜货烧烤，打卡招牌卤烤软糯猪蹄、糯鸡爪与夏日姐妹烧烤。",
    segments: [
      {
        id: "cd-danninini-yanglaotou-zhongliang",
        name: "杨老头鲜货烧烤（中粮鸿云店）",
        category: "烧烤 / 夜宵烤肉",
        summary: "锦江区中粮鸿云社区的人气现烤烧烤，招牌先卤后烤软糯猪蹄、脱骨糯鸡爪，秘制酱汁刷三遍滋滋冒油，夏日姐妹夜宵聚餐宝地。",
        addressText: "成都市锦江区汇源北路333号中粮鸿云13栋附101",
        start: 0.0,
        end: 660.72,
        posterSecond: 3.0,
        coordinates: [104.111429, 30.644779],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 汇源北路中粮鸿云街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市锦江区汇源北路中粮鸿云杨老头鲜货烧烤，吸附于汇源北路源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:汇源北路",
            name: "汇源北路",
            nearestNode: 30475,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-renyi-7665540510911565099",
    author: "Renyi毅哥",
    title: "果然火爆菜就该火爆师傅来炒！在高温夏夜解锁人生虾蟹套餐",
    url: "https://www.douyin.com/video/7665540510911565099",
    shareURL: "https://v.douyin.com/b_MN6WqsZ9Q/",
    platform: "douyin",
    publishedOn: "2026-07-23",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 165.2,
    sourceSHA256: "925d467b379814414d4cfc3e201e2e3a60951df6aa665b8ea1a396526d1137e4",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市青羊区吉祥街芙蓉爆炒烧烤香辣蟹(2店)，8秒大火爆炒吊龙、拉丝番茄鸡蛋、香辣虾蟹煲。",
    segments: [
      {
        id: "cd-renyi-furongbaochao",
        name: "芙蓉爆炒烧烤香辣蟹（吉祥街店）",
        category: "川味爆炒 / 江湖菜烧烤",
        summary: "青羊区吉祥街大火爆炒夜市老店，8秒猛火爆炒吊龙、拉丝番茄鸡蛋、鲜活香辣蟹虾蟹煲，镬气十足锅气冲天。",
        addressText: "成都市青羊区吉祥街33号（近奎星楼街）",
        start: 0.0,
        end: 165.2,
        posterSecond: 4.0,
        coordinates: [104.066596, 30.668526],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 吉祥街奎星楼街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市青羊区吉祥街芙蓉爆炒烧烤香辣蟹，吸附于吉祥街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:吉祥街",
            name: "吉祥街",
            nearestNode: 16790,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-mizijun-7667472654974176546",
    author: "密子君",
    title: "成都开了几十年的老牌火锅！特色菜品夯爆！",
    url: "https://www.douyin.com/video/7667472654974176546",
    shareURL: "https://v.douyin.com/1EtToX-i75w/",
    platform: "douyin",
    publishedOn: "2026-07-28",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 600.93,
    sourceSHA256: "94489e5f45eb4cecd4387161fdda7641c7953ff32e976f34ef078fc232bf8fc3",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市成华区二仙桥机车厂华丰火锅，几十年老牌重油火锅，鲜牛肉与厚毛肚夯爆。",
    segments: [
      {
        id: "cd-mizijun-huafenghuoguo",
        name: "华丰火锅（二仙桥老店）",
        category: "老火锅 / 社区火锅",
        summary: "成华区机车厂二仙桥老生活区三十年老牌火锅，重牛油浓香老卤锅底，现切鲜牛肉、大片毛肚、千层肚份量夯爆，纯正市井老街烟火味。",
        addressText: "成都市成华区二仙桥东路15号附17号",
        start: 0.0,
        end: 600.93,
        posterSecond: 3.0,
        coordinates: [104.117254, 30.686049],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 二仙桥机车厂街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市成华区二仙桥东路华丰火锅，吸附于二仙桥东路源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:二仙桥东路",
            name: "二仙桥东路",
            nearestNode: 9938,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaojie-7691237866088815759",
    author: "小解",
    title: "成都神级烧烤！我们最爱之一！烤猪蹄绝！ 大油边也很好吃😋",
    url: "https://www.douyin.com/video/7691237866088815759",
    shareURL: "https://v.douyin.com/iZBrPNULxTA/",
    platform: "douyin",
    publishedOn: "2026-09-30",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 153.43,
    sourceSHA256: "3fab69ceb98d6505d8b97332786647fef241ecd58d38b812cea923070473b8d2",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市武侯区科华中路泛悦国际商业广场烤江湖，招牌神级烤猪蹄、大油边与江湖烤肉。",
    segments: [
      {
        id: "cd-xiaojie-kaojianghu",
        name: "烤江湖（泛悦国际店）",
        category: "江湖烧烤 / 夜宵大排档",
        summary: "科华中路泛悦国际商圈神级夜宵烧烤，招牌炭火烤猪蹄外焦里嫩胶质丰厚，焦香大油边肉汁爆口，川式香料浓郁下酒。",
        addressText: "成都市武侯区科华中路9号泛悦国际商业广场1号楼",
        start: 0.0,
        end: 153.43,
        posterSecond: 2.0,
        coordinates: [104.075298, 30.619167],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 科华中路泛悦国际商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市武侯区科华中路泛悦国际烤江湖，吸附于科华中路源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:科华中路",
            name: "科华中路",
            nearestNode: 39927,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-aji-7577624241508551942",
    author: "阿鸡",
    title: "本地人才去的苍蝇馆子没点绝活是活不下去的！",
    url: "https://www.douyin.com/video/7577624241508551942",
    shareURL: "https://v.douyin.com/xtqWdRO-WbM/",
    platform: "douyin",
    publishedOn: "2025-11-28",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 192.93,
    sourceSHA256: "1ea351eaec5e429a2a383e2af3826a73e315e218b4c0b4b8d4e08766b0aea769",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：阿鸡连吃四家成都绝活老店，左撇子私房面（莲桂东路）、毛记和意冒菜（解放西街）、小妹滋补蹄花（理工大学）、永乐饭店（肖家河中街）。",
    segments: [
      {
        id: "cd-aji-zuopiezimian",
        name: "左撇子私房面（莲桂东路店）",
        category: "私房面馆 / 炸酱面",
        summary: "锦江区莲花老小区绝活面馆，几十年只卖一种粗棍干拌杂酱面，青豇豆与花椒浓香肉臊和匀回甜，只营业到下午两点老板准时去打麻将。",
        addressText: "成都市锦江区莲桂东路（四川师大附中正对面老院子）",
        start: 13.0,
        end: 39.0,
        posterSecond: 21.0,
        coordinates: [104.095959, 30.639607],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 莲桂东路川师附中街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市锦江区莲桂东路左撇子私房面，吸附于莲桂东路源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:莲桂东路",
            name: "莲桂东路",
            nearestNode: 30258,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-aji-maojiheyi",
        placeId: "cd-rourou-maojiheyi",
        name: "毛记和意冒菜（解放西街店）",
        category: "冒菜 / 川味小吃",
        summary: "阿鸡推荐的成都最老派豆豉冒菜，牛肉厚切大片入味极深，豆豉香气醇厚下饭神物，同店三博主合力认证。",
        addressText: "成都市金牛区解放西街9号1楼附2号",
        start: 39.0,
        end: 92.0,
        posterSecond: 57.0,
        coordinates: [104.081, 30.6905],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 解放西街街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "原片POI明确为毛记和意(解放西街店)，地址解放西街9号附2号，锚定解放西街中心路段",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:解放西街",
            name: "解放西街",
            nearestNode: 9480,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-aji-xiaomeitihua",
        placeId: "cd-xiaojunmao-xiaomeitihua",
        name: "小妹滋补蹄花（理工大学总店）",
        category: "蹄花 / 夜宵炖品",
        summary: "阿鸡打卡理工大学必吃榜蹄花，双皮奶般滑糯口感连骨抽离，雪豆海带慢炖鲜美，豆瓣原汤两相宜。",
        addressText: "成都市成华区十里店街103号（成都理工大学旁）",
        start: 92.0,
        end: 137.0,
        posterSecond: 101.0,
        coordinates: [104.1458, 30.6738],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 理工大学十里店街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "原片门头为十里店街小妹滋补蹄花，吸附十里店街与崔家店路交会处",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:十里店路",
            name: "十里店路",
            nearestNode: 15306,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-aji-yongle",
        name: "永乐饭店（肖家河中街店）",
        category: "老字号川菜 / 米其林指南",
        summary: "武侯区肖家河老街连年入选米其林指南与必吃榜的市井川菜传奇，红油香浓紧实凉拌鸡片、脆嫩镬气肝腰合炒、软烂咸香糯米排骨。",
        addressText: "成都市武侯区肖家河中街36号",
        start: 137.0,
        end: 192.93,
        posterSecond: 150.0,
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
    id: "cd-wangxun-7509334944506793225",
    author: "演员王迅",
    title: "成都烧烤 先卤后烤，软糯入味！秘制酱料刷三遍，滋滋冒油香上天！",
    url: "https://www.douyin.com/video/7509334944506793225",
    shareURL: "https://v.douyin.com/O-6OCE2bjTg/",
    platform: "douyin",
    publishedOn: "2025-05-28",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 393.21,
    sourceSHA256: "6e23971b730b17d2f9369d5ebcbcdf2f3188bfcf1c2c455172f42dc733ae2e93",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市成华区玉双路杨老头鲜货烧烤，王迅力荐先卤后烤软糯入味猪蹄与鸡爪。",
    segments: [
      {
        id: "cd-wangxun-yanglaotou-yushuang",
        name: "杨老头鲜货烧烤（玉双路店）",
        category: "烧烤 / 卤烤猪蹄",
        summary: "演员王迅回成都力荐的玉双路宝藏烧烤，招牌先卤后烤软烂脱骨猪蹄、软糯鸡爪，秘制老卤配特制烧烤酱刷三遍，焦香四溢胶原蛋白满满。",
        addressText: "成都市成华区玉双路5号附1-2号（近望平街）",
        start: 0.0,
        end: 393.21,
        posterSecond: 3.0,
        coordinates: [104.088813, 30.661035],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 玉双路望平街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市成华区玉双路杨老头鲜货烧烤，吸附于玉双路源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:玉双路",
            name: "玉双路",
            nearestNode: 22979,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xixichibupang-7700226535367149923",
    author: "希希吃不胖",
    title: "成都极品油泼烤牛排！ #成都美食 #牛排 #烧烤",
    url: "https://www.douyin.com/video/7700226535367149923",
    shareURL: "https://v.douyin.com/yNBg7530onI/",
    platform: "douyin",
    publishedOn: "2026-10-25",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 21.7,
    sourceSHA256: "e4c6695d7adb1e7de6f0323b3d9c1a037c7783eef1554979926c039d86c2451e",
    acquisitionStatus: "local-source",
    evidenceNote: "原片内容：21秒极品油泼烤牛排短视频，暂无门头招牌与POI地址，留视频库建档储备不上图造点。",
    segments: [
      {
        id: "cd-xixichibupang-youponiupai",
        name: "成都油泼极品烤牛排",
        category: "创意烧烤 / 烤肉",
        summary: "成都夜市创意爆款，炭火厚切烤牛排铺满辣椒蒜末，滚烫热油当场浇泼，滋滋声中香辣扑鼻肉嫩多汁。",
        addressText: null,
        start: 0.0,
        end: 21.7,
        posterSecond: 3.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danninini-7672958672024112424",
    author: "丹妮妮妮妮",
    title: "橡树皮还能吃？ 逛完街意外发现一家社区老火锅，解锁冷门食材新吃法！",
    url: "https://www.douyin.com/video/7672958672024112424",
    shareURL: "https://v.douyin.com/NymZleQssAM/",
    platform: "douyin",
    publishedOn: "2026-08-12",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 578.74,
    sourceSHA256: "8197c56745887e7ab97d7188050e805d7e182067e2595b0b1f420633ebb8cc50",
    acquisitionStatus: "local-source",
    evidenceNote: "原片门头与POI核定：成都市锦江区通盈街五井合火锅店，社区老火锅，解锁大巴山橡树皮爽脆新吃法与现切毛肚嫩肉片。",
    segments: [
      {
        id: "cd-danninini-wujinghe",
        name: "五井合火锅店（通盈街店）",
        category: "社区老火锅 / 川味火锅",
        summary: "锦江区万科社区口碑老火锅，浓郁牛油手工锅底，特色解锁大巴山橡树皮爽脆回甘独特新吃法，手撕毛肚与嫩肉片口感过瘾。",
        addressText: "成都市锦江区通盈街210号（万科城市花园）",
        start: 0.0,
        end: 578.74,
        posterSecond: 3.0,
        coordinates: [104.109017, 30.645266],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 通盈街万科街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市锦江区通盈街五井合火锅店，吸附于通盈街源道路节点",
          reviewedOn: "2026-11-07",
          anchor: {
            kind: "osm-way",
            id: "road:通盈街",
            name: "通盈街",
            nearestNode: 30536,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-renyi-7702676924241366326",
    author: "Renyi毅哥",
    title: "被山城夜摊的爆辣宵夜狠狠拿捏！超大田螺辣炖满肉筒骨，拌上爽弹牛筋面",
    url: "https://www.douyin.com/video/7702676924241366326",
    shareURL: "https://v.douyin.com/K6k6ECK9t28/",
    platform: "douyin",
    publishedOn: "2026-10-31",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 237.1,
    sourceSHA256: "995f8fa966088553a3c0f6c7f747f078e2de0d48920958a16d6314d8596efe3b",
    acquisitionStatus: "local-source",
    evidenceNote: "原片内容：成都深夜街头山城爆辣宵夜鬼饮食，超大田螺辣炖满肉筒子骨与牛筋面，无具体门店招牌POI门牌，留视频库建档储备不上图造点。",
    segments: [
      {
        id: "cd-renyi-tianluotonggu",
        name: "山城风味辣炖田螺棒子骨",
        category: "鬼饮食 / 夜市大排档",
        summary: "成都深夜路边摊山城爆辣宵夜，超大鲜活田螺加小米辣慢火煨炖满肉棒子骨，浓汁拌入劲道牛筋面与豌豆尖，川渝夜市绝绝子。",
        addressText: null,
        start: 0.0,
        end: 237.1,
        posterSecond: 12.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  }
];

// Merge
const fullLibrary = {
  ...existingLibrary,
  sources: [...existingLibrary.sources, ...batch2Sources]
};

// Validate
console.log("Validating updated library...");
validateVideoLibrary(fullLibrary, 'chengdu');
console.log(`Validation PASSED! Total sources: ${fullLibrary.sources.length}, total segments: ${fullLibrary.sources.reduce((sum, s) => sum + s.segments.length, 0)}`);

// Save updated video-library.json
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), JSON.stringify(fullLibrary, null, 2) + '\n', 'utf8');
console.log("Saved updated map-base/data/cities/chengdu/video-library.json");

// Process video clips and posters for batch 2
const reportPath = path.join(root, '.local/video-clips/report.json');
let report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log("\nStarting transcoding and poster extraction for batch 2 segments...");

for (const source of batch2Sources) {
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

    // Transcode clip: faststart, libx264, aac
    const clipArgs = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', String(segment.start),
      '-i', input,
      '-t', String(segment.end - segment.start),
      '-map', '0:v:0', '-map', '0:a:0',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
      '-threads', '4',
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

console.log("\nAll batch 2 video processing completed successfully!");
