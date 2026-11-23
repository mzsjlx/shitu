import json
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
lib_path = root / "map-base/data/cities/harbin/video-library.json"
intake_dir = root / "map-base/.local/video-intake"

with open(lib_path, "r", encoding="utf-8") as f:
    lib = json.load(f)

# Clean out any partial additions from previous test run
target_new_source_ids = {
    "hb-wulala-7270343915872505143",
    "hb-weiwei-7588038557453913370",
    "hb-xiaotui-7554309439802543387",
    "hb-xiaociwei-7592457034574985701",
    "hb-caomeixiong-7592438166386019237",
    "hb-daoyueshe-7600245288900529454",
    "hb-tanchiwang-7670859043891634408",
    "hb-lige-7537340285953592595",
    "hb-kanqiuzugeju-7590255878650072370",
    "hb-chongchong-7620362169690983707",
    "hb-chongchong-7613676327157140782",
    "hb-linchenshui-7584347255247818035"
}

lib['sources'] = [s for s in lib['sources'] if s['id'] not in target_new_source_ids]

def get_sha256(sid):
    mp4 = intake_dir / sid / "source.mp4"
    if mp4.exists():
        return hashlib.sha256(mp4.read_bytes()).hexdigest()
    return ""

new_sources = [
    {
        "id": "hb-wulala-7270343915872505143",
        "author": "特别乌啦啦",
        "title": "花27元吃黏黏糊糊的「砂锅面」～吃面没有空调等于没有空调",
        "url": "https://www.douyin.com/video/7270343915872505143",
        "publishedOn": "2023-08-23",
        "durationSeconds": 317.73,
        "sourceSHA256": get_sha256("hb-wulala-7270343915872505143"),
        "segments": [
            {
                "id": "hb-wulala-jizhiwei-shaguomian",
                "name": "前宏吉之味砂锅面（金太阳店）",
                "category": "传统面馆 / 特色麻酱砂锅面",
                "summary": "圣索菲亚大教堂旁金太阳6楼大众点评必吃榜名面，双拼面条浇上秘制浓厚麻酱与热气腾腾小砂锅。",
                "addressText": "哈尔滨市道里区地段街128号索菲亚金太阳买手商城6楼",
                "start": 20.0,
                "end": 32.0,
                "posterSecond": 24.0,
                "coordinates": [126.6279486, 45.769538],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "金太阳商城地段街门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片索菲亚金太阳买手商城6楼线索采用开放地图对象【地段街路段】（OSM node 10470）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10470,
                        "name": "地段街路段",
                        "url": "https://www.openstreetmap.org/node/10470",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2023年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-weiwei-7588038557453913370",
        "author": "特厨魏味",
        "title": "特厨探店|无数人推荐的哈尔滨道外老菜馆，味道怎么样？——崔家 鸡馆",
        "url": "https://www.douyin.com/video/7588038557453913370",
        "publishedOn": "2025-12-25",
        "durationSeconds": 298.28,
        "sourceSHA256": get_sha256("hb-weiwei-7588038557453913370"),
        "segments": [
            {
                "id": "hb-weiwei-cuijia-jiguan",
                "name": "崔家鸡馆（正阳北小区店）",
                "category": "老道外本帮菜 / 传统名菜",
                "summary": "中华巴洛克历史街区旁道外老字号苍蝇小馆，招牌红焖溜达鸡、滑熘里脊与传统老道外菜品。",
                "addressText": "哈尔滨市道外区北十道街17号",
                "start": 22.0,
                "end": 34.0,
                "posterSecond": 25.0,
                "coordinates": [126.657072, 45.7883848],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "北十道街与正阳街交口",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外北十道街17号正阳北小区线索采用开放地图对象【北十道街】（OSM node 5959）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5959,
                        "name": "北十道街路段",
                        "url": "https://www.openstreetmap.org/node/5959",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-xiaotui-7554309439802543387",
        "author": "小颓废的嘴",
        "title": "哈尔滨美味大排骨～ 哈尔滨一家没有牌匾的几十年老店",
        "url": "https://www.douyin.com/video/7554309439802543387",
        "publishedOn": "2025-09-26",
        "durationSeconds": 93.33,
        "sourceSHA256": get_sha256("hb-xiaotui-7554309439802543387"),
        "segments": [
            {
                "id": "hb-xiaotui-juju-caiguan",
                "name": "居家菜馆（下夹树街店）",
                "category": "市井融合私房菜 / 百姓小馆",
                "summary": "始名369小吃红房子，哈埠早年融合菜百姓私房老字号，招牌桂花排骨与黄蘑扣肉。",
                "addressText": "哈尔滨市南岗区下夹树街20号",
                "start": 16.0,
                "end": 28.0,
                "posterSecond": 20.0,
                "coordinates": [126.6340077, 45.7530281],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "下夹树街居民区路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片下夹树街20号原369小吃线索采用开放地图对象【下夹树街】（OSM node 15149）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 15149,
                        "name": "下夹树街路段",
                        "url": "https://www.openstreetmap.org/node/15149",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-xiaociwei-7592457034574985701",
        "author": "钮祜禄小刺猬",
        "title": "带姐妹来吃我的多年宝藏韩餐小店！",
        "url": "https://www.douyin.com/video/7592457034574985701",
        "publishedOn": "2026-01-07",
        "durationSeconds": 293.07,
        "sourceSHA256": get_sha256("hb-xiaociwei-7592457034574985701"),
        "segments": [
            {
                "id": "hb-xiaociwei-lajiaogaoshou",
                "name": "辣椒高手韩国辣料理（中央大街店）",
                "category": "韩式料理 / 辣炖鸡爪与芝士年糕",
                "summary": "中央大街商圈红霞街宝藏韩式小馆，浓郁焦糖拉丝芝士熔岩、热辣炖鸡爪与金枪鱼饭团。",
                "addressText": "哈尔滨市道里区红霞街59号",
                "start": 6.0,
                "end": 18.0,
                "posterSecond": 10.0,
                "coordinates": [126.6206181, 45.7676427],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "红霞街中央大街交汇街区",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街红霞街59号线索采用开放地图对象【红霞街】（OSM node 12368）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 12368,
                        "name": "红霞街路段",
                        "url": "https://www.openstreetmap.org/node/12368",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-caomeixiong-7592438166386019237",
        "author": "杨草莓熊",
        "title": "哈尔滨是有好吃面包的！",
        "url": "https://www.douyin.com/video/7592438166386019237",
        "publishedOn": "2026-01-07",
        "durationSeconds": 369.33,
        "sourceSHA256": get_sha256("hb-caomeixiong-7592438166386019237"),
        "segments": [
            {
                "id": "hb-caomeixiong-danko-bakery",
                "name": "丹科手工面包（DANKO BAKERY）",
                "category": "俄式手工面包 / 烘焙甜点",
                "summary": "花园街俄罗斯师傅主理手工面包坊，扎实纯正俄式大列巴、传统甜品与黑麦发酵烘焙。",
                "addressText": "哈尔滨市南岗区花园街D区20号",
                "start": 14.0,
                "end": 26.0,
                "posterSecond": 18.0,
                "coordinates": [126.6392326, 45.7577553],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "花园街水木清华社区",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片花园街D区20号文汇路口线索采用开放地图对象【花园街】（OSM node 15218）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 15218,
                        "name": "花园街路段",
                        "url": "https://www.openstreetmap.org/node/15218",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-daoyueshe-7600245288900529454",
        "author": "盗月社食遇记",
        "title": "哈尔滨本地朋友私藏的两家神级小店！ 第二家直接把我击穿了",
        "url": "https://www.douyin.com/video/7600245288900529454",
        "publishedOn": "2026-01-28",
        "durationSeconds": 526.29,
        "sourceSHA256": get_sha256("hb-daoyueshe-7600245288900529454"),
        "segments": [
            {
                "id": "hb-daoyueshe-changchun222-shuijiao",
                "name": "长春街222号无名三鲜水饺",
                "category": "老道外水饺 / 独门纯手工水饺",
                "summary": "老道外长春街无招牌隐秘小馆，红纸门牌仅卖一锅纯手工传统三鲜水饺，皮薄多汁肉馅爆鲜。",
                "addressText": "哈尔滨市道外区长春街222号",
                "start": 248.0,
                "end": 260.0,
                "posterSecond": 252.0,
                "coordinates": [126.6656899, 45.7884652],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "长春街222号老街巷",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片长春街222号门贴线索采用开放地图对象【长春街】（OSM node 6166）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 6166,
                        "name": "长春街路段",
                        "url": "https://www.openstreetmap.org/node/6166",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-tanchiwang-7670859043891634408",
        "author": "哈尔滨贪吃王👑",
        "title": "哈尔滨十大苍蝇馆子大盘点（权威版）",
        "url": "https://www.douyin.com/video/7670859043891634408",
        "publishedOn": "2026-10-02",
        "durationSeconds": 117.63,
        "sourceSHA256": get_sha256("hb-tanchiwang-7670859043891634408"),
        "segments": [
            {
                "id": "hb-tanchiwang-xubaopu",
                "name": "徐包铺（丰润街店）",
                "category": "老道外字号 / 传统包子熏酱",
                "summary": "中华巴洛克历史街区小学旁老字号包子铺，手工热气腾腾大肉包配精选哈尔滨自制熏酱。",
                "addressText": "哈尔滨市道外区丰润街17号",
                "start": 62.0,
                "end": 74.0,
                "posterSecond": 66.0,
                "coordinates": [126.6537809, 45.7866809],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "丰润街中华巴洛克路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外区丰润街17号117中学对面线索采用开放地图对象【丰润街】（OSM node 6003）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 6003,
                        "name": "丰润街路段",
                        "url": "https://www.openstreetmap.org/node/6003",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-lige-7537340285953592595",
        "author": "李哥我饿了",
        "title": "上有天堂，下有红肠 环游中国第五站，哈尔滨下",
        "url": "https://www.douyin.com/video/7537340285953592595",
        "publishedOn": "2025-08-12",
        "durationSeconds": 272.30,
        "sourceSHA256": get_sha256("hb-lige-7537340285953592595"),
        "segments": [
            {
                "id": "hb-lige-yongshun-xiaochi",
                "name": "永顺小吃（长春街店）",
                "category": "老道外小吃 / 招牌肘子配老汤豆腐",
                "summary": "老道外长春街镇街之宝，路边大爷推荐的软烂咸甜家常大肘子、老汤豆腐与地道东北家常菜。",
                "addressText": "哈尔滨市道外区长春街37号",
                "start": 14.0,
                "end": 26.0,
                "posterSecond": 18.0,
                "coordinates": [126.6626617, 45.7871784],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "长春街永顺小吃门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外长春街37号线索采用开放地图对象【长春街】（OSM node 6173）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 6173,
                        "name": "长春街路段",
                        "url": "https://www.openstreetmap.org/node/6173",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-kanqiuzugeju-7590255878650072370",
        "author": "看球组个局",
        "title": "新年勇闯哈尔滨干饭攻略，跟着特别乌啦啦逛本地菜市场",
        "url": "https://www.douyin.com/video/7590255878650072370",
        "publishedOn": "2026-01-01",
        "durationSeconds": 164.84,
        "sourceSHA256": get_sha256("hb-kanqiuzugeju-7590255878650072370"),
        "segments": [
            {
                "id": "hb-kanqiuzugeju-daolishichang",
                "placeId": "hb-lingzi-daolishichang",
                "name": "道里菜市场（百年老字号美食城）",
                "category": "百年室内菜市 / 东北名吃聚集地",
                "summary": "何浩楠、卓沅与特别乌啦啦打卡道里菜市场，品尝大煎饼、熏酱熟食与市井烟火。",
                "addressText": "哈尔滨市道里区尚志大街57号",
                "start": 18.0,
                "end": 30.0,
                "posterSecond": 22.0,
                "coordinates": [126.6161925, 45.7725128],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "尚志大街道里菜市场门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道里菜市场线索采用开放地图对象【尚志大街】（OSM node 10271）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10271,
                        "name": "尚志大街路段",
                        "url": "https://www.openstreetmap.org/node/10271",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-chongchong-7620362169690983707",
        "author": "小紧张的虫虫",
        "title": "不用早起也能逛的东北早市，大冬天零上20度的户内早市！",
        "url": "https://www.douyin.com/video/7620362169690983707",
        "publishedOn": "2026-03-24",
        "durationSeconds": 849.57,
        "sourceSHA256": get_sha256("hb-chongchong-7620362169690983707"),
        "segments": [
            {
                "id": "hb-chongchong-daolishichang",
                "placeId": "hb-lingzi-daolishichang",
                "name": "道里菜市场（百年老字号美食城）",
                "category": "百年室内菜市 / 东北名吃聚集地",
                "summary": "南方博主冬日零上20度舒适打卡道里菜市场，热腾腾的东北大包、蛋堡与红肠烤冷面一网打尽。",
                "addressText": "哈尔滨市道里区尚志大街57号",
                "start": 10.0,
                "end": 22.0,
                "posterSecond": 15.0,
                "coordinates": [126.6161925, 45.7725128],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "尚志大街道里菜市场门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道里菜市场线索采用开放地图对象【尚志大街】（OSM node 10271）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10271,
                        "name": "尚志大街路段",
                        "url": "https://www.openstreetmap.org/node/10271",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-chongchong-7613676327157140782",
        "author": "小紧张的虫虫",
        "title": "南方人逛东北零下早市，眼睛一亮又一亮！",
        "url": "https://www.douyin.com/video/7613676327157140782",
        "publishedOn": "2026-03-05",
        "durationSeconds": 671.47,
        "sourceSHA256": get_sha256("hb-chongchong-7613676327157140782"),
        "segments": [
            {
                "id": "hb-chongchong-hongzhuanzaoshi",
                "placeId": "hb-lingzi-hongzhuanzaoshi",
                "name": "红专街早市（哈尔滨百年晨市）",
                "category": "哈尔滨百年晨市 / 特色早点小吃",
                "summary": "零下二十度冰城晨光中的热气腾腾红专街早市，油炸糕、蛋堡、热豆浆与满街烟火长队。",
                "addressText": "哈尔滨市道里区红专街（近红霞街口）",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 16.0,
                "coordinates": [126.6111815, 45.7725927],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "红专街早市步行街口",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片红专街早市线索采用开放地图对象【红专街】（OSM node 10302）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10302,
                        "name": "红专街路段",
                        "url": "https://www.openstreetmap.org/node/10302",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-linchenshui-7584347255247818035",
        "author": "林晨睡",
        "title": "第一次被陌生人请客吃饭 哈尔滨太有温度了",
        "url": "https://www.douyin.com/video/7584347255247818035",
        "publishedOn": "2025-12-16",
        "durationSeconds": 381.55,
        "sourceSHA256": get_sha256("hb-linchenshui-7584347255247818035"),
        "segments": [
            {
                "id": "hb-linchenshui-zhangfeibarou",
                "placeId": "hb-liuyuxin-zhangfeibarou",
                "name": "道外张飞扒肉（南五道街老店）",
                "category": "老道外名吃 / 传统扒肉",
                "summary": "老道外百年传统扒肉名店，肥而不腻酥烂脱骨的传统扒肉淋上汤汁拌白米饭，尽显冰城人情暖意。",
                "addressText": "哈尔滨市道外区南五道街258号",
                "start": 28.0,
                "end": 40.0,
                "posterSecond": 32.0,
                "coordinates": [126.637052, 45.7828147],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "南五道街张飞扒肉门前",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片南五道街张飞扒肉线索采用开放地图对象【南五道街】（OSM node 5780）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5780,
                        "name": "南五道街路段",
                        "url": "https://www.openstreetmap.org/node/5780",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2025年视频 · 营业情况待确认"
            }
        ]
    }
]

lib['sources'].extend(new_sources)

with open(lib_path, "w", encoding="utf-8") as f:
    json.dump(lib, f, ensure_ascii=False, indent=2)

print(f"Perfectly integrated {len(new_sources)} new sources with full metadata schema!")
total_sources = len(lib['sources'])
total_segments = sum(len(s['segments']) for s in lib['sources'])
unique_spots = len({seg['placeId'] if 'placeId' in seg else seg['id'] for s in lib['sources'] for seg in s['segments']})
print(f"Total in Library: {total_sources} sources, {total_segments} segments across {unique_spots} unique spots.")
