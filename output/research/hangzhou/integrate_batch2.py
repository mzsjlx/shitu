import subprocess, json, hashlib, math
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

def clean_num(x):
    return int(x) if x == int(x) else round(float(x), 2)

# 1. Load downloaded metadata
dl_path = worktree_root / "output/research/hangzhou/batch1_downloaded.json"
dl_data = json.loads(dl_path.read_text(encoding='utf-8'))
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

# 3. Define 10 targets
targets = [
    {
        "source_id": "hz-suipo-7691365898199797046",
        "seg_id": "hz-suipo-ruyuan",
        "name": "如院（植物园店）",
        "category": "创意杭帮菜 / 米其林二星",
        "addressText": "杭州市西湖区植物园桃源岭5号（近玉泉路）",
        "start": 15,
        "end": 50,
        "posterSecond": 28,
        "summary": "米其林二星傅月良大师主理，隐于西湖植物园桃源岭，江南意境园林雅致私房杭帮菜。",
        "coordinates": [120.1197, 30.2512],
        "planningLocation": {"accuracy": "approximate", "label": "西湖植物园桃源岭街区"}
    },
    {
        "source_id": "hz-xiaojia-7539578218773286178",
        "seg_id": "hz-xiaojia-jinshating",
        "name": "西子湖四季酒店·金沙厅",
        "category": "经典杭帮菜 / 黑珍珠三钻",
        "addressText": "杭州市西湖区灵隐路5号西子湖四季酒店1楼",
        "start": 18,
        "end": 55,
        "posterSecond": 26,
        "summary": "西子湖畔黑珍珠三钻殿堂级杭帮菜，招牌西湖醋鱼、鲍鱼红烧肉、熟醉蟹与龙井炖奶。",
        "coordinates": [120.1292, 30.2536],
        "planningLocation": {"accuracy": "approximate", "label": "灵隐路西子湖四季街区"}
    },
    {
        "source_id": "hz-wulala-7015887929377639688",
        "seg_id": "hz-wulala-wumingshi",
        "name": "无名氏面馆（邮电路店）",
        "category": "杭帮老面馆 / 地道片儿川",
        "addressText": "杭州市上城区邮电路17-1号（近延安路、东坡路）",
        "start": 10,
        "end": 45,
        "posterSecond": 25,
        "summary": "46元豪华现炒腰花大排片儿川，老底子生炒雪菜与鲜笋，面条筋道镬气十足。",
        "coordinates": [120.1631, 30.2525],
        "planningLocation": {"accuracy": "approximate", "label": "湖滨邮电路延安路街区"}
    },
    {
        "source_id": "hz-wulala-7125679146512043301",
        "seg_id": "hz-wulala-hongmaoshushu",
        "name": "红帽叔叔包子（保俶路店）",
        "category": "特色小吃 / 深夜包子",
        "addressText": "杭州市西湖区保俶路148号（近曙光路）",
        "start": 10,
        "end": 42,
        "posterSecond": 24,
        "summary": "深夜老底子排队发面小笼包，皮暄肉嫩汤汁丰沛，老杭州深夜慰藉与碳水快乐。",
        "coordinates": [120.1465, 30.2689],
        "planningLocation": {"accuracy": "approximate", "label": "黄龙保俶路曙光路街区"}
    },
    {
        "source_id": "hz-dazuihou-7617713495173254451",
        "seg_id": "hz-dazuihou-fengqi",
        "name": "凤起农贸市场·方爷爷方奶奶现炸现炒",
        "category": "市井小吃 / 农贸市场熟食现炒",
        "addressText": "杭州市拱墅区刀茅巷288号凤起农贸市场内",
        "start": 12,
        "end": 48,
        "posterSecond": 30,
        "summary": "藏在菜市场里的市井烟火气，比脸大的现卤黑猪肘子配现炒拌川，外皮软糯胶质满满。",
        "coordinates": [120.1802, 30.2612],
        "planningLocation": {"accuracy": "approximate", "label": "凤起路刀茅巷农贸市场街区"}
    },
    {
        "source_id": "hz-panghuyimiba-7601802944681718961",
        "seg_id": "hz-panghu-honghai",
        "name": "红海小吃店（竞舟路店）",
        "category": "杭帮家常菜 / 苍蝇馆子",
        "addressText": "杭州市西湖区竞舟路364号南都花园（近文二西路）",
        "start": 5,
        "end": 35,
        "posterSecond": 15,
        "summary": "开业近30年的社区平价夫妻苍蝇馆子，人均30元吃到撑，锅气十足的杭帮家常现炒。",
        "coordinates": [120.1042, 30.2868],
        "planningLocation": {"accuracy": "approximate", "label": "文二西路竞舟路街区"}
    },
    {
        "source_id": "hz-hongshuqin-7661669844861029668",
        "seg_id": "hz-hongshuqin-guobaoyou",
        "name": "郭包又东北菜（东站店）",
        "category": "东北菜 / 大份量现炒",
        "addressText": "杭州市上城区新塘路681号彭悦商务中心1幢",
        "start": 10,
        "end": 45,
        "posterSecond": 25,
        "summary": "份量惊人的东北大盘菜，酥脆酸甜老式锅包肉、大拉皮与下饭地三鲜。",
        "coordinates": [120.2185, 30.2915],
        "planningLocation": {"accuracy": "approximate", "label": "城东新塘路彭悦商务街区"}
    },
    {
        "source_id": "hz-wenyoulala-7652680490016656690",
        "seg_id": "hz-wenyou-shangan",
        "name": "上岸·鲜·辣炒小海鲜（LOFT49店）",
        "category": "辣炒海鲜 / 创意排档",
        "addressText": "杭州市拱墅区吉如路LOFT49文创园",
        "start": 10,
        "end": 45,
        "posterSecond": 28,
        "summary": "文创园内排队海鲜小馆，浓郁紫苏沼虾与鲜辣皮皮虾，汤汁浓厚拌饭一绝。",
        "coordinates": [120.1315, 30.3150],
        "planningLocation": {"accuracy": "approximate", "label": "运河LOFT49吉如路街区"}
    },
    {
        "source_id": "hz-qifeiyizai-7623649482890071347",
        "seg_id": "hz-qifei-yedujuan",
        "name": "野杜鹃·贵州菜（黄姑山路店）",
        "category": "贵州风味 / 酸汤鱼·怪噜饭",
        "addressText": "杭州市西湖区黄姑山路29号",
        "start": 10,
        "end": 45,
        "posterSecond": 25,
        "summary": "地道酸辣贵州风味，招牌洋芋粑粑、现炒脆哨怪噜饭与酸汤鱼，米饭杀手。",
        "coordinates": [120.1340, 30.2780],
        "planningLocation": {"accuracy": "approximate", "label": "文三路黄姑山路街区"}
    },
    {
        "source_id": "hz-xiaoyiwen-7601446280635906202",
        "seg_id": "hz-xiaoyiwen-ludelin",
        "name": "禄德林·川味黑鱼花",
        "category": "川菜家常 / 现杀麻辣水煮鱼",
        "addressText": "杭州市西湖区文三西路428号",
        "start": 10,
        "end": 45,
        "posterSecond": 25,
        "summary": "居民楼下的地道川香麻辣水煮鱼，鱼片嫩滑无刺，热油泼淋满盆红亮，配米饭鲜香下饭。",
        "coordinates": [120.1065, 30.2815],
        "planningLocation": {"accuracy": "approximate", "label": "文三西路竞舟路街区"}
    }
]

# 4. Verify snapping for all
print("Verifying road network snapping:")
for t in targets:
    dist, nid = snap(t['coordinates'])
    print(f"  {t['name']}: {dist:.1f}m -> node {nid}")
    assert dist <= 250, f"Exceeded snap limit: {dist}"

# 5. Process clips and posters
vlib_file = map_base / "data/cities/hangzhou/video-library.json"
vlib = json.loads(vlib_file.read_text(encoding='utf-8'))
hz_posters_file = map_base / "data/cities/hangzhou/video-posters.json"
hz_posters = json.loads(hz_posters_file.read_text(encoding='utf-8'))
global_posters_file = map_base / "data/video-posters.json"
global_posters = json.loads(global_posters_file.read_text(encoding='utf-8'))
hz_assets_file = map_base / "data/cities/hangzhou/video-library-assets.json"
hz_assets = json.loads(hz_assets_file.read_text(encoding='utf-8'))

report_file = map_base / ".local/video-clips/report.json"
report_data = json.loads(report_file.read_text(encoding='utf-8'))

for t in targets:
    s_id = t['source_id']
    meta = dl_by_id[s_id]
    s_sha = meta['source_sha256']
    seg_id = t['seg_id']
    start = clean_num(t['start'])
    end = clean_num(t['end'])
    poster_sec = clean_num(t['posterSecond'])
    dur = round(end - start, 2)
    
    mkey = get_media_key(s_sha, seg_id, start, end, poster_sec)
    clip_name = f"{seg_id}-{mkey}.mp4"
    poster_name = f"{seg_id}-{mkey}.jpg"
    
    clips_dir = map_base / f".local/video-clips/{s_id}"
    clips_dir.mkdir(parents=True, exist_ok=True)
    posters_dir = map_base / f"assets/video-posters/{s_id}"
    posters_dir.mkdir(parents=True, exist_ok=True)
    
    clip_path = clips_dir / clip_name
    poster_path = posters_dir / poster_name
    src_mp4 = map_base / f".local/video-intake/{s_id}/source.mp4"
    
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
    
    # Also save a copy of poster in .local/video-clips/{s_id}/ as required by build-video-library.mjs
    clip_poster_path = clips_dir / poster_name
    
    # 2) FFmpeg extract poster
    cmd_poster = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(poster_sec), "-i", str(src_mp4),
        "-vframes", "1", "-q:v", "2",
        str(poster_path)
    ]
    subprocess.run(cmd_poster, check=True)
    clip_poster_path.write_bytes(poster_path.read_bytes())
    
    p_bytes = poster_path.stat().st_size
    p_sha = hashlib.sha256(poster_path.read_bytes()).hexdigest()
    c_bytes = clip_path.stat().st_size
    c_sha = hashlib.sha256(clip_path.read_bytes()).hexdigest()
    
    print(f"Generated {seg_id} (key={mkey}): clip {dur}s ({c_bytes}B), poster {p_bytes}B")
    
    # Append segment to target source in video-library.json
    seg_entry = {
        "id": seg_id,
        "name": t['name'],
        "category": t['category'],
        "addressText": t['addressText'],
        "start": start,
        "end": end,
        "posterSecond": poster_sec,
        "summary": t['summary'],
        "coordinates": t['coordinates'],
        "planningLocation": t['planningLocation'],
        "locationStatus": "approximate",
        "routeEligible": False,
        "coordinateSystem": "WGS84",
        "addressNote": f"真实探店实拍，位于{t['planningLocation']['label']}，经度纬度吸附杭州开放道路网络。",
        "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
    }
    
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
        "start": start,
        "end": end,
        "posterSecond": poster_sec,
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

print("\nIntegration completed successfully! Total Hangzhou sources:", len(vlib['sources']), "Total segments:", len(hz_posters['segments']))
