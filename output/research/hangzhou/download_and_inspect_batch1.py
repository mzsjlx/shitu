import urllib.request, json, re, time, os, hashlib, subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[4] # Root of repo D:\Antigravity\地图
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

resolved_file = Path(__file__).resolve().parent / "batch1_resolved.json"
items = json.loads(resolved_file.read_text(encoding='utf8'))

desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

def sanitize_author(author):
    # Mapping author to stable short ascii prefix
    author_clean = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]', '', author)
    mapping = {
        '陈赫': 'chenhe',
        '小甲同学': 'xiaojia',
        '红薯味的芹菜': 'hongshuqin',
        '二百者也': 'erbaizheye',
        '特别乌啦啦': 'wulala',
        '大专厨子': 'dazhuanchuzi',
        '特厨隋坡重新出发版': 'suipo',
        '特厨隋坡': 'suipo',
        '小怡雯': 'xiaoyiwen',
        '超开心的大嘴猴': 'dazuihou',
        '浪胃仙做自己': 'langweixian',
        '起飞一仔': 'qifeiyizai',
        '瓦萨北北全国巡烤中': 'wasabeibei',
        '十一的两三天': 'shiyideliangsan',
        '战宝饱饱': 'zhanbaobao',
        '温油辣辣U': 'wenyoulala',
        '胖虎一米八': 'panghuyimiba',
        '盗月社食遇记': 'daoyueshe'
    }
    return mapping.get(author_clean, 'blogger')

def fetch_aweme_detail(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception as e:
            time.sleep(1)
    return None

def download_video(url, dest_path):
    if dest_path.exists() and dest_path.stat().st_size > 100000:
        return True
    req = urllib.request.Request(url, headers={'User-Agent': mobile_ua})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp, open(dest_path, 'wb') as f:
            while chunk := resp.read(1024 * 1024):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Download error: {e}")
        if dest_path.exists():
            dest_path.unlink()
        return False

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

def inspect_video(video_path):
    cmd = [ffmpeg_exe, "-hide_banner", "-i", str(video_path)]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    stderr = res.stderr
    
    # Duration: 00:01:39.10, start: 0.000000, bitrate: 1234 kb/s
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):([\d\.]+)", stderr)
    duration = 0.0
    if dur_match:
        h, m, s = float(dur_match.group(1)), float(dur_match.group(2)), float(dur_match.group(3))
        duration = h * 3600 + m * 60 + s
        
    # Stream #0:0: Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709), 720x1280 ...
    v_match = re.search(r"Stream #\d+:\d+.*?: Video: ([^,\s]+).*?,\s*(\d+)x(\d+)", stderr)
    # Stream #0:1: Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz ...
    a_match = re.search(r"Stream #\d+:\d+.*?: Audio: ([^,\s]+)", stderr)
    
    return {
        'duration': round(duration, 2),
        'size': video_path.stat().st_size,
        'width': int(v_match.group(2)) if v_match else 0,
        'height': int(v_match.group(3)) if v_match else 0,
        'video_codec': v_match.group(1) if v_match else '',
        'audio_codec': a_match.group(1) if a_match else ''
    }

results = []
for item in items:
    vid = item['vid']
    author = item['author']
    prefix = sanitize_author(author)
    source_id = f"hz-{prefix}-{vid}"
    item['source_id'] = source_id
    
    print(f"\nProcessing [{item['idx']}/21] {author} | {source_id}...")
    detail = fetch_aweme_detail(vid)
    if not detail:
        print(f"Failed to fetch detail for {vid}")
        item['status'] = 'detail_failed'
        results.append(item)
        continue
        
    title = detail.get('desc', item['title'])
    create_time = detail.get('create_time')
    published_on = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-01-01'
    video_info = detail.get('video', {})
    play_addr = video_info.get('play_addr', {})
    url_list = play_addr.get('url_list', [])
    
    if not url_list:
        print(f"No play URL found for {vid}")
        item['status'] = 'no_url'
        results.append(item)
        continue
        
    play_url = url_list[0]
    out_dir = intake_dir / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    video_file = out_dir / "source.mp4"
    
    print(f"Downloading to {video_file}...")
    ok = download_video(play_url, video_file)
    if not ok:
        print(f"Failed to download video from {play_url}")
        item['status'] = 'download_failed'
        results.append(item)
        continue
        
    # Inspect video with ffmpeg
    probe = inspect_video(video_file)
    # SHA256
    h = hashlib.sha256()
    with open(video_file, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    sha256 = h.hexdigest()
    
    item.update({
        'status': 'downloaded',
        'title': title,
        'published_on': published_on,
        'duration_seconds': probe['duration'] if probe else 0,
        'width': probe['width'] if probe else 0,
        'height': probe['height'] if probe else 0,
        'video_codec': probe['video_codec'] if probe else '',
        'audio_codec': probe['audio_codec'] if probe else '',
        'source_sha256': sha256,
        'file_bytes': video_file.stat().st_size
    })
    print(f"Downloaded! Duration: {item['duration_seconds']}s, Res: {item['width']}x{item['height']}, SHA256: {sha256[:16]}...")
    results.append(item)
    time.sleep(0.5)

out_summary = Path(__file__).resolve().parent / "batch1_downloaded.json"
out_summary.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf8')
print(f"\nBatch 1 downloaded and inspected: {len(results)} items saved to {out_summary}")
