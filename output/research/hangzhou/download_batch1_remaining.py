import urllib.request, json, re, time, os, hashlib, subprocess, sys
from pathlib import Path

root = Path(r"D:\Antigravity\地图")
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

resolved_file = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch1_resolved.json")
items = json.loads(resolved_file.read_text(encoding='utf8'))

downloaded_file = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch1_downloaded.json")
existing_records = json.loads(downloaded_file.read_text(encoding='utf8')) if downloaded_file.exists() else []
existing_by_vid = {r['vid']: r for r in existing_records if r.get('status') == 'ready'}

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

author_map = {
    '陈赫': 'chenhe',
    '小甲同学': 'xiaojia',
    '红薯味的芹菜': 'hongshuqin',
    '二百者也': 'erbaizheye',
    '特别乌啦啦': 'wulala',
    '大专厨子': 'dazhuanchuzi',
    '特厨隋坡（重新出发版）': 'suipo',
    '小怡雯': 'xiaoyiwen',
    '超开心的大嘴猴': 'dazuihou',
    '浪胃仙做自己': 'langweixian',
    '起飞一仔': 'qifeiyizai',
    '瓦萨北北(全国巡烤中)': 'wasabeibei',
    '十一的两三天': 'shiyideliangsan',
    '战宝饱饱': 'zhanbaobao',
    '温油辣辣U': 'wenyoulala',
    '胖虎一米八': 'panghuyimiba',
    '盗月社食遇记': 'daoyueshe'
}

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

def download_file(url, target_path):
    if target_path.exists() and target_path.stat().st_size > 100000:
        return True
    req = urllib.request.Request(url, headers={
        'User-Agent': mobile_ua,
        'Referer': 'https://www.douyin.com/'
    })
    try:
        with urllib.request.urlopen(req, timeout=35) as resp, open(target_path, 'wb') as f:
            while chunk := resp.read(1024 * 1024):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  Download error: {e}", flush=True)
        if target_path.exists():
            target_path.unlink()
        return False

def inspect_video(video_path):
    cmd = [ffmpeg_exe, "-hide_banner", "-i", str(video_path)]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    stderr = res.stderr
    dur_match = re.search(r"Duration:\s*(\d+):(\d+):([\d\.]+)", stderr)
    duration = 0.0
    if dur_match:
        h, m, s = float(dur_match.group(1)), float(dur_match.group(2)), float(dur_match.group(3))
        duration = h * 3600 + m * 60 + s
    v_match = re.search(r"Stream #\d+:\d+.*?: Video: ([^,\s]+).*?,\s*(\d+)x(\d+)", stderr)
    a_match = re.search(r"Stream #\d+:\d+.*?: Audio: ([^,\s]+)", stderr)
    return {
        'duration': round(duration, 2),
        'size': video_path.stat().st_size,
        'width': int(v_match.group(2)) if v_match else 0,
        'height': int(v_match.group(3)) if v_match else 0,
        'video_codec': v_match.group(1) if v_match else '',
        'audio_codec': a_match.group(1) if a_match else ''
    }

final_records = []
for item in items:
    vid = item['vid']
    author = item['author']
    prefix = author_map.get(author, 'blogger')
    source_id = f"hz-{prefix}-{vid}"
    
    if vid in existing_by_vid:
        print(f"[{item['idx']:02d}/21] ALREADY READY: {author} ({source_id})", flush=True)
        final_records.append(existing_by_vid[vid])
        continue
        
    print(f"[{item['idx']:02d}/21] Fetching {author} ({source_id})...", flush=True)
    detail = fetch_aweme(vid)
    if not detail:
        print(f"  Failed detail for {vid}", flush=True)
        item['status'] = 'detail_failed'
        final_records.append(item)
        continue
        
    title = detail.get('desc', item['title'])
    create_time = detail.get('create_time')
    published_on = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-01-01'
    play_urls = detail.get('video', {}).get('play_addr', {}).get('url_list', [])
    
    if not play_urls:
        print(f"  No play URL for {vid}", flush=True)
        item['status'] = 'no_url'
        final_records.append(item)
        continue
        
    out_dir = intake_dir / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    video_file = out_dir / "source.mp4"
    
    ok = download_file(play_urls[0], video_file)
    if not ok:
        print(f"  Download failed for {source_id}", flush=True)
        item['status'] = 'download_failed'
        final_records.append(item)
        continue
        
    probe = inspect_video(video_file)
    h = hashlib.sha256()
    with open(video_file, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    sha256 = h.hexdigest()
    
    rec = {
        'idx': item['idx'],
        'author': author,
        'source_id': source_id,
        'vid': vid,
        'short_url': item['short_url'],
        'canonical_url': f"https://www.douyin.com/video/{vid}",
        'title': title,
        'published_on': published_on,
        'duration_seconds': probe['duration'],
        'width': probe['width'],
        'height': probe['height'],
        'video_codec': probe['video_codec'],
        'audio_codec': probe['audio_codec'],
        'source_sha256': sha256,
        'bytes': video_file.stat().st_size,
        'status': 'ready'
    }
    print(f"  SUCCESS: {rec['duration_seconds']}s | {rec['width']}x{rec['height']} | {sha256[:16]}... | {rec['bytes']} bytes", flush=True)
    final_records.append(rec)
    time.sleep(0.3)

out_summary = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch1_downloaded.json")
out_summary.write_text(json.dumps(final_records, ensure_ascii=False, indent=2), encoding='utf8')
ready_count = len([r for r in final_records if r.get('status')=='ready'])
print(f"\nCompleted! {ready_count}/{len(items)} ready.", flush=True)
