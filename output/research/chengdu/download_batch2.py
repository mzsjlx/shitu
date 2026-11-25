import os
import re
import json
import hashlib
import urllib.request
from pathlib import Path

links = [
    ("温油辣辣U", "https://v.douyin.com/LkSj7rSSy10/"),
    ("Renyi毅哥", "https://v.douyin.com/cak286iTA9U/"),
    ("达哥在上海", "https://v.douyin.com/9BnP6tfsCI4/"),
    ("见习食神", "https://v.douyin.com/zxM0rLBpgMw/")
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')
DETAILS_BASE.mkdir(parents=True, exist_ok=True)

author_slugs = {
    "温油辣辣U": "wenyoulala",
    "Renyi毅哥": "renyi",
    "达哥在上海": "dage",
    "见习食神": "jianxishishen"
}

def resolve_url(short_url):
    req = urllib.request.Request(short_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.geturl()
    except urllib.error.HTTPError as e:
        return e.url or e.headers.get('Location') or short_url

for author, short_url in links:
    print(f"\n--- Resolving {author}: {short_url} ---")
    long_url = resolve_url(short_url)
    print("Resolved URL:", long_url)
    m = re.search(r'video/(\d+)', long_url)
    if not m:
        m = re.search(r'modal_id=(\d+)', long_url)
    if not m:
        print("ERROR: could not find aweme_id in", long_url)
        continue
    aweme_id = m.group(1)
    slug = author_slugs.get(author, 'author')
    source_id = f"cd-{slug}-{aweme_id}"
    print(f"Aweme ID: {aweme_id}, Source ID: {source_id}")

    # Fetch detail
    api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    api_req = urllib.request.Request(api_url, headers=HEADERS)
    with urllib.request.urlopen(api_req) as resp:
        detail_data = json.loads(resp.read().decode('utf-8'))
    
    aweme_detail = detail_data.get('aweme_detail', {})
    detail_path = DETAILS_BASE / f"{source_id}.json"
    with open(detail_path, 'w', encoding='utf-8') as f:
        json.dump(aweme_detail, f, ensure_ascii=False, indent=2)
    print(f"Saved detail to {detail_path}")

    # Video download
    video_info = aweme_detail.get('video', {})
    play_addrs = video_info.get('play_addr', {}).get('url_list', [])
    if not play_addrs:
        play_addrs = video_info.get('play_addr_h264', {}).get('url_list', [])
    if not play_addrs:
        print("ERROR: No play address found for", source_id)
        continue
    
    download_url = play_addrs[0]
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 100000:
        print(f"Already downloaded: {out_mp4} ({out_mp4.stat().st_size} bytes)")
    else:
        print(f"Downloading MP4 from CDN ({download_url[:60]}...)...")
        dl_req = urllib.request.Request(download_url, headers=HEADERS)
        with urllib.request.urlopen(dl_req) as resp, open(out_mp4, 'wb') as f_out:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                f_out.write(chunk)
        print(f"Downloaded: {out_mp4.stat().st_size} bytes")

    # Calculate SHA256
    with open(out_mp4, 'rb') as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    with open(out_sha, 'w', encoding='utf-8') as f:
        f.write(sha + '\n')
    print(f"SHA256: {sha}")
