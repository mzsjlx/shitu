import json
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
lib_path = root / "map-base/data/cities/harbin/video-library.json"
assets_path = root / "map-base/data/cities/harbin/video-library-assets.json"
intake_dir = root / "map-base/.local/video-intake"

with open(lib_path, "r", encoding="utf-8") as f:
    lib = json.load(f)

# Find primary segments
primary_map = {}
for s in lib['sources']:
    for seg in s['segments']:
        if not seg.get('placeId') or seg.get('placeId') == seg['id']:
            primary_map[seg['id']] = seg

# Filter out the 6 new sources if partially added
lib['sources'] = [s for s in lib['sources'] if s['id'] not in [
    "hb-mingming-7702462176011194609",
    "hb-xiaoxuanbaobao-7597317049454497078",
    "hb-wangmian-7608143548450848699",
    "hb-liuyikou-7619254660604247721",
    "hb-yizhezhengbao-7702647090325159652",
    "hb-rikkuxianbuxian-7626363099980762313"
]]

def get_real_sha256(sid):
    mp4 = intake_dir / sid / "source.mp4"
    return hashlib.sha256(mp4.read_bytes()).hexdigest()

new_sources = [
    {
        "id": "hb-mingming-7702462176011194609",
        "author": "明明的幸福生活",
        "title": "来哈尔滨一定要去的道里菜市场 能买1个不买2个，能买5块钱不买10块钱",
        "url": "https://www.douyin.com/video/7702462176011194609",
        "shareURL": "https://v.douyin.com/GaOSzr0Z2pM/",
        "publishedOn": "2026-10-30",
        "durationSeconds": 522.05,
        "sourceSHA256": get_real_sha256("hb-mingming-7702462176011194609"),
        "acquisitionStatus": "ready",
        "evidenceNote": "博主实地探访哈尔滨道里菜市场，分享排队传统粘豆包、中之杰大饼子与各色东北传统熟食。",
        "segments": [
            {
                "id": "hb-mingming-daolishichang",
                "placeId": "hb-lingzi-daolishichang",
                "name": primary_map["hb-lingzi-daolishichang"]["name"],
                "category": primary_map["hb-lingzi-daolishichang"]["category"],
                "summary": "明明的幸福生活实地打卡道里菜市场，细数招牌粘豆包、大饼子与传统老街熟食。",
                "addressText": primary_map["hb-lingzi-daolishichang"]["addressText"],
                "start": 26.0,
                "end": 38.0,
                "posterSecond": 32.0,
                "coordinates": primary_map["hb-lingzi-daolishichang"]["coordinates"],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": primary_map["hb-lingzi-daolishichang"]["planningLocation"],
                "routeEligible": False,
                "footageNote": "明明的幸福生活实地打卡道里菜市场老式面点与粘豆包摊位。"
            }
        ]
    },
    {
        "id": "hb-xiaoxuanbaobao-7597317049454497078",
        "author": "小旋宝宝",
        "title": "沉浸式逛吃哈尔滨早市，烟火气十足直接吃爽了！",
        "url": "https://www.douyin.com/video/7597317049454497078",
        "shareURL": "https://v.douyin.com/UMFjkC-TVLY/",
        "publishedOn": "2026-01-20",
        "durationSeconds": 363.81,
        "sourceSHA256": get_real_sha256("hb-xiaoxuanbaobao-7597317049454497078"),
        "acquisitionStatus": "ready",
        "evidenceNote": "博主冬日清晨打卡红专街早市，体验烟火升腾的铁板煎血肠、米肠与特色早市热食。",
        "segments": [
            {
                "id": "hb-xiaoxuanbaobao-hongzhuanzaoshi",
                "placeId": "hb-lingzi-hongzhuanzaoshi",
                "name": primary_map["hb-lingzi-hongzhuanzaoshi"]["name"],
                "category": primary_map["hb-lingzi-hongzhuanzaoshi"]["category"],
                "summary": "小旋宝宝冬日清晨逛吃红专街早市，热气腾腾的铁板煎血肠、米肠与传统炸物烟火气十足。",
                "addressText": primary_map["hb-lingzi-hongzhuanzaoshi"]["addressText"],
                "start": 66.0,
                "end": 78.0,
                "posterSecond": 72.0,
                "coordinates": primary_map["hb-lingzi-hongzhuanzaoshi"]["coordinates"],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": primary_map["hb-lingzi-hongzhuanzaoshi"]["planningLocation"],
                "routeEligible": False,
                "footageNote": "小旋宝宝实拍红专街早市铁板煎血肠摊位与热火朝天的早市晨景。"
            }
        ]
    },
    {
        "id": "hb-wangmian-7608143548450848699",
        "author": "王勉",
        "title": "我说实话，东北麻辣烫，还是得在东北吃。",
        "url": "https://www.douyin.com/video/7608143548450848699",
        "shareURL": "https://v.douyin.com/OJgu7InmbbU/",
        "publishedOn": "2026-02-18",
        "durationSeconds": 339.45,
        "sourceSHA256": get_real_sha256("hb-wangmian-7608143548450848699"),
        "acquisitionStatus": "ready",
        "evidenceNote": "王勉实地探店哈尔滨道里区卓展购物中心邵胖子麻辣烫，吸溜浓郁醇厚的大碗老式麻辣烫。",
        "segments": [
            {
                "id": "hb-wangmian-shaopangzi-zhuozhan",
                "placeId": "hb-wangmian-shaopangzi-zhuozhan",
                "name": "邵胖子麻辣烫（卓展购物中心店）",
                "category": "特色面食 / 老式麻辣烫",
                "summary": "王勉打卡哈尔滨卓展购物中心邵胖子麻辣烫，大碗现煮老式东北麻辣烫浓香过瘾。",
                "addressText": "哈尔滨市道里区上海街99号卓展购物中心负一层B1-7室",
                "start": 175.0,
                "end": 187.0,
                "posterSecond": 180.0,
                "coordinates": [126.606617, 45.758569],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "上海街卓展购物中心",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片与POI线索采用开放地图对象【上海街路段】（OSM node 14361）作为街区参照。",
                    "reviewedOn": "2026-11-16",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 14361,
                        "name": "上海街路段",
                        "url": "https://www.openstreetmap.org/node/14361",
                        "sourceDate": "2026-11-16",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "王勉实拍卓展购物中心邵胖子麻辣烫大碗现煮与热腾腾吸溜镜头。"
            }
        ]
    },
    {
        "id": "hb-liuyikou-7619254660604247721",
        "author": "刘一口",
        "title": "哈尔滨麻辣面谁家最权威，哪个是你心中的number one……",
        "url": "https://www.douyin.com/video/7619254660604247721",
        "shareURL": "https://v.douyin.com/6zSjHYDS5iw/",
        "publishedOn": "2026-03-18",
        "durationSeconds": 68.5,
        "sourceSHA256": get_real_sha256("hb-liuyikou-7619254660604247721"),
        "acquisitionStatus": "ready",
        "evidenceNote": "刘一口实地评测道外区南极三道街老字号天意麻辣面，劲道猪皮、卤干豆腐与经典红油麻辣面。",
        "segments": [
            {
                "id": "hb-liuyikou-tianyimalamian",
                "placeId": "hb-liuyikou-tianyimalamian",
                "name": "天意麻辣面（南极三道街老店）",
                "category": "特色面食 / 老道外传统麻辣面",
                "summary": "刘一口实地评测哈尔滨老道外天意麻辣面，经典红油手擀面搭配猪皮与卤干豆腐滋味醇厚。",
                "addressText": "哈尔滨市道外区南极三道街23号",
                "start": 36.0,
                "end": 48.0,
                "posterSecond": 40.0,
                "coordinates": [126.644294, 45.775067],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "南极三道街老街区",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片天意麻辣面南极三道街线索采用开放地图对象【南极三道街】（OSM node 8606）作为街区参照。",
                    "reviewedOn": "2026-11-16",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 8606,
                        "name": "南极三道街路段",
                        "url": "https://www.openstreetmap.org/node/8606",
                        "sourceDate": "2026-11-16",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "刘一口实拍天意麻辣面老店招牌、红油面条与猪皮干豆腐拼盘。"
            }
        ]
    },
    {
        "id": "hb-yizhezhengbao-7702647090325159652",
        "author": "一只蒸包zz",
        "title": "哈尔滨vlog：吃美了",
        "url": "https://www.douyin.com/video/7702647090325159652",
        "shareURL": "https://v.douyin.com/Bm5is0EXL18/",
        "publishedOn": "2026-10-31",
        "durationSeconds": 346.0,
        "sourceSHA256": get_real_sha256("hb-yizhezhengbao-7702647090325159652"),
        "acquisitionStatus": "ready",
        "evidenceNote": "博主漫步中央大街打卡本土经典完达山·乳此新鲜，品尝招牌宝藏草莓牛乳与新鲜奶香乳品。",
        "segments": [
            {
                "id": "hb-yizhezhengbao-wandashan-zhongyangdajie",
                "placeId": "hb-yizhezhengbao-wandashan-zhongyangdajie",
                "name": "完达山·乳此新鲜（中央大街店）",
                "category": "面包甜品 / 本土经典乳品冰饮",
                "summary": "一只蒸包zz漫步中央大街打卡本土经典老字号完达山·乳此新鲜，清爽奶香草莓牛乳十分解腻。",
                "addressText": "哈尔滨市道里区中央大街66号松雷国际商厦F1层",
                "start": 315.0,
                "end": 327.0,
                "posterSecond": 322.0,
                "coordinates": [126.619564, 45.769431],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中央大街松雷商厦",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街66号线索采用开放地图对象【中央大街路段】（OSM node 10432）作为街区参照。",
                    "reviewedOn": "2026-11-16",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10432,
                        "name": "中央大街路段",
                        "url": "https://www.openstreetmap.org/node/10432",
                        "sourceDate": "2026-11-16",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "一只蒸包zz实拍中央大街完达山乳此新鲜草莓牛乳杯身与松雷商厦街景。"
            }
        ]
    },
    {
        "id": "hb-rikkuxianbuxian-7626363099980762313",
        "author": "rikku闲不咸",
        "title": "哈尔滨｜三天吃了20家！本地人珍藏美食！",
        "url": "https://www.douyin.com/video/7626363099980762313",
        "shareURL": "https://v.douyin.com/FdnPZRxUKQA/",
        "publishedOn": "2026-04-06",
        "durationSeconds": 342.59,
        "sourceSHA256": get_real_sha256("hb-rikkuxianbuxian-7626363099980762313"),
        "acquisitionStatus": "ready",
        "evidenceNote": "博主实地打卡哈尔滨高人气烘焙心朋制菓，品尝百万单品热腾腾金黄海盐牛角面包。",
        "segments": [
            {
                "id": "hb-rikkuxianbuxian-xinpengzhiguo",
                "placeId": "hb-rikkuxianbuxian-xinpengzhiguo",
                "name": "心朋制菓·盐面包（红博中央公园店）",
                "category": "面包甜品 / 人气海盐烘焙",
                "summary": "rikku闲不咸打卡哈尔滨人气排队王心朋制菓，刚出炉的金黄海盐面包外皮酥软香浓。",
                "addressText": "哈尔滨市南岗区红旗大街339号红博中央公园",
                "start": 67.0,
                "end": 79.0,
                "posterSecond": 72.0,
                "coordinates": [126.698442, 45.758015],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "红旗大街红博中央公园",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片红旗大街红博中央公园线索采用开放地图对象【红旗大街路段】（OSM node 16228）作为街区参照。",
                    "reviewedOn": "2026-11-16",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 16228,
                        "name": "红旗大街路段",
                        "url": "https://www.openstreetmap.org/node/16228",
                        "sourceDate": "2026-11-16",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "rikku闲不咸实拍心朋制菓百万单品招牌海盐牛角面包特写。"
            }
        ]
    }
]

for s in new_sources:
    lib['sources'].append(s)
    print(f"Added source: {s['id']} (SHA256: {s['sourceSHA256'][:8]}...)")

lib_bytes = json.dumps(lib, ensure_ascii=False, indent=2).encode('utf-8')
with open(lib_path, "wb") as f:
    f.write(lib_bytes)

new_sha256 = hashlib.sha256(lib_bytes).hexdigest()
print(f"Updated video-library.json with {len(new_sources)} new sources. New SHA256: {new_sha256}")

# Update video-library-assets.json
if assets_path.exists():
    with open(assets_path, "r", encoding="utf-8") as f:
        assets = json.load(f)
    assets['catalogSHA256'] = new_sha256
    with open(assets_path, "w", encoding="utf-8") as f:
        json.dump(assets, f, ensure_ascii=False, indent=2)
    print("Updated catalogSHA256 in video-library-assets.json")
