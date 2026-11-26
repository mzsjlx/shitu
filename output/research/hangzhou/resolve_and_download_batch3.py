import urllib.request, re, json, time, hashlib, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {
        "idx": 1,
        "author": "萨卡班吃不下",
        "title": "我的杭州美食·月度总结丨7月的4️⃣家小店 7️⃣...",
        "short_url": "https://v.douyin.com/9eYjeQVgwaE/"
    },
    {
        "idx": 2,
        "author": "童子佬james",
        "title": "vlog｜欢迎收看07年男大开学季的快乐，就在这一...",
        "short_url": "https://v.douyin.com/EpQYFEhUNjg/"
    },
    {
        "idx": 3,
        "author": "宥宥不会喝酒",
        "title": "花很少的钱，走最少的路！杭州一日懒人攻略之西湖美食...",
        "short_url": "https://v.douyin.com/r2Pdwo0yeVg/"
    },
    {
        "idx": 4,
        "author": "大力逛吃全国（山东小伙）",
        "title": "今天我们在浙江杭州感受『杭州碳水』 # 杭州美食 ...",
        "short_url": "https://v.douyin.com/BaEVmmefKXA/"
    },
    {
        "idx": 5,
        "author": "胖虎一米八",
        "title": "分享三家我在杭州吃过八次以上的宝藏美食，每家人均二...",
        "short_url": "https://v.douyin.com/8KbWhwK_Hn4/"
    },
    {
        "idx": 6,
        "author": "章余飞不是章鱼飞",
        "title": "深夜在杭州城中村里爽吃一顿豪华铁板烧！太香了！ #...",
        "short_url": "https://v.douyin.com/426sXVB6hVQ/"
    }
]

author_pinyin = {
    "萨卡班吃不下": "sakaban",
    "童子佬james": "tongzilao",
    "宥宥不会喝酒": "youyou",
    "大力逛吃全国（山东小伙）": "dali",
    "胖虎一米八": "panghuyimiba",
    "章余飞不是章鱼飞": "zhangyufei"
}

# 1. Resolve short links via curl -I
print(f"Resolving {len(raw_items)} short links using curl...")
resolved = []
for item in raw_items:
    u = item['short_url']
    res = subprocess.run(['curl.exe', '-I', '-s', u], capture_output=True, text=True)
    m = re.search(r'Location:\s*(https://[^\r\n]+)', res.stdout, re.IGNORECASE)
    final_location = m.group(1) if m else ""
    vid_m = re.search(r'/video/(\d+)', final_location)
    vid = vid_m.group(1) if vid_m else ""
    author_tag = author_pinyin.get(item['author'], "author")
    s_id = f"hz-{author_tag}-{vid}"
    canonical_url = f"https://www.douyin.com/video/{vid}"
    
    rec = {
        "idx": item['idx'],
        "author": item['author'],
        "title": item['title'],
        "short_url": u,
        "vid": vid,
        "canonical_url": canonical_url,
        "source_id": s_id
    }
    resolved.append(rec)
    print(f"[{item['idx']}] {item['author']} -> VID: {vid} | {s_id}")

out_res_file = worktree_root / "output/research/hangzhou/batch3_resolved.json"
out_res_file.write_text(json.dumps(resolved, ensure_ascii=False, indent=2), encoding='utf-8')

# 2. Fetch metadata and download
def fetch_aweme(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception:
            time.sleep(1)
    return None

def download_video_curl(url, target_path):
    cmd = [
        'curl.exe', '-s', '-L',
        '-H', f'User-Agent: {mobile_ua}',
        '-H', 'Referer: https://www.douyin.com/',
        '-o', str(target_path),
        url
    ]
    res = subprocess.run(cmd)
    return res.returncode == 0 and target_path.exists() and target_path.stat().st_size > 100000

def check_video(path):
    cmd = [ffmpeg_exe, "-v", "error", "-i", str(path), "-f", "null", "-"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0

downloaded = []
print("\nFetching video metadata and downloading MP4s with curl...")
for r in resolved:
    vid = r['vid']
    s_id = r['source_id']
    if not vid:
        print(f"Skipping {s_id}: no vid")
        continue
    
    print(f"\n--- Processing [{r['idx']:02d}] {r['author']} ({vid}) ---")
    detail = fetch_aweme(vid)
    if not detail:
        print(f"  Warning: failed to fetch aweme detail for {vid}")
        continue
    
    title = detail.get('desc', r['title'])
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else "2026-01-01"
    
    video_info = detail.get('video', {})
    play_addr = video_info.get('play_addr', {})
    url_list = play_addr.get('url_list', [])
    dur_sec = round(detail.get('duration', 0) / 1000.0, 2)
    poi_info = detail.get('poi_info')
    
    # Target directory
    s_dir = intake_dir / s_id
    s_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = s_dir / "source.mp4"
    
    download_ok = False
    if target_mp4.exists() and target_mp4.stat().st_size > 100000:
        if check_video(target_mp4):
            print(f"  Existing source.mp4 verified ({target_mp4.stat().st_size} bytes)")
            download_ok = True
    
    if not download_ok:
        for u in url_list:
            print(f"  Downloading from: {u[:60]}...")
            if download_video_curl(u, target_mp4):
                if check_video(target_mp4):
                    download_ok = True
                    break
                else:
                    print("  Corrupt video file, retrying next url...")
                    if target_mp4.exists(): target_mp4.unlink()
    
    if not download_ok:
        print(f"  ERROR: Could not download valid MP4 for {s_id}")
        continue
        
    raw_bytes = target_mp4.read_bytes()
    f_size = len(raw_bytes)
    f_sha = hashlib.sha256(raw_bytes).hexdigest()
    
    rec = {
        "idx": r['idx'],
        "author": r['author'],
        "source_id": s_id,
        "vid": vid,
        "short_url": r['short_url'],
        "canonical_url": r['canonical_url'],
        "title": title,
        "published_on": pub_date,
        "duration_seconds": dur_sec,
        "source_sha256": f_sha,
        "bytes": f_size,
        "poi_info": poi_info,
        "status": "ready"
    }
    downloaded.append(rec)
    print(f"  Success: {dur_sec}s, {f_size} bytes, sha256={f_sha[:10]}...")
    time.sleep(0.5)

out_dl_file = worktree_root / "output/research/hangzhou/batch3_downloaded.json"
out_dl_file.write_text(json.dumps(downloaded, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"\nBatch 3 downloading complete! Successfully verified {len(downloaded)} videos.")
