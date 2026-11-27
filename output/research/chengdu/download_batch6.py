import os
import sys
import json
import hashlib
import urllib.request
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')

with open('output/research/chengdu/batch6_sources_meta.json', 'r', encoding='utf-8') as f:
    batch6_sources = json.load(f)

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}
HEADERS_DESKTOP = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.douyin.com/'
}

results = []

for item in batch6_sources:
    source_id = item['sourceId']
    aweme_id = item['awemeId']
    author = item['author']
    
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 500000:
        with open(out_sha, 'r', encoding='utf-8') as sf:
            cached_sha = sf.read().strip()
        print(f"[{item['index']}/18] {source_id} already exists ({out_mp4.stat().st_size} bytes, SHA: {cached_sha[:10]}...)")
        results.append({
            "sourceId": source_id,
            "bytes": out_mp4.stat().st_size,
            "sha256": cached_sha
        })
        continue

    print(f"\n[{item['index']}/18] === Fetching fresh detail for {source_id} ({author}) ===")
    detail_path = DETAILS_BASE / f"{source_id}.json"
    aweme_detail = {}
    if detail_path.exists():
        try:
            with open(detail_path, 'r', encoding='utf-8') as f:
                aweme_detail = json.load(f)
        except Exception:
            pass

    # If play_addr not in cached detail or expired, re-fetch
    api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    try:
        api_req = urllib.request.Request(api_url, headers=HEADERS_MOBILE)
        with urllib.request.urlopen(api_req, timeout=15) as resp:
            detail_data = json.loads(resp.read().decode('utf-8'))
            fresh_detail = detail_data.get('aweme_detail')
            if fresh_detail:
                aweme_detail = fresh_detail
                with open(detail_path, 'w', encoding='utf-8') as f:
                    json.dump(aweme_detail, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"  Note: error re-fetching detail: {e}, using existing if present")

    video_info = aweme_detail.get('video', {})
    urls = []
    if 'play_addr' in video_info and 'url_list' in video_info['play_addr']:
        urls.extend(video_info['play_addr']['url_list'])
    if 'play_addr_h264' in video_info and 'url_list' in video_info['play_addr_h264']:
        urls.extend(video_info['play_addr_h264']['url_list'])

    success = False
    for i, u in enumerate(urls):
        print(f"  Trying CDN URL {i+1}/{len(urls)}...")
        req = urllib.request.Request(u, headers=HEADERS_DESKTOP)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content_len = resp.headers.get('Content-Length')
                h = hashlib.sha256()
                with open(out_mp4, 'wb') as f_out:
                    downloaded = 0
                    while True:
                        chunk = resp.read(131072)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        h.update(chunk)
                        downloaded += len(chunk)
                        print(f"\r  Downloaded: {downloaded / (1024*1024):.2f} MB", end='', flush=True)
                print(f"\n  Downloaded total {downloaded} bytes.")
                if downloaded > 500000:
                    sha = h.hexdigest()
                    with open(out_sha, 'w', encoding='utf-8') as f_out_sha:
                        f_out_sha.write(sha + '\n')
                    print(f"  Success! SHA256: {sha}")
                    results.append({
                        "sourceId": source_id,
                        "bytes": downloaded,
                        "sha256": sha
                    })
                    success = True
                    break
        except Exception as e:
            print(f"\n  Failed CDN {i+1}: {e}")
            time.sleep(1)
            
    if not success:
        print(f"  ERROR: Could not download {source_id}")

print(f"\n=== Download completed: {len(results)}/18 sources ready ===")
