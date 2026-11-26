import urllib.request, re, json, time, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {"author": "PP超能炫", "pinyin": "ppchaonengxuan", "short_url": "https://v.douyin.com/GcZmnnl3Ca0/", "vid": "7579565604874519798"},
    {"author": "麦乐金", "pinyin": "mailejin", "short_url": "https://v.douyin.com/Dlun6tO4W8I/", "vid": "7650325270264601273"},
    {"author": "大大大丸子", "pinyin": "dadadawanzi", "short_url": "https://v.douyin.com/Flt_kVLZ-9M/", "vid": "7626778962945341797"},
    {"author": "红薯味的芹菜", "pinyin": "hongshuweideqincai", "short_url": "https://v.douyin.com/ZR2WHfD6gKY/", "vid": "7689748839745490211"},
    {"author": "麦乐金", "pinyin": "mailejin", "short_url": "https://v.douyin.com/J3anXDuAmO4/", "vid": "7643044412784454757"},
    {"author": "瓦萨北北", "pinyin": "wasabeibei", "short_url": "https://v.douyin.com/qWtdlEAuJak/", "vid": "7596530870594457787"}
]

def fetch_aweme(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception as e:
            print(f"fetch_aweme attempt {attempt} error: {e}", flush=True)
            time.sleep(1)
    return None

def download_video_curl(url, target_path):
    target_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        'curl.exe', '-s', '-L',
        '-H', f'User-Agent: {mobile_ua}',
        '-H', 'Referer: https://www.douyin.com/',
        '-o', str(target_path),
        url
    ]
    res = subprocess.run(cmd)
    return res.returncode == 0 and target_path.exists() and target_path.stat().st_size > 100000

out = []
for idx, item in enumerate(raw_items):
    vid = item.get('vid', '')
    pinyin = item['pinyin']
    author_name = item['author']
    s_id = f"hz-{pinyin}-{vid}"
    print(f"[{idx+1}/{len(raw_items)}] Processing: {author_name} -> VID: {vid} (ID: {s_id})", flush=True)
    
    detail = fetch_aweme(vid)
    if not detail:
        print(f"Failed to fetch detail for {vid}", flush=True)
        continue
    
    title = detail.get('desc', '')
    author = detail.get('author', {}).get('nickname', author_name)
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else "2026-01-01"
    poi_info = detail.get('poi_info', {})
    
    video_info = detail.get('video', {})
    bit_rates = video_info.get('bit_rate', [])
    download_url = None
    
    # Choose moderate bitrate stream
    if bit_rates:
        sorted_br = sorted(bit_rates, key=lambda b: b.get('bit_rate', 0))
        chosen = None
        for b in sorted_br:
            if b.get('bit_rate', 0) >= 800000:
                chosen = b
                break
        if not chosen:
            chosen = sorted_br[-1]
        url_list = chosen.get('play_addr', {}).get('url_list', [])
        if url_list:
            download_url = url_list[0]
            
    if not download_url:
        play_addr = video_info.get('play_addr', {}).get('url_list', [])
        download_url = play_addr[0] if play_addr else None
        
    mp4_target1 = intake_dir / s_id / "source.mp4"
    mp4_target2 = intake_dir / f"{s_id}.mp4"
    
    downloaded = False
    if mp4_target1.exists() and mp4_target1.stat().st_size > 100000:
        downloaded = True
        actual_path = mp4_target1
    elif mp4_target2.exists() and mp4_target2.stat().st_size > 100000:
        downloaded = True
        actual_path = mp4_target2
    else:
        if download_url:
            print(f"  Downloading video to {mp4_target1}...", flush=True)
            if download_video_curl(download_url, mp4_target1):
                downloaded = True
                actual_path = mp4_target1
                print(f"  Downloaded successfully: {mp4_target1.stat().st_size / (1024*1024):.1f} MB", flush=True)
            else:
                print(f"  Download failed for {s_id}", flush=True)
        else:
            print(f"  No download url found for {s_id}", flush=True)
            
    # Cover poster
    cover_url_list = video_info.get('cover', {}).get('url_list', [])
    cover_url = cover_url_list[0] if cover_url_list else ""
    cover_path = intake_dir / s_id / "cover.jpg"
    if cover_url and not cover_path.exists():
        download_video_curl(cover_url, cover_path)

    out.append({
        "source_id": s_id,
        "author": author,
        "title": title,
        "pub_date": pub_date,
        "vid": vid,
        "original_url": f"https://www.douyin.com/video/{vid}",
        "poi_info": poi_info,
        "video_path": str(actual_path) if downloaded else None,
        "cover_path": str(cover_path) if cover_path.exists() else None,
        "duration": video_info.get('duration', 0) / 1000.0
    })

res_file = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch15_downloaded.json")
res_file.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Batch 15 download complete: {len(out)}/{len(raw_items)} processed. Saved to {res_file}", flush=True)
