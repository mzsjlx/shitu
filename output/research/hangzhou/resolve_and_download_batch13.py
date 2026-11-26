import urllib.request, re, json, time, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {"author": "富贵不想上班", "pinyin": "fuguibuxiangshangban", "short_url": "https://v.douyin.com/cIZiY0Lj6lM/"},
    {"author": "是吨吨呀", "pinyin": "shidundunya", "short_url": "https://v.douyin.com/JbYoHi_ocko/"},
    {"author": "大专厨子", "pinyin": "dazhuanchuzi", "short_url": "https://v.douyin.com/2HtOsc9e028/"},
    {"author": "米雪食记", "pinyin": "mixueshiji", "short_url": "https://v.douyin.com/pBzZIGyHdY4/"}
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
    u = item['short_url']
    # Follow redirects to get real URL and video ID
    res = subprocess.run(['curl.exe', '-I', '-s', u], capture_output=True, text=True)
    m = re.search(r'video/(\d+)', res.stdout)
    if not m:
        # Check location header
        loc = re.search(r'location:\s*([^\r\n]+)', res.stdout, re.IGNORECASE)
        if loc:
            res2 = subprocess.run(['curl.exe', '-I', '-s', loc.group(1)], capture_output=True, text=True)
            m = re.search(r'video/(\d+)', res2.stdout)
    
    vid = m.group(1) if m else ''
    pinyin = item['pinyin']
    author_name = item['author']
    s_id = f"hz-{pinyin}-{vid}"
    print(f"[{idx+1}/{len(raw_items)}] Resolved: {author_name} -> VID: {vid} (ID: {s_id})", flush=True)
    
    if not vid:
        print(f"Failed to resolve VID for {u}", flush=True)
        continue
        
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
    if download_url and (not mp4_target1.exists() or mp4_target1.stat().st_size < 100000):
        print(f"Downloading {s_id} to {mp4_target1}...", flush=True)
        success = download_video_curl(download_url, mp4_target1)
        print(f"Download result: {success}, size: {mp4_target1.stat().st_size if mp4_target1.exists() else 0}", flush=True)
    else:
        print(f"File already exists: {mp4_target1} (size: {mp4_target1.stat().st_size if mp4_target1.exists() else 0})", flush=True)
        
    out.append({
        "id": s_id,
        "vid": vid,
        "author": author,
        "title": title,
        "publishedOn": pub_date,
        "poi_info": poi_info,
        "mp4_exists": mp4_target1.exists(),
        "mp4_size": mp4_target1.stat().st_size if mp4_target1.exists() else 0,
        "short_url": u
    })

res_file = worktree_root / "output/research/hangzhou/batch13_downloaded.json"
res_file.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print("Finished. Saved to", res_file, flush=True)
