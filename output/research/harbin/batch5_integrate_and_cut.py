import json
import shutil
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"

# 1. Rename directories to valid slugs
slug_renames = {
    "hb-杨草莓熊-7603573604471421305": "hb-caomeixiong-7603573604471421305",
    "hb-小饭熊不正常-7429264519756614949": "hb-xiaofanxiong-7429264519756614949"
}

for old_name, new_name in slug_renames.items():
    p_old = intake_dir / old_name
    if p_old.exists():
        p_new = intake_dir / new_name
        if p_new.exists():
            shutil.rmtree(p_new)
        p_old.rename(p_new)

b2_path = root / "output/research/harbin/batch2_resolved.json"
b2_items = json.load(open(b2_path, encoding="utf-8")) if b2_path.exists() else []
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

batch5_sources = [
    {
        "id": "hb-yunibobo-7233354874224725287",
        "author": "芋泥啵啵",
        "title": "东北简直就是我梦中的故乡啊！老昌熏肉大饼",
        "url": "https://www.douyin.com/video/7233354874224725287",
        "shareURL": "https://v.douyin.com/JLy6YYqT1F4/",
        "publishedOn": "2023-05-15",
        "durationSeconds": 46.35,
        "sourceSHA256": get_sha256("hb-yunibobo-7233354874224725287"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "芋泥啵啵哈尔滨美食探店，实地打卡中央大街老昌熏肉大饼，现烙薄酥大饼卷大块熏肉煎蛋土豆丝。",
        "segments": [
            {
                "id": "hb-yunibobo-laochang",
                "name": "老昌熏肉大饼（中央大街店）",
                "category": "东北老字号 / 传统熏肉大饼",
                "summary": "哈尔滨百年老字号熏肉大饼，现烙热腾腾层层酥脆薄饼，卷入大片酱香熏肉、软嫩煎蛋与爽脆土豆丝，抹上面酱葱丝卷着吃。",
                "addressText": "哈尔滨市道里区中央大街近红专街路段",
                "start": 15.0,
                "end": 27.0,
                "posterSecond": 17.0,
                "coordinates": [126.6137516, 45.7688439],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中央大街近红专街交汇处",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街老昌熏肉大饼线索采用开放地图对象【中央大街】（OSM node 10353）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10353,
                        "name": "中央大街路段",
                        "url": "https://www.openstreetmap.org/node/10353",
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
        "id": "hb-caomeixiong-7603573604471421305",
        "author": "杨草莓熊",
        "title": "哈尔滨是有好吃甜品的！山也法式甜品店",
        "url": "https://www.douyin.com/video/7603573604471421305",
        "shareURL": "https://v.douyin.com/340faI0rmFA/",
        "publishedOn": b2_map.get("hb-caomeixiong-7603573604471421305", {}).get("publishedOn", "2026-01-20"),
        "durationSeconds": b2_map.get("hb-caomeixiong-7603573604471421305", {}).get("durationSeconds", 448.77),
        "sourceSHA256": get_sha256("hb-caomeixiong-7603573604471421305"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "杨草莓熊哈尔滨甜品探店，打卡道里红霞街山也法式甜品，招牌香草拿破仑与日本小柚子酥脆可口。",
        "segments": [
            {
                "id": "hb-caomeixiong-shanye",
                "name": "山也 Patisserie 法式甜品（红霞街店）",
                "category": "精品法式西点 / 手工拿破仑",
                "summary": "道里区红霞街高品质法式甜点私房，金黄酥脆千层香草拿破仑、日本小柚子酸甜果香慕斯与手冲咖啡风味清爽。",
                "addressText": "哈尔滨市道里区红霞街街区",
                "start": 16.0,
                "end": 28.0,
                "posterSecond": 25.0,
                "coordinates": [126.606617, 45.7698523],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区红霞街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道里区红霞街法式甜品线索采用开放地图对象【红专街/红霞街】（OSM node 10232）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10232,
                        "name": "红霞街周边路段",
                        "url": "https://www.openstreetmap.org/node/10232",
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
        "id": "hb-xiaofanxiong-7429264519756614949",
        "author": "小饭熊不正常",
        "title": "大馋丫头勇闯哈尔滨，2天30顿，一天胖10斤，美食太多啦",
        "url": "https://www.douyin.com/video/7429264519756614949",
        "shareURL": "https://v.douyin.com/TBpR0Kn5bQg/",
        "publishedOn": b2_map.get("hb-xiaofanxiong-7429264519756614949", {}).get("publishedOn", "2024-10-24"),
        "durationSeconds": b2_map.get("hb-xiaofanxiong-7429264519756614949", {}).get("durationSeconds", 346.1),
        "sourceSHA256": get_sha256("hb-xiaofanxiong-7429264519756614949"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "小饭熊不正常哈尔滨探店，实地打卡道外靖宇街老字号透油牛杂大包，热气腾腾牛窝骨软烂爆汁。",
        "segments": [
            {
                "id": "hb-xiaofanxiong-niuzabao",
                "name": "远东清真牛杂大包（道外巴洛克店）",
                "category": "东北传统大包 / 清真熟食名吃",
                "summary": "道外中华巴洛克核心区传统清真包子铺，手工老面现蒸透油麻辣牛杂包、软糯牛窝骨大包，肉馅多汁油香四溢。",
                "addressText": "哈尔滨市道外区靖宇街近北四道街路段",
                "start": 10.0,
                "end": 22.0,
                "posterSecond": 15.0,
                "coordinates": [126.6394231, 45.7838566],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "靖宇街近北四道街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外老清真大包线索采用开放地图对象【靖宇街】（OSM node 5700）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 5700,
                        "name": "靖宇街路段",
                        "url": "https://www.openstreetmap.org/node/5700",
                        "sourceDate": "2026-11-15",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2024年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-liuyuxin-7597760285105065251",
        "author": "刘雨鑫JASON",
        "title": "黑龙江哈尔滨，来晚就吃不上的人气铁锅炖，尝尝怎么样？",
        "url": "https://www.douyin.com/video/7597760285105065251",
        "shareURL": "https://v.douyin.com/cydwJOuvbtc/",
        "publishedOn": "2025-01-20",
        "durationSeconds": 139.73,
        "sourceSHA256": get_sha256("hb-liuyuxin-7597760285105065251"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "刘雨鑫JASON哈尔滨探店视频，实地打卡道外江畔老牌柴火铁锅炖大鹅，整只大鹅鲜嫩多汁贴热乎玉米饼。",
        "segments": [
            {
                "id": "hb-liuyuxin-chaihuotieguo",
                "name": "柴火人家铁锅炖大鹅（道外江畔店）",
                "category": "东北铁锅炖 / 柴火炖大鹅",
                "summary": "道外江畔老牌柴火铁锅炖，大铁锅慢煨肥美东北大鹅，配干豆角、宽粉与土豆，锅沿现贴焦黄玉米饼子沾满浓香鹅汤。",
                "addressText": "哈尔滨市道外区大新街江畔段",
                "start": 5.0,
                "end": 17.0,
                "posterSecond": 8.0,
                "coordinates": [126.6508932, 45.7892144],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道外区大新街江畔路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外江畔柴火铁锅炖线索采用开放地图对象【大新街/靖宇街】（OSM node 11210）作为街区参照。",
                    "reviewedOn": "2026-11-15",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 11210,
                        "name": "大新街路段",
                        "url": "https://www.openstreetmap.org/node/11210",
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

# 3. Append to video-library.json
vl_path = root / "map-base/data/cities/harbin/video-library.json"
vl = json.load(open(vl_path, encoding="utf-8"))
existing_sids = {s["id"] for s in vl["sources"]}

for ns in batch5_sources:
    if ns["id"] in existing_sids:
        idx = next(i for i, s in enumerate(vl["sources"]) if s["id"] == ns["id"])
        vl["sources"][idx] = ns
    else:
        vl["sources"].append(ns)

# Update rights scope
vl["rights"]["scope"] = "哈尔滨探店视频来源由用户提供，经确认已获作者特别乌啦啦、小珍来咯…、橘子公主、澳仔、刘雨鑫JASON、盗月社食遇记、面条人、PP超能炫、特厨隋坡（重新出发版）、真探唐仁杰、玲子reiko、给我囊次一口、达哥在上海、东北两口子全国炫饭、野生Bunny、咸鱼不是keii、崔佳楠、李哥我饿了、二百者也、小蒲同学、小颓废的嘴、喵喵酱、汤氏熊、猴儿甜猴儿甜、花二Strange、芋泥啵啵、杨草莓熊、小饭熊不正常允许剪辑并在食途网站使用；保留原平台、原作者与原作品链接。"
vl["preparedOn"] = "2026-11-15"

with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

all_segs = [seg for s in vl["sources"] for seg in s["segments"]]
unique_spots = set(seg.get("placeId") or seg["id"] for seg in all_segs)
print(f"video-library.json updated: {len(vl['sources'])} sources, {len(all_segs)} segments, {len(unique_spots)} unique map spots.")
