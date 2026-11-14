import json
import shutil
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"

# 1. Rename directories to valid slugs
slug_renames = {
    "hb-东北两口子全国炫-7621837609320704677": "hb-liangkou-7621837609320704677",
    "hb-咸鱼不是keii-7698221299197592827": "hb-xianyu-7698221299197592827",
    "hb-特别乌啦啦-7267829572761062668": "hb-wulala-7267829572761062668",
    "hb-野生Bunny-7589967426209484082": "hb-bunny-7589967426209484082"
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

# 2. Define new batch 3 sources & segments
batch3_sources = [
    {
        "id": "hb-liangkou-7621837609320704677",
        "author": "东北两口子全国炫饭",
        "title": "两口子极限48小时，哈尔滨14家美食全是宝藏小店",
        "url": "https://www.douyin.com/video/7621837609320704677",
        "shareURL": "https://v.douyin.com/Q4CHFE7LA1E/",
        "publishedOn": b2_map.get("hb-liangkou-7621837609320704677", {}).get("publishedOn", "2026-03-24"),
        "durationSeconds": b2_map.get("hb-liangkou-7621837609320704677", {}).get("durationSeconds", 252.79),
        "sourceSHA256": b2_map.get("hb-liangkou-7621837609320704677", {}).get("sourceSHA256", "06f43bb5767bdf51ff08a68ba7a48d885ae3c06e89758cb1fe32bdfb7713d7e8"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "东北两口子全国炫饭哈尔滨探店视频，实地打卡香坊区东北农业大学著名十年老店善嘉农大烤盘。",
        "segments": [
            {
                "id": "hb-liangkou-nongdakaopan",
                "name": "善嘉农大烤盘（香坊农大店）",
                "category": "东北特色烤肉 / 农大烤盘",
                "summary": "香坊区东北农业大学旁传奇烤盘名店，招牌烤牛肉与酸菜五花肉焦香四溢，铁盘滋滋冒油配干调蘸料风味绝佳。",
                "addressText": "哈尔滨市香坊区公滨路木材东街农大生活区附近",
                "start": 10.0,
                "end": 22.0,
                "posterSecond": 13.0,
                "coordinates": [126.6688094, 45.7240401],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "公滨路农大生活区路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片香坊农大烤盘老店线索采用开放地图对象【公滨路】（OSM node 24319）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 24319,
                        "name": "公滨路段",
                        "url": "https://www.openstreetmap.org/node/24319",
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
        "id": "hb-wulala-7267829572761062668",
        "author": "特别乌啦啦",
        "title": "花69元在哈尔滨吃「东北菜」～快乐需要用心发现 美食从来不分贵贱",
        "url": "https://www.douyin.com/video/7267829572761062668",
        "shareURL": "https://v.douyin.com/bAprtztSy8Y/",
        "publishedOn": b2_map.get("hb-wulala-7267829572761062668", {}).get("publishedOn", "2023-08-16"),
        "durationSeconds": b2_map.get("hb-wulala-7267829572761062668", {}).get("durationSeconds", 301.53),
        "sourceSHA256": b2_map.get("hb-wulala-7267829572761062668", {}).get("sourceSHA256", "4328982631526848148b894191d908fa9fa41634629ea3cb71c4c92ba1887e2b"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "特别乌啦啦哈尔滨东北菜探店视频，实地打卡森林街著名嘉样小吃（穷鬼大乐园），大盘锅包肉溜三样。",
        "segments": [
            {
                "id": "hb-wulala-jiayangxiaochi",
                "name": "嘉样小吃（森林街穷鬼大乐园店）",
                "category": "东北家常菜 / 市井小吃馆",
                "summary": "道里区森林街著名高性价比老菜馆，大盘金黄酥脆锅包肉、软嫩咸鲜溜三样与下饭尖椒肥肠，量大实惠烟火气十足。",
                "addressText": "哈尔滨市道里区森林街小吃一条街",
                "start": 5.0,
                "end": 17.0,
                "posterSecond": 6.0,
                "coordinates": [126.6236249, 45.7749261],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "道里区森林街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片森林街嘉样小吃线索采用开放地图对象【森林街】（OSM node 10446）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10446,
                        "name": "森林街路段",
                        "url": "https://www.openstreetmap.org/node/10446",
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
        "id": "hb-bunny-7589967426209484082",
        "author": "野生Bunny",
        "title": "哈尔滨三日游超详细逛吃打卡攻略！三天玩遍13个热门景点打卡19家宝藏美食",
        "url": "https://www.douyin.com/video/7589967426209484082",
        "shareURL": "https://v.douyin.com/41vgluJdkO0/",
        "publishedOn": b2_map.get("hb-bunny-7589967426209484082", {}).get("publishedOn", "2026-01-01"),
        "durationSeconds": b2_map.get("hb-bunny-7589967426209484082", {}).get("durationSeconds", 642.29),
        "sourceSHA256": b2_map.get("hb-bunny-7589967426209484082", {}).get("sourceSHA256", "d58ce8bb2e8006bf069796ff02ee3fc42d9921c327244908075d5a9fae8b15d9"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "野生Bunny哈尔滨逛吃纪实，实地打卡安静街早市与中央大街山河屯铁锅炖名店。",
        "segments": [
            {
                "id": "hb-bunny-anjingzaoshi",
                "name": "安静街早市（哈尔滨市井大早市）",
                "category": "哈尔滨市井早市 / 特色早点小吃",
                "summary": "道里区安静街哈尔滨本地人最爱的烟火气早市，金黄现煎粘豆包、热气腾腾羊汤、牛肉火勺与刚出锅油条豆腐脑集结。",
                "addressText": "哈尔滨市道里区安静街与安升街交界处",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 13.0,
                "coordinates": [126.6079366, 45.7586255],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "安静街与安升街交汇路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片安静街早市线索采用开放地图对象【安静街】（OSM node 14494）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 14494,
                        "name": "安静街早市路段",
                        "url": "https://www.openstreetmap.org/node/14494",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 早市早间营业待确认"
            },
            {
                "id": "hb-bunny-shanhetunzhongyang",
                "name": "山河屯铁锅炖（中央大街店）",
                "category": "东北铁锅炖 / 炖排骨大鹅",
                "summary": "中央大街旁黑龙江老字号铁锅炖旗舰店，大锅慢炖大鹅、排骨土豆豆角，金黄玉米饼子贴在锅边焦香软糯。",
                "addressText": "哈尔滨市道里区中央大街近红专街路段",
                "start": 384.0,
                "end": 396.0,
                "posterSecond": 385.0,
                "coordinates": [126.6137516, 45.7688439],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中央大街近红专街交汇处",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街山河屯铁锅炖线索采用开放地图对象【中央大街】（OSM node 10353）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10353,
                        "name": "中央大街路段",
                        "url": "https://www.openstreetmap.org/node/10353",
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
        "id": "hb-xianyu-7698221299197592827",
        "author": "咸鱼不是keii",
        "title": "这个冬天总要和好朋友一起去趟东北早市吧！感受下东北早市的烟火气！",
        "url": "https://www.douyin.com/video/7698221299197592827",
        "shareURL": "https://v.douyin.com/oMOaqpNTY9o/",
        "publishedOn": b2_map.get("hb-xianyu-7698221299197592827", {}).get("publishedOn", "2026-01-08"),
        "durationSeconds": b2_map.get("hb-xianyu-7698221299197592827", {}).get("durationSeconds", 33.72),
        "sourceSHA256": b2_map.get("hb-xianyu-7698221299197592827", {}).get("sourceSHA256", "35b1789e0ff5b736b7cf9e527d9760773d72ff37c89b7fa43d78c3b4cfc13fc9"),
        "acquisitionStatus": "local-source",
        "evidenceNote": "咸鱼不是keii哈尔滨早市探店视频，打卡安静街早市金黄现煎粘豆包与王氏干炸里脊。",
        "segments": [
            {
                "id": "hb-xianyu-anjingzaoshi",
                "placeId": "hb-bunny-anjingzaoshi",
                "name": "安静街早市（哈尔滨市井大早市）",
                "category": "哈尔滨市井早市 / 特色早点小吃",
                "summary": "道里区安静街哈尔滨本地人最爱的烟火气早市，金黄现煎粘豆包、热气腾腾羊汤、牛肉火勺与刚出锅油条豆腐脑集结。",
                "addressText": "哈尔滨市道里区安静街与安升街交界处",
                "start": 0.0,
                "end": 12.0,
                "posterSecond": 1.0,
                "coordinates": [126.6079366, 45.7586255],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "安静街与安升街交汇路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片安静街早市线索采用开放地图对象【安静街】（OSM node 14494）作为街区参照。",
                    "reviewedOn": "2026-11-14",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 14494,
                        "name": "安静街早市路段",
                        "url": "https://www.openstreetmap.org/node/14494",
                        "sourceDate": "2026-11-14",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 早市早间营业待确认"
            }
        ]
    }
]

# 3. Append to video-library.json
vl_path = root / "map-base/data/cities/harbin/video-library.json"
vl = json.load(open(vl_path, encoding="utf-8"))
existing_sids = {s["id"] for s in vl["sources"]}

for ns in batch3_sources:
    if ns["id"] in existing_sids:
        idx = next(i for i, s in enumerate(vl["sources"]) if s["id"] == ns["id"])
        vl["sources"][idx] = ns
    else:
        vl["sources"].append(ns)

# Update rights scope
vl["rights"]["scope"] = "哈尔滨探店视频来源由用户提供，经确认已获作者特别乌啦啦、小珍来咯…、橘子公主、澳仔、刘雨鑫JASON、盗月社食遇记、面条人、PP超能炫、特厨隋坡（重新出发版）、真探唐仁杰、玲子reiko、给我囊次一口、达哥在上海、东北两口子全国炫饭、野生Bunny、咸鱼不是keii允许剪辑并在食途网站使用；保留原平台、原作者与原作品链接。"
vl["preparedOn"] = "2026-11-14"

with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

print(f"video-library.json updated: {len(vl['sources'])} sources, {sum(len(s['segments']) for s in vl['sources'])} segments.")
