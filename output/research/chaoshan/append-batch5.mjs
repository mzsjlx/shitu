import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const worktreeRoot = 'D:/codex/美食网站/.local/worktrees/chaoshan';
const libPath = path.join(worktreeRoot, 'map-base/data/cities/chaoshan/video-library.json');
const lib = JSON.parse(await readFile(libPath, 'utf8'));

// 1. Update rights scope
lib.rights.scope = "前五批共41条抖音探店链接经用户在会话中明确提供；视频剪辑与画面使用按用户提供范围记录，原片保留在.local，小封面与公开元数据纳入仓库。";

// 2. New sources for Batch 5
const newSources = [
  {
    id: "chaoshan-wulala-7096332711874317575",
    author: "特别乌啦啦",
    title: "在原产地吃鲜掉眉毛的「潮汕牛肉」～喝苦到尽头的茶",
    url: "https://www.douyin.com/video/7096332711874317575",
    shareURL: "https://v.douyin.com/ywOE2J8_UXs/",
    publishedOn: "2022-05-11",
    durationSeconds: 263,
    sourceSHA256: "8dfbc5c4050fa75f119585ce3c40633e7ec6e1457f099a8d101e5b33c937f315",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头龙湖区新海街道蔡杰牛肉店，萝卜玉米清汤锅底现切牛胸口朥、雪花牛肉与三花趾。",
    segments: [
      {
        id: "chaoshan-wulala-caijieniurou",
        name: "蔡杰牛肉店（新海东升店）",
        category: "潮汕牛肉火锅 / 现宰鲜切全牛各部位",
        addressText: "汕头市龙湖区新海街道东升村金鸿公路与公园路交界铺面3号",
        start: 23.5,
        end: 51.5,
        posterSecond: 38,
        summary: "乌啦啦实探汕头金鸿公路蔡杰牛肉店，萝卜玉米清汤锅底搭配现点现切大盘牛胸口朥、雪花牛肉与三花趾，肉质鲜嫩厚薄均匀，沙茶酱与生抽辣椒蘸料风味浓郁。",
        coordinates: [
          116.783,
          23.3894
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "新海街道金鸿公路东升路口",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍与高德POI定位新海街道金鸿公路蔡杰牛肉店大致街区，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-wangdingyi-7592131556836199718",
    author: "王丁亿Dean",
    title: "揭阳大排档最终形态！食材巨多xN种搭配x花样做法",
    url: "https://www.douyin.com/video/7592131556836199718",
    shareURL: "https://v.douyin.com/QffKCM6HcHw/",
    publishedOn: "2026-01-06",
    durationSeconds: 220,
    sourceSHA256: "b330ef7f0153bb87dba5b0b48fa1b3ef6f3378564c1ba44ea63fdd6890019eaa",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳阿忠大排档食材明档自选，九层塔金不换爆炒海瓜子、海笋与特色鲜炒。",
    segments: [
      {
        id: "chaoshan-wangdingyi-azhongdapaidang",
        name: "揭阳阿忠大排档（特色潮味小炒）",
        category: "潮汕大排档 / 揭阳镬气海鲜小炒",
        addressText: "揭阳市榕城区市区大排档老街",
        start: 13,
        end: 38,
        posterSecond: 25,
        summary: "揭阳高人气阿忠大排档，食材琳琅满目现点现做，一菜多吃，九层塔金不换爆炒海瓜子鲜香微辣、特色海笋脆嫩爽滑，充满潮汕市井极致镬气。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-anywei-7699057165206500022",
    author: "Any味",
    title: "汕头随便攻略，老板不想火的那些小店！“家常的气场”最馋人",
    url: "https://www.douyin.com/video/7699057165206500022",
    shareURL: "https://v.douyin.com/CArodHtBTSc/",
    publishedOn: "2026-10-21",
    durationSeconds: 255,
    sourceSHA256: "e55b59f83b33e0574b32b94632e801e7bd4fb82a426806762b352c6d53e77141",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头金平老街区詹记和味小食排档，酸梅煮车白、辣炒小花甲、香煎鲜鱼与带膏皮皮虾。",
    segments: [
      {
        id: "chaoshan-anywei-zhanjihewei",
        name: "詹记和味小食·家常潮汕海鲜（金平老店）",
        category: "潮汕排档 / 老饕私藏家常海鲜小馆",
        addressText: "汕头市金平区大理西路/光华老街区",
        start: 15,
        end: 39,
        posterSecond: 28,
        summary: "俩夫妻怕火的纯正家常排档，老板挑货极精，招牌酸梅煮车白酸甜开胃汤汁拌饭绝配，辣炒小花甲、香煎鲜鱼与带膏大皮皮虾鲜甜多汁，纯粹的老汕头家常市井气场。",
        coordinates: [
          116.681,
          23.372
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "光华老街区生活商圈",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍金平区光华街道老街区家常小店环境大致定位，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-maomao-7456427035368426809",
    author: "毛毛美食指南",
    title: "汕头火了十几年的老牌土鸡火锅，每晚路过都和全村吃席一样热闹！",
    url: "https://www.douyin.com/video/7456427035368426809",
    shareURL: "https://v.douyin.com/FpCm0lMhsAg/",
    publishedOn: "2025-01-05",
    durationSeconds: 228,
    sourceSHA256: "86b49dcc706e9d871ea44c1dbba150d0a13c27e9cb4c3d876cced7b50b01cc4e",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头龙湖区创新土鸡火锅总店，传统炭火清汤锅底配手切老母鸡片与椒盐鸡骨。",
    segments: [
      {
        id: "chaoshan-maomao-chuangxintujihuoguo",
        name: "创新土鸡火锅（汕头总店）",
        category: "潮汕鸡煲 / 传统炭炉老母鸡清汤火锅",
        addressText: "汕头市龙湖区长平路与衡山路交界",
        start: 11,
        end: 36,
        posterSecond: 20,
        summary: "汕头火了十几年全村吃席般热闹的老牌炭炉土鸡火锅，红枣枸杞清透鲜甜鸡汤底，老母鸡肉片均匀紧实带鸡味，搭配香酥椒盐鸡骨与潮汕秘制豆酱，排队盛况蔚为壮观。",
        coordinates: [
          116.7265,
          23.3712
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "长平路与衡山路美食街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍创新土鸡火锅招牌与长平路衡山路口大体定位街区，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-dongmai-7445459864287022375",
    author: "东麦",
    title: "《汕头20多年老式大排档》品种是真多 老板厨艺是真好",
    url: "https://www.douyin.com/video/7445459864287022375",
    shareURL: "https://v.douyin.com/mYNQpcnb_70/",
    publishedOn: "2024-12-07",
    durationSeconds: 139,
    sourceSHA256: "a23e3075995bdec673979c497a8cc46c3fc283955cc376a54f42c2aacb11ecd8",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍汕头西堤海滨路老三鱼仔店20多年老式大排档，全猪油现炒海鲜、八爪鱼与白灼虾。",
    segments: [
      {
        id: "chaoshan-dongmai-xidilaosanyuzai",
        name: "西堤老三鱼仔店（老式海鲜大排档）",
        category: "潮汕排档 / 老式海鲜打冷小炒",
        addressText: "汕头市金平区海滨路西堤公园旁 / 西堤路老城区",
        start: 0,
        end: 24,
        posterSecond: 10,
        summary: "小公园旁近西堤公园开了20多年的老式海鲜排档，保留怀旧老骑楼风貌，全猪油大火猛炒，招牌八爪鱼炒韭菜花、九肚鱼与白灼本港海虾，镬气十足酒楼级口感。",
        coordinates: [
          116.6775,
          23.3568
        ],
        locationStatus: "approximate-planning",
        routeEligible: false,
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "海滨路西堤公园老街区",
          basis: "video-address",
          branchMatch: "unconfirmed",
          note: "根据视频实拍西堤海滨路老城排档与西堤老三鱼仔店实景大致定位，非店门实测。",
          reviewedOn: "2026-11-09"
        }
      }
    ]
  },
  {
    id: "chaoshan-zhuzhanggui-7604509857686119670",
    author: "北京一家五口（猪掌柜）",
    title: "来潮汕旅游，路边的这种深夜小炒砂锅粥，一定不要错过！",
    url: "https://www.douyin.com/video/7604509857686119670",
    shareURL: "https://v.douyin.com/a_JidGhHOsA/",
    publishedOn: "2026-02-09",
    durationSeconds: 217,
    sourceSHA256: "7b2e6db04a622ee90f13060669a73411b8d379315211e7db0dc0250bea004ea6",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳棉湖糖厂路边深夜小炒砂锅粥，现点现滚海鲜粥、现炸香酥生姜丝与炸鸟、鳝鱼。",
    segments: [
      {
        id: "chaoshan-zhuzhanggui-mianhushaguozhou",
        name: "棉湖糖厂前无招牌砂锅粥（路边深夜小炒）",
        category: "潮汕砂锅粥 / 现滚海鲜粥深夜小炒",
        addressText: "揭阳市揭西县棉湖镇糖厂路口附近",
        start: 0,
        end: 25,
        posterSecond: 15,
        summary: "棉湖糖厂旁无招牌半夜才开的路边摊，每一份都现点现滚，现炸香酥姜丝炸鸟、鲜脆黄鳝、带皮田鸡与酥炸普宁豆干，鲜甜滋味直击味蕾。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-zhuzhanggui-7691153854340382633",
    author: "北京一家五口（猪掌柜）",
    title: "潮汕揭阳夯爆了的路边烧烤摊！",
    url: "https://www.douyin.com/video/7691153854340382633",
    shareURL: "https://v.douyin.com/ndgWmkQ2Cyk/",
    publishedOn: "2026-09-30",
    durationSeconds: 354,
    sourceSHA256: "46e7a865989c45dd2b6e47220cbd1dc016972bbd83f08cfe27861eb7b515fb44",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳马牙路大鹏车炭火烧烤摊，2元现串鲜嫩牛肉、牛筋、菠萝牛肉与沙茶肥牛。",
    segments: [
      {
        id: "chaoshan-zhuzhanggui-dapengcheshaokao",
        name: "大鹏车烧烤（马牙店）",
        category: "潮汕烧烤 / 街头路边摊炭烤",
        addressText: "揭阳市榕城区马牙路夜市",
        start: 0,
        end: 24,
        posterSecond: 12,
        summary: "揭阳超火爆路边炭火烧烤野摊，2元一串鲜嫩牛肉、牛筋、吊龙、菠萝牛肉、洋葱牛肉与沙茶肥牛，现点现炭火生烤，配免费蒜泡与浓郁沙茶酱，烟火气拉满。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-liuyuxin-7198778156277353787",
    author: "刘雨鑫JASON",
    title: "潮汕揭阳网红「卢前夜市」，看看高颜值路边摊味道怎么样？",
    url: "https://www.douyin.com/video/7198778156277353787",
    shareURL: "https://v.douyin.com/DL3qatSiOJQ/",
    publishedOn: "2023-02-11",
    durationSeconds: 196,
    sourceSHA256: "3dff30eb6d0d9148cf02d0eec0a2672f623dc803e9a008cec5010815876f6e7d",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳卢前夜市高颜值通宵小吃集市，烤粿桃、铁板肥肠配泡面泡菜与泰式柠檬虾滑。",
    segments: [
      {
        id: "chaoshan-liuyuxin-luqianyeishi",
        name: "卢前夜市高颜值路边摊（卢前美食街）",
        category: "潮汕夜市 / 街头小吃集市",
        addressText: "揭阳市榕城区卢前夜市美食街 / 2Milk街",
        start: 3,
        end: 27,
        posterSecond: 18,
        summary: "揭阳爆火的高颜值通宵小吃集市，烤粿桃四种馅米香油糯刷甜辣灵魂酱汁、韩式铁板肥肠炒泡面年糕、酸辣蒜蓉泰式柠檬虾滑与炭烤牛蛙，年轻人聚会夜宵圣地。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-zhuzhanggui-7630332590779551003",
    author: "北京一家五口（猪掌柜）",
    title: "潮汕的炸猪肉太好吃了 酥酥脆脆",
    url: "https://www.douyin.com/video/7630332590779551003",
    shareURL: "https://v.douyin.com/X4NhshA_t9o/",
    publishedOn: "2026-04-19",
    durationSeconds: 152,
    sourceSHA256: "369ef65ad60a32250f886a57f581a0eeed957a74aca80ae6daf46680e1491c93",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍揭阳新亨镇三角楼路口传统现炸猪肉条老铺，先腌后炸金黄酥脆带酒香与凉拌猪耳。",
    segments: [
      {
        id: "chaoshan-zhuzhanggui-sanjiaolouzhurou",
        name: "揭阳新亨三角楼炸猪肉条（26年老店）",
        category: "潮汕炸物 / 传统现炸酥香猪肉条",
        addressText: "揭阳市揭东区新亨镇三角楼路口老街",
        start: 13,
        end: 36,
        posterSecond: 24,
        summary: "揭阳新亨开了26年的传统现炸潮汕猪肉条，先腌后炸外酥里嫩，金黄酥脆带白酒甘甜与广式腊肠风味，每天下午出锅即秒空，另有酸甜爽脆凉拌猪耳。",
        coordinates: null,
        locationStatus: "unpositioned-archive",
        routeEligible: false,
        coordinateSystem: null,
        planningLocation: null
      }
    ]
  },
  {
    id: "chaoshan-zhuzhujixingzi-7592890422541625050",
    author: "猪猪急性子",
    title: "吃不吃潮汕市场里的蒜蓉炸串！香迷糊了🤤",
    url: "https://www.douyin.com/video/7592890422541625050",
    shareURL: "https://v.douyin.com/uPczzRYuJ58/",
    publishedOn: "2026-01-08",
    durationSeconds: 15,
    sourceSHA256: "3452c7727e8b9d2b09b7731c84a670047bf8675ae934f5ebb2da4caa0e23abae",
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍潮阳谷饶镇大坑村菜市场老字号蒜蓉炸串，现串现炸猪肉里脊与蔬菜刷浓蒜辣酱。",
    segments: [
      {
        id: "chaoshan-zhuzhu-dakengzhachuan",
        name: "大坑村肉菜市场蒜蓉炸串（谷饶老铺）",
        category: "潮式炸串 / 菜市场蒜蓉酱炸串",
        addressText: "汕头市潮阳区谷饶镇大坑村菜市场西北侧约50米",
        start: 0,
        end: 14.5,
        posterSecond: 4,
        summary: "潮阳谷饶大坑村菜市场老字号蒜蓉炸串，新鲜串炸里脊肉条、肉丸与蔬菜，现出锅刷满灵魂特调蒜蓉辣酱，市井烟火气浓郁香气扑鼻。",
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
