import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
vl_path = root / "map-base/data/cities/harbin/video-library.json"

with open(vl_path, "r", encoding="utf-8") as f:
    vl = json.load(f)

# Update rights scope
vl["rights"]["scope"] = "哈尔滨探店视频来源由用户提供，经确认已获作者特别乌啦啦、小珍来咯…、橘子公主、澳仔、刘雨鑫JASON、盗月社食遇记、面条人、PP超能炫允许剪辑并在食途网站使用；保留原平台、原作者与原作品链接。"

# Define new sources and segments
new_sources = [
    {
        "id": "hb-daoyueshe-7599195778485161252",
        "author": "盗月社食遇记",
        "title": "再不敢去哈尔滨了！零下20度3天胖5斤，本地私藏美食太硬核了",
        "url": "https://www.douyin.com/video/7599195778485161252",
        "shareURL": "https://v.douyin.com/CN9I3pp3wbM/",
        "publishedOn": "2026-01-25",
        "durationSeconds": 1351.60,
        "sourceSHA256": "62b35f31565ec37c8257b7a3da323962432746412461bc82d433c2f174e4c283",
        "acquisitionStatus": "local-source",
        "evidenceNote": "盗月社食遇记哈尔滨美食纪实，实地探访红专街早市尹胖子油炸糕、道外中华巴洛克张包铺与中央大街马迭尔冷饮厅。",
        "segments": [
            {
                "id": "hb-daoyueshe-yinpangzi",
                "name": "尹胖子油炸糕（红专街早市店）",
                "category": "早市名吃 / 东北油炸糕",
                "summary": "道里区红专街早市传奇老摊，金黄酥脆外皮包裹热气腾腾玫瑰红豆沙，现炸现卖排队长龙。",
                "addressText": "哈尔滨市道里区红专街88号（红专街早市中段）",
                "start": 196.0,
                "end": 208.0,
                "posterSecond": 200.0,
                "coordinates": [126.6130543, 45.7716129],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "红专街早市近通江街交口",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片早市排队实录采用开放地图对象【红专街】（OSM node 10360）作为街区参照，未核实摊位日间撤市变动。",
                    "reviewedOn": "2026-11-12",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10360,
                        "name": "红专街与通江街交汇处",
                        "url": "https://www.openstreetmap.org/node/10360",
                        "sourceDate": "2026-11-12",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 早市早间营业待确认"
            },
            {
                "id": "hb-daoyueshe-zhangbaopu",
                "name": "张包铺（中华巴洛克店）",
                "category": "百年老字号 / 排骨包子",
                "summary": "道外中华巴洛克百年风味名店，首创排骨大包与老式豆腐包，骨肉软烂浓郁鲜香，配蒜泥酱油格外开胃。",
                "addressText": "哈尔滨市道外区南三道街与南勋街交叉口西北角",
                "start": 1308.0,
                "end": 1320.0,
                "posterSecond": 1312.0,
                "coordinates": [126.6392434, 45.779848],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中华巴洛克街区南勋街口",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片老道外排骨包实录采用开放地图对象【南勋街】（OSM node 8406）作为街区参照。",
                    "reviewedOn": "2026-11-12",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 8406,
                        "name": "南勋街与南三道街交汇处",
                        "url": "https://www.openstreetmap.org/node/8406",
                        "sourceDate": "2026-11-12",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            },
            {
                "id": "hb-daoyueshe-madieer",
                "name": "马迭尔冷饮厅（中央大街店）",
                "category": "百年老字号 / 冰品甜点",
                "summary": "中央大街地标名店，零下二十度在百年欧式石板街上咬一口奶香醇厚浓郁的经典马迭尔冰棍与秋林格瓦斯。",
                "addressText": "哈尔滨市道里区中央大街89号马迭尔宾馆1楼",
                "start": 1152.0,
                "end": 1164.0,
                "posterSecond": 1156.0,
                "coordinates": [126.6162461, 45.771916],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "中央大街与西七道街交汇处",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片中央大街步行街实景采用开放地图对象【西七道街】（OSM node 10332）作为街区参照。",
                    "reviewedOn": "2026-11-12",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 10332,
                        "name": "西七道街与中央大街交界口",
                        "url": "https://www.openstreetmap.org/node/10332",
                        "sourceDate": "2026-11-12",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 常态营业待确认"
            }
        ]
    },
    {
        "id": "hb-miantiaoren-7665314978568737498",
        "author": "面条人",
        "title": "也没人告诉我哈尔滨市烧烤涮肚这么好吃啊！！！",
        "url": "https://www.douyin.com/video/7665314978568737498",
        "shareURL": "https://v.douyin.com/KkspUiY02Js/",
        "publishedOn": "2026-05-03",
        "durationSeconds": 240.23,
        "sourceSHA256": "1d2b96f4c3684fdb5213356c60198a6b701d6fa8cd829870b9a9d77ca9839d6b",
        "acquisitionStatus": "local-source",
        "evidenceNote": "面条人哈尔滨涮肚探店视频，实地打卡南岗区建兴街胖姐涮肚烧烤老店，特厚老味麻辣涮毛肚与双筋炭火烤串。",
        "segments": [
            {
                "id": "hb-miantiaoren-pangjie",
                "name": "胖姐涮肚烧烤（建兴街老店）",
                "category": "东北烧烤 / 老味涮肚",
                "summary": "南岗区建兴街传奇苍蝇馆子，大铁锅慢熬浓香老汤，大串厚实毛肚吸饱麻酱辣油，炭火双筋与牛胸口外焦里嫩。",
                "addressText": "哈尔滨市南岗区建兴街5号",
                "start": 12.0,
                "end": 24.0,
                "posterSecond": 16.0,
                "coordinates": [126.6074163, 45.731537],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "建兴街涮肚一条街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片建兴街老店线索采用开放地图对象【建兴街】（OSM node 22011）作为街区参照。",
                    "reviewedOn": "2026-11-12",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 22011,
                        "name": "建兴街街区段",
                        "url": "https://www.openstreetmap.org/node/22011",
                        "sourceDate": "2026-11-12",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    },
    {
        "id": "hb-ppchaonengxuan-7609991984049434862",
        "author": "PP超能炫",
        "title": "一个人逛吃哈尔滨美食～超长20分钟谁敢全看完哈哈哈",
        "url": "https://www.douyin.com/video/7609991984049434862",
        "shareURL": "https://v.douyin.com/Xf2nvi4DBQs/",
        "publishedOn": "2026-02-23",
        "durationSeconds": 1221.73,
        "sourceSHA256": "64a3646f8c7a76e5726a7d6cde189af6bd64c34f978317fb4f7d1c73c9a3817c",
        "acquisitionStatus": "local-source",
        "evidenceNote": "PP超能炫深度逛吃哈尔滨20分钟全纪实，探访老道外丰润街崔家炖鸡馆名店。",
        "segments": [
            {
                "id": "hb-ppchaonengxuan-cuijia",
                "name": "崔家炖鸡馆（丰润街店）",
                "category": "东北炖菜 / 老道外名店",
                "summary": "老道外丰润街几十载招牌老馆，大砂锅原汁原味小火慢煨家养笨鸡，鸡肉软烂脱骨，汤浓汁醇泡大米饭一绝。",
                "addressText": "哈尔滨市道外区丰润街48号",
                "start": 598.0,
                "end": 610.0,
                "posterSecond": 602.0,
                "coordinates": [126.640842, 45.7826239],
                "coordinateSystem": "WGS84",
                "locationStatus": "approximate-planning",
                "planningLocation": {
                    "accuracy": "approximate",
                    "label": "老道外丰润街路段",
                    "basis": "video-address",
                    "branchMatch": "unconfirmed",
                    "note": "按原片道外丰润街炖鸡老店线索采用开放地图对象【丰润街】（OSM node 8569）作为街区参照。",
                    "reviewedOn": "2026-11-12",
                    "anchor": {
                        "kind": "osm-node",
                        "id": 8569,
                        "name": "丰润街老店门前",
                        "url": "https://www.openstreetmap.org/node/8569",
                        "sourceDate": "2026-11-12",
                        "method": "original-way-node"
                    }
                },
                "routeEligible": False,
                "footageNote": "2026年视频 · 营业情况待确认"
            }
        ]
    }
]

# Append new sources if not present
existing_ids = {s["id"] for s in vl["sources"]}
for ns in new_sources:
    ns["segments"].sort(key=lambda s: s["start"])
    if ns["id"] not in existing_ids:
        vl["sources"].append(ns)
    else:
        # replace
        idx = next(i for i, s in enumerate(vl["sources"]) if s["id"] == ns["id"])
        vl["sources"][idx] = ns

with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

print(f"Updated {vl_path.name}: now has {len(vl['sources'])} sources and {sum(len(s['segments']) for s in vl['sources'])} segments.")
