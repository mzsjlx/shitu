import subprocess, json, hashlib, math, re
from pathlib import Path

root = Path(r"D:\Antigravity\地图")
worktree_root = root / ".local/worktrees/hangzhou-prep/map-base"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

source_id = "hz-shiyideliangsan-7670185446282245307"
source_mp4 = root / f"map-base/.local/video-intake/{source_id}/source.mp4"
source_sha256 = "72161d830d1b53f7b24ffdb5cf51859663d8ffaf1cbbd25c68ae70960584b42c"

posters_dir = worktree_root / f"assets/video-posters/{source_id}"
posters_dir.mkdir(parents=True, exist_ok=True)

clips_dir = root / f"map-base/.local/video-clips/{source_id}"
clips_dir.mkdir(parents=True, exist_ok=True)

# 5 segments
segments_def = [
    {
        "id": "hz-shiyi-chunya-banchuan",
        "name": "椿芽·鲜牛肉杭州拌川（长生路店）",
        "category": "杭帮面食 / 现炒拌川",
        "addressText": "杭州市上城区长生路34号（近东坡路、西湖湖滨步行街）",
        "start": 11.0,
        "end": 50.0,
        "posterSecond": 24.0,
        "summary": "西湖湖滨老底子风味拌川，金黄酥脆虾爆鳝、浓郁酱汁现切牛肉拌川，配现蒸番茄小笼包与炸白里脊串。",
        "coordinates": [120.1601, 30.2558],
        "planningLocation": {"accuracy": "approximate", "label": "湖滨长生路街区"}
    },
    {
        "id": "hz-shiyi-chuanwei-paocaiyu",
        "name": "川味泡菜馆（黄姑山路店）",
        "category": "川味家常 / 招牌泡菜鱼",
        "addressText": "杭州市西湖区黄姑山路11号（近文三路、颐高百脑汇）",
        "start": 50.0,
        "end": 83.0,
        "posterSecond": 69.0,
        "summary": "始于2000年的20年社区老店，白汤泡菜鱼片鲜薄嫩滑，老坛泡菜酸爽开胃超级下饭。",
        "coordinates": [120.1332, 30.2796],
        "planningLocation": {"accuracy": "approximate", "label": "文三路黄姑山路街区"}
    },
    {
        "id": "hz-shiyi-juemeijia-huntun",
        "name": "绝美嘉海鲜馄饨（武林总店）",
        "category": "特色小吃 / 海鲜馄饨·烧麦",
        "addressText": "杭州市拱墅区万寿亭街31号（近武林路、武林广场）",
        "start": 83.0,
        "end": 101.0,
        "posterSecond": 90.0,
        "summary": "武林广场社区经典老店，爆汁蛋黄鲜肉烧麦与18元超大碗鲜美海鲜馄饨，配料满满。",
        "coordinates": [120.1625, 30.2691],
        "planningLocation": {"accuracy": "approximate", "label": "武林广场万寿亭街区"}
    },
    {
        "id": "hz-shiyi-jinzhongbang-sifangcai",
        "name": "金仲帮中餐厅（虎玉路店）",
        "category": "老底子杭帮菜 / 社区私房菜",
        "addressText": "杭州市上城区虎玉路38号B幢（八卦新村内，近陶瓷市场、八卦田）",
        "start": 101.0,
        "end": 131.0,
        "posterSecond": 114.0,
        "summary": "老居民区土著私房菜，大颗鲍鱼红烧肉配酒酿馒头、清爽鲜甜手打鱼米羹，地道非流水线老杭帮口味。",
        "coordinates": [120.1503, 30.2185],
        "planningLocation": {"accuracy": "approximate", "label": "八卦新村虎玉路街区"}
    },
    {
        "id": "hz-shiyi-baijia-jiweiguan",
        "name": "百家鸡味馆（清泰街店）",
        "category": "杭州老字号 / 百家鸡·鸡粥鸡汁面",
        "addressText": "杭州市上城区清泰街571号金泰商务大厦裙楼（近中河中路、定安路地铁站）",
        "start": 131.0,
        "end": 155.0,
        "posterSecond": 138.0,
        "summary": "杭州老城区土著老字号，招牌白斩百家鸡肉质滑嫩鲜美，搭配鸡粥与鸡汁拌面，老城烟火气十足。",
        "coordinates": [120.1706, 30.2458],
        "planningLocation": {"accuracy": "approximate", "label": "清泰街定安路街区"}
    }
]

# Read road network for snapping check
net_path = worktree_root / "data/cities/hangzhou/food-road-network.json"
net = json.loads(net_path.read_text(encoding='utf8'))
nodes_dict = {n[0]: (n[1], n[2]) for n in net['nodes']}

def haversine(p1, p2):
    R = 6371000
    lon1, lat1 = math.radians(p1[0]), math.radians(p1[1])
    lon2, lat2 = math.radians(p2[0]), math.radians(p2[1])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def snap_to_road(coord):
    best_dist = float('inf')
    best_node = None
    for nid, (lon, lat) in nodes_dict.items():
        # fast bounding check 0.003 deg approx 300m
        if abs(lon - coord[0]) > 0.003 or abs(lat - coord[1]) > 0.003:
            continue
        dist = haversine(coord, (lon, lat))
        if dist < best_dist:
            best_dist = dist
            best_node = nid
    return best_dist, best_node

print("Checking road snapping for 5 segments...")
for seg in segments_def:
    d, nid = snap_to_road(seg['coordinates'])
    print(f"  {seg['name']}: snapped {d:.1f}m to node {nid} (<= 250m: {d <= 250})")
    assert d <= 250, f"Snapping exceeded 250m: {d}m"

print("\nGenerating clips and posters...")
processed_segments = []
posters_entries = {}
assets_entries = {}

for seg in segments_def:
    seg_id = seg['id']
    start = seg['start']
    end = seg['end']
    dur = round(end - start, 2)
    poster_sec = seg['posterSecond']
    
    # Generate mediaKey (sha256 of source_id + seg_id + start + end)[:16]
    key_str = f"{source_id}:{seg_id}:{start}:{end}"
    media_key = hashlib.sha256(key_str.encode('utf8')).hexdigest()[:16]
    
    clip_file = clips_dir / f"{seg_id}-{media_key}.mp4"
    poster_file = posters_dir / f"{seg_id}-{media_key}.jpg"
    
    # Cut clip: ffmpeg -ss start -i source.mp4 -t dur -c:v libx264 -c:a aac -movflags +faststart
    cmd_clip = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(start), "-i", str(source_mp4),
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(clip_file)
    ]
    subprocess.run(cmd_clip, check=True)
    
    # Extract poster: ffmpeg -ss poster_sec -i source.mp4 -vframes 1 -q:v 2
    cmd_poster = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-ss", str(poster_sec), "-i", str(source_mp4),
        "-vframes", "1", "-q:v", "2",
        str(poster_file)
    ]
    subprocess.run(cmd_poster, check=True)
    
    clip_bytes = clip_file.stat().st_size
    poster_bytes = poster_file.stat().st_size
    poster_sha256 = hashlib.sha256(poster_file.read_bytes()).hexdigest()
    
    seg_entry = {
        "id": seg_id,
        "name": seg['name'],
        "category": seg['category'],
        "addressText": seg['addressText'],
        "start": start,
        "end": end,
        "posterSecond": poster_sec,
        "summary": seg['summary'],
        "coordinates": seg['coordinates'],
        "planningLocation": seg['planningLocation'],
        "locationStatus": "approximate",
        "routeEligible": False,
        "coordinateSystem": "WGS84",
        "addressNote": f"真实探店实拍，位于{seg['planningLocation']['label']}，经度纬度吸附杭州开放道路网络。",
        "footageNote": "2026年原视频实拍 · 具体营业时间以到店为准。"
    }
    # routeEligible must be false as required by video-library-model.js (line 25: if(segment.routeEligible!==false)throw new Error('视频店址尚未核对，不能生成到店导航');)
    seg_entry['routeEligible'] = False
    processed_segments.append(seg_entry)
    
    posters_entries[seg_id] = {
        "sourceId": source_id,
        "sourceSHA256": source_sha256,
        "mediaKey": media_key,
        "path": f"assets/video-posters/{source_id}/{seg_id}-{media_key}.jpg",
        "sha256": poster_sha256,
        "bytes": poster_bytes
    }
    
    assets_entries[seg_id] = {
        "clip": f"./media/videos/{source_id}/{seg_id}-{media_key}.mp4",
        "poster": f"./media/videos/{source_id}/{seg_id}-{media_key}.jpg",
        "durationSeconds": dur
    }
    print(f"  Processed {seg_id}: clip {dur}s ({clip_bytes} bytes), poster ({poster_bytes} bytes)")

# Update video-library.json
source_record = {
    "id": source_id,
    "author": "十一的两三天",
    "title": "杭州必吃两人食！5家老底子小馆 来杭州玩必冲的几家老店！烟火气满满～本地人私藏！",
    "url": "https://www.douyin.com/video/7670185446282245307",
    "shareURL": "https://v.douyin.com/WC1_bWZ4SOo/",
    "publishedOn": "2026-06-20",
    "durationSeconds": 156.92,
    "sourceSHA256": source_sha256,
    "acquisitionStatus": "local-source",
    "evidenceNote": "博主实拍门头招牌、后厨炒制、菜单明细与菜品口感，逐家详细口播推荐。",
    "segments": processed_segments
}

vlib_path = worktree_root / "data/cities/hangzhou/video-library.json"
vlib_data = {
    "schemaVersion": 1,
    "city": "hangzhou",
    "preparedOn": "2026-11-20",
    "rights": {
        "status": "user-confirmed",
        "confirmedOn": "2026-11-20",
        "scope": "杭州第一批探店视频由用户在会话中明确提供，首选来源打通端到端全流程；视频画面仅使用用户提供范围，记录与原片留.local，小封面海报与公开元数据进库。",
        "evidence": "本项目会话中用户提供的原帖链接与分享文本；未独立审查纸质授权文件。"
    },
    "sources": [source_record]
}
vlib_path.write_text(json.dumps(vlib_data, ensure_ascii=False, indent=2) + "\n", encoding='utf8')

# Update video-posters.json
posters_path = worktree_root / "data/cities/hangzhou/video-posters.json"
posters_data = {
    "schemaVersion": 1,
    "segments": posters_entries
}
posters_path.write_text(json.dumps(posters_data, ensure_ascii=False, indent=2) + "\n", encoding='utf8')

# Update video-library-assets.json
assets_path = worktree_root / "data/cities/hangzhou/video-library-assets.json"
assets_data = {
    "schemaVersion": 1,
    "catalogSHA256": hashlib.sha256(vlib_path.read_bytes()).hexdigest(),
    "segments": assets_entries
}
assets_path.write_text(json.dumps(assets_data, ensure_ascii=False, indent=2) + "\n", encoding='utf8')

print("\nAll JSON files and media assets updated successfully!")
