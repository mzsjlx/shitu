import urllib.request, re, json, time, subprocess
from pathlib import Path

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

# Also ensure root intake_dir
root_intake = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
root_intake.mkdir(parents=True, exist_ok=True)

mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

raw_items = [
    {"author": "红薯味的芹菜", "pinyin": "hongshuqin", "short_url": "https://v.douyin.com/iHrzoaWgF2U/"},
    {"author": "一只学土木的驼", "pinyin": "xuetumudeduo", "short_url": "https://v.douyin.com/N5XKNuVWOIw/"},
    {"author": "美味双响炮", "pinyin": "meiweishuangxiangpao", "short_url": "https://v.douyin.com/a4pSZjngfxw/"},
    {"author": "卢小君嬉游记", "pinyin": "luxiaojun", "short_url": "https://v.douyin.com/fvFp0F6mUBc/"},
    {"author": "一支凯子", "pinyin": "yizhikaizi", "short_url": "https://v.douyin.com/frkKwT-mCl4/"}
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
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else "2024-01-01"
    poi_info = detail.get('poi_info', {})
    
    video_info = detail.get('video', {})
    play_addr = video_info.get('play_addr', {}).get('url_list', [])
    download_url = play_addr[0] if play_addr else None
    
    mp4_target1 = intake_dir / s_id / "source.mp4"
    if download_url and (not mp4_target1.exists() or mp4_target1.stat().st_size < 100000):
        print(f"Downloading {s_id}...")
        download_video_curl(download_url, mp4_target1)
        
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

res_file = worktree_root / "output/research/hangzhou/batch6_downloaded.json"
res_file.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
print("Finished. Saved to", res_file)
