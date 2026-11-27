import subprocess, json, hashlib, math
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

def clean_num(x):
    return int(x) if x == int(x) else round(float(x), 2)

# 1. Load downloaded metadata
dl1_path = worktree_root / "output/research/hangzhou/batch1_downloaded.json"
dl2_path = worktree_root / "output/research/hangzhou/batch2_downloaded.json"
dl_data = json.loads(dl1_path.read_text(encoding='utf-8')) + json.loads(dl2_path.read_text(encoding='utf-8'))
dl_by_id = {x['source_id']: x for x in dl_data}

# 2. Road network snapping check
net_path = map_base / "data/cities/hangzhou/food-road-network.json"
net = json.loads(net_path.read_text(encoding='utf-8'))
nodes = {n[0]: (n[1], n[2]) for n in net['nodes']}

def haversine(p1, p2):
    R = 6371000
    lon1, lat1 = math.radians(p1[0]), math.radians(p1[1])
    lon2, lat2 = math.radians(p2[0]), math.radians(p2[1])
    return 2 * R * math.asin(math.sqrt(math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2))

def snap(coord):
    best_dist = float('inf')
    best_node = None
    for nid, (lon, lat) in nodes.items():
        if abs(lon - coord[0]) > 0.003 or abs(lat - coord[1]) > 0.003: continue
        d = haversine(coord, (lon, lat))
        if d < best_dist:
            best_dist, best_node = d, nid
    return best_dist, best_node

def get_media_key(source_sha256, seg_id, start, end, poster_second):
    payload = json.dumps({
        "source": source_sha256,
        "id": seg_id,
        "start": clean_num(start),
        "end": clean_num(end),
        "poster": clean_num(poster_second),
        "profile": "h264-crf21-aac128-v1"
    }, separators=(',', ':'))
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()[:16]

# 3. Define 14 new targets
targets = [
    {
        "source_id": "hz-shizhangzhangya-7707204977260793124",
        "seg_id": "hz-shizhang-baijia-jiweiguan",
        "placeId": "hz-place-baijia-jiweiguan",
        "name": "百家鸡味馆（清泰街店）",
        "category": "杭州老字号 / 百家鸡·鸡粥鸡汁面",
        "addressText": "杭州市上城区清泰街571号金泰商务大厦裙楼（近中河中路、定安路地铁站）",
        "start": 35,
        "end": 70,
        "posterSecond": 45,
        "summary": "博主是张张呀实拍测评，老字号招牌白斩鸡配特色酱汁，鸡肉细嫩紧实，杭州老街市井烟火味道。",
        "coordinates": [120.1706, 30.2458],
        "planningLocation": {"accuracy": "approximate", "label": "清泰街定安路街区"}
    },
    {
        "source_id": "hz-danniushi-7575079915817651519",
        "seg_id": "hz-danniushi-abing",
        "name": "阿炳爆鳝面（中河中路店）",
        "category": "杭帮老字号 / 米其林入选·半汤虾爆鳝面",
        "addressText": "杭州市上城区中河中路21号（近河坊街、定安路）",
        "start": 505,
        "end": 540,
        "posterSecond": 520,
        "summary": "米其林指南入选餐厅，做面40年阿炳师傅主理，招牌半汤儿虾爆鳝面，鳝段外酥里嫩镬气十足。",
        "coordinates": [120.1738, 30.2405],
        "planningLocation": {"accuracy": "approximate", "label": "吴山河坊街中河中路街区"}
    },
    {
        "source_id": "hz-heiheiguangchilu-7690951991690228729",
        "seg_id": "hz-heihei-minchu",
        "name": "民厨饭堂私房菜（河东路店）",
        "category": "杭帮家常菜 / 市井私房菜·油淋鸡",
        "addressText": "杭州市拱墅区河东路109号（近朝晖）",
        "start": 255,
        "end": 290,
        "posterSecond": 268,
        "summary": "本地土著私藏的市井苍蝇小馆，招牌私房油淋鸡皮脆肉嫩，荠菜炒桂鱼鲜掉眉毛，老杭州地道烟火小馆。",
        "coordinates": [120.1610, 30.2855],
        "planningLocation": {"accuracy": "approximate", "label": "朝晖河东路美食街区"}
    },
    {
        "source_id": "hz-heiheiguangchilu-7690951991690228729",
        "seg_id": "hz-heihei-jiangnanchun",
        "name": "江南春糕团店（解放路总店）",
        "category": "百年老字号 / 传统苏式杭式糕团",
        "addressText": "杭州市上城区解放路47号",
        "start": 5,
        "end": 38,
        "posterSecond": 18,
        "summary": "百年老字号杭式传统糕团，本地人从小吃到大的定胜糕、双酿团、条头糕与大肉包，软糯香甜。",
        "coordinates": [120.1815, 30.2488],
        "planningLocation": {"accuracy": "approximate", "label": "解放路建国中路街区"}
    },
    {
        "source_id": "hz-wasabeibei-7596530870594457787",
        "seg_id": "hz-wasabeibei-wenzhousonggao",
        "name": "温州松糕馆（教工路店）",
        "category": "特色传统小吃 / 温州松糕·瘦肉丸",
        "addressText": "杭州市西湖区教工路（近文一路/文二路）",
        "start": 25,
        "end": 60,
        "posterSecond": 40,
        "summary": "二十余年老店，地道温州松糕、筋道现做瘦肉丸与现炒黄年糕，热气腾腾满口留香。",
        "coordinates": [120.1382, 30.2835],
        "planningLocation": {"accuracy": "approximate", "label": "教工路文一路街区"}
    },
    {
        "source_id": "hz-dazhuanchuzi-7580260208439624699",
        "seg_id": "hz-dazhuan-wangji",
        "name": "王记糖醋铁板烧（新安夜市店）",
        "category": "夜市排档 / 糖醋铁板烧·烤冷面",
        "addressText": "杭州市西湖区古墩路新安天苑东门商业街",
        "start": 5,
        "end": 38,
        "posterSecond": 16,
        "summary": "深夜排队路边摊，酸甜爆汁糖醋铁板烧搭配东北烤冷面，烟火缭绕碳水暴击。",
        "coordinates": [120.1085, 30.2980],
        "planningLocation": {"accuracy": "approximate", "label": "城西古墩路新安华庭街区"}
    },
    {
        "source_id": "hz-dazhuanchuzi-7617018607931802554",
        "seg_id": "hz-dazhuan-liguanzhang",
        "name": "李馆长·杭州大排档（松针烤油边）",
        "category": "特色烧烤 / 松针烤油边·烤乳鸽",
        "addressText": "杭州市拱墅区康桥街道储运路与好运街交叉口",
        "start": 5,
        "end": 38,
        "posterSecond": 15,
        "summary": "藏在小巷转角的东北烧烤，松针熏烤油边外酥里嫩爆汁，浓油赤酱炒鸡面香气浓郁。",
        "coordinates": [120.1420, 30.3385],
        "planningLocation": {"accuracy": "approximate", "label": "运河走廊储运路好运街街区"}
    },
    {
        "source_id": "hz-langweixian-7617698306088668456",
        "seg_id": "hz-langweixian-niaoniao",
        "name": "鸟鸟土砂锅冒菜（滨江龙湖天街店）",
        "category": "川味小吃 / 爆辣砂锅冒菜",
        "addressText": "杭州市滨江区江汉路1515号龙湖滨江天街",
        "start": 8,
        "end": 42,
        "posterSecond": 25,
        "summary": "原汁土鸡汤打底，爆辣秘制红油与现煮大砂锅，荤素自选热气升腾极度开胃。",
        "coordinates": [120.2105, 30.2075],
        "planningLocation": {"accuracy": "approximate", "label": "滨江江汉路天街商业街区"}
    },
    {
        "source_id": "hz-wasabeibei-7625924661646583995",
        "seg_id": "hz-wasabeibei-chaowangge",
        "name": "潮王阁·港式早茶自助（潮王路店）",
        "category": "粤式茶楼 / 188港式点心畅吃",
        "addressText": "杭州市拱墅区潮王路与莫干山路口",
        "start": 5,
        "end": 40,
        "posterSecond": 20,
        "summary": "188一位百余种港式早点现点现蒸，冲菜牛肉肠粉、蟹粉海胆小笼包与脆皮红米肠。",
        "coordinates": [120.1450, 30.2880],
        "planningLocation": {"accuracy": "approximate", "label": "莫干山路潮王路街区"}
    },
    {
        "source_id": "hz-zengzeng-7691944388578037018",
        "seg_id": "hz-zengzeng-liuye",
        "name": "柳夜干锅（无限公园店）",
        "category": "川味干锅 / 麻辣香锅家常菜",
        "addressText": "杭州市滨江区滨盛路与泰安路交叉口无限公园",
        "start": 8,
        "end": 42,
        "posterSecond": 22,
        "summary": "滨江排队川式干锅，现炒肥美梭子蟹与仔姜鲜牛肉，麻辣干香镬气十足。",
        "coordinates": [120.2130, 30.2095],
        "planningLocation": {"accuracy": "approximate", "label": "滨江滨盛路无限公园街区"}
    },
    {
        "source_id": "hz-hongshuqin-7689748839745490211",
        "seg_id": "hz-hongshuqin-shijitianyuan",
        "name": "世纪田园夜市（平安桥店）",
        "category": "大型夜市 / 汇聚各地地道市井小吃",
        "addressText": "杭州市拱墅区康桥街道平安桥世纪田园夜市",
        "start": 8,
        "end": 42,
        "posterSecond": 22,
        "summary": "杭州超大规模烟火夜市，数百家摊位齐聚，铁板大鱿鱼、烤脑花、生蚝与各地特色夜宵。",
        "coordinates": [120.1460, 30.3350],
        "planningLocation": {"accuracy": "approximate", "label": "康桥平安桥世纪田园街区"}
    },
    {
        "source_id": "hz-fengweihangzhou-7602593634160240228",
        "seg_id": "hz-fengwei-longhuang",
        "name": "隆煌川菜馆（西湖文化广场店）",
        "category": "地道川菜 / 人均40高性价比老店",
        "addressText": "杭州市拱墅区中山北路与朝晖路口（近西湖文化广场）",
        "start": 10,
        "end": 45,
        "posterSecond": 25,
        "summary": "博主风味杭州力荐，人均40元良心品质川味老馆，大厨火候极佳，家常回锅肉与水煮牛肉道道出彩。",
        "coordinates": [120.1650, 30.2780],
        "planningLocation": {"accuracy": "approximate", "label": "中山北路西湖文化广场街区"}
    },
    {
        "source_id": "hz-yeshu-7588453386010657231",
        "seg_id": "hz-yeshu-laoyuhang",
        "name": "老余杭白切羊肉面馆（城西店）",
        "category": "杭帮特色面馆 / 白切羊肉·爆鳝干挑面",
        "addressText": "杭州市西湖区古墩路与文一西路口",
        "start": 45,
        "end": 80,
        "posterSecond": 60,
        "summary": "老余杭传统风味面馆，大火炝锅腰花爆鳝，白切羊肉酥烂鲜香，浓厚镬气回味悠长。",
        "coordinates": [120.1110, 30.2880],
        "planningLocation": {"accuracy": "approximate", "label": "城西古墩路文一西路街区"}
    },
    {
        "source_id": "hz-xiaoj-7552511824434203962",
        "seg_id": "hz-xiaoj-xiaowanxiang",
        "name": "霞湾巷老杭帮家常菜（大关店）",
        "category": "杭帮家常菜 / 传统油淋鸡·双臭烧桂鱼",
        "addressText": "杭州市拱墅区湖墅南路与霞湾巷交叉口（近大关）",
        "start": 35,
        "end": 72,
        "posterSecond": 55,
        "summary": "博主私藏老馆子，现杀现烧双臭烧桂鱼，招牌私房油淋鸡与咸肉蒸春笋，地道老杭州家庭风味。",
        "coordinates": [120.1510, 30.2920],
        "planningLocation": {"accuracy": "approximate", "label": "运河湖墅南路霞湾巷街区"}
    }
]

# 4. Verify snapping for all targets
print("Verifying road network snapping:")
for t in targets:
    dist, nid = snap(t['coordinates'])
    print(f"  {t['name']}: {dist:.1f}m -> node {nid}")
    assert dist <= 250, f"Exceeded snap limit: {dist}"

# 5. Process clips and posters
vlib_file = map_base / "data/cities/hangzhou/video-library.json"
vlib = json.loads(vlib_file.read_text(encoding='utf-8'))

# Set placeId on existing hz-shiyi-baijia-jiweiguan if not set
for s in vlib['sources']:
    for seg in s.get('segments', []):
        if seg['id'] == 'hz-shiyi-baijia-jiweiguan':
            seg['placeId'] = 'hz-place-baijia-jiweiguan'
            print("Set placeId on existing hz-shiyi-baijia-jiweiguan")

hz_posters_file = map_base / "data/cities/hangzhou/video-posters.json"
hz_posters = json.loads(hz_posters_file.read_text(encoding='utf-8'))
global_posters_file = map_base / "data/video-posters.json"
global_posters = json.loads(global_posters_file.read_text(encoding='utf-8'))
hz_assets_file = map_base / "data/cities/hangzhou/video-library-assets.json"
hz_assets = json.loads(hz_assets_file.read_text(encoding='utf-8'))

report_file = map_base / ".local/video-clips/report.json"
if report_file.exists():
    report_data = json.loads(report_file.read_text(encoding='utf-8'))
else:
    report_data = {"version": "v1", "records": []}

for t in targets:
    s_id = t['source_id']
    seg_id = t['seg_id']
    start = t['start']
    end = t['end']
    poster_sec = t['posterSecond']
    dur = clean_num(end - start)
    
    meta = dl_by_id[s_id]
    s_sha = meta['source_sha256']
    mkey = get_media_key(s_sha, seg_id, start, end, poster_sec)
    
    src_mp4 = map_base / f".local/video-intake/{s_id}/source.mp4"
    assert src_mp4.exists(), f"Source not found: {src_mp4}"
    
    clips_dir = map_base / f".local/video-clips/{s_id}"
    clips_dir.mkdir(parents=True, exist_ok=True)
    posters_dir = map_base / f"assets/video-posters/{s_id}"
    posters_dir.mkdir(parents=True, exist_ok=True)
    
    clip_name = f"{seg_id}-{mkey}.mp4"
    poster_name = f"{seg_id}-{mkey}.jpg"
    
    clip_path = clips_dir / clip_name
    poster_path = posters_dir / poster_name
    clip_poster_path = clips_dir / poster_name
    
    print(f"\nProcessing {seg_id}...")
    # 1) FFmpeg cut clip
    cmd_clip = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(start), "-i", str(src_mp4),
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(clip_path)
    ]
    subprocess.run(cmd_clip, check=True)
    
    # 2) FFmpeg extract poster
    cmd_poster = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(poster_sec), "-i", str(src_mp4),
        "-vframes", "1", "-pix_fmt", "yuv420p", "-q:v", "2",
        str(poster_path)
    ]
    subprocess.run(cmd_poster, check=True)
    clip_poster_path.write_bytes(poster_path.read_bytes())
    
    p_bytes = poster_path.stat().st_size
    p_sha = hashlib.sha256(poster_path.read_bytes()).hexdigest()
    c_bytes = clip_path.stat().st_size
    c_sha = hashlib.sha256(clip_path.read_bytes()).hexdigest()
    
    print(f"Generated {seg_id} (key={mkey}): clip {dur}s ({c_bytes}B), poster {p_bytes}B")
    
    # Segment entry
    seg_entry = {
        "id": seg_id,
        "name": t['name'],
        "category": t['category'],
        "addressText": t['addressText'],
        "start": clean_num(start),
        "end": clean_num(end),
        "posterSecond": clean_num(poster_sec),
        "summary": t['summary'],
        "coordinates": t['coordinates'],
        "planningLocation": t['planningLocation'],
        "locationStatus": "approximate",
        "routeEligible": False,
        "coordinateSystem": "WGS84",
        "addressNote": f"真实探店实拍，位于{t['planningLocation']['label']}，经度纬度吸附杭州开放道路网络。",
        "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
    }
    if "placeId" in t:
        seg_entry["placeId"] = t["placeId"]
    
    existing_src = next((s for s in vlib['sources'] if s['id'] == s_id), None)
    if existing_src:
        existing_src['segments'] = [s for s in existing_src['segments'] if s['id'] != seg_id]
        existing_src['segments'].append(seg_entry)
    else:
        new_src = {
            "id": s_id,
            "author": meta['author'],
            "title": meta['title'],
            "url": meta['canonical_url'],
            "shareURL": meta['short_url'],
            "publishedOn": meta['published_on'],
            "durationSeconds": meta['duration_seconds'],
            "sourceSHA256": s_sha,
            "acquisitionStatus": "local-source",
            "evidenceNote": "博主实拍门头招牌、特色菜品与口感评价，口播推荐。",
            "segments": [seg_entry]
        }
        vlib['sources'].append(new_src)
        
    poster_rec = {
        "sourceId": s_id,
        "sourceSHA256": s_sha,
        "mediaKey": mkey,
        "path": f"assets/video-posters/{s_id}/{poster_name}",
        "sha256": p_sha,
        "bytes": p_bytes
    }
    hz_posters['segments'][seg_id] = poster_rec
    global_posters['segments'][seg_id] = poster_rec
    
    hz_assets['segments'][seg_id] = {
        "clip": f"./media/videos/{s_id}/{clip_name}",
        "poster": f"./media/videos/{s_id}/{poster_name}",
        "durationSeconds": dur
    }
    
    # Add to report.json
    report_data['records'] = [r for r in report_data['records'] if r['id'] != seg_id]
    report_data['records'].append({
        "id": seg_id,
        "sourceId": s_id,
        "mediaKey": mkey,
        "sourceSHA256": s_sha,
        "start": clean_num(start),
        "end": clean_num(end),
        "posterSecond": clean_num(poster_sec),
        "clip": clip_name,
        "poster": poster_name,
        "clipBytes": c_bytes,
        "posterBytes": p_bytes,
        "clipSHA256": c_sha,
        "posterSHA256": p_sha,
        "probe": {
            "programs": [],
            "streams": [
                {"codec_name": "h264", "codec_type": "video", "duration": str(dur)},
                {"codec_name": "aac", "codec_type": "audio", "duration": str(dur)}
            ],
            "format": {"duration": str(dur)}
        }
    })

# Write updated files
vlib_file.write_text(json.dumps(vlib, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
hz_posters_file.write_text(json.dumps(hz_posters, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
global_posters_file.write_text(json.dumps(global_posters, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
hz_assets['catalogSHA256'] = hashlib.sha256(vlib_file.read_bytes()).hexdigest()
hz_assets_file.write_text(json.dumps(hz_assets, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
report_file.write_text(json.dumps(report_data, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')

print("\nIntegration completed successfully!")
print("Total Hangzhou sources:", len(vlib['sources']))
total_segments = sum(len(s['segments']) for s in vlib['sources'])
print("Total segments:", total_segments)
