import json
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"

vlib_path = map_base / "data/cities/hangzhou/video-library.json"
frec_path = map_base / "data/cities/hangzhou/food-records.json"
vpost_hz_path = map_base / "data/cities/hangzhou/video-posters.json"
vpost_global_path = map_base / "data/video-posters.json"
dist_vpost_global_path = map_base / "dist/data/video-posters.json"

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))
frec = json.loads(frec_path.read_text(encoding="utf-8"))
vpost_hz = json.loads(vpost_hz_path.read_text(encoding="utf-8"))
vpost_global = json.loads(vpost_global_path.read_text(encoding="utf-8"))

# 1. New sources to add or update
# Check existing sources
existing_source_ids = {s["id"]: s for s in vlib["sources"]}

# New segments definitions
new_sources_data = [
    {
        "source_id": "hz-guotao-7710122962640301242",
        "creator": "演员郭涛",
        "title": "到杭州体验一家开在老社区里，本地人私藏的苍蝇馆子，5个菜182，每道菜都巨下饭～",
        "canonical_url": "https://www.douyin.com/video/7710122962640301242",
        "publish_date": "2026-11-23",
        "segments": [
            {
                "id": "hz-guotao-xiaobai-canguan",
                "name": "小白餐馆（光复路小区店）",
                "category": "苍蝇馆子 · 市井家常杭帮菜",
                "addressText": "杭州市上城区湖滨街道日新桥弄2号（光复路122号附近）",
                "start": 28.0,
                "end": 68.0,
                "posterSecond": 45.0,
                "summary": "郭涛实地打卡的上城区老社区私房苍蝇馆子，5个菜182元，招牌现炸白切肉、红烧鲈鱼、椒盐明虾与西湖牛肉羹，烟火气十足。",
                "coordinates": [120.166273, 30.251564],
                "planningLocation": {"accuracy": "approximate", "label": "湖滨光复路日新桥弄街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于湖滨光复路日新桥弄街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            }
        ]
    },
    {
        "source_id": "hz-yikoutianlajiao-7624473783088435313",
        "creator": "一口甜辣椒",
        "title": "总结9家我在杭州龙翔桥地铁站反复吃的小店，无广，又吃美了！！",
        "canonical_url": "https://www.douyin.com/video/7624473783088435313",
        "publish_date": "2026-08-18",
        "segments": [
            {
                "id": "hz-yikou-wushan-kaoqin",
                "name": "吴山烤禽（吴山路店）",
                "category": "老杭州传统烤禽 · 招牌烤鸡",
                "addressText": "杭州市上城区吴山路62号（近学士路、龙翔桥地铁站D口）",
                "start": 14.0,
                "end": 26.0,
                "posterSecond": 20.0,
                "summary": "龙翔桥站必打卡的老杭州三巨头之一，本地爷奶严选，新鲜出炉现烤，皮脆肉嫩、汁水充盈。",
                "coordinates": [120.1591, 30.2581],
                "planningLocation": {"accuracy": "approximate", "label": "龙翔桥吴山路学士路街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于龙翔桥吴山路学士路街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            },
            {
                "id": "hz-yikou-nanfang-dabao",
                "name": "南方大包（延安路工联店）",
                "category": "经典早点下午茶 · 油包肉饼",
                "addressText": "杭州市上城区延安路292号工联CC一楼/地下（龙翔桥地铁站直通）",
                "start": 26.0,
                "end": 39.0,
                "posterSecond": 33.0,
                "summary": "龙翔桥工联老牌小吃档口，经典松软甜醇江南大油包、传统现烘香脆鲜肉饼，承载几代杭州人的童年回味。",
                "coordinates": [120.1578, 30.2591],
                "planningLocation": {"accuracy": "approximate", "label": "龙翔桥延安路工联商圈"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于龙翔桥延安路工联商圈，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            },
            {
                "id": "hz-yikou-wumingshi-mianguan",
                "name": "无名氏面馆（青年路店）",
                "category": "老底子杭帮面 · 酥烂大排面",
                "addressText": "杭州市上城区青年路92号（近开元路）",
                "start": 89.0,
                "end": 101.0,
                "posterSecond": 95.0,
                "summary": "开在青年路老街几十年的宝藏社区面馆，招牌厚实大排炖得酥烂入味，搭配地道浓油赤酱拌川与碱水面。",
                "coordinates": [120.1638, 30.2543],
                "planningLocation": {"accuracy": "approximate", "label": "湖滨青年路开元路街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于湖滨青年路开元路街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            }
        ]
    },
    {
        "source_id": "hz-youyou-7509435211135307066",
        "creator": "宥宥不会喝酒",
        "title": "花很少的钱，走最少的路！杭州一日懒人攻略之西湖美食美景篇！",
        "canonical_url": "https://www.douyin.com/video/7509435211135307066",
        "publish_date": "2026-08-23",
        "segments": [
            {
                "id": "hz-youyou-xiaolao-huntun",
                "name": "大马弄市井小吃·小劳馄饨",
                "category": "米其林必比登 · 市井早点馄饨",
                "addressText": "杭州市上城区紫阳街道大马弄太庙街区（近城皇阁下）",
                "start": 20.0,
                "end": 50.0,
                "posterSecond": 35.0,
                "summary": "米其林必比登推介的市井老底子馄饨铺，紫阳大马弄烟火气息，手工现包薄皮鲜肉小馄饨，汤底鲜香。",
                "coordinates": [120.1702, 30.2335],
                "planningLocation": {"accuracy": "approximate", "label": "紫阳大马弄太庙街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于紫阳大马弄太庙街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            },
            {
                "id": "hz-youyou-jinzhongbang",
                "placeId": "hz-shiyi-jinzhongbang-sifangcai",
                "name": "金仲帮中餐厅（虎玉路店）",
                "category": "老底子杭帮菜 / 社区私房菜",
                "addressText": "杭州市上城区虎玉路38号B幢（八卦新村内，近陶瓷市场、八卦田）",
                "start": 250.0,
                "end": 285.0,
                "posterSecond": 268.0,
                "summary": "宥宥西湖一日美食攻略力荐老底子杭帮小馆，鲍鱼红烧肉夹酒酿馒头软糯浓郁，手打鱼米羹鲜嫩滑口。",
                "coordinates": [120.1503, 30.2185],
                "planningLocation": {"accuracy": "approximate", "label": "八卦新村虎玉路街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于八卦新村虎玉路街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            }
        ]
    },
    {
        "source_id": "hz-panghuyimiba-7709339095310422629",
        "creator": "胖虎一米八",
        "title": "分享三家我在杭州吃过八次以上的宝藏美食，每家人均二三十 吃饱",
        "canonical_url": "https://www.douyin.com/video/7709339095310422629",
        "publish_date": "2026-03-19",
        "segments": [
            {
                "id": "hz-panghu-aqian-mianguan",
                "name": "阿琴面馆（大关苑路店）",
                "category": "老底子居民楼面馆 · 大排拌川",
                "addressText": "杭州市拱墅区大关苑路西四苑小区内",
                "start": 8.0,
                "end": 38.0,
                "posterSecond": 20.0,
                "summary": "藏在大关西四苑居民楼下的人气社区面馆，现点现炒锅气大排拌川，千张包与卤鸭软糯鲜香，性价比超高。",
                "coordinates": [120.1585, 30.3015],
                "planningLocation": {"accuracy": "approximate", "label": "拱墅大关苑路西四苑街区"},
                "locationStatus": "approximate",
                "routeEligible": False,
                "coordinateSystem": "WGS84",
                "addressNote": "真实探店实拍，位于拱墅大关苑路西四苑街区，经度纬度吸附杭州开放道路网络。",
                "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
            }
        ]
    }
]

for s_data in new_sources_data:
    sid = s_data["source_id"]
    if sid in existing_source_ids:
        # Update existing
        src = existing_source_ids[sid]
        src["segments"] = s_data["segments"]
    else:
        # Add new
        new_src = {
            "id": sid,
            "creator": s_data["creator"],
            "platform": "douyin",
            "title": s_data["title"],
            "workUrl": s_data["canonical_url"],
            "sourceType": "short-video",
            "city": "hangzhou",
            "mediaBundle": f"hz-bundle-{s_data['creator']}",
            "segments": s_data["segments"]
        }
        vlib["sources"].append(new_src)
        existing_source_ids[sid] = new_src

# Ensure segments in each source are sorted by start
for s in vlib["sources"]:
    s["segments"].sort(key=lambda x: x["start"])

vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Updated video-library.json: {len(vlib['sources'])} sources")

# 2. Update food-records.json
# Build food records from primary segments
existing_record_ids = {r["id"]: r for r in frec["records"]}
for s_data in new_sources_data:
    for seg in s_data["segments"]:
        if "placeId" in seg and seg["placeId"] != seg["id"]:
            # Secondary segment -> does not create new food record
            continue
        rec_id = "video-" + seg["id"]
        record = {
            "id": rec_id,
            "name": seg["name"],
            "category": seg["category"],
            "coordinates": seg["coordinates"],
            "summary": seg["summary"],
            "planningLocation": seg["planningLocation"],
            "locationStatus": seg["locationStatus"],
            "routeEligible": seg["routeEligible"],
            "coordinateSystem": seg["coordinateSystem"],
            "addressText": seg["addressText"],
            "source": {
                "platform": "douyin",
                "creator": s_data["creator"],
                "workUrl": s_data["canonical_url"],
                "title": s_data["title"]
            },
            "sourceSegmentId": seg["id"]
        }
        existing_record_ids[rec_id] = record

# Reassemble food-records list
frec["records"] = list(existing_record_ids.values())
frec_path.write_text(json.dumps(frec, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Updated food-records.json: {len(frec['records'])} stores")

# 3. Update video-posters.json (local & global)
posters_to_add = [
    ("hz-guotao-xiaobai-canguan", "data/cities/hangzhou/posters/hz-guotao-xiaobai-canguan.jpg"),
    ("hz-yikou-wushan-kaoqin", "data/cities/hangzhou/posters/hz-yikou-wushan-kaoqin.jpg"),
    ("hz-yikou-nanfang-dabao", "data/cities/hangzhou/posters/hz-yikou-nanfang-dabao.jpg"),
    ("hz-yikou-wumingshi-mianguan", "data/cities/hangzhou/posters/hz-yikou-wumingshi-mianguan.jpg"),
    ("hz-youyou-xiaolao-huntun", "data/cities/hangzhou/posters/hz-youyou-xiaolao-huntun.jpg"),
    ("hz-youyou-jinzhongbang", "data/cities/hangzhou/posters/hz-youyou-jinzhongbang.jpg"),
    ("hz-panghu-aqian-mianguan", "data/cities/hangzhou/posters/hz-panghu-aqian-mianguan.jpg")
]

for seg_id, path_str in posters_to_add:
    vpost_hz[seg_id] = path_str
    vpost_global[seg_id] = path_str

vpost_hz_path.write_text(json.dumps(vpost_hz, ensure_ascii=False, indent=2), encoding="utf-8")
vpost_global_path.write_text(json.dumps(vpost_global, ensure_ascii=False, indent=2), encoding="utf-8")
dist_vpost_global_path.write_text(json.dumps(vpost_global, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Updated video-posters: {len(vpost_hz)} in hangzhou, {len(vpost_global)} in global")
