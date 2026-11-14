import json
import shutil
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"

# 1. Rename directories to valid slugs
slug_renames = {
    "hb-崔佳楠-7308658908573256998": "hb-cuijianan-7308658908573256998",
    "hb-李哥我饿了-7460829367191571747": "hb-lige-7460829367191571747",
    "hb-刘雨鑫JASON-7290460823955197241": "hb-liuyuxin-7290460823955197241",
    "hb-二百者也-7399924817459219751": "hb-erbaizheye-7399924817459219751",
    "hb-玲子reiko-7605863016671792427": "hb-lingzi-7605863016671792427",
    "hb-小蒲同学-7684246987718093043": "hb-puputongxue-7684246987718093043",
    "hb-小颓废的嘴-7560616038187126025": "hb-xiaotui-7560616038187126025",
    "hb-喵喵酱-7300097591973268748": "hb-miaomiao-7300097591973268748",
    "hb-汤氏熊-7587357599683644709": "hb-tangshixiong-7587357599683644709",
    "hb-猴儿甜猴儿甜-7442281313752648997": "hb-houertian-7442281313752648997",
    "hb-花二Strang-7578396210692623625": "hb-huaer-7578396210692623625"
}

for old_name, new_name in slug_renames.items():
    p_old = intake_dir / old_name
    if p_old.exists():
        p_new = intake_dir / new_name
        if p_new.exists():
            shutil.rmtree(p_new)
        p_old.rename(p_new)

b2_path = root / "output/research/harbin/batch2_resolved.json"
b2_items = json.load(open(b2_path, encoding="utf-8"))
for it in b2_items:
    if it["sourceId"] in slug_renames:
        it["sourceId"] = slug_renames[it["sourceId"]]
json.dump(b2_items, open(b2_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

b2_map = {it["sourceId"]: it for it in b2_items}

def get_sha256(sid):
    p = intake_dir / sid / "source.mp4"
    if p.exists():
        h = hashlib.sha256()
        with open(p, "rb") as f:
            while chunk := f.read(1024*1024):
                h.update(chunk)
        return h.hexdigest()
    return ""

# 2. Define batch 4 sources & segments
batch4_sources = [
    {
        "id": "hb-cuijianan-7308658908573256998",
        "author": "崔佳楠",
        "title": "带512G胃吃遍哈尔滨美食！平价又无雷",
        "url": "https://www.douyin.com/video/7308658908573256998",
        "shareURL": "https://v.douyin.com/l2cFIhZwb1Q/",
        "publishedOn": b2_map.get("hb-cuijianan-7308658908573256998", {}).get("publishedOn", "2023-12-04"),
        "durationSeconds": b2_map.get("hb-cuijianan-7308658908573256998", {}).get("durationSeconds", 262.42),
        "sourceSHA256": get_sha256("hb-cuijianan-7308658908573256998"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "崔佳楠哈尔滨美食探店，实地打卡哈尔滨锅包肉发祥地百年老厨家。",
        "segments": [
            {
                "id": "hb-cuijianan-laochujia",
                "name": "老厨家（友谊路总店）",
                "category": "东北老字号 / 锅包肉创始人店",
                "summary": "哈尔滨锅包肉发源地百年老店，外皮酸甜金黄酥脆、肉片大而紧实，配招牌油炸冰棍与麻酱大拉皮。",
                "addressText": "哈尔滨市道里区友谊路与地段街交汇处",
                "start": 17.0,
                "end": 29.0,
                "posterSecond": 20.0,
                "coordinates": [126.6200495, 45.7750665],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "友谊路与地段街交汇路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片老厨家友谊路老店线索采用开放地图对象【地段街】（OSM node 8239）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 8239,
                        "name": "地段街北段",
                        "url": "https://www.openstreetmap.org/node/8239",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2023年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-lige-7460829367191571747",
        "author": "李哥我饿了",
        "title": "哈尔滨美食攻略 不看血亏，小鸟胃美食博主整理一个星期，用一条视频带你吃透哈尔滨",
        "url": "https://www.douyin.com/video/7460829367191571747",
        "shareURL": "https://v.douyin.com/FftUM9HN1ZQ/",
        "publishedOn": b2_map.get("hb-lige-7460829367191571747", {}).get("publishedOn", "2025-01-10"),
        "durationSeconds": b2_map.get("hb-lige-7460829367191571747", {}).get("durationSeconds", 185.39),
        "sourceSHA256": get_sha256("hb-lige-7460829367191571747"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "李哥我饿了哈尔滨美食攻略，实地推荐道外北三凯奇清真食品老店与透笼街金太阳吉之味麻辣烫。",
        "segments": [
            {
                "id": "hb-lige-kaiqiqingzhen",
                "name": "北三凯奇清真食品（道外老店）",
                "category": "传统清真糕点 / 老式光头饼",
                "summary": "道外中华巴洛克核心区排队长龙传奇点心铺，刚出炉传统老式光头饼外酥内暄，泡牛奶或咖啡风味绝佳。",
                "addressText": "哈尔滨市道外区北三道街与靖宇街交口",
                "start": 5.0,
                "end": 17.0,
                "posterSecond": 6.0,
                "coordinates": [126.6338307, 45.7827286],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "北三道街与靖宇街交口路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片北三凯奇清真食品线索采用开放地图对象【北三道街】（OSM node 5745）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5745,
                        "name": "北三道街路段",
                        "url": "https://www.openstreetmap.org/node/5745",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            },
            {
                "id": "hb-lige-jizhiweimalatang",
                "name": "吉之味麻辣烫（金太阳商厦店）",
                "category": "哈尔滨特色麻辣烫 / 金太阳老味道",
                "summary": "圣索菲亚大教堂旁金太阳商厦地下一层神级老店，浓郁醇厚麻酱汤底裹满宽粉、手擀面与素串。",
                "addressText": "哈尔滨市道里区透笼街金太阳商厦地下一层",
                "start": 18.0,
                "end": 30.0,
                "posterSecond": 19.0,
                "coordinates": [126.6249177, 45.768567],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "透笼街金太阳商厦路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片金太阳吉之味麻辣烫线索采用开放地图对象【透笼街】（OSM node 10442）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10442,
                        "name": "透笼街路段",
                        "url": "https://www.openstreetmap.org/node/10442",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-liuyuxin-7290460823955197241",
        "author": "刘雨鑫JASON",
        "title": "真的假的？在哈尔滨6毛就能撸串了？",
        "url": "https://www.douyin.com/video/7290460823955197241",
        "shareURL": "https://v.douyin.com/Wra5VDGimvY/",
        "publishedOn": b2_map.get("hb-liuyuxin-7290460823955197241", {}).get("publishedOn", "2023-10-17"),
        "durationSeconds": b2_map.get("hb-liuyuxin-7290460823955197241", {}).get("durationSeconds", 120.37),
        "sourceSHA256": get_sha256("hb-liuyuxin-7290460823955197241"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "刘雨鑫JASON哈尔滨探店视频，实地体验南岗革新街6毛烤串自由，小脆骨与羊油小串配大蒜。",
        "segments": [
            {
                "id": "hb-liuyuxin-liumaoxiaochuan",
                "name": "兄弟特色烤串（革新街6毛小串店）",
                "category": "东北市井烧烤 / 经典6毛小串",
                "summary": "南岗革新街老市井烟火气烤串铺，6毛钱一串现烤小脆骨、羊肉串带羊油香，配鲜豆皮大蒜吃出老哈尔滨夜生活。",
                "addressText": "哈尔滨市南岗区革新街夜市街区",
                "start": 5.0,
                "end": 17.0,
                "posterSecond": 10.0,
                "coordinates": [126.6569942, 45.7520736],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "革新街夜市路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片革新街6毛小串线索采用开放地图对象【革新街】（OSM node 15473）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 15473,
                        "name": "革新街路段",
                        "url": "https://www.openstreetmap.org/node/15473",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2023年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-erbaizheye-7399924817459219751",
        "author": "二百者也",
        "title": "哈尔滨200元开盲盒 接受第一波东北菜的暴击吧。",
        "url": "https://www.douyin.com/video/7399924817459219751",
        "shareURL": "https://v.douyin.com/EgRbH0w0h58/",
        "publishedOn": b2_map.get("hb-erbaizheye-7399924817459219751", {}).get("publishedOn", "2024-08-06"),
        "durationSeconds": b2_map.get("hb-erbaizheye-7399924817459219751", {}).get("durationSeconds", 346.19),
        "sourceSHA256": get_sha256("hb-erbaizheye-7399924817459219751"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "二百者也哈尔滨200元开盲盒探店，实地打卡道外中华巴洛克老太太扒肉馆。",
        "segments": [
            {
                "id": "hb-erbaizheye-laotaitai",
                "name": "老太太扒肉馆（道外巴洛克老店）",
                "category": "哈尔滨百年老字号 / 砂锅扒肉",
                "summary": "道外中华巴洛克历史街区著名扒肉老馆，整块五花大扒肉炖得软烂脱骨、入口即化，浇上肉汤拌米饭香浓过瘾。",
                "addressText": "哈尔滨市道外区南勋街中华巴洛克街区",
                "start": 1.0,
                "end": 13.0,
                "posterSecond": 3.0,
                "coordinates": [126.6470003, 45.7827904],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "南勋街中华巴洛克路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外老太太扒肉馆线索采用开放地图对象【南勋街】（OSM node 5870）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5870,
                        "name": "南勋街路段",
                        "url": "https://www.openstreetmap.org/node/5870",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2024年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-lingzi-7605863016671792427",
        "author": "玲子reiko",
        "title": "落地零下20度的哈尔滨，逛一波早市！",
        "url": "https://www.douyin.com/video/7605863016671792427",
        "shareURL": "https://v.douyin.com/peod9WX4C8s/",
        "publishedOn": b2_map.get("hb-lingzi-7605863016671792427", {}).get("publishedOn", "2026-02-04"),
        "durationSeconds": b2_map.get("hb-lingzi-7605863016671792427", {}).get("durationSeconds", 220.87),
        "sourceSHA256": get_sha256("hb-lingzi-7605863016671792427"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "玲子reiko哈尔滨落地探店视频，实地打卡红专街早市现炸大油条与油条包麻糍。",
        "segments": [
            {
                "id": "hb-lingzi-hongzhuanzaoshi",
                "name": "红专街早市（哈尔滨百年晨市）",
                "category": "哈尔滨百年晨市 / 特色早点小吃",
                "summary": "道里区百年红专街大早市，热气腾腾大油条配豆腐脑、油条包麻糍、大肉包与现煎粘豆包连吃七八摊。",
                "addressText": "哈尔滨市道里区红专街与红霞街交界处",
                "start": 3.0,
                "end": 15.0,
                "posterSecond": 4.0,
                "coordinates": [126.6111815, 45.7725927],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "红专街与红霞街交汇路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片红专街早市线索采用开放地图对象【红专街】（OSM node 10232）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10232,
                        "name": "红专街路段",
                        "url": "https://www.openstreetmap.org/node/10232",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 晨市早间营业待确认"
            }
        ]
    },
    {
        "id": "hb-puputongxue-7684246987718093043",
        "author": "小蒲同学",
        "title": "极限90分钟爽吃哈尔滨98元/位甜品自助 我不说谁能想到这是甜品自助的出品？？",
        "url": "https://www.douyin.com/video/7684246987718093043",
        "shareURL": "https://v.douyin.com/BuG88WNQbyU/",
        "publishedOn": b2_map.get("hb-puputongxue-7684246987718093043", {}).get("publishedOn", "2026-09-08"),
        "durationSeconds": b2_map.get("hb-puputongxue-7684246987718093043", {}).get("durationSeconds", 490.47),
        "sourceSHA256": get_sha256("hb-puputongxue-7684246987718093043"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "小蒲同学哈尔滨甜品自助探店，实地体验中央大街西十道街Lisa Bakery伊丽莎白烘焙甜品自助。",
        "segments": [
            {
                "id": "hb-puputongxue-lisabakery",
                "name": "Lisa Bakery 伊丽莎白烘焙（甜品自助店）",
                "category": "甜品西点 / 蛋糕自助",
                "summary": "98元限时自助西点殿堂，招牌开心果巴斯克、蓝天白云生椰慕斯、手工脆皮面包与多款法式切块甜品畅吃。",
                "addressText": "哈尔滨市道里区西十道街近中央大街",
                "start": 3.0,
                "end": 15.0,
                "posterSecond": 6.0,
                "coordinates": [126.6149157, 45.7695885],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区西十道街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片Lisa Bakery线索采用开放地图对象【西十道街】（OSM node 10363）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10363,
                        "name": "西十道街路段",
                        "url": "https://www.openstreetmap.org/node/10363",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-xiaotui-7560616038187126025",
        "author": "小颓废的嘴",
        "title": "在东北一口香迷糊你的铁锅炖到底该点什么！ 小姜告诉你！优先点排骨，鸡爪子，小鸡炖蘑菇锅",
        "url": "https://www.douyin.com/video/7560616038187126025",
        "shareURL": "https://v.douyin.com/qX7uhrtB3JY/",
        "publishedOn": b2_map.get("hb-xiaotui-7560616038187126025", {}).get("publishedOn", "2025-10-13"),
        "durationSeconds": b2_map.get("hb-xiaotui-7560616038187126025", {}).get("durationSeconds", 212.67),
        "sourceSHA256": get_sha256("hb-xiaotui-7560616038187126025"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "小颓废的嘴哈尔滨铁锅炖探店，实地打卡道里区安发街地道东北排骨鸡爪铁锅炖。",
        "segments": [
            {
                "id": "hb-xiaotui-laoshitieguodun",
                "name": "乡村老式铁锅炖（道里安发街店）",
                "category": "东北铁锅炖 / 炖排骨小鸡",
                "summary": "安发街地道东北柴火铁锅炖，鲜排骨、鸡爪与小鸡炖蘑菇，加盖帘慢炖软烂入味，锅沿贴满焦香玉米饼。",
                "addressText": "哈尔滨市道里区安发街街区",
                "start": 10.0,
                "end": 22.0,
                "posterSecond": 15.0,
                "coordinates": [126.6022208, 45.7563537],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区安发街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片乡村老式铁锅炖线索采用开放地图对象【安发街】（OSM node 14291）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 14291,
                        "name": "安发街路段",
                        "url": "https://www.openstreetmap.org/node/14291",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-miaomiao-7300097591973268748",
        "author": "喵喵酱",
        "title": "可惜你不来哈尔滨 不知道烤冷面有多好吃",
        "url": "https://www.douyin.com/video/7300097591973268748",
        "shareURL": "https://v.douyin.com/FTmVARS1EiM/",
        "publishedOn": b2_map.get("hb-miaomiao-7300097591973268748", {}).get("publishedOn", "2023-11-11"),
        "durationSeconds": b2_map.get("hb-miaomiao-7300097591973268748", {}).get("durationSeconds", 21.27),
        "sourceSHA256": get_sha256("hb-miaomiao-7300097591973268748"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "喵喵酱哈尔滨街头实拍，打卡师大夜市文兴街招牌金牌酸甜烤冷面。",
        "segments": [
            {
                "id": "hb-miaomiao-kaolengmian",
                "name": "小亮经典烤冷面（师大夜市总摊）",
                "category": "东北街头小吃 / 招牌烤冷面",
                "summary": "师大夜市排队大王烤冷面，面皮现烤刷满经典酸甜酱汁，裹上鸡蛋、洋葱香菜与火腿肠，外润内劲道。",
                "addressText": "哈尔滨市南岗区文兴街师大夜市核心路段",
                "start": 1.0,
                "end": 13.0,
                "posterSecond": 4.0,
                "coordinates": [126.6156426, 45.7225215],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "师大夜市文兴街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片师大夜市烤冷面线索采用开放地图对象【文兴街】（OSM node 23689）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 23689,
                        "name": "文兴街路段",
                        "url": "https://www.openstreetmap.org/node/23689",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2023年视频 · 夜市晚间营业待确认"
            }
        ]
    },
    {
        "id": "hb-tangshixiong-7587357599683644709",
        "author": "汤氏熊",
        "title": "中国冰城哈尔滨，烟火气美食之乡！哈尔滨美食攻略13家本地人私藏好店！",
        "url": "https://www.douyin.com/video/7587357599683644709",
        "shareURL": "https://v.douyin.com/B4NIeP08tzQ/",
        "publishedOn": b2_map.get("hb-tangshixiong-7587357599683644709", {}).get("publishedOn", "2025-12-25"),
        "durationSeconds": b2_map.get("hb-tangshixiong-7587357599683644709", {}).get("durationSeconds", 1024.0),
        "sourceSHA256": get_sha256("hb-tangshixiong-7587357599683644709"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "汤氏熊哈尔滨烟火气美食纪实，实地打卡道里区通达街热气腾腾大铜锅涮肚与烤串。",
        "segments": [
            {
                "id": "hb-tangshixiong-shuanduguo",
                "name": "老哈炭火涮肚（道里通达街店）",
                "category": "东北砂锅涮肚 / 炭火串烤",
                "summary": "哈尔滨通达街热气腾腾大铜锅涮肚，浓郁牛油香辣老汤底浸润千层肚与肉串，冬天围炉吃得汗流浃背。",
                "addressText": "哈尔滨市道里区通达街美食街区",
                "start": 970.0,
                "end": 982.0,
                "posterSecond": 975.0,
                "coordinates": [126.592412, 45.7475199],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "通达街美食街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片通达街炭火涮肚线索采用开放地图对象【通达街】（OSM node 16942）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 16942,
                        "name": "通达街路段",
                        "url": "https://www.openstreetmap.org/node/16942",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-houertian-7442281313752648997",
        "author": "猴儿甜猴儿甜",
        "title": "不看血亏！半个月整理的超强哈尔滨美食攻略！涵盖60多种美食！",
        "url": "https://www.douyin.com/video/7442281313752648997",
        "shareURL": "https://v.douyin.com/CTQQ7k3_Zgk/",
        "publishedOn": b2_map.get("hb-houertian-7442281313752648997", {}).get("publishedOn", "2024-11-28"),
        "durationSeconds": b2_map.get("hb-houertian-7442281313752648997", {}).get("durationSeconds", 679.23),
        "sourceSHA256": get_sha256("hb-houertian-7442281313752648997"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "猴儿甜猴儿甜哈尔滨超强美食攻略，实地打卡道外丰润街老字号鑫鑫砂锅居。",
        "segments": [
            {
                "id": "hb-houertian-xinxinshaguo",
                "name": "鑫鑫砂锅居（道外丰润街老店）",
                "category": "哈尔滨老字号砂锅 / 坛肉酸菜",
                "summary": "道外老区三十载砂锅老店，滚烫砂锅酸菜五花肉、浓油赤酱红烧坛肉，米饭拌肉汤连干三碗。",
                "addressText": "哈尔滨市道外区丰润街街区",
                "start": 145.0,
                "end": 157.0,
                "posterSecond": 149.0,
                "coordinates": [126.6425559, 45.7834787],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道外区丰润街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片丰润街鑫鑫砂锅居线索采用开放地图对象【丰润街】（OSM node 5867）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5867,
                        "name": "丰润街路段",
                        "url": "https://www.openstreetmap.org/node/5867",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2024年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-huaer-7578396210692623625",
        "author": "花二Strange",
        "title": "一口气50种哈尔滨特色美食！爽得起飞！无广！真本地人私藏美食！",
        "url": "https://www.douyin.com/video/7578396210692623625",
        "shareURL": "https://v.douyin.com/MzFw-ZDQpVU/",
        "publishedOn": b2_map.get("hb-huaer-7578396210692623625", {}).get("publishedOn", "2025-11-30"),
        "durationSeconds": b2_map.get("hb-huaer-7578396210692623625", {}).get("durationSeconds", 1090.27),
        "sourceSHA256": get_sha256("hb-huaer-7578396210692623625"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "花二Strange哈尔滨50种特色美食速通，打卡道里区安和街亮仔特色大盒饭。",
        "segments": [
            {
                "id": "hb-huaer-liangzaihefan",
                "name": "亮仔特色大盒饭（道里安和街店）",
                "category": "东北硬核盒饭 / 24小时自助快餐",
                "summary": "道里安和街名扬全城的东北大盒饭，二三十种热菜全自助，溜肉段、排骨红烧肉与地三鲜无限量任添。",
                "addressText": "哈尔滨市道里区安和街美食街区",
                "start": 240.0,
                "end": 252.0,
                "posterSecond": 242.0,
                "coordinates": [126.6033447, 45.7549651],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区安和街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片亮仔特色大盒饭线索采用开放地图对象【安和街】（OSM node 14360）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 14360,
                        "name": "安和街路段",
                        "url": "https://www.openstreetmap.org/node/14360",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 全天营业待确认"
            }
        ]
    }
]

# 3. Append to video-library.json
vl_path = root / "map-base/data/cities/harbin/video-library.json"
vl = json.load(open(vl_path, encoding="utf-8"))
existing_sids = {s["id"] for s in vl["sources"]}

for ns in batch4_sources:
    if ns["id"] in existing_sids:
        idx = next(i for i, s in enumerate(vl["sources"]) if s["id"] == ns["id"])
        vl["sources"][idx] = ns
    else:
        vl["sources"].append(ns)

# Update rights scope
vl["rights"]["scope"] = "哈尔滨探店视频来源由用户提供，经确认已获作者特别乌啦啦、小珍来咯…、橘子公主、澳仔、刘雨鑫JASON、盗月社食遇记、面条人、PP超能炫、特厨隋坡（重新出发版）、真探唐仁杰、玲子reiko、给我囊次一口、达哥在上海、东北两口子全国炫饭、野生Bunny、咸鱼不是keii、崔佳楠、李哥我饿了、二百者也、小蒲同学、小颓废的嘴、喵喵酱、汤氏熊、猴儿甜猴儿甜、花二Strange允许剪辑并在食途网站使用；保留原平台、原作者与原作品链接。"
vl["preparedOn"] = "2026-11-14"

with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

all_segs = [seg for s in vl["sources"] for seg in s["segments"]]
unique_spots = set(seg.get("placeId") or seg["id"] for seg in all_segs)
print(f"video-library.json updated: {len(vl['sources'])} sources, {len(all_segs)} segments, {len(unique_spots)} unique map spots.")
