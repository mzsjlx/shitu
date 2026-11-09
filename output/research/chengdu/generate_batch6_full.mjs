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

const batch6Sources = [
  {
    id: "cd-wangxun-7646269570142981417",
    author: "演员王迅",
    title: "牛肉面来喽 面脑袋又上线！成都面馆👍#忙忙碌碌迅宝藏 #成都面馆 #遇见城市 #心动打卡指南 #成都牛肉面",
    url: "https://www.douyin.com/video/7646269570142981417",
    shareURL: "https://v.douyin.com/N5hPdi-OZ0Y/",
    platform: "douyin",
    publishedOn: "2026-06-01",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 255.44,
    sourceSHA256: "fcd0f5e69356b8296370bc2da427843dd8df4b5c91030df1b1d6387981998809",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：演员王迅打卡武侯区科华北路樊记干捞牛肉面，实尝大块牛肉干捞面与原汤牛肉粉，面条爽滑劲道、牛肉卤香扑鼻。",
    segments: [
      {
        id: "cd-wangxun-fanjiganlaoniuroumian",
        name: "樊记干捞牛肉面（科华店）",
        category: "特色面馆 / 川味面食",
        summary: "演员王迅极力推荐的成都老牌牛肉面馆，招牌干捞牛肉面大颗牛肉厚实软烂，秘制红油酱汁裹满劲道碱水面，原汤牛肉浓郁醇香，碳水星人必吃名品。",
        addressText: "成都市武侯区科华北路60号",
        start: 0.0,
        end: 255.44,
        posterSecond: 25.0,
        coordinates: [104.072721, 30.627824],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 科华北路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市武侯区科华北路60号，吸附科华北路源道路节点（距离26.1米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:锦绣路",
            name: "锦绣路",
            nearestNode: 36038,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danniushi-7644571662289046818",
    author: "丹牛食",
    title: "我吃遍了四川成都最經典的街頭小吃，第九家太饞人了！ #肥肠面",
    url: "https://www.douyin.com/video/7644571662289046818",
    shareURL: "https://v.douyin.com/-0hfL6zWl78/",
    platform: "douyin",
    publishedOn: "2026-05-30",
    publishedOnNote: "2026年街头探店特辑",
    durationSeconds: 1198.8,
    sourceSHA256: "df6bc4a0f92aa8475a0962859346cb5bf1a5a648f76f17b46945f61cf36d3dc7",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：博主丹牛食全景走访成都经典街头小吃9大老店，包含双桥美味肥肠粉、双哨面、铁门杂酱面、竹篓香冒菜、水津豆汤、贺记蛋烘糕、钟水饺、美蹄花及糖油果子。",
    segments: [
      {
        id: "cd-danniushi-shuangqiaofeichangfen",
        name: "双桥美味肥肠粉（双桥路店）",
        category: "市井老字号 / 肥肠粉",
        summary: "丹牛食探访的第一家地道街头老店，手打红薯粉鲜滑弹牙，卤香肥肠软糯多汁，红油高汤酸辣过瘾，搭配刚出炉的焦香烤卤锅盔，开启老成都早餐仪式。",
        addressText: "成都市成华区双桥路南四街",
        start: 20.0,
        end: 140.0,
        posterSecond: 30.0,
        coordinates: [104.1042, 30.6508],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 双桥路社区街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "双桥路社区南四街老店，吸附双桥路南四街真实道路节点（距离21.2米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:双桥路南四街",
            name: "双桥路南四街",
            nearestNode: 27301,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-shuangsaomian",
        name: "特色双哨面（水碾河店）",
        category: "特色面馆 / 川味面食",
        summary: "水碾河片区老牌特色面馆，将浓香肉末臊子与酥脆油炸脆臊双重搭配，红油花椒麻辣调味，根根面条挂满双臊油亮焦香。",
        addressText: "成都市成华区水碾河路经华北路口",
        start: 145.0,
        end: 280.0,
        posterSecond: 160.0,
        coordinates: [104.1022, 30.6482],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 水碾河街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "水碾河经华北路交口附近，吸附蜀都大道水碾河路道路节点（距离39.5米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:蜀都大道水碾河路",
            name: "蜀都大道水碾河路",
            nearestNode: 27182,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-tiemen",
        placeId: "cd-yizhihedapang-tiemen",
        name: "铁门杂酱面（牛市口店）",
        category: "面馆 / 川味小吃",
        summary: "丹牛食亲探牛市口非遗铁门杂酱面，大火煨煮浓郁杂酱浇头，肉粒颗颗分明，裹着热气腾腾的干拌筋道手工面，老成都三十年如一日的踏实味道。",
        addressText: "成都市锦江区牛市口路22号附1号",
        start: 285.0,
        end: 390.0,
        posterSecond: 305.0,
        coordinates: [104.103, 30.641],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 牛市口街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "与一只和大胖同店归并，吸附牛市口路源道路节点（距离11.4米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:牛市口路",
            name: "牛市口路",
            nearestNode: 30415,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-zhulouxiangmaocai",
        name: "竹篓香冒菜（春熙商圈店）",
        category: "市井冒菜 / 川味快餐",
        summary: "春熙路商圈深受食客追捧的市井老竹篓冒菜，秘制牛油老汤用竹篓现烫牛肉、千层肚、黄喉与脆藕，淋上香辣红油与蒜泥香菜，下饭一绝。",
        addressText: "成都市锦江区红星路三段步行街旁巷弄",
        start: 395.0,
        end: 495.0,
        posterSecond: 410.0,
        coordinates: [104.0792, 30.6545],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路商圈",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "红星路三段商圈巷弄老店，吸附步行街源道路节点（距离35.2米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:红星路三段",
            name: "红星路三段",
            nearestNode: 26648,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-shuijindoutang",
        name: "水津豆汤（水井坊店）",
        category: "老成都豆汤饭 / 市井苍蝇馆",
        summary: "水井坊水津街三十年老店，豌豆久煨熬至沙绵软烂、汤色金黄油润，舀入白米饭配上招牌现拌心片、肥肠与蒜泥白肉，暖胃又过瘾。",
        addressText: "成都市锦江区水津街1号附6号",
        start: 500.0,
        end: 605.0,
        posterSecond: 520.0,
        coordinates: [104.0886, 30.6465],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 水井坊水津街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "水津街老店，吸附水津街源道路节点（距离15.3米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:水津街",
            name: "水津街",
            nearestNode: 30217,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-heji",
        placeId: "cd-yizhihedapang-heji",
        name: "贺记蛋烘糕（文庙西街总店）",
        category: "川味小吃 / 蛋烘糕",
        summary: "文庙西街传奇非遗小吃，铜锅慢火现烤外脆内绵蛋烘糕，肉松大头菜、老干妈芝麻白糖、奶油肉松甜咸兼备，老成都人童年不可复制的味道。",
        addressText: "成都市青羊区文庙西街1号附8号",
        start: 609.5,
        end: 810.0,
        posterSecond: 630.0,
        coordinates: [104.054, 30.651],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 文庙西街街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "与一只和大胖同店归并，吸附文庙西街源道路节点（距离14.3米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:文庙西街",
            name: "文庙西街",
            nearestNode: 25777,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-zhongshuijiao",
        name: "钟水饺（祠堂街总店）",
        category: "中华老字号 / 传统名小吃",
        summary: "人民公园祠堂街中华老字号钟水饺，纯猪肉馅小巧紧实，淋上特制复制红酱油与芝麻红油，微甜鲜辣复合回味，成都小吃名片之一。",
        addressText: "成都市青羊区祠堂街人民公园东门",
        start: 813.5,
        end: 998.0,
        posterSecond: 830.0,
        coordinates: [104.0592, 30.6568],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 祠堂街人民公园商圈",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "祠堂街人民公园东门老店，吸附祠堂街源道路节点（距离53.6米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:祠堂街",
            name: "祠堂街",
            nearestNode: 25642,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-meitihua",
        name: "美蹄花（水碾河路店）",
        category: "老牌夜蹄花 / 川味蹄花",
        summary: "水碾河老牌夜蹄花名馆，雪豆清炖大猪蹄煨至汤汁奶白黏嘴、蹄肉粑软入口即化，搭配红油鲜辣双碟蘸水，解腻下饭过夜宵。",
        addressText: "成都市成华区水碾河路一心桥街坊",
        start: 1002.0,
        end: 1095.0,
        posterSecond: 1020.0,
        coordinates: [104.0988, 30.6492],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 水碾河路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "水碾河一心桥街坊老店，吸附水碾河路源道路节点（距离140.6米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:水碾河路",
            name: "水碾河路",
            nearestNode: 27196,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-tangyouguozi",
        name: "老成都名小吃糖油果子（奎星楼街店）",
        category: "非遗民俗小吃 / 传统甜点",
        summary: "奎星楼街经典街头糖油果子，糯米团炸至金黄中空鼓胀，裹满焦香红糖与白芝麻，一串四五个外酥里糯、甜而不腻。",
        addressText: "成都市青羊区奎星楼街实业街交口",
        start: 1099.0,
        end: 1198.8,
        posterSecond: 1115.0,
        coordinates: [104.0515, 30.6685],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 奎星楼街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "奎星楼街街头摊位，吸附奎星楼街/实业街源道路节点（距离17.7米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:实业街",
            name: "实业街",
            nearestNode: 16387,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-mizijun-7673762441674755391",
    author: "密子君",
    title: "成都烧烤隐藏款！彩色冰沙啤酒 尿罐虾 海肠捞饭！#用一杯彩色漂亮水告别三伏天#过暑假#开启地球夏日online#心动打卡指南",
    url: "https://www.douyin.com/video/7673762441674755391",
    shareURL: "https://v.douyin.com/MhbbOmre_ws/",
    platform: "douyin",
    publishedOn: "2026-08-14",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 570.75,
    sourceSHA256: "0e3fda02ef7d915ff7ea827b50a7591fc66849ac879c189dcc681cdfdc4c1de0",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为杨老头鲜货烧烤(太古里店)，密子君二度探店打卡夏日隐藏菜单：彩色冰沙啤酒、尿罐虾、海肠捞饭及鲜烤五花肉串。",
    segments: [
      {
        id: "cd-mizijun-yanglaotou-taikooli-2",
        placeId: "cd-mizijun-yanglaotou-taikooli",
        name: "杨老头鲜货烧烤（太古里店）",
        category: "烧烤 / 江湖菜",
        summary: "密子君再度探访太古里杨老头鲜货烧烤，解锁夏日隐藏款彩色冰沙啤酒、鲜烤尿罐虾、浓郁海肠捞饭与烤脑花，市井氛围拉满。",
        addressText: "成都市锦江区中纱帽街8号成都远洋太古里28栋L2层2307B",
        start: 0.0,
        end: 570.75,
        posterSecond: 20.0,
        coordinates: [104.0818, 30.6552],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路太古里商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "远洋太古里核心商圈，与既有片段同店归并，吸附中纱帽街源道路节点（距离10.8米）",
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
    id: "cd-danninini-7660789316540550446",
    author: "丹妮妮妮妮",
    title: "粉丝推荐N次的社区火锅，必须翻牌！ 发现炒饭的冷门吃法！香得我选择困难症都犯了~#好好吃饭 #成都美食 #火锅 #妈呀太香了 #美食分享",
    url: "https://www.douyin.com/video/7660789316540550446",
    shareURL: "https://v.douyin.com/fwejLaH1wYQ/",
    platform: "douyin",
    publishedOn: "2026-07-10",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 775.92,
    sourceSHA256: "ccf6e8bed39a2d24c0a2fc15a4baeb8f7a5b30aac8b9d3b09e663fc5a23aac40",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为富贵原味火锅，位于金牛区蜀通街社区，老成都醇厚牛油老火锅配蛋炒饭与鲜鸭肠。",
    segments: [
      {
        id: "cd-danninini-fuguihuoguo",
        name: "富贵原味火锅（蜀通街店）",
        category: "社区老火锅 / 川味火锅",
        summary: "丹妮妮妮妮翻牌金牛区粉丝私藏社区火锅，老成都醇厚牛油锅底慢煮千层肚、屠场鲜毛肚与大片鲜牛肉，搭配独门冷门吃法干煸炒饭，麻辣喷香让人欲罢不能。",
        addressText: "成都市金牛区蜀通街",
        start: 0.0,
        end: 775.92,
        posterSecond: 25.0,
        coordinates: [104.025981, 30.686437],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 蜀通街社区街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "金牛区蜀通街社区名店，吸附蜀汉路源道路节点（距离73.4米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:蜀汉路",
            name: "蜀汉路",
            nearestNode: 8477,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wangxun-7610270923085729070",
    author: "演员王迅",
    title: "三孃这面做的有点子东西，一不小心就吃多了，又是碳水超标的一天。#忙忙碌碌迅宝藏 #心动打卡指南 #遇见城市 #成都美食 #抖音新春吃喝玩乐节",
    url: "https://www.douyin.com/video/7610270923085729070",
    shareURL: "https://v.douyin.com/QJXttJ1ogJo/",
    platform: "douyin",
    publishedOn: "2026-02-24",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 299.14,
    sourceSHA256: "8dfe74656513c1dc3ee23e1ac826376dd2f21f73479f138d35660ac18c3ea5e1",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为三妹小吃(馨兰苑店)，王迅探访郭家桥社区老面馆，实吃特色臊子干拌面与红油蹄花汤。",
    segments: [
      {
        id: "cd-wangxun-sanmeixiaochi",
        name: "三妹小吃（馨兰苑店）",
        category: "社区苍蝇馆 / 特色面食",
        summary: "演员王迅实地力荐的川大周边老牌苍蝇馆子，三孃亲自掌勺，招牌臊子杂酱干拌面红油香辣、麻而不苦，配上一碗清亮温润的蹄花汤，市井烟火气息十足。",
        addressText: "成都市武侯区郭家桥北街5号馨兰苑旁",
        start: 0.0,
        end: 299.14,
        posterSecond: 18.0,
        coordinates: [104.070316, 30.625741],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 郭家桥北街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "郭家桥北街馨兰苑，吸附棕南西街源道路节点（距离71.8米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:棕南西街",
            name: "棕南西街",
            nearestNode: 36125,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danninini-7627052493003853056",
    author: "丹妮妮妮妮",
    title: "特辣江湖菜跟烧烤都快吃完了才发现， 这家油焖小龙虾竟如此惊艳！#寻味烟火气 #省饭课代表 #来成都你就吃吧 #成都美食图鉴 #烧烤大排档",
    url: "https://www.douyin.com/video/7627052493003853056",
    shareURL: "https://v.douyin.com/uiojTW6MdLQ/",
    platform: "douyin",
    publishedOn: "2026-04-10",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 786.18,
    sourceSHA256: "98cae43454b85e0148918299339e8d75088903ccbc3e9ee4225bd84be941797a",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为上亿海鲜烧烤自贡江湖菜，位于成华区双福二路，实吃鲜活爆炒海鲜、自贡仔姜跳水蛙、油焖小龙虾与生炭烧烤。",
    segments: [
      {
        id: "cd-danninini-shangyijianghucai",
        name: "上亿海鲜烧烤自贡江湖菜（双福二路店）",
        category: "自贡江湖菜 / 海鲜烧烤",
        summary: "丹妮妮妮妮夜探成华区双福二路火爆大排档，重度自贡仔姜小米辣热油爆炒、鲜捞跳水蛙滑嫩爆辣，油焖小龙虾浸满酱汁，纯炭火现烤肉串下酒极其过瘾。",
        addressText: "成都市成华区双福二路",
        start: 0.0,
        end: 786.18,
        posterSecond: 30.0,
        coordinates: [104.109414, 30.659755],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 双福二路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "双福二路大排档街区，吸附源道路节点（距离34.9米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:双福二路",
            name: "双福二路",
            nearestNode: 23470,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-huoguocheshou-7652876209759522086",
    author: "火锅车手",
    title: "好久没有吃到怎么安逸的蹄花了 这熟悉的感觉 这酣畅淋漓的吃相 太哇塞了#人间烟火 #火锅车手",
    url: "https://www.douyin.com/video/7652876209759522086",
    shareURL: "https://v.douyin.com/jvWtRVSZF-A/",
    platform: "douyin",
    publishedOn: "2026-06-19",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 438.51,
    sourceSHA256: "ce6096267a180ee1657f554ec3ada2f6526e60fecfb6ec677bc70b436930a721",
    acquisitionStatus: "local-source",
    evidenceNote: "原片口述与镜头：成都老街坊无名巷子蹄花摊，大铁锅慢火炖至皮糯肉香脱骨，配秘制鲜椒蘸水与干拌抄手，具体门牌待进一步确证。",
    segments: [
      {
        id: "cd-huoguocheshou-wumingtihua",
        name: "成都街边老巷蹄花摊",
        category: "市井蹄花 / 街头小吃",
        summary: "火锅车手实地酣畅打卡的成都街边巷子老牌蹄花，猪蹄慢火久煨至软烂黏唇、肉质细腻入味，红油鲜椒蘸料香浓扑鼻，搭配大颗干拌抄手，老成都深宵滋味。",
        addressText: "成都市老巷深处（门牌街区待进一步确证）",
        start: 0.0,
        end: 438.51,
        posterSecond: 15.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-zhouboling-7645133105279388938",
    author: "周柏伶",
    title: "挑战成都四大天王之一的街边冒菜❗红油爆汁！狂炫两盆饭！ #成都 #冒菜 #妈呀太香了 #美食 #抖音美食推荐官",
    url: "https://www.douyin.com/video/7645133105279388938",
    shareURL: "https://v.douyin.com/gtVVXgfA2Mo/",
    platform: "douyin",
    publishedOn: "2026-05-29",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 214.51,
    sourceSHA256: "8d4a5fc99095cc229f1bf6436307925d58f7a1974088ba077d3c248b0adbbd37",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：周柏伶打卡解放西街老成都冒菜四大天王之毛记和意冒菜，红油爆汁现冒千层肚与牛肉，与肉肉大搜索、小俊毛、阿鸡同店四博主合流归并。",
    segments: [
      {
        id: "cd-zhouboling-maojiheyi",
        placeId: "cd-rourou-maojiheyi",
        name: "毛记和意冒菜（解放西街店）",
        category: "冒菜 / 川味小吃",
        summary: "周柏伶深度打卡成都冒菜界天花板名店，红油重辣香辛底汤冒煮厚切牛肉、爽脆千层肚、吸饱汤汁的鲜藕与豆皮，红油爆汁淋饭狂炫两整盆。",
        addressText: "成都市金牛区解放西街2号附3号",
        start: 0.0,
        end: 214.51,
        posterSecond: 20.0,
        coordinates: [104.081, 30.6905],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 解放西街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "解放西街老店，与既有三位博主同点合流，吸附解放西街真实道路节点",
          reviewedOn: "2026-11-09",
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
      }
    ]
  },
  {
    id: "cd-renyi-7606583802420317455",
    author: "Renyi毅哥",
    title: "收藏好，它能让你在成都3天胖5斤。#美食分享 #这一口好过瘾 #地方特色美食 #美食攻略 #成都住宿券",
    url: "https://www.douyin.com/video/7606583802420317455",
    shareURL: "https://v.douyin.com/ZRlMb6QDfN8/",
    platform: "douyin",
    publishedOn: "2026-02-14",
    publishedOnNote: "2026年探店攻略",
    durationSeconds: 134.28,
    sourceSHA256: "639d8ca84e46d5c239f19805da3bc8bd4e5941e4fc1dbcb502e4c8d0c0a3fd00",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：毅哥7年探店老饕精选川西老店攻略，第八家重磅推荐成都市区武侯区燃灯寺东街张记好实惠冒菜，豆豉秘汁浓郁醇厚；其余周边及外围县区老店如实标注。",
    segments: [
      {
        id: "cd-renyi-haoshihuimaocai",
        placeId: "cd-xiaozhen-haoshihuimaocai",
        name: "张记好实惠冒菜（燃灯寺东街店）",
        category: "市井高性价比冒菜 / 社区苍蝇馆",
        summary: "毅哥强力背书的成都市井冒菜典范，老成都社区苍蝇馆子，凭借浓郁豆豉红油老汤底与分量厚道的现冒牛肉、千层肚深受老街坊青睐，人均三十元吃撑。",
        addressText: "成都市武侯区燃灯寺东街14号",
        start: 112.0,
        end: 134.28,
        posterSecond: 115.0,
        coordinates: [104.0384, 30.6455],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 燃灯寺东街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成都市武侯区燃灯寺东街14号，与小珍来咯同店合流，吸附燃灯寺东街源道路节点（距离39.3米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:一环路西一段",
            name: "一环路西一段",
            nearestNode: 28585,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-yituoxiaocaomei-7662716234656230746",
    author: "一坨小草莓",
    title: "出了国才发现川菜和烧烤在海外是多么牛的存在#成都美食#成都烧烤#成都旅游#烤江湖 #成都",
    url: "https://www.douyin.com/video/7662716234656230746",
    shareURL: "https://v.douyin.com/oiICn0P38vY/",
    platform: "douyin",
    publishedOn: "2026-07-15",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 122.17,
    sourceSHA256: "9d808789fb8966d8aca001944f296cd4f0102e4262f4265d31552ca3b191c994",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为烤江湖(泛悦国际店)，位于武侯区长荣路56号泛悦国际，炭烤鲜五花、烤腰片、烤包浆豆腐与秘制干碟，与小解同店合流。",
    segments: [
      {
        id: "cd-yituoxiaocaomei-kaojianghu",
        placeId: "cd-xiaojie-kaojianghu",
        name: "烤江湖（泛悦国际店）",
        category: "江湖烧烤 / 夜宵大排档",
        summary: "一坨小草莓探店力荐的武侯区品质烧烤，鲜切大把炭火烤肉串、软糯入味烤猪蹄、焦香脆皮烤鸡爪与爆汁包浆豆腐，川味烧烤地道名店。",
        addressText: "成都市武侯区长荣路56号泛悦国际商业广场2号楼1层",
        start: 0.0,
        end: 122.17,
        posterSecond: 15.0,
        coordinates: [104.075298, 30.619167],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 泛悦国际商圈",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "泛悦国际核心商圈，与小解同店归并，吸附科华中路源道路节点（距离22.4米）",
          reviewedOn: "2026-11-09",
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
    id: "cd-renyi-7327176467857558838",
    author: "Renyi毅哥",
    title: "偶遇街头稀有炭火烧烤，再来一份小料超多的生炒铁板烧，这顿宵夜也太解压了#美食分享 #烧烤#抖音商城好物年货节",
    url: "https://www.douyin.com/video/7327176467857558838",
    shareURL: "https://v.douyin.com/-DsNmLHsRbs/",
    platform: "douyin",
    publishedOn: "2024-01-24",
    publishedOnNote: "2024年市井探店",
    durationSeconds: 172.83,
    sourceSHA256: "1a1fcdd14cccd0f448099992533d97926b8d53dfc704de44874186047b226039",
    acquisitionStatus: "local-source",
    evidenceNote: "原片镜头与口述：成都街头流动无名老式炭火烧烤生炒铁板烧摊，大排鲜肉炭香弥漫，流动摊位无固定门牌，保留视频库记录。",
    segments: [
      {
        id: "cd-renyi-jiebianbbq",
        name: "成都街头老式炭火烧烤铁板烧摊",
        category: "街头烧烤摊 / 流动宵夜",
        summary: "毅哥街头偶遇的老成都无名炭火烧烤与生炒铁板烧，鲜肉大排、整只鸡腿在火红炭火上滋滋冒油，烟熏香气扑鼻，小料葱花厚实诱人。",
        addressText: "成都市街巷流动摊位（无固定门牌）",
        start: 0.0,
        end: 172.83,
        posterSecond: 25.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danninini-7653369569842695430",
    author: "丹妮妮妮妮",
    title: "震惊从头到尾的烧烤店！光鱼片就玩出6种口味！活该生意好！ #这个夏天没有天花板 #成都烧烤 #好好吃饭 #心动打卡指南 #成都美食",
    url: "https://www.douyin.com/video/7653369569842695430",
    shareURL: "https://v.douyin.com/-w8aExCMhvQ/",
    platform: "douyin",
    publishedOn: "2026-06-20",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 775.73,
    sourceSHA256: "530f28b5e814dd4d7261b54b4eaf72dbc2142366d2c9aa74debdab7813ec0b3c",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为阿城烤鱼片|纯碳烧烤·暖冬免费羊汤(牛市口店)，位于锦江区牛市口莲花南路四段，纯炭慢烤多味鲜鱼片与烧烤肉串。",
    segments: [
      {
        id: "cd-danninini-achengkaoyupian",
        name: "阿城烤鱼片（牛市口店）",
        category: "特色烤鱼片 / 纯炭火烧烤",
        summary: "丹妮妮妮妮深度打卡的牛市口超高人气烧烤店，独家将新鲜鱼片玩出6种口味（鲜椒、泡椒、蒜香、麻辣等），鱼肉嫩滑焦香无刺，纯炭火烤肉串与鲜美羊汤搭配恰到好处。",
        addressText: "成都市锦江区牛市口莲花南路四段",
        start: 0.0,
        end: 775.73,
        posterSecond: 35.0,
        coordinates: [104.104659, 30.642232],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 牛市口莲花南路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "牛市口莲花南路老街区，吸附二环路东四段源道路节点（距离40.2米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:二环路东四段",
            name: "二环路东四段",
            nearestNode: 30325,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-jigelebuqide-7499355273165851923",
    author: "鸡哥了不得",
    title: "这个天气来到室外 整一顿全是肉嘎嘎的烧烤 也太得劲了！ #抖音五一吃喝玩乐节 #开启五一美食主线任务 #美食分享 #成都烧烤有多美味",
    url: "https://www.douyin.com/video/7499355273165851923",
    shareURL: "https://v.douyin.com/ksh9lMTf0Y4/",
    platform: "douyin",
    publishedOn: "2025-05-01",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 284.47,
    sourceSHA256: "86a04af8ea94a985be015ad4ebaddf68bba98e994f5cbe107ff52c5af0b0d16c",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为杨老头鲜货烧烤(玉双路店)，位于成华区玉双路，露天室外大桌烤肉、生烤牛肉与烤脑花，与演员王迅同店合流。",
    segments: [
      {
        id: "cd-jigelebuqide-yanglaotou-yushuang",
        placeId: "cd-wangxun-yanglaotou-yushuang",
        name: "杨老头鲜货烧烤（玉双路店）",
        category: "烧烤 / 卤烤猪蹄",
        summary: "鸡哥了不得五一打卡成华区玉双路杨老头老店，全场肉嘎嘎大快朵颐，鲜切牛肉串鲜嫩爆汁、炭烤五花肉焦香扑鼻，夏夜室外摆摊烟火气十足。",
        addressText: "成都市成华区玉双路",
        start: 0.0,
        end: 284.47,
        posterSecond: 20.0,
        coordinates: [104.088813, 30.661035],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 玉双路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "成华区玉双路老店，与演员王迅同店归并，吸附玉双路源道路节点（距离13.7米）",
          reviewedOn: "2026-11-09",
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
    id: "cd-ppchaonengxuan-7551750117855202601",
    author: "PP超能炫",
    title: "一个人逛吃成都美食！从东吃到西！彻底吃嗨了 #抖音美食创作者 #成都 #成都美食 #成都美食图鉴 #成都旅游",
    url: "https://www.douyin.com/video/7551750117855202601",
    shareURL: "https://v.douyin.com/YAnkBTvtxVg/",
    platform: "douyin",
    publishedOn: "2025-09-19",
    publishedOnNote: "2025年逛吃合辑",
    durationSeconds: 844.65,
    sourceSHA256: "3b64d0f4ff34f1a9fb3fe89931b9fc6e0e3c1b0d190d35b7179f3c4db5e18d85",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：PP超能炫走访金牛区马鞍北路甘记肥肠粉，手打肥肠粉配牛肉锅盔，与莎莎又馋了同店合流。",
    segments: [
      {
        id: "cd-ppchaonengxuan-ganjifeichangfen",
        placeId: "cd-shashayouchanle-ganji",
        name: "甘记肥肠粉（马鞍北路总店）",
        category: "川味小吃 / 肥肠粉",
        summary: "PP超能炫逛吃成都极力称赞的非遗老牌肥肠粉，红薯粉在红油大铜锅中现漏现煮，配上卤软肥肠与焦香酥脆的牛肉锅盔，麻辣鲜香、酸辣适口。",
        addressText: "成都市金牛区马鞍北路18号",
        start: 660.0,
        end: 710.0,
        posterSecond: 670.0,
        coordinates: [104.0865, 30.686],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 马鞍北路街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "与莎莎又馋了同店归并，吸附马鞍北路源道路节点（距离28.6米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:马鞍北路",
            name: "马鞍北路",
            nearestNode: 9592,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wowxingge-7683461500186496307",
    author: "wow醒哥",
    title: "在成都巷子爽吃夜蹄花，皮糯肉香，搭配油辣子吃每一口都好满足！#成都美食 #蹄花 #心动打卡指南 #人间烟火 #好好吃饭",
    url: "https://www.douyin.com/video/7683461500186496307",
    shareURL: "https://v.douyin.com/awhrQ3-KZCs/",
    platform: "douyin",
    publishedOn: "2026-09-09",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 422.84,
    sourceSHA256: "5744b006a6f02cabca03ef01c47b4502472279b588f1dde7d53e0f2b3b52bce5",
    acquisitionStatus: "local-source",
    evidenceNote: "原片镜头与口述：成都巷弄深处的老牌滋补夜蹄花，精选带筋猪前蹄配云南大白豆慢炖，早上6点开门，具体门牌街区待核实。",
    segments: [
      {
        id: "cd-wowxingge-xiangziyetihua",
        name: "成都巷子老牌夜蹄花",
        category: "川味滋补蹄花 / 夜市名点",
        summary: "wow醒哥夜探成都巷弄老牌夜蹄花，大锅奶白蹄花汤清鲜滋补，猪皮软糯滑口一抿化渣，带筋瘦肉蘸上特制青椒油辣子，夜深食客的暖心慰藉。",
        addressText: "成都市巷子深处（具体门牌待核）",
        start: 0.0,
        end: 422.84,
        posterSecond: 18.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaozhen-7628908247805725986",
    author: "小珍来咯…",
    title: "第一次吃成都冒菜 一定要配米饭 热辣凉风太惬意了～#人间烟火 #美食vlog #妈呀太香了",
    url: "https://www.douyin.com/video/7628908247805725986",
    shareURL: "https://v.douyin.com/MeQCwLe5Mp4/",
    platform: "douyin",
    publishedOn: "2026-04-15",
    publishedOnNote: "2026年探店vlog",
    durationSeconds: 663.43,
    sourceSHA256: "d6602647defc227f606214cecbde56e6a54b79029676143394027e8b9341c22a",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探核定：小珍探访武侯区燃灯寺东街14号张记好实惠冒菜，点菜单与门牌电话一致，实吃特辣牛肉、毛肚、黄喉与千层肚冒菜。",
    segments: [
      {
        id: "cd-xiaozhen-haoshihuimaocai",
        name: "张记好实惠冒菜（燃灯寺东街店）",
        category: "市井高性价比冒菜 / 社区苍蝇馆",
        summary: "小珍初尝惊艳的成都市井社区冒菜，老成都燃灯寺东街苍蝇馆子，大铁盆冒煮现切牛肉片、爽脆黄喉、毛肚与豆皮，浓厚红油酱香浇淋白米饭，热辣过瘾。",
        addressText: "成都市武侯区燃灯寺东街14号",
        start: 0.0,
        end: 663.43,
        posterSecond: 30.0,
        coordinates: [104.0384, 30.6455],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 燃灯寺东街街区",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "武侯区燃灯寺东街14号，吸附一环路西一段源道路节点（距离39.3米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:一环路西一段",
            name: "一环路西一段",
            nearestNode: 28585,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wangmian-7509812980910656787",
    author: "王勉",
    title: "老板在吗我想加盟 #心动打卡指南 #王勉的养老生活 #美食探店 #烧烤 #成都美食",
    url: "https://www.douyin.com/video/7509812980910656787",
    shareURL: "https://v.douyin.com/DkFHqN6oyqQ/",
    platform: "douyin",
    publishedOn: "2025-05-29",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 281.7,
    sourceSHA256: "a3fd4085a21b38f65c9b7b182d5ad85dece2a72cb8f6a9e99c2d40399b9f82a4",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为无名烧烤(南湖店)，位于天府新区南湖大道，地处成都五城区范围以南逾17公里，保留视频库并如实记录外围状态。",
    segments: [
      {
        id: "cd-wangmian-wumingshaokao",
        name: "无名烧烤（南湖店）",
        category: "市井烧烤 / 地方名小吃",
        summary: "脱口秀演员王勉在成都探店直呼想加盟的市井烧烤，特色烤五花肉、香脆烤肠与独家辣料，炭火慢烤香气浓烈，深受南湖片区食客喜爱。",
        addressText: "成都市天府新区南湖西路（主城五城区外围）",
        start: 0.0,
        end: 281.7,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wasaijizhang-7605563150743145317",
    author: "哇塞几张",
    title: "“世界美食之都”的伙食！到底有多好吃？ #记忆中的年味回来了 #抖音新春吃喝玩乐节 #新春来抓马 #过个抖音新轻年 #烟火成都",
    url: "https://www.douyin.com/video/7605563150743145317",
    shareURL: "https://v.douyin.com/_ZjdwUTltBg/",
    platform: "douyin",
    publishedOn: "2026-02-11",
    publishedOnNote: "2026年新春美食特辑",
    durationSeconds: 357.63,
    sourceSHA256: "35c0824782276a2c0c186514bc1ef3e4605835f7b8f22641d078773e4362b264",
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为南堂馆·非遗传承人餐厅(IFS国金店)，地处春熙路IFS国际金融中心核心商圈，米其林推荐川菜老字号，实吃新派传统非遗川菜大宴。",
    segments: [
      {
        id: "cd-wasaijizhang-nantangguan",
        name: "南堂馆·非遗传承人餐厅（IFS国金店）",
        category: "非遗传承川菜 / 米其林指南",
        summary: "哇塞几张新春探访春熙路IFS顶奢名店南堂馆，非物质文化遗产川菜传承人掌勺，传承古法九大碗风味，经典蒜泥白肉卷秋葵、招牌樟茶鸭与红袍雪花牛肉，品味世界美食之都的雅致宴席。",
        addressText: "成都市锦江区红星路三段1号成都IFS国际金融中心5楼",
        start: 0.0,
        end: 357.63,
        posterSecond: 25.0,
        coordinates: [104.078731, 30.657219],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路IFS国金商圈",
          basis: "video-dialogue-and-osm-road",
          branchMatch: "exact-match",
          note: "春熙路红星路三段IFS国金中心大厦体块，吸附红星路源道路节点（距离47.7米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:红星路三段",
            name: "红星路三段",
            nearestNode: 22871,
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
const existingSourceIds = new Set(existingLibrary.sources.map(s => s.id));
const newSourcesToAdd = batch6Sources.filter(s => !existingSourceIds.has(s.id));

console.log(`Existing sources: ${existingLibrary.sources.length}`);
console.log(`New batch 6 sources to add: ${newSourcesToAdd.length}`);

const fullLibrary = {
  ...existingLibrary,
  sources: [
    ...existingLibrary.sources,
    ...newSourcesToAdd
  ]
};

// Validate video library model
console.log("\nValidating updated video library model...");
validateVideoLibrary(fullLibrary);
console.log("Validation passed successfully!");

// Transcode clips and extract posters
const clipsDir = path.join(root, '.local/video-clips');
const reportPath = path.join(clipsDir, 'report.json');
let report = { schemaVersion: 1, records: [] };
if (fs.existsSync(reportPath)) {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

console.log("\nProcessing Batch 6 video segments...");
for (const source of newSourcesToAdd) {
  const intakeDir = path.join(root, '.local/video-intake', source.id);
  const input = path.join(intakeDir, 'source.mp4');
  if (!fs.existsSync(input)) {
    console.warn(`WARNING: Missing source MP4 for ${source.id}`);
    continue;
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

// Save updated video-library.json
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), JSON.stringify(fullLibrary, null, 2) + '\n', 'utf8');
console.log(`\nUpdated map-base/data/cities/chengdu/video-library.json (Total sources: ${fullLibrary.sources.length}, total segments: ${fullLibrary.sources.reduce((sum, s) => sum + s.segments.length, 0)})`);

console.log("\nAll batch 6 video processing completed successfully!");
