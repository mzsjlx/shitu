import os
import json
import hashlib
import urllib.request
import time
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')
DETAILS_BASE.mkdir(parents=True, exist_ok=True)

batch5_sources = [
    ("岛民大白", "daomindabai", "7703823334010051003", "https://v.douyin.com/oGozuTIN6cU/"),
    ("小紧张的虫虫", "xiaojinzhangdechongchong", "7498312599780560147", "https://v.douyin.com/C_0Xzgcw-Dg/"),
    ("特别乌啦啦", "wulala", "7560927991686008098", "https://v.douyin.com/rBUBfZPymRQ/"),
    ("JoJo觅食", "jojomishi", "7704936890641747227", "https://v.douyin.com/hArgGJeBJKw/"),
    ("是 Simon 啊", "shisimon", "7641414725993719515", "https://v.douyin.com/hoxqlgUK6cg/"),
    ("贺千万。", "heqianwan", "7616015531045363578", "https://v.douyin.com/0GCicxnpL3M/"),
    ("霹雳干饭记", "piliganfanji", "7700130613965155529", "https://v.douyin.com/nNvV8zil_bc/"),
    ("马伯骞", "maboqian", "7628555606619063478", "https://v.douyin.com/xq6m7O66BZE/"),
    ("小解", "xiaojie", "7614776037532110143", "https://v.douyin.com/nJhrVJUTpzw/")
]

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}
HEADERS_DESKTOP = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.douyin.com/'
}

results = []

for idx, (author, slug, aweme_id, share_url) in enumerate(batch5_sources, 1):
    source_id = f"cd-{slug}-{aweme_id}"
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'
    detail_path = DETAILS_BASE / f"{source_id}.json"

    print(f"\n[{idx}/9] Processing {author} [{source_id}]...", flush=True)

    aweme_detail = {}
    if detail_path.exists():
        try:
            with open(detail_path, 'r', encoding='utf-8') as f:
                aweme_detail = json.load(f)
        except Exception:
            pass

    if not aweme_detail or 'desc' not in aweme_detail:
        for attempt in range(3):
            print(f"Fetching fresh detail for {aweme_id} (attempt {attempt+1})...", flush=True)
            api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
            api_req = urllib.request.Request(api_url, headers=HEADERS_MOBILE)
            try:
                with urllib.request.urlopen(api_req, timeout=15) as resp:
                    detail_data = json.loads(resp.read().decode('utf-8'))
                    aweme_detail = detail_data.get('aweme_detail', {})
                    if aweme_detail and 'desc' in aweme_detail:
                        with open(detail_path, 'w', encoding='utf-8') as f:
                            json.dump(aweme_detail, f, ensure_ascii=False, indent=2)
                        break
            except Exception as e:
                print(f"API detail attempt {attempt+1} failed: {e}", flush=True)
                time.sleep(2)

    desc = aweme_detail.get('desc', '')
    create_time = aweme_detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else ''
    video_info = aweme_detail.get('video', {})
    duration = video_info.get('duration', 0) / 1000.0

    print(f"  Title: {desc[:60]}", flush=True)
    print(f"  Published: {pub_date}, Duration: {duration}s", flush=True)

    # Check if video already exists with valid SHA256 and size > 1MB
    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 1000000:
        with open(out_sha, 'r', encoding='utf-8') as sf:
            cached_sha = sf.read().strip()
        print(f"  [Cached] {out_mp4.stat().st_size} bytes, SHA256: {cached_sha[:16]}...", flush=True)
        results.append({
            'source_id': source_id,
            'author': author,
            'slug': slug,
            'aweme_id': aweme_id,
            'share_url': share_url,
            'title': desc,
            'publishedOn': pub_date,
            'duration': duration,
            'bytes': out_mp4.stat().st_size,
            'sha256': cached_sha
        })
        continue

    urls = []
    if 'play_addr' in video_info and 'url_list' in video_info['play_addr']:
        urls.extend(video_info['play_addr']['url_list'])
    if 'play_addr_h264' in video_info and 'url_list' in video_info['play_addr_h264']:
        urls.extend(video_info['play_addr_h264']['url_list'])

    downloaded_sha = ''
    downloaded_size = 0
    for i, u in enumerate(urls):
        print(f"  Trying CDN URL {i+1}/{len(urls)}: {u[:60]}...", flush=True)
        req = urllib.request.Request(u, headers=HEADERS_DESKTOP)
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                content_len = int(resp.headers.get('Content-Length', 0))
                print(f"  Connected! Content-Length={content_len} ({(content_len/1024/1024):.1f} MB)", flush=True)
                h = hashlib.sha256()
                downloaded = 0
                temp_mp4 = out_dir / 'source.tmp'
                with open(temp_mp4, 'wb') as f_out:
                    last_log = time.time()
                    while True:
                        chunk = resp.read(262144)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        h.update(chunk)
                        downloaded += len(chunk)
                        if time.time() - last_log > 3.0:
                            percent = (downloaded / content_len * 100) if content_len else 0
                            print(f"    Progress: {downloaded/1024/1024:.1f} MB ({percent:.0f}%)", flush=True)
                            last_log = time.time()
                
                if content_len and downloaded < content_len * 0.98:
                    print(f"  Downloaded size {downloaded} is less than content_len {content_len}, retrying next CDN...", flush=True)
                    if temp_mp4.exists():
                        temp_mp4.unlink()
                    continue

                if temp_mp4.exists():
                    if out_mp4.exists():
                        out_mp4.unlink()
                    temp_mp4.rename(out_mp4)
                
                downloaded_sha = h.hexdigest()
                downloaded_size = out_mp4.stat().st_size
                with open(out_sha, 'w', encoding='utf-8') as sf:
                    sf.write(downloaded_sha + '\n')
                print(f"  [Downloaded] Size: {downloaded_size} bytes, SHA256: {downloaded_sha[:16]}...", flush=True)
                break
        except Exception as e:
            print(f"  CDN download failed: {e}", flush=True)

    results.append({
        'source_id': source_id,
        'author': author,
        'slug': slug,
        'aweme_id': aweme_id,
        'share_url': share_url,
        'title': desc,
        'publishedOn': pub_date,
        'duration': duration,
        'bytes': downloaded_size,
        'sha256': downloaded_sha
    })

with open('output/research/chengdu/batch5_sources_meta.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nAll 9 sources metadata saved to batch5_sources_meta.json!", flush=True)
