import urllib.request
import json
import os
import hashlib
import time
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

with open(root / "output/research/harbin/batch1_resolved.json", "r", encoding="utf-8") as f:
    items = json.load(f)

headers_mobile = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
}
headers_stream = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
}

def resolve_best_stream(aweme_id):
    url = f'https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0'
    req = urllib.request.Request(url, headers=headers_mobile)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    video = data['aweme_detail']['video']
    bitrates = video.get('bit_rate', [])
    
    # We want a high-quality 1080p or 720p stream, ideally between 40MB and 250MB
    best_candidate = None
    # First preference: 1080p with moderate bitrate (e.g. normal_1080_0 or lower 1080)
    for b in bitrates:
        gear = b.get('gear_name', '')
        size = b.get('play_addr', {}).get('data_size', 0)
        # prefer 1080p with size < 250MB
        if '1080' in gear and 30*1024*1024 < size < 250*1024*1024:
            best_candidate = b
            break
            
    # Second preference: 720p or normal_720
    if not best_candidate:
        for b in bitrates:
            gear = b.get('gear_name', '')
            size = b.get('play_addr', {}).get('data_size', 0)
            if '720' in gear and size < 200*1024*1024:
                best_candidate = b
                break
                
    # Fallback to play_addr
    if not best_candidate:
        url_list = video.get('play_addr', {}).get('url_list', [])
        best_url = url_list[0] if url_list else None
        best_size = video.get('play_addr', {}).get('data_size', 0)
    else:
        best_url = best_candidate['play_addr']['url_list'][0]
        best_size = best_candidate['play_addr'].get('data_size', 0)
        
    return best_url, best_size

def download_file_resumable(url, target_path, expected_size=0):
    tmp_path = target_path.with_suffix('.part')
    current_size = tmp_path.stat().st_size if tmp_path.exists() else 0
    
    if target_path.exists() and target_path.stat().st_size > 1000000:
        if expected_size and abs(target_path.stat().st_size - expected_size) < 1000:
            print(f"    Already fully downloaded: {target_path.stat().st_size} bytes")
            return target_path.stat().st_size
            
    max_retries = 8
    for attempt in range(max_retries):
        try:
            req_headers = dict(headers_stream)
            if current_size > 0:
                req_headers['Range'] = f'bytes={current_size}-'
                
            req = urllib.request.Request(url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                mode = 'ab' if current_size > 0 and resp.status == 206 else 'wb'
                if mode == 'wb':
                    current_size = 0
                with open(tmp_path, mode) as f_out:
                    while True:
                        chunk = resp.read(128 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        current_size += len(chunk)
                        if current_size % (5 * 1024 * 1024) < 128 * 1024:
                            print(f"    Downloaded {current_size / 1024 / 1024:.1f} MB...", flush=True)
            # Finished!
            tmp_path.rename(target_path)
            print(f"    Download complete! Final size: {current_size / 1024 / 1024:.2f} MB")
            return current_size
        except Exception as e:
            print(f"    Attempt {attempt+1} interrupted: {e}. Retrying in 2s...")
            time.sleep(2)
            if tmp_path.exists():
                current_size = tmp_path.stat().st_size
    raise RuntimeError(f"Failed to download after {max_retries} retries: {url}")

print("Testing resolve_best_stream...")
for idx in [2, 5]:
    item = next(it for it in items if it["index"] == idx)
    u, s = resolve_best_stream(item["awemeId"])
    print(f"[{idx}] {item['author']}: size={s/1024/1024:.2f} MB, url={u[:80]}...")
