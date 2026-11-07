import os
import json
import hashlib
import urllib.request
import time
from pathlib import Path

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')

batch3_sources = [
    ("特厨隋坡", "suipo", "7513669075017501992"),
    ("哇塞几张", "wasaijizhang", "7622980347575192832"),
    ("二百者也", "erbaizheye", "7571507105111362862")
]

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}
HEADERS_DESKTOP = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.douyin.com/'
}

for author, slug, aweme_id in batch3_sources:
    source_id = f"cd-{slug}-{aweme_id}"
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 1000000:
        with open(out_sha, 'r', encoding='utf-8') as sf:
            cached_sha = sf.read().strip()
        print(f"\n{source_id} already exists ({out_mp4.stat().st_size} bytes, SHA256: {cached_sha[:12]}...)")
        continue

    print(f"\n=== Fetching fresh detail for {source_id} ===")
    api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    api_req = urllib.request.Request(api_url, headers=HEADERS_MOBILE)
    with urllib.request.urlopen(api_req, timeout=15) as resp:
        detail_data = json.loads(resp.read().decode('utf-8'))
        aweme_detail = detail_data.get('aweme_detail', {})

    detail_path = DETAILS_BASE / f"{source_id}.json"
    with open(detail_path, 'w', encoding='utf-8') as f:
        json.dump(aweme_detail, f, ensure_ascii=False, indent=2)

    video_info = aweme_detail.get('video', {})
    urls = []
    if 'play_addr' in video_info and 'url_list' in video_info['play_addr']:
        urls.extend(video_info['play_addr']['url_list'])
    if 'play_addr_h264' in video_info and 'url_list' in video_info['play_addr_h264']:
        urls.extend(video_info['play_addr_h264']['url_list'])

    success = False
    for i, u in enumerate(urls):
        print(f"Trying CDN URL {i+1}/{len(urls)}: {u[:60]}...")
        req = urllib.request.Request(u, headers=HEADERS_DESKTOP)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content_len = resp.headers.get('Content-Length')
                print(f"Connected, Content-Length={content_len}")
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
                print(f"\nDownloaded total {downloaded} bytes.")
                if downloaded > 1000000:
                    sha = h.hexdigest()
                    with open(out_sha, 'w', encoding='utf-8') as f_out_sha:
                        f_out_sha.write(sha + '\n')
                    print(f"Success! SHA256: {sha}")
                    success = True
                    break
        except Exception as e:
            print(f"\nFailed URL {i+1} with {e}")
            time.sleep(1)
    if not success:
        print(f"ERROR: Could not download {source_id}")

print("\n=== All batch 3 sources download finished ===")
