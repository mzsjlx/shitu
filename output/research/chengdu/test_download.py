import urllib.request
import json
import hashlib
from pathlib import Path

INTAKE_BASE = Path(r'map-base/.local/video-intake')

def download_video(source_id, detail_file):
    with open(detail_file, 'r', encoding='utf-8') as f:
        d = json.load(f)
    urls = d['video']['play_addr']['url_list']
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    for u in urls:
        for ref in [None, 'https://www.douyin.com/', 'https://www.iesdouyin.com/']:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            if ref:
                headers['Referer'] = ref
            req = urllib.request.Request(u, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    print(f"Connected to {u[:40]}... (status {resp.status}, length {resp.headers.get('Content-Length')})")
                    with open(out_mp4, 'wb') as f_out:
                        while True:
                            chunk = resp.read(65536)
                            if not chunk:
                                break
                            f_out.write(chunk)
                    print(f"Downloaded {out_mp4.stat().st_size} bytes!")
                    with open(out_mp4, 'rb') as f_check:
                        sha = hashlib.sha256(f_check.read()).hexdigest()
                    with open(out_sha, 'w', encoding='utf-8') as f_sha:
                        f_sha.write(sha + '\n')
                    print(f"SHA256: {sha}")
                    return True
            except Exception as e:
                print(f"Failed {u[:30]} with ref {ref}: {e}")
    return False

# Download jianxishishen
print("=== Resolving JianXiShiShen ===")
short_url = "https://v.douyin.com/zxM0rLBpgMw/"
import re
req = urllib.request.Request(short_url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'})
try:
    with urllib.request.urlopen(req) as resp:
        long_url = resp.geturl()
except urllib.error.HTTPError as e:
    long_url = e.url or e.headers.get('Location') or short_url

print("Long URL:", long_url)
m = re.search(r'video/(\d+)', long_url) or re.search(r'modal_id=(\d+)', long_url)
aweme_id = m.group(1)
source_id = f"cd-jianxishishen-{aweme_id}"
print("Source ID:", source_id)

api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
api_req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'})
with urllib.request.urlopen(api_req) as resp:
    detail_data = json.loads(resp.read().decode('utf-8'))

detail_path = Path(r'output/research/chengdu/details') / f"{source_id}.json"
with open(detail_path, 'w', encoding='utf-8') as f:
    json.dump(detail_data.get('aweme_detail', {}), f, ensure_ascii=False, indent=2)

res2 = download_video(source_id, str(detail_path))
print("Jianxishishen result:", res2)
