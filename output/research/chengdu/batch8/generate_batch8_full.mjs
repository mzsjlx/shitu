import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateVideoLibrary } from '../../../../map-base/src/video-library-model.js';
import { digest, mediaKey, mediaNames } from '../../../../map-base/scripts/video-library-common.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../map-base');
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

const batch8Sources = [
  {
    id: "cd-xiaojie-7618124241510947764",
    author: "小解",
    title: "菜品从2.8块开始，吃疯了！成都宝藏社区火锅赶超重庆！ #火锅 #成都火锅 #重庆火锅 #火锅约起来 #成都美食",
    url: "https://www.douyin.com/video/7618124241510947764",
    shareURL: "https://v.douyin.com/t5tiefW9k7c/",
    platform: "douyin",
    publishedOn: "2026-03-10",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 134.07,
    sourceSHA256: "329fe81b97319989ba6254058d84a7e9e51dd8c3bb486e926f491c107e05e534",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探北门金牛区洞子口路老牌社区九宫格老火锅，素菜2.8元起步，锅底牛油醇厚、麻辣浓郁，招牌手撕鲜毛肚、现切吊龙与非遗老火锅底料，市井性价比爆棚。",
    segments: [
      {
        id: "cd-xiaojie-mingyu",
        name: "重庆明玉九宫格老火锅（洞子口路店）",
        category: "火锅 / 社区九宫格",
        summary: "小解实探北门金牛区洞子口路老牌社区九宫格老火锅，素菜2.8元起步，锅底牛油醇厚、麻辣浓郁，招牌手撕鲜毛肚、现切吊龙与非遗老火锅底料，市井性价比爆棚。",
        addressText: "成都市金牛区洞子口路165号附17号",
        start: 0.0,
        end: 50.0,
        posterSecond: 10.0,
        coordinates: [104.067588, 30.713652],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 洞子口片区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "洞子口路商圈老牌社区火锅，吸附洞子口路真实道路节点（距离60.9米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:洞子口路",
            name: "洞子口路",
            nearestNode: 4304,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xulaosihebeijiang-7665310310001360997",
    author: "徐老斯和bee酱",
    title: "北门棚户级神店终于开到我家附近了！！没理由不冲！ #国际代吃 #嘿吃了吗 #在拍一种很新的vlog #成都烧烤 #成都美食攻略",
    url: "https://www.douyin.com/video/7665310310001360997",
    shareURL: "https://v.douyin.com/GeNhiCqZb8E/",
    platform: "douyin",
    publishedOn: "2026-07-20",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 188.22,
    sourceSHA256: "7f0da142852e4610fe586735e5ef07a39ba67356262a632095ba69a5a76e017d",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探老北门洞子口棚户级传奇烧烤神店卢大众烧烤，主打炭火原味现烤鲜牛肉、鲜鸡尖、爆浆松板肉与猪鼻筋，拒绝厚重码料，深受老街坊喜爱。",
    segments: [
      {
        id: "cd-xulaosi-ludazhong",
        name: "卢大众烧烤（洞子口总店）",
        category: "烧烤 / 洞子口老店",
        summary: "徐老斯和bee酱探访老北门洞子口棚户级传奇烧烤神店，主打炭火原味现烤鲜牛肉、鲜鸡尖、爆浆松板肉与猪鼻筋，拒绝厚重码料与科技狠活，被街坊老饕赠予“洞子口咪其林九星”锦旗。",
        addressText: "成都市金牛区沙河源街道老洞子口街区",
        start: 0.0,
        end: 60.0,
        posterSecond: 15.0,
        coordinates: [104.066277, 30.718065],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 洞子口街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "老洞子口原址地标烧烤，吸附中环路洞子口路段真实道路节点（距离26.1米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:中环路洞子口路段",
            name: "中环路洞子口路段",
            nearestNode: 1518,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danniushi-7645662813721054504",
    author: "丹牛食",
    title: "我吃遍了成都最經典的早餐，第四家太香了！ #成都 #成都美食",
    url: "https://www.douyin.com/video/7645662813721054504",
    shareURL: "https://v.douyin.com/swRzsh6ODd0/",
    platform: "douyin",
    publishedOn: "2026-05-28",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 713.26,
    sourceSHA256: "e42d9553df813e8fbff4dd62baefcebb51f71df170e17c093a0ca385cfcf131e",
    acquisitionStatus: "local-source",
    evidenceNote: "原片深度探寻成都经典早餐：北门张婆婆香酥锅盔夹牛肉与凉粉、成都50强食而百面馆酸辣鸡杂面，传承老成都早市地道风味。",
    segments: [
      {
        id: "cd-danniushi-shierbaimian",
        name: "食而百面馆（北门店）",
        category: "面馆 / 成都50强面馆",
        summary: "丹牛食探访成都50强面馆食而百面馆，招牌酸辣鸡杂面与牛肉绍子面，鲜辣过瘾、面条筋道，老北门街坊清晨排队的人气碳水。",
        addressText: "成都市金牛区树德二路6号附2号",
        start: 110.0,
        end: 170.0,
        posterSecond: 115.0,
        coordinates: [104.077880, 30.685904],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 梁家巷商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "树德二路老牌面馆，吸附树德二路真实道路节点（距离73.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:树德二路",
            name: "树德二路",
            nearestNode: 9420,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-danniushi-zhangpopoguokui",
        name: "张婆婆香酥锅盔（北门店）",
        category: "锅盔 / 传统名小吃",
        summary: "丹牛食探寻成都经典早餐第四站：张婆婆香酥锅盔，金黄酥脆的外壳裹挟鲜香麻辣的拌牛肉、凉粉与耳片，咬下去层次分明、咔嚓作响。",
        addressText: "成都市金牛区一环路北二段6号附2号",
        start: 645.0,
        end: 705.0,
        posterSecond: 655.0,
        coordinates: [104.080278, 30.686871],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 一环路北二段",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "北门老字号香酥锅盔店，吸附一环路北二段真实道路节点（距离82.9米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:一环路北二段",
            name: "一环路北二段",
            nearestNode: 9484,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-zhangxixi-7675242161461366070",
    author: "张喜喜",
    title: "怒花小1千点了11家成都顶级外卖，美食博主严选每一个都是夯中夯！#成都外卖 #成都美食 #外卖推荐",
    url: "https://www.douyin.com/video/7675242161461366070",
    shareURL: "https://v.douyin.com/mfcBM_7UslY/",
    platform: "douyin",
    publishedOn: "2026-08-16",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 584.56,
    sourceSHA256: "705199629d93eb4cb6e8d2e8aa1c7263544ec4e3c5ecf479d45388c679a95fb3",
    acquisitionStatus: "local-source",
    evidenceNote: "张喜喜居家点单评测成都11家高口碑特色外卖，涵盖多款热门冒菜、特色拌鸡与网红甜品，无单一固定实体门店堂食落点，保留原始探店评测记录。",
    segments: [
      {
        id: "cd-zhangxixi-waimaiheji",
        name: "成都外卖美食博主严选合集",
        category: "外卖测评 / 川味美食合集",
        summary: "张喜喜居家点单评测成都11家高口碑特色外卖，涵盖多款热门冒菜、特色拌鸡与网红甜品，无单一固定实体门店堂食落点，保留原始探店评测记录。",
        addressText: "成都市（居家外卖多店合集评测，无单一固定堂食门牌）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaozhouhexiaozhang-7637716186867813682",
    author: "小周和小张",
    title: "四川成都江湖菜 这家的沸腾鱼简直惊为天人,麻辣过瘾,食材很新鲜!#四川美食 #成都美食 #江湖菜 #沸腾鱼",
    url: "https://www.douyin.com/video/7637716186867813682",
    shareURL: "https://v.douyin.com/QsbhdHXsPKw/",
    platform: "douyin",
    publishedOn: "2026-05-02",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 226.73,
    sourceSHA256: "3ad7a784eb51ffeb3f9a7aa76fc939ca6e00b848bb4477c7f42cf05d3763f019",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实探武侯区紫薇东路谢逍遥山城大排档，多博主同店合用锚点；打卡现杀黑豆花沸腾鱼、油焖蟹与拉丝番茄炒蛋，麻辣鲜香、锅气十足。",
    segments: [
      {
        id: "cd-xiaozhou-xiexiaoyao",
        placeId: "cd-xulaosihebeijiang-xiexiaoyao",
        name: "谢逍遥山城大排档（成都总店）",
        category: "川味爆炒 / 江湖菜烧烤",
        summary: "小周和小张打卡武侯区紫薇东路谢逍遥山城大排档，多博主同店合用锚点；实探现点现杀黑豆花沸腾鱼、油焖蟹、乱刀土豆泥与拉丝番茄炒蛋，麻辣鲜香、锅气冲天。",
        addressText: "成都市武侯区紫薇东路107号",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: [104.0673, 30.6128],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 桐梓林商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "紫薇东路热门江湖菜大排档，多博主合用锚点，吸附紫薇东路真实道路节点（距离29.0米）",
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
    id: "cd-liuyuxin-7608971956116917519",
    author: "刘雨鑫JASON",
    title: "今天在成都街头吃顿老火锅，尝尝怎么样？ #人间烟火 #街头美食 #火锅 #成都 #我要上热门",
    url: "https://www.douyin.com/video/7608971956116917519",
    shareURL: "https://v.douyin.com/d2KToN8JXLQ/",
    platform: "douyin",
    publishedOn: "2026-02-18",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 178.56,
    sourceSHA256: "7a7ba4f18792e3ba159dc23bc3620e7e1aa71f9cfd41a310860528e530feecb8",
    acquisitionStatus: "local-source",
    evidenceNote: "刘雨鑫JASON穿行成都老街坊偶遇的市井老火锅摊，荤菜9元均一、现切鲜牛肉，无固定招牌与工商注册门牌，记录地道成都街头烟火气。",
    segments: [
      {
        id: "cd-liuyuxin-jietouhuoguo",
        name: "成都老社区街头老火锅小摊",
        category: "老火锅 / 街头市井",
        summary: "刘雨鑫JASON穿行成都老街坊偶遇的市井老火锅摊，荤菜9元均一、现切鲜牛肉，无固定招牌与工商注册门牌，记录地道成都街头烟火气。",
        addressText: "成都市老社区街头步行区（无固定门牌招牌）",
        start: 0.0,
        end: 60.0,
        posterSecond: 15.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-danninini-7660078717984705826",
    author: "丹妮妮妮妮",
    title: "和老朋友的夜宵局！ 火辣辣的江湖菜和成都的夜晚适配度百分百！#这个暑假我先吃为敬 #好好吃饭大赛 #宵夜吃什么 #郫县美食 #江湖菜",
    url: "https://www.douyin.com/video/7660078717984705826",
    shareURL: "https://v.douyin.com/kl1_DHuC6n8/",
    platform: "douyin",
    publishedOn: "2026-07-06",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 776.85,
    sourceSHA256: "1cd951ff41279b97771e847c2fb813c9eefb40d4212ecf41d06ca223ea4e1169",
    acquisitionStatus: "local-source",
    evidenceNote: "丹妮妮妮妮打卡自贡特色江湖菜与炭火烧烤宵师父，爆炒香辣盆盆虾、热辣鲜兔与烤驴肉。因位于郫都区蜀都万达广场，超出中心五城区底图范围，严格遵循真实地理不上图。",
    segments: [
      {
        id: "cd-danninini-xiaoshifu",
        name: "宵师父江湖菜烧烤（蜀都万达店）",
        category: "江湖菜 / 自贡爆炒 / 烧烤",
        summary: "丹妮妮妮妮打卡自贡特色江湖菜与炭火烧烤宵师父，爆炒香辣盆盆虾、热辣鲜兔与烤驴肉。因位于郫都区蜀都万达广场，超出中心五城区底图范围，严格遵循真实地理不上图。",
        addressText: "成都市郫都区郫筒街道檬柏西路37号1楼39（超出中心五城区底图范围）",
        start: 0.0,
        end: 60.0,
        posterSecond: 25.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-liuyuxin-7116803193459281159",
    author: "刘雨鑫JASON",
    title: "你们要的成都春熙路小吃避雷指南来啦！#我要上热门#跟着抖音去探店",
    url: "https://www.douyin.com/video/7116803193459281159",
    shareURL: "https://v.douyin.com/GcOD1yaPQzQ/",
    platform: "douyin",
    publishedOn: "2022-07-06",
    publishedOnNote: "春熙路探店指南",
    durationSeconds: 212.53,
    sourceSHA256: "8722b6fcddada30e8c454e5672ea5a17684d081f2ba95f4e3c3b03f0b2f5b5b0",
    acquisitionStatus: "local-source",
    evidenceNote: "刘雨鑫JASON实地巡礼春熙路步行街小吃摊位，实测招牌降龙爪爪、嗨岛兔与各类网红街头小吃，客观评析调味与口感特色。",
    segments: [
      {
        id: "cd-liuyuxin-jianglongzhuazhua",
        name: "降龙爪爪（春熙路总店）",
        category: "街头小吃 / 卤味鸡爪",
        summary: "刘雨鑫JASON实地巡礼春熙路步行街小吃摊位，实测招牌降龙爪爪、嗨岛兔与各类网红街头小吃，客观评析调味与口感特色。",
        addressText: "成都市锦江区春熙路步行街北段",
        start: 0.0,
        end: 60.0,
        posterSecond: 5.0,
        coordinates: [104.081573, 30.655925],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路步行街",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "春熙路商圈核心小吃门面，吸附春熙路真实步行道路节点（距离15.6米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:春熙路",
            name: "春熙路",
            nearestNode: 26498,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-suipo-7516184274110876947",
    author: "特厨隋坡（重新出发版）",
    title: "特厨探店 |完全没有外地人的成都小馆是什么味道—包家兄弟 #好好吃饭大赛 #美食探店  #特厨隋卞 #隋坡 #成都",
    url: "https://www.douyin.com/video/7516184274110876947",
    shareURL: "https://v.douyin.com/gGa0FcfCcFY/",
    platform: "douyin",
    publishedOn: "2025-06-15",
    publishedOnNote: "特厨探店系列",
    durationSeconds: 192.73,
    sourceSHA256: "718c3a38837f4fe9a6230f2f0a1cbb09249ba9c7e096414777da7a1512db73ee",
    acquisitionStatus: "local-source",
    evidenceNote: "特厨隋坡探访完全没有外地游客的成都本地老小馆包家兄弟餐馆，连干三碗米饭，实测招牌回锅牛肉、麻婆豆腐，豆瓣酱香浓郁、镬气十足。",
    segments: [
      {
        id: "cd-suipo-baojia",
        name: "包家兄弟餐馆（包家巷店）",
        category: "川菜 / 苍蝇馆子",
        summary: "特厨隋坡探访完全没有外地游客的成都本地老小馆包家兄弟餐馆，连干三碗米饭，实测招牌回锅牛肉、麻婆豆腐，豆瓣酱香浓郁、镬气十足。",
        addressText: "成都市青羊区包家巷181号附1号",
        start: 0.0,
        end: 60.0,
        posterSecond: 15.0,
        coordinates: [104.053946, 30.662471],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 包家巷街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "青羊区包家巷老字号苍蝇馆，吸附包家巷真实道路节点（距离14.4米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:包家巷",
            name: "包家巷",
            nearestNode: 21455,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wangxun-7553863973137943849",
    author: "演员王迅",
    title: "每回回成都都会去逛菜市场，除了满满的烟火气还有很多美食，可以一站式解决你的所需。#忙忙碌碌迅宝藏 #心动打卡指南 #遇见城市 #寻味烟火气 #成都美食",
    url: "https://www.douyin.com/video/7553863973137943849",
    shareURL: "https://v.douyin.com/jJUIY1UZU9Y/",
    platform: "douyin",
    publishedOn: "2025-09-24",
    publishedOnNote: "王迅逛玉林菜市",
    durationSeconds: 332.58,
    sourceSHA256: "6abcaf3175bb870c58e5ff4e24eb224ff2337d404099d0e2e987c676f2d29402",
    acquisitionStatus: "local-source",
    evidenceNote: "演员王迅每次回成都必逛的玉林综合菜市场，实探风骨兔手撕麻椒鸡、香酥去骨风骨兔，肉质紧实麻辣过瘾，老成都菜市烟火气一览无余。",
    segments: [
      {
        id: "cd-wangxun-fenggutu",
        name: "风骨兔（玉林菜市店）",
        category: "兔头 / 凉拌菜 / 熟食卤味",
        summary: "演员王迅每次回成都必逛的玉林综合菜市场，实探风骨兔手撕麻椒鸡、香酥去骨风骨兔，肉质紧实麻辣过瘾，老成都菜市烟火气一览无余。",
        addressText: "成都市武侯区玉林西街12号玉林综合市场一层A区30号",
        start: 0.0,
        end: 60.0,
        posterSecond: 5.0,
        coordinates: [104.055698, 30.628780],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 玉林生活街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "玉林综合菜市场外围熟食铺，吸附玉林西街真实道路节点（距离10.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:玉林西街",
            name: "玉林西街",
            nearestNode: 32478,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaojinzhangdechongchong-7654099844046261538",
    author: "小紧张的虫虫",
    title: "落地成都第一顿，冲连续两年米其林川菜馆，点9道菜会踩雷吗？ #好好吃饭 #成都川菜推荐#年丰饭店",
    url: "https://www.douyin.com/video/7654099844046261538",
    shareURL: "https://v.douyin.com/Xz2uvgQVg1k/",
    platform: "douyin",
    publishedOn: "2026-06-20",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 674.94,
    sourceSHA256: "5979f428c0db168a737d6e87f8976fe7ae992021666cb69bbf5cb3a0d53cbfd5",
    acquisitionStatus: "local-source",
    evidenceNote: "小紧张的虫虫落地成都打卡连续两年荣获米其林必比登推介的年丰饭店，实测9道招牌川菜：红油浓郁的凉拌鸡、鲜香软嫩的豆瓣鲜鱼与下饭神菜，见证老馆子深厚功底。",
    segments: [
      {
        id: "cd-xiaojinzhang-nianfeng",
        name: "年丰饭店（米其林必比登推介）",
        category: "老字号川菜 / 米其林必比登",
        summary: "小紧张的虫虫落地成都打卡连续两年荣获米其林必比登推介的年丰饭店，实测9道招牌川菜：红油浓郁的凉拌鸡、鲜香软嫩的豆瓣鲜鱼与下饭神菜，见证老馆子深厚功底。",
        addressText: "成都市武侯区丁塘南街与棕树南街交叉口",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: [104.077081, 30.618857],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 棕树生活街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "丁塘南街老牌川菜米其林，吸附棕树南街真实道路节点（距离30.8米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:棕树南街",
            name: "棕树南街",
            nearestNode: 36607,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaojie-7689001733104180450",
    author: "小解",
    title: "1000万人推荐的火锅！成都前三⁉️ 大家评论区见！！#火锅 #成都火锅 #火锅约起来 #重庆火锅 #成都美食",
    url: "https://www.douyin.com/video/7689001733104180450",
    shareURL: "https://v.douyin.com/yWzcCUZ2VFQ/",
    platform: "douyin",
    publishedOn: "2026-09-24",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 153.73,
    sourceSHA256: "0f57cbe5e686cb00cf34b4fbf349ec6a0a996bcff24c5ee9cefb3f37502474aa",
    acquisitionStatus: "local-source",
    evidenceNote: "小解实探锦江区东门市井内的正南齐北重庆老火锅，主打老重庆九宫格纯牛油锅底、屠场现撕鲜毛肚与爆款竹笋虾滑，本地老饕云集的人气火锅。",
    segments: [
      {
        id: "cd-xiaojie-zhengnanqibei",
        name: "正南齐北重庆老火锅（东门市井店）",
        category: "火锅 / 重庆老火锅",
        summary: "小解实探锦江区东门市井内的正南齐北重庆老火锅，主打老重庆九宫格纯牛油锅底、屠场现撕鲜毛肚与爆款竹笋虾滑，本地老饕云集的人气火锅。",
        addressText: "成都市锦江区菱窠西路9号东门市井文化街区内",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: [104.115361, 30.628007],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 东门市井街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "东门市井川西特色街区火锅，吸附菱窠西路真实道路节点（距离141.1米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:菱窠西路",
            name: "菱窠西路",
            nearestNode: 37105,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-yangdui-7701272428579802368",
    author: "杨队！快来吃点！",
    title: "成都金牛区人气烧烤，小串不用撒料就够味，全凭食材新鲜短短一年干成网红店！#美食vlog #建议普及这一口 #青年创作者扶持计划 #成都美食 #烧烤",
    url: "https://www.douyin.com/video/7701272428579802368",
    shareURL: "https://v.douyin.com/B2tERMiyg9g/",
    platform: "douyin",
    publishedOn: "2026-10-25",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 390.86,
    sourceSHA256: "d841fdaf2feaf0c55fe82d56d2e61df3fa65239a9c2d1b7eb7eb76aa8c0570b5",
    acquisitionStatus: "local-source",
    evidenceNote: "说唱歌手PSY.P杨队实地探访金牛区人气鲜货烧烤小店，主打炭火原味小串不用撒料便鲜美多汁，现切牛肉、鲜鸭舌与乌鱼片原汁原味，市井氛围浓厚。",
    segments: [
      {
        id: "cd-yangdui-jinniushaokao",
        name: "成都金牛区鲜货原味小串烧烤",
        category: "烧烤 / 夜宵小串",
        summary: "说唱歌手PSY.P杨队实地探访金牛区人气鲜货烧烤小店，主打炭火原味小串不用撒料便鲜美多汁，现切牛肉、鲜鸭舌与乌鱼片原汁原味，市井氛围浓厚。",
        addressText: "成都市金牛区（社区夜宵小串烧烤，无固定工商门牌）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-renyiyige-7591742533558914346",
    author: "Renyi毅哥",
    title: "赶场3小时只为一碗川式老味早餐！鲜粉现烫加上爆汁节子，人气爆棚的菜市小店到底有多惊艳！#肥肠粉 #美食分享 #地方特色美食",
    url: "https://www.douyin.com/video/7591742533558914346",
    shareURL: "https://v.douyin.com/XxS66BX43Ac/",
    platform: "douyin",
    publishedOn: "2026-01-04",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 181.84,
    sourceSHA256: "6ef0fc1fd49bedd6a62a74c2bc27c62d85ce091d37446bb90c8897c9b36d0e8e",
    acquisitionStatus: "local-source",
    evidenceNote: "Renyi毅哥专程驱车往返3小时奔赴川西乡镇赶场菜市，打卡排队爆棚的传统老式现烫鲜粉配爆汁节子，纯手工红薯粉与自炼红油，因地处远郊乡镇赶场市集，不上图造点。",
    segments: [
      {
        id: "cd-renyiyige-caishifeichangfen",
        name: "川西乡镇赶场菜市手工肥肠粉",
        category: "特色早餐 / 肥肠粉 / 节子",
        summary: "Renyi毅哥专程驱车往返3小时奔赴川西乡镇赶场菜市，打卡排队爆棚的传统老式现烫鲜粉配爆汁节子，纯手工红薯粉与自炼红油，因地处远郊乡镇赶场市集，不上图造点。",
        addressText: "成都市远郊乡镇菜市场（超出中心五城区底图范围）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-duizhang0527-7684125638060587974",
    author: "队长0527",
    title: "累了就喝点，不用逢场作戏，也不用带着面具，生活本来就是九分努力，留下一分犒劳自己。列气！#烟火探子团美食转身挑战 #路边摊美味 #烧烤 #秋季吃辣挑战 #队长0527",
    url: "https://www.douyin.com/video/7684125638060587974",
    shareURL: "https://v.douyin.com/jygpkGR3m58/",
    platform: "douyin",
    publishedOn: "2026-09-11",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 448.0,
    sourceSHA256: "d9384be932717bf5137233aa5a133461298492f2545d13d72ec5c99e7c3e5db7",
    acquisitionStatus: "local-source",
    evidenceNote: "队长0527深夜路边小摊独自小酌撸串，百元夜宵烤肉抚慰身心，生活九分努力留下一分犒劳自己，无固定门牌招牌。",
    segments: [
      {
        id: "cd-duizhang0527-ludiantanhua",
        name: "成都深夜路边摊治愈小酌烧烤",
        category: "路边摊 / 深夜小酌 / 烧烤",
        summary: "队长0527深夜路边小摊独自小酌撸串，百元夜宵烤肉抚慰身心，生活九分努力留下一分犒劳自己，无固定门牌招牌。",
        addressText: "成都市街角夜市路边摊（无固定门牌）",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-daoyueshe-7577614489533680959",
    author: "盗月社食遇记",
    title: "这个贵州五线小城，凭什么是中国“吃商”最高的城市？ 糟了，捅了贵州老吃家的窝了！ #抖音美食班当季新菜单 #当季新菜单挑战赛 #贵州美食 #中国街头小吃 #老吃家",
    url: "https://www.douyin.com/video/7577614489533680959",
    shareURL: "https://v.douyin.com/Xg1oXevXgQY/",
    platform: "douyin",
    publishedOn: "2025-11-26",
    publishedOnNote: "贵州安顺寻味",
    durationSeconds: 1082.5,
    sourceSHA256: "c0bcfbd2027d142100dc05cf52eb71db1331776953fc9d17d598585e13554098",
    acquisitionStatus: "local-source",
    evidenceNote: "盗月社食遇记实探贵州省安顺市特色炸猪蹄爆米花、酸辣炖猪蹄与自助烤小肠，展示安顺人极高吃商。因属贵州省安顺市，严格遵循地理真实规范，不上图造点。",
    segments: [
      {
        id: "cd-daoyueshe-anshunxiaochi",
        name: "贵州安顺炸猪蹄与烙锅烤小肠",
        category: "地方特色 / 贵州小吃",
        summary: "盗月社食遇记实探贵州省安顺市特色炸猪蹄爆米花、酸辣炖猪蹄与自助烤小肠，展示安顺人极高吃商。因属贵州省安顺市，严格遵循地理真实规范，不上图造点。",
        addressText: "贵州省安顺市各特色小吃街区（城外非成都数据）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-suipo-7657929491175509275",
    author: "特厨隋坡（重新出发版）",
    title: "边吃边笑，重庆本地人的食堂到底咋样？—口未餐家常菜 #美食探店 #隋坡 #美食 #重庆",
    url: "https://www.douyin.com/video/7657929491175509275",
    shareURL: "https://v.douyin.com/GCNj0aNSgus/",
    platform: "douyin",
    publishedOn: "2026-06-30",
    publishedOnNote: "重庆探店系列",
    durationSeconds: 246.6,
    sourceSHA256: "6a7ddcacd678c187be06992d9bb471e9f19316d3f2ec8da7713d297d02566db9",
    acquisitionStatus: "local-source",
    evidenceNote: "特厨隋坡实探重庆本地人口碑食堂口未餐家常菜，实尝海带蹄花肚子汤、烧椒皮蛋与肉末土豆泥下饭神器。因地处重庆市，严格遵循地理真实规范，不上图造点。",
    segments: [
      {
        id: "cd-suipo-kouweican",
        name: "口未餐家常菜（重庆总店）",
        category: "川渝家常菜 / 苍蝇馆子",
        summary: "特厨隋坡实探重庆本地人口碑食堂口未餐家常菜，实尝海带蹄花肚子汤、烧椒皮蛋与肉末土豆泥下饭神器。因地处重庆市，严格遵循地理真实规范，不上图造点。",
        addressText: "重庆市（城外重庆数据）",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-zhoujiawei-7498287314364615946",
    author: "巨爱吃的周嘉伟",
    title: "贡菜肥牛凤爪螺蛳粉加麻辣小龙虾串加黑椒土豆泥炸鸡加生巧榛子慕斯#一起吃饭吧",
    url: "https://www.douyin.com/video/7498287314364615946",
    shareURL: "https://v.douyin.com/l6PDDbYwDsQ/",
    platform: "douyin",
    publishedOn: "2025-04-28",
    publishedOnNote: "2025年探店视频",
    durationSeconds: 315.17,
    sourceSHA256: "5c057411647573f08146747d7c67428f5228c2e646f9024f0c78a0c202022b7a",
    acquisitionStatus: "local-source",
    evidenceNote: "巨爱吃的周嘉伟居家大碗贡菜肥牛凤爪螺蛳粉配麻辣小龙虾串与黑椒土豆泥炸鸡，居家无店铺堂食门牌。",
    segments: [
      {
        id: "cd-zhoujiawei-chibo",
        name: "居家麻辣小龙虾串与贡菜螺蛳粉吃播",
        category: "吃播评测 / 螺蛳粉炸鸡",
        summary: "巨爱吃的周嘉伟居家大碗贡菜肥牛凤爪螺蛳粉配麻辣小龙虾串与黑椒土豆泥炸鸡，居家无店铺堂食门牌。",
        addressText: "成都市（居家吃播无实体堂食门店）",
        start: 0.0,
        end: 60.0,
        posterSecond: 15.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaozhen-7644496437832600838",
    author: "小珍来咯…",
    title: "再次被重庆火锅惊艳了 肥肠炒饭吃完念念不忘～#好好吃饭 #美食vlog日常 #人间烟火",
    url: "https://www.douyin.com/video/7644496437832600838",
    shareURL: "https://v.douyin.com/qTm5R6cMLz0/",
    platform: "douyin",
    publishedOn: "2026-05-25",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 875.67,
    sourceSHA256: "357e61870d65b16e87f3e1b7473a2164d50937a892705ddaa52c80c2f8d3b841",
    acquisitionStatus: "local-source",
    evidenceNote: "小珍来咯打卡重庆市渝中区解放碑较场口天棒老火锅，体验浓郁红油锅底、大苕皮、糖心鱿鱼与特色肥肠炒饭。因地处重庆解放碑较场口，严格遵循地理真实规范，不上图造点。",
    segments: [
      {
        id: "cd-xiaozhen-tianbanghuoguo",
        name: "天棒老火锅（重庆解放碑店）",
        category: "重庆火锅 / 市井老火锅",
        summary: "小珍来咯打卡重庆市渝中区解放碑较场口天棒老火锅，体验浓郁红油锅底、大苕皮、糖心鱿鱼与特色肥肠炒饭。因地处重庆解放碑较场口，严格遵循地理真实规范，不上图造点。",
        addressText: "重庆市渝中区解放碑较场口新华路磨房巷25号（城外重庆数据）",
        start: 0.0,
        end: 60.0,
        posterSecond: 20.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-juzigongzhu-7615894254908476681",
    author: "橘子公主",
    title: "第7年来吃大姐铁板烧啦，还是熟悉的配方熟悉的味道 #烟火气 #夜宵 #路边摊 #炸串 #寻味烟火气",
    url: "https://www.douyin.com/video/7615894254908476681",
    shareURL: "https://v.douyin.com/riHkA0ocZiY/",
    platform: "douyin",
    publishedOn: "2026-03-04",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 60.0,
    sourceSHA256: "b3243d1bd4485da33a20fc0d927442bfb0304afaf473ba9c0d53e575452cad10",
    acquisitionStatus: "local-source",
    evidenceNote: "橘子公主第7年光顾的大姐铁板烧路边摊，1元土豆片、铁板炒米粉与特色炸串，满满市井街头深夜烟火气。流动小摊无固定门牌，保留原始探店记录。",
    segments: [
      {
        id: "cd-juzigongzhu-dajietiebangshao",
        name: "老成都街头大姐铁板烧流动小摊",
        category: "铁板烧 / 夜宵炸串",
        summary: "橘子公主第7年光顾的大姐铁板烧路边摊，1元土豆片、铁板炒米粉与特色炸串，满满市井街头深夜烟火气。流动小摊无固定门牌，保留原始探店记录。",
        addressText: "成都市夜市路边摊（流动摆摊无固定门牌）",
        start: 0.0,
        end: 50.0,
        posterSecond: 10.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-qianjinbaole-7615904629490076969",
    author: "千金饱了",
    title: "挑战火爆全网的刘文祥麻辣烫,又黏又辣简直“夯爆了” #刘文祥 #无辣不欢 #麻辣烫 #紫薯精",
    url: "https://www.douyin.com/video/7615904629490076969",
    shareURL: "https://v.douyin.com/uTauG1haMVA/",
    platform: "douyin",
    publishedOn: "2026-03-04",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 317.74,
    sourceSHA256: "a1429fe7f6f072ca745287f3ca85f403980bcba757656360c7df18f2bb8726ba",
    acquisitionStatus: "local-source",
    evidenceNote: "千金饱了挑战火爆全网的刘文祥麻辣烫，必点吸汁黄细面、软糯黄粗面与香辣小酥肉，裹满浓郁麻酱与特调辣椒油，黏糊咸香、回味无穷。",
    segments: [
      {
        id: "cd-qianjin-liuwenxiang",
        name: "刘文祥大盘麻辣烫（春熙太古里店）",
        category: "麻辣烫 / 东北麻辣烫",
        summary: "千金饱了挑战火爆全网的刘文祥麻辣烫，必点吸汁黄细面、软糯黄粗面与香辣小酥肉，裹满浓郁麻酱与特调辣椒油，黏糊咸香、回味无穷。",
        addressText: "成都市锦江区大慈寺路春熙太古里商圈",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: [104.083649, 30.655616],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 太古里大慈寺商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "太古里大慈寺路人气麻辣烫，吸附大慈寺路真实道路节点（距离25.0米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:大慈寺路",
            name: "大慈寺路",
            nearestNode: 26433,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-finn-7632654123914398054",
    author: "叫我Finn",
    title: "成都外卖推荐3🥘绿色无广保姆级攻略来袭！ ！ 假期来成都旅游或者在成都生活  不知道吃什么   看Finn老师这篇就够啦！ 如果你住在锦江区 或者太古里春熙路附近  请速速观看本期视频！ 绿色无广 店铺如下： 1.桃香源火锅鸡（近期的爱 自己做个醋碟无敌！） 2.王氏现捞 （鸭头和笋花生好吃 很适合下8+1） 3.攀枝花羊肉粉（恨不得一天一碗的程度 一定要加羊肉加糊辣壳辣椒） 4.黄嬢甜不辣 （两种蘸碟都要吃 香拽了） 5.正宗罈子蟠龙烤鸭冒烤鸭 （鸭肉很鲜很大块 鸭血很好吃） 6.小豆海棠  （点牛肉软饼和鸡丝豆腐脑 无敌） 7.盘子串串香 （想吃串串的来） 8.瓦烤（经常吃的烧烤 小贵但好吃） 9.cokofrigo（我心中的成都韩料top5） 10.吉川（巨巨巨香的关东煮） #成都美食 #成都本地美食 #成都外卖 #成都探店 #成都旅游攻略",
    url: "https://www.douyin.com/video/7632654123914398054",
    shareURL: "https://v.douyin.com/xZZ0LVPaG3Q/",
    platform: "douyin",
    publishedOn: "2026-04-18",
    publishedOnNote: "2026年探店视频",
    durationSeconds: 325.91,
    sourceSHA256: "a1ecad2cea16f2c3bf88a6d7bb9dd18bf5d48c0800e9989bce256e30b62e49c7",
    acquisitionStatus: "local-source",
    evidenceNote: "太古里常住博主叫我Finn无广实测锦江区与太古里周边高分外卖名店：太升南路老字号黄嬢甜不辣、东门大桥桃香源火锅鸡。",
    segments: [
      {
        id: "cd-finn-taoxiangyuan",
        name: "桃香源火锅鸡（东门大桥店）",
        category: "火锅鸡 / 川味火锅",
        summary: "叫我Finn太古里住客力荐的桃香源火锅鸡，大份鲜香芋儿鸡，鸡肉软嫩入味，自调醋碟搭配相得益彰。",
        addressText: "成都市锦江区东门大桥天仙桥南路",
        start: 22.0,
        end: 65.0,
        posterSecond: 25.0,
        coordinates: [104.088646, 30.651365],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 东门大桥商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "东门大桥天仙桥南路火锅鸡，吸附天仙桥南路真实道路节点（距离20.5米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:天仙桥南路",
            name: "天仙桥南路",
            nearestNode: 26970,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-finn-huangniang",
        name: "黄嬢甜不辣（太升南路店）",
        category: "传统小吃 / 油炸甜不辣",
        summary: "叫我Finn强力推荐的成都老牌甜不辣黄嬢甜不辣，两种特制干湿蘸碟搭配酥香炸串，外酥里嫩、香气扑鼻。",
        addressText: "成都市锦江区太升南路天涯石街区",
        start: 125.0,
        end: 155.0,
        posterSecond: 130.0,
        coordinates: [104.074323, 30.666118],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 太升南路商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "太升南路天涯石老街区知名甜不辣，吸附太升南路真实道路节点（距离39.2米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:太升南路",
            name: "太升南路",
            nearestNode: 17019,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiaolongren-7381768360482114870",
    author: "小笼人",
    title: "八个小时炫成都！看看我都吃了什么～ 没睡饱…也没吃饱…#成都 #成都美食 #美食vlog #抖音美好食光",
    url: "https://www.douyin.com/video/7381768360482114870",
    shareURL: "https://v.douyin.com/omFxXS6MUDg/",
    platform: "douyin",
    publishedOn: "2024-06-18",
    publishedOnNote: "2024年探店视频",
    durationSeconds: 630.65,
    sourceSHA256: "53878a16aed2591bfeaeefcefc52aeb0498a9c2d1b72a0889c25dafc0534267e",
    acquisitionStatus: "local-source",
    evidenceNote: "小笼人极限8小时逛吃成都街头，实尝酸辣豆花、手撕兔肉、火锅底料辣条与现蒸蒸饺，体验老成都街头小吃风味。",
    segments: [
      {
        id: "cd-xiaolongren-bachengdu",
        name: "成都八小时市井美食速吃巡礼",
        category: "市井小吃 / 美食特快",
        summary: "小笼人极限8小时逛吃成都街头，实尝酸辣豆花、手撕兔肉、火锅底料辣条与现蒸蒸饺，体验老成都街头小吃风味。",
        addressText: "成都市中心城区多街区巡礼（无单一固定门店堂食落点）",
        start: 0.0,
        end: 60.0,
        posterSecond: 10.0,
        coordinates: null,
        locationStatus: "unlocated-source",
        coordinateSystem: "WGS84",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-ganshiqi-7498254662479465743",
    author: "淦诗岐",
    title: "成都的网红店会惩罚每一个不做攻略就来的人#成都美食  #五一美食攻略 #谁懂这一口的好吃程度",
    url: "https://www.douyin.com/video/7498254662479465743",
    shareURL: "https://v.douyin.com/C9EotAUArgo/",
    platform: "douyin",
    publishedOn: "2025-04-28",
    publishedOnNote: "成都避坑指南",
    durationSeconds: 313.3,
    sourceSHA256: "2b81176fe0fa48f80bb1e17d98be77fa643884ea21c29b6264ffdfcb8eb865fe",
    acquisitionStatus: "local-source",
    evidenceNote: "淦诗岐成都避坑指南力荐的老字号社区火锅天星正源火锅，成华区地勘路二仙桥老店，手工炒制底料无添加，招牌极品鲜腰片大且脆嫩、鲜毛肚与鲜鸭血越煮越香。",
    segments: [
      {
        id: "cd-ganshiqi-tianxingzhengyuan",
        name: "天星正源火锅（地勘路总店）",
        category: "火锅 / 社区老火锅",
        summary: "淦诗岐成都避坑指南力荐的老字号社区火锅天星正源火锅，成华区地勘路二仙桥老店，手工炒制底料无添加，招牌极品鲜腰片大且脆嫩、鲜毛肚与鲜鸭血越煮越香。",
        addressText: "成都市成华区地勘路1号附52号（近二仙桥地铁站A口）",
        start: 20.0,
        end: 75.0,
        posterSecond: 25.0,
        coordinates: [104.128246, 30.686827],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 二仙桥商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "二仙桥地勘路老牌社区火锅，吸附地勘路真实道路节点（距离24.4米）",
          reviewedOn: "2026-11-09",
          anchor: {
            kind: "osm-way",
            id: "road:地勘路",
            name: "地勘路",
            nearestNode: 10129,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  }
];

// Combine existing sources and Batch 8 sources
const sourceMap = new Map();
for (const s of existingLibrary.sources) {
  sourceMap.set(s.id, s);
}
for (const s of batch8Sources) {
  sourceMap.set(s.id, s);
}
const combinedSources = Array.from(sourceMap.values());
const newLibrary = {
  ...existingLibrary,
  sources: combinedSources
};

// Validate schema
validateVideoLibrary(newLibrary);
console.log(`Video library validated successfully: ${newLibrary.sources.length} sources.`);

// Save updated video-library.json
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-library.json'), JSON.stringify(newLibrary, null, 2), 'utf8');
console.log('Saved data/cities/chengdu/video-library.json');

// Process clips and posters
const posters = JSON.parse(fs.readFileSync(path.join(root, 'data/cities/chengdu/video-posters.json'), 'utf8'));

for (const source of batch8Sources) {
  const intakePath = path.join(root, '.local/video-intake', source.id, 'source.mp4');
  if (!fs.existsSync(intakePath)) {
    console.warn(`Source video not found: ${intakePath}`);
    continue;
  }
  
  for (const seg of source.segments) {
    const names = mediaNames(source, seg);
    const clipDir = path.join(root, '.local/video-clips', source.id);
    const posterDir = path.join(root, 'assets/video-posters', source.id);
    fs.mkdirSync(clipDir, { recursive: true });
    fs.mkdirSync(posterDir, { recursive: true });
    
    const clipFile = path.join(clipDir, names.clip);
    const posterFile = path.join(posterDir, names.poster);
    
    // 1. Poster extraction
    if (!fs.existsSync(posterFile) || fs.statSync(posterFile).size === 0) {
      console.log(`Extracting poster: ${posterFile}...`);
      await run(FFMPEG, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', String(seg.posterSecond || seg.start),
        '-i', intakePath,
        '-frames:v', '1',
        '-q:v', '3',
        posterFile
      ]);
    }
    
    // Register poster in video-posters.json
    const posterBuffer = fs.readFileSync(posterFile);
    const posterDigest = digest(posterBuffer);
    posters[mediaKey(source, seg)] = {
      file: `assets/video-posters/${source.id}/${names.poster}`,
      sha256: posterDigest
    };
    
    // 2. Video transcode (faststart H.264 + aac)
    if (!fs.existsSync(clipFile) || fs.statSync(clipFile).size === 0) {
      console.log(`Transcoding clip: ${clipFile}...`);
      const duration = (seg.end - seg.start).toFixed(2);
      await run(FFMPEG, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', String(seg.start),
        '-i', intakePath,
        '-t', String(duration),
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        clipFile
      ]);
      console.log(`Transcoded ${clipFile} (${fs.statSync(clipFile).size} bytes)`);
    }
  }
}

// Write back video-posters.json
fs.writeFileSync(path.join(root, 'data/cities/chengdu/video-posters.json'), JSON.stringify(posters, null, 2), 'utf8');
console.log('Updated data/cities/chengdu/video-posters.json');

// Also update global video-posters.json
const globalPostersPath = path.join(root, 'data/video-posters.json');
if (fs.existsSync(globalPostersPath)) {
  const globalPosters = JSON.parse(fs.readFileSync(globalPostersPath, 'utf8'));
  Object.assign(globalPosters, posters);
  fs.writeFileSync(globalPostersPath, JSON.stringify(globalPosters, null, 2), 'utf8');
  console.log('Updated data/video-posters.json');
}

console.log('=== Batch 8 Media Generation Completed! ===');
