import urllib.request, re, json, time, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
intake_dir.mkdir(parents=True, exist_ok=True)

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {"author": "章余飞不是章鱼飞", "pinyin": "zhangyufei", "short_url": "https://v.douyin.com/iPGzBZI1T8U/"},
    {"author": "演员郭涛", "pinyin": "guotao", "short_url": "https://v.douyin.com/o78JhVVMvg8/"},
    {"author": "一口甜辣椒", "pinyin": "yikoutianlajiao", "short_url": "https://v.douyin.com/HodOuCAuvI0/"},
    {"author": "胃袋梦想家", "pinyin": "weidaimengxiangjia", "short_url": "https://v.douyin.com/LaO1q7PicAg/"}
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

out = []
for item in raw_items:
    u = item['short_url']
    res = subprocess.run(['curl.exe', '-I', '-s', u], capture_output=True, text=True)
    m = re.search(r'video/(\d+)', res.stdout)
    vid = m.group(1) if m else ''
    pinyin = item['pinyin']
    author_name = item['author']
    s_id = f"hz-{pinyin}-{vid}"
    print(f"Resolved: {author_name} -> VID: {vid}")
    
    detail = fetch_aweme(vid)
    if not detail:
        print(f"Failed to fetch detail for {vid}")
        continue
    
    title = detail.get('desc', '')
    author = detail.get('author', {}).get('nickname', author_name)
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-01-01'
    
    video_info = detail.get('video', {})
    play_addr = video_info.get('play_addr', {})
    url_list = play_addr.get('url_list', [])
    dur_sec = round(detail.get('duration', 0) / 1000.0, 2)
    poi_info = detail.get('poi_info')
    
    s_dir = intake_dir / s_id
    s_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = s_dir / 'source.mp4'
    
    print(f"Downloading {s_id} ({dur_sec}s)...")
    if url_list:
        for p_url in url_list:
            if download_video_curl(p_url, target_mp4):
                print(f"Successfully downloaded {target_mp4.stat().st_size} bytes")
                break
    
    rec = {
        'source_id': s_id,
        'author': author,
        'title': title,
        'publish_date': pub_date,
        'duration': dur_sec,
        'poi_info': poi_info,
        'canonical_url': f"https://www.douyin.com/video/{vid}",
        'video_path': str(target_mp4)
    }
    out.append(rec)

out_file = worktree_root / "output/research/hangzhou/batch4_downloaded.json"
out_file.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print("Finished batch 4 intake!")
