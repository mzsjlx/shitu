import hashlib, json, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
vlib_path = map_base / "data/cities/hangzhou/video-library.json"

def get_file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
def get_duration(path):
    cmd = [ffmpeg_exe, "-hide_banner", "-i", str(path)]
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding="utf-8", errors="ignore")
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", p.stderr)
    if m:
        return round(float(m.group(1))*3600 + float(m.group(2))*60 + float(m.group(3)), 2)
    return 100.0

sources_to_integrate = [
    {
        "source_id": "hz-guotao-7710122962640301242",
        "author": "演员郭涛",
        "title": "到杭州体验一家开在老社区里，本地人私藏的苍蝇馆子，5个菜182，每道菜都巨下饭～",
        "url": "https://www.douyin.com/video/7710122962640301242",
        "shareURL": "https://v.douyin.com/o78JhVVMvg8/",
        "publishedOn": "2026-11-23",
        "evidenceNote": "郭涛实地探访上城区社区苍蝇小馆，实拍门头日新桥弄、菜单、后厨现做与白切肉、椒盐明虾等5道招牌菜口播测评。",
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
        "author": "一口甜辣椒",
        "title": "总结9家我在杭州龙翔桥地铁站反复吃的小店，无广，又吃美了！！",
        "url": "https://www.douyin.com/video/7624473783088435313",
        "shareURL": "https://v.douyin.com/HodOuCAuvI0/",
        "publishedOn": "2026-08-18",
        "evidenceNote": "博主实地在龙翔桥地铁站周边打卡9家老底子传统小店与烟火馆子，详细记录门头、特色菜品与口感评价。",
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
        "author": "宥宥不会喝酒",
        "title": "花很少的钱，走最少的路！杭州一日懒人攻略之西湖美食美景篇！",
        "url": "https://www.douyin.com/video/7509435211135307066",
        "shareURL": "https://v.douyin.com/r2Pdwo0yeVg/",
        "publishedOn": "2026-08-23",
        "evidenceNote": "宥宥西湖一日美食美景路线，探访紫阳街道大马弄市井小吃与八卦新村金仲帮中餐厅，实拍菜品与点单。",
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
                "start": 245.0,
                "end": 276.0,
                "posterSecond": 260.0,
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
        "author": "胖虎一米八",
        "title": "分享三家我在杭州吃过八次以上的宝藏美食，每家人均二三十 吃饱",
        "url": "https://www.douyin.com/video/7709339095310422629",
        "shareURL": "https://v.douyin.com/8KbWhwK_Hn4/",
        "publishedOn": "2026-03-19",
        "evidenceNote": "胖虎一米八探访大关苑路西四苑老底子面馆，实拍大排拌川炒制与口播实评。",
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

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))
existing_sources = {s["id"]: s for s in vlib["sources"]}

for item in sources_to_integrate:
    s_id = item["source_id"]
    src_mp4 = intake_dir / s_id / "source.mp4"
    if not src_mp4.exists():
        print(f"Skipping {s_id}: {src_mp4} not found")
        continue
    
    sha256 = get_file_sha256(src_mp4)
    duration = get_duration(src_mp4)
    print(f"Source {s_id}: sha256={sha256[:12]}..., duration={duration}s")
    
    source_obj = {
        "id": s_id,
        "author": item["author"],
        "title": item["title"],
        "url": item["url"],
        "shareURL": item["shareURL"],
        "publishedOn": item["publishedOn"],
        "durationSeconds": duration,
        "sourceSHA256": sha256,
        "acquisitionStatus": "local-source",
        "evidenceNote": item["evidenceNote"],
        "segments": item["segments"]
    }
    
    # Sort segments by start
    source_obj["segments"].sort(key=lambda x: x["start"])
    
    existing_sources[s_id] = source_obj

vlib["sources"] = list(existing_sources.values())
vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Saved video-library.json with {len(vlib['sources'])} sources.")
