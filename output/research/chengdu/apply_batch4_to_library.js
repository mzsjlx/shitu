const fs = require('fs');
const path = require('path');

const intakeBase = 'map-base/.local/video-intake';
const batch4Sources = [
  {
    id: "cd-bozai-7286785550986611983",
    author: "传说中的波仔",
    title: "成都街边的蹄花耙撸撸的！配上鲜椒蘸水！吃起来连皮带筋的这也太过瘾了！",
    url: "https://www.douyin.com/video/7286785550986611983",
    shareURL: "https://v.douyin.com/lYh4k0_Z9y0/",
    platform: "douyin",
    publishedOn: "2023-10-06",
    publishedOnNote: "2023年探店视频 · 营业情况待核实",
    durationSeconds: 78.32,
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍与口述：成都街边路边摊鲜椒热拌蹄花，连皮带筋，位于郫都区，尚缺门牌与街道，保留视频库待补充街区或郫都区扩图接入。",
    segments: [
      {
        id: "cd-bozai-tihua",
        name: "成都街边鲜椒热拌蹄花摊",
        category: "川味小吃 / 蹄花",
        summary: "传说中的波仔探访的成都街边蹄花摊，大铁锅慢炖奶白浓汤大蹄花，耙软脱骨连皮带筋，现捞热拌秘制青红小米椒剁椒蘸水，鲜辣脆爽，市井烟火气十足。",
        addressText: "成都市郫都区街边小吃摊（具体门牌待核）",
        start: 0,
        end: 78.32,
        posterSecond: 3,
        coordinates: null,
        locationStatus: "unlocated-source",
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-mizijun-7496389147616218379",
    author: "密子君",
    title: "上头了一人花795元！把南方烧烤当自助餐吃！",
    url: "https://www.douyin.com/video/7496389147616218379",
    shareURL: "https://v.douyin.com/SjcQX9q5ov4/",
    platform: "douyin",
    publishedOn: "2025-04-23",
    durationSeconds: 516.83,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为杨老头鲜货烧烤(太古里店)，地址位于锦江区远洋太古里28栋L2层2307B，地处春熙路太古里大慈寺核心商圈。",
    segments: [
      {
        id: "cd-mizijun-yanglaotou-taikooli",
        name: "杨老头鲜货烧烤（太古里店）",
        category: "烧烤 / 江湖菜",
        summary: "密子君大快朵颐的市井鲜货烧烤名店，主打鲜切现串生烤牛肉、秘制爆油五花肉、烤脑花与招牌特辣辣椒面，烟火缭绕，肉香四溢。",
        addressText: "成都市锦江区中纱帽街8号成都远洋太古里28栋L2层2307B",
        start: 0,
        end: 516.83,
        posterSecond: 12,
        coordinates: [104.0818, 30.6552],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 春熙路太古里商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "远洋太古里核心商圈，吸附中纱帽街/大慈寺路真实道路节点（距离10.8米）",
          reviewedOn: "2026-11-08",
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
    id: "cd-yangdui-7618146716805614874",
    author: "杨队！快来吃点！",
    title: "棚户级环境殿堂级美味，郫县这家苍蝇馆子六菜一汤盲点不踩雷！",
    url: "https://www.douyin.com/video/7618146716805614874",
    shareURL: "https://v.douyin.com/4eLGP6Ub_Tc/",
    platform: "douyin",
    publishedOn: "2026-03-17",
    durationSeconds: 418.84,
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍与交流：杨队（PSY.P）探访郫县鹃城村传奇苍蝇馆子周师饭店，招牌猛火急炒肝腰合炒、火爆肥肠、酥肉响皮汤与凉拌土鸡，地处郫都区中心城区西北外围。",
    segments: [
      {
        id: "cd-yangdui-zhoushi",
        name: "周师饭店（鹃城村店）",
        category: "川菜 / 苍蝇馆子",
        summary: "杨队（PSY.P）探访的郫县传奇苍蝇馆子，急火短烹十秒出锅的嫩脆肝腰合炒、红润油亮的火爆肥肠、酥肉响皮汤与凉拌土鸡，地道老川菜锅气满满。",
        addressText: "成都市郫都区郫筒街道鹃城村6组",
        start: 0,
        end: 418.84,
        posterSecond: 13,
        coordinates: [103.8820, 30.8120],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "郫都区 · 鹃城村片区",
          basis: "video-poi-and-village-record",
          branchMatch: "exact-match",
          note: "位于郫都区郫筒街道，超出中心城区地图范围约15公里，标记待郫都区扩图",
          reviewedOn: "2026-11-08"
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-shashayouchanle-7694250186420137125",
    author: "鲨鲨又馋了",
    title: "成都真好吃呀！下辈子当川渝人",
    url: "https://www.douyin.com/video/7694250186420137125",
    shareURL: "https://v.douyin.com/h67qfH7ZTNw/",
    platform: "douyin",
    publishedOn: "2026-10-08",
    durationSeconds: 787.25,
    acquisitionStatus: "local-source",
    evidenceNote: "原片13分钟深度漫游成都街头名店：甘记肥肠粉马鞍北路总店、中华老字号西月城谭豆花总店、太古里回水镇江湖川菜。",
    segments: [
      {
        id: "cd-shashayouchanle-ganji",
        name: "甘记肥肠粉（马鞍北路总店）",
        category: "川味小吃 / 肥肠粉",
        summary: "鲨鲨打卡的成都米其林必比登老牌肥肠粉神店，大锅现冒红薯鲜粉，汤红油亮，大坨软烂肥肠搭配爆汁冒节子与现烤军屯锅魁，资格老成都味道。",
        addressText: "成都市金牛区马鞍北路18号（近梁家巷地铁站）",
        start: 45.0,
        end: 165.0,
        posterSecond: 60.0,
        coordinates: [104.0865, 30.6860],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "金牛区 · 马鞍北路梁家巷街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "原片价目表与招牌明确为甘记肥肠粉总店，吸附马鞍北路真实道路节点（距离28.6米）",
          reviewedOn: "2026-11-08",
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
      },
      {
        id: "cd-shashayouchanle-huishuizhen",
        name: "回水镇·江湖川菜（太古里店）",
        category: "川菜 / 江湖菜",
        summary: "鲨鲨品尝的高人气市井江湖川菜，麻辣鲜香、大火翻炒的黑豆花水煮鱼、火爆双脆配现烤松脆锅边馍，川味浓郁极致下饭。",
        addressText: "成都市锦江区东大街下东大街段太古里商圈",
        start: 325.0,
        end: 380.0,
        posterSecond: 330.0,
        coordinates: [104.0825, 30.6538],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 太古里东大街街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "太古里东大街商圈，吸附东大街真实道路节点（距离35.9米）",
          reviewedOn: "2026-11-08",
          anchor: {
            kind: "osm-way",
            id: "road:东大街下东大街段",
            name: "东大街下东大街段",
            nearestNode: 26640,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      },
      {
        id: "cd-shashayouchanle-tandouhua",
        name: "西月城谭豆花（太升南路总店）",
        category: "川味小吃 / 老字号",
        summary: "鲨鲨探访的中华老字号百年名店（创于1924年），细腻绵滑的招牌豆花面拌麻酱红油、冰爽清润的旋子凉粉与经典散子豆花，醇厚回甜非遗技艺。",
        addressText: "成都市青羊区太升南路282号附3号",
        start: 410.0,
        end: 530.0,
        posterSecond: 420.0,
        coordinates: [104.0782, 30.6628],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 太升南路商圈",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "中华老字号西月城谭豆花总店，吸附太升南路真实道路节点（距离15.6米）",
          reviewedOn: "2026-11-08",
          anchor: {
            kind: "osm-way",
            id: "road:太升南路",
            name: "太升南路",
            nearestNode: 22741,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-xiehuangbao-7670453083968785664",
    author: "蟹黄宝",
    title: "跑成都避暑却意外解锁了我的人生烧烤 藏得太深了！",
    url: "https://www.douyin.com/video/7670453083968785664",
    shareURL: "https://v.douyin.com/_HFD063j7A4/",
    platform: "douyin",
    publishedOn: "2026-08-05",
    durationSeconds: 272.93,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为醉火火鲜货烧烤(鑫都汇店)，位于天府新区南湖板块祥鹤二街，属于城南天府新区外围区域。",
    segments: [
      {
        id: "cd-xiehuangbao-zuihuohuo",
        name: "醉火火鲜货烧烤（鑫都汇店）",
        category: "烧烤 / 江湖菜",
        summary: "蟹黄宝打卡的人生烧烤宝藏小店，招牌现烤大鱿鱼、鲜烤五花肉与秘制香辣蟹，炭火焦香十足，江湖气息浓烈。",
        addressText: "成都市天府新区祥鹤二街183号（鑫苑鑫都汇商区内）",
        start: 0,
        end: 272.93,
        posterSecond: 10,
        coordinates: [104.0320, 30.4950],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "天府新区 · 南湖鑫都汇商圈",
          basis: "video-poi-and-amap-address",
          branchMatch: "exact-match",
          note: "位于天府新区南湖片区，超出中心城区地图范围约12公里，标记待天府新区扩图",
          reviewedOn: "2026-11-08"
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-rourou-7024754924965661956",
    author: "肉肉大搜索",
    title: "成都“巨难找牛爆爆”麻辣冒菜，超大片牛肉100多一大盆，麻麻辣辣巨下饭",
    url: "https://www.douyin.com/video/7024754924965661956",
    shareURL: "https://v.douyin.com/9CLuiz0omUM/",
    platform: "douyin",
    publishedOn: "2021-10-30",
    publishedOnNote: "2021年探店视频 · 营业情况待核实",
    durationSeconds: 234.29,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI与高德对应为成华区猛追湾街10号晓薇冒菜，深巷大脸盆超大片现滑嫩牛肉与千层肚冒菜。",
    segments: [
      {
        id: "cd-rourou-xiaoweimaocai",
        name: "晓薇冒菜（猛追湾店）",
        category: "冒菜 / 川味小吃",
        summary: "肉肉大搜索探访的猛追湾居民区深处巨难找麻辣冒菜，大脸盆装满超大片鲜滑嫩牛肉、毛肚、千层肚与脆鸭肠，红油底料醇厚麻辣，极度下饭。",
        addressText: "成都市成华区猛追湾街10号附1号",
        start: 0,
        end: 234.29,
        posterSecond: 15,
        coordinates: [104.0888, 30.6690],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 猛追湾街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "原片POI明确为晓薇冒菜，地址猛追湾街10号，吸附猛追湾街真实道路节点（距离27.4米）",
          reviewedOn: "2026-11-08",
          anchor: {
            kind: "osm-way",
            id: "road:猛追湾街",
            name: "猛追湾街",
            nearestNode: 17250,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-yizhihedapang-7661852443047369078",
    author: "一只何大胖",
    title: "来成都就要跟着本地人找吃的！整理成都吃喝玩乐一整天攻略",
    url: "https://www.douyin.com/video/7661852443047369078",
    shareURL: "https://v.douyin.com/1ourAZRGnNY/",
    platform: "douyin",
    publishedOn: "2026-07-13",
    durationSeconds: 110.57,
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍推荐成都10年以上老店：牛市口铁门杂酱面、文庙西街贺记蛋烘糕、兴禅寺街甩记小吃店。",
    segments: [
      {
        id: "cd-yizhihedapang-tiemen",
        name: "铁门杂酱面（牛市口店）",
        category: "面馆 / 川味小吃",
        summary: "何大胖推荐的成都40年市井老面馆，浓油赤酱手剁肉臊素椒杂酱面，配皮薄馅嫩的红油水饺与海味抄手，老成都地道早餐碳水。",
        addressText: "成都市锦江区牛市口路22号附6号",
        start: 22.0,
        end: 35.0,
        posterSecond: 26.0,
        coordinates: [104.1030, 30.6410],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "锦江区 · 牛市口街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "牛市口路22号老店，吸附牛市口路真实道路节点（距离75.8米）",
          reviewedOn: "2026-11-08",
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
        id: "cd-yizhihedapang-heji",
        name: "贺记蛋烘糕（文庙西街总店）",
        category: "川味小吃 / 蛋烘糕",
        summary: "文翁石室中学旁的成都非遗老字号蛋烘糕总店，外皮焦脆内里软糯，麻辣牛肉、肉松大头菜、老干妈肉松与经典红糖芝麻等数十种咸甜馅料任选。",
        addressText: "成都市青羊区文庙西街1号附1号",
        start: 35.0,
        end: 49.0,
        posterSecond: 36.0,
        coordinates: [104.0540, 30.6510],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 文庙西街石室街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "文庙西街总店，吸附文庙西街真实道路节点（距离22.2米）",
          reviewedOn: "2026-11-08",
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
        id: "cd-yizhihedapang-shuaiji",
        name: "甩记小吃店（兴禅寺街店）",
        category: "川菜 / 苍蝇馆子",
        summary: "藏在成华区兴禅寺街老居民楼下的地道苍蝇小馆，无华丽环境却烟火气十足，家常小炒与特色小吃风味浓郁接地气。",
        addressText: "成都市成华区兴禅寺街居民楼下",
        start: 49.0,
        end: 63.0,
        posterSecond: 52.0,
        coordinates: [104.0950, 30.6710],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "成华区 · 猛追湾兴禅寺街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "兴禅寺街居民楼老店，吸附兴禅寺街真实道路节点（距离124.6米）",
          reviewedOn: "2026-11-08",
          anchor: {
            kind: "osm-way",
            id: "road:兴禅寺街",
            name: "兴禅寺街",
            nearestNode: 17732,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-renyi-7514320630787919167",
    author: "Renyi毅哥",
    title: "在工地旁的小摊怒点12个菜会有多下饭！爆辣鲜拌肥肠猪头肉，搭配刚出锅的粉蒸牛肉",
    url: "https://www.douyin.com/video/7514320630787919167",
    shareURL: "https://v.douyin.com/WAuZrW4cZxk/",
    platform: "douyin",
    publishedOn: "2025-06-11",
    durationSeconds: 191.80,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为唐拌虎脑花·肥肠，位于武侯区一环路南一段5号，主打热拌肥肠、鲜脑花与粉蒸牛肉。",
    segments: [
      {
        id: "cd-renyi-tangbanhu",
        name: "唐拌虎脑花·肥肠（一环路店）",
        category: "快餐 / 川味小吃",
        summary: "Renyi毅哥在工地旁怒点12个菜的烟火小摊，招牌热拌鲜滑肥肠、红油脑花与刚出锅的粉蒸牛肉，香辣开胃，脆弹过瘾，分量十足。",
        addressText: "成都市武侯区一环路南一段5号",
        start: 0,
        end: 191.80,
        posterSecond: 10,
        coordinates: [104.0797, 30.6401],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 一环路南一段川大街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "原片POI明确为一环路南一段5号，吸附一环路南一段真实道路节点（距离44.5米）",
          reviewedOn: "2026-11-08",
          anchor: {
            kind: "osm-way",
            id: "road:一环路南一段",
            name: "一环路南一段",
            nearestNode: 29829,
            sourceDate: "2026-11-05",
            method: "road-network-snap"
          }
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-yangdui-7683090587154779401",
    author: "杨队！快来吃点！",
    title: "云贵川胃私藏的成都云南菜，普洱烤鸡干香浓郁，臭豆腐脑花味道直冲天灵盖！",
    url: "https://www.douyin.com/video/7683090587154779401",
    shareURL: "https://v.douyin.com/Mw82XErdUVY/",
    platform: "douyin",
    publishedOn: "2026-09-08",
    durationSeconds: 413.48,
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍与口述：从锦江区搬迁至城南南门新址的地道云南风味菜馆，普洱炭火烤乌鸡、臭豆腐渎脑花与边境辣螃蟹，位于城南外围。",
    segments: [
      {
        id: "cd-yangdui-yunnancai",
        name: "南边私藏云南菜小馆",
        category: "地方菜 / 云南菜",
        summary: "杨队私藏的成都地道滇味餐馆，招牌炭火普洱烤乌鸡干香酥脆、臭豆腐渎脑花臭香浓烈入味、边境辣活螃蟹与现烤牛肉串，风味奇绝。",
        addressText: "成都市城南天府/华阳片区（新搬南门分店）",
        start: 0,
        end: 413.48,
        posterSecond: 14,
        coordinates: [104.0450, 30.5200],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "城南 · 天府华阳片区",
          basis: "video-dialogue-and-south-gate",
          branchMatch: "unnamed-stall",
          note: "原片明确说明从锦江区搬至南门新店，超出中心城区地图范围约10公里，标记待城南扩图",
          reviewedOn: "2026-11-08"
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wangxun-7609124019572428095",
    author: "演员王迅",
    title: "成都肥肠粉 在成都，为一口地道美味，打车花的钱，比吃饭还多。",
    url: "https://www.douyin.com/video/7609124019572428095",
    shareURL: "https://v.douyin.com/JDYn8DwpzQo/",
    platform: "douyin",
    publishedOn: "2026-02-21",
    durationSeconds: 300.74,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为郑老八肥肠粉，位于武侯区草金路南段139号（近金花站），属于武侯新城外围区域。",
    segments: [
      {
        id: "cd-wangxun-zhengba",
        name: "郑老八肥肠粉（草金路店）",
        category: "川味小吃 / 肥肠粉",
        summary: "演员王迅专程打车跨城寻访的资格老牌肥肠粉店，现烫软滑红薯粉配油亮红汤，拌肥肠、拌节子与大碗鲜浓肥肠汤，地道成都老饕的私藏美味。",
        addressText: "成都市武侯区草金路南段139号（近地铁10号线金花站）",
        start: 0,
        end: 300.74,
        posterSecond: 15,
        coordinates: [103.9692, 30.6159],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "武侯区 · 草金路金花街区",
          basis: "video-poi-and-amap-address",
          branchMatch: "exact-match",
          note: "位于武侯新城金花板块，超出中心城区地图西边界约4公里，标记待武侯新城扩图",
          reviewedOn: "2026-11-08"
        },
        routeEligible: false
      }
    ]
  },
  {
    id: "cd-wulala-7078883833852087566",
    author: "特别乌啦啦",
    title: "花22元吃「素椒面」～成都到底有没有好吃的面？",
    url: "https://www.douyin.com/video/7078883833852087566",
    shareURL: "https://v.douyin.com/_CgLELjY4gE/",
    platform: "douyin",
    publishedOn: "2022-03-26",
    publishedOnNote: "2022年探店视频 · 营业情况待核实",
    durationSeconds: 275.01,
    acquisitionStatus: "local-source",
    evidenceNote: "原片POI明确为眼哥素椒面，位于青羊区金丝街22号文殊院街区，与已有cd-fengwei-yangesujiaomian实现同店多博主共同落点归并。",
    segments: [
      {
        id: "cd-wulala-yangesujiaomian",
        placeId: "cd-fengwei-yangesujiaomian",
        name: "眼哥素椒面（文殊院店）",
        category: "面馆 / 川味面食",
        summary: "特别乌啦啦专程打卡的老成都文殊院金丝街深处名面，手工手擀劲道面条裹满浓郁素椒肉酱与秘制复合红油，干香油润回味微甜，成都面食天花板之一。",
        addressText: "成都市青羊区金丝街22号附12号（近文殊院）",
        start: 0,
        end: 275.01,
        posterSecond: 10,
        coordinates: [104.077609, 30.667122],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "青羊区 · 金丝街文殊院街区",
          basis: "video-address-and-osm-road",
          branchMatch: "exact-match",
          note: "与风味篇同店归并落点，吸附金丝街真实道路节点（距离39.4米）",
          reviewedOn: "2026-11-08",
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
    id: "cd-xiaozhang-7640394328993233657",
    author: "小张一人食",
    title: "在成都体验232/位的黑珍珠川菜自助，看看到底有多快乐",
    url: "https://www.douyin.com/video/7640394328993233657",
    shareURL: "https://v.douyin.com/wnf0mdr1WWc/",
    platform: "douyin",
    publishedOn: "2026-05-16",
    durationSeconds: 575.43,
    acquisitionStatus: "local-source",
    evidenceNote: "原片实拍仁和新城商场与许家艺创菜自选菜单，位于高新区成汉南路仁和新城4楼，属于高新南区府城大道板块。",
    segments: [
      {
        id: "cd-xiaozhang-xujiacai",
        name: "许家艺创菜（仁和新城店）",
        category: "川菜 / 黑珍珠精品",
        summary: "小张一人食测评的黑珍珠二钻旗下川菜单点现做精致自助，大红袍脆皮乳鸽、青花椒水煮牛肉、陈皮灯影牛肉、烧椒黑猪红烧肉与招牌精致川式点心任点畅吃。",
        addressText: "成都市高新区成汉南路与府城大道西段交汇处仁和新城购物中心4楼",
        start: 0,
        end: 575.43,
        posterSecond: 12,
        coordinates: [104.0538, 30.5898],
        locationStatus: "approximate-planning",
        coordinateSystem: "WGS84",
        planningLocation: {
          accuracy: "approximate",
          label: "高新区 · 府城大道仁和新城商圈",
          basis: "video-mall-directory-and-amap",
          branchMatch: "exact-match",
          note: "位于高新南区府城大道仁和新城，超出中心城区地图南边界约1公里，标记待高新南区扩图",
          reviewedOn: "2026-11-08"
        },
        routeEligible: false
      }
    ]
  }
];

// Fill in sourceSHA256 from source.sha256 files
for (const s of batch4Sources) {
  const shaFile = path.join(intakeBase, s.id, 'source.sha256');
  if (fs.existsSync(shaFile)) {
    s.sourceSHA256 = fs.readFileSync(shaFile, 'utf-8').trim();
  } else {
    console.error('Missing sha for ' + s.id);
  }
}

// Read current library
const libPath = 'map-base/data/cities/chengdu/video-library.json';
const lib = JSON.parse(fs.readFileSync(libPath, 'utf-8'));

// Filter out any existing entries with these IDs to allow re-running cleanly
const existingIds = new Set(batch4Sources.map(s => s.id));
lib.sources = lib.sources.filter(s => !existingIds.has(s.id));
lib.sources.push(...batch4Sources);

fs.writeFileSync(libPath, JSON.stringify(lib, null, 2) + '\n', 'utf-8');
console.log('Successfully updated chengdu video-library.json!');
console.log('Total sources now:', lib.sources.length);
console.log('Total segments now:', lib.sources.reduce((sum, s) => sum + s.segments.length, 0));
