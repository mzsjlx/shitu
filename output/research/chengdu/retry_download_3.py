import os
import json
import hashlib
import urllib.request
from pathlib import Path

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')

retry_sources = [
    ("密子君", "mizijun", "7667472654974176546"),
    ("小解", "xiaojie", "7691237866088815759"),
    ("阿鸡", "aji", "7577624241508551942")
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}

for author, slug, aweme_id in retry_sources:
    source_id = f"cd-{slug}-{aweme_id}"
    print(f"\n=== Refetching API detail for {source_id} ===")
    api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    api_req = urllib.request.Request(api_url, headers=HEADERS)
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

    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    success = False
    for u in urls:
        print(f"Trying URL: {u[:60]}...")
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                print(f"Connected, Content-Length={resp.headers.get('Content-Length')}")
                with open(out_mp4, 'wb') as f_out:
                    downloaded = 0
                    while True:
                        chunk = resp.read(131072)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        downloaded += len(chunk)
                print(f"Downloaded total {downloaded} bytes.")
                if downloaded > 1000000:
                    with open(out_mp4, 'rb') as f_sha:
                        sha = hashlib.sha256(f_sha.read()).hexdigest()
                    with open(out_sha, 'w', encoding='utf-8') as f_out_sha:
                        f_out_sha.write(sha + '\n')
                    print(f"Success! SHA256: {sha}")
                    success = True
                    break
        except Exception as e:
            print(f"Failed with {e}")
    if not success:
        print(f"ERROR: Could not download {source_id}")
