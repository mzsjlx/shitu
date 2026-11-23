import urllib.request
import json
import os
import hashlib
import time
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def get_cdn_url(vid):
    for ratio in ['720p', '540p', 'default']:
        for line in [0, 1]:
            url = f'https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio={ratio}&line={line}'
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    cdn_url = resp.geturl()
                    size = int(resp.headers.get('Content-Length', 0))
                    if size > 1000000:
                        return cdn_url, size
            except Exception as e:
                time.sleep(1)
    return None, 0

def download(source_id, vid, title):
    print(f"\n==========================================")
    print(f"Target: {source_id} - {title}")
    target_dir = intake_dir / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = target_dir / "source.mp4"
    part_mp4 = target_dir / "source.mp4.part"
    
    cdn_url, expected_size = get_cdn_url(vid)
    print(f"Expected size: {expected_size / 1024 / 1024:.2f} MB")
    if expected_size == 0:
        print("Failed to resolve stream URL!")
        return False
        
    curr = part_mp4.stat().st_size if part_mp4.exists() else 0
    if target_mp4.exists() and target_mp4.stat().st_size >= expected_size:
        print("Already fully downloaded!")
        return True
        
    max_retries = 20
    for attempt in range(max_retries):
        try:
            curr = part_mp4.stat().st_size if part_mp4.exists() else 0
            if curr >= expected_size:
                break
                
            req_headers = {'User-Agent': 'Mozilla/5.0'}
            if curr > 0:
                req_headers['Range'] = f'bytes={curr}-'
                print(f"Resuming from {curr/1024/1024:.2f} MB...")
                
            req = urllib.request.Request(cdn_url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                mode = 'ab' if curr > 0 and resp.status == 206 else 'wb'
                if mode == 'wb':
                    curr = 0
                with open(part_mp4, mode) as f_out:
                    while True:
                        chunk = resp.read(512 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        curr += len(chunk)
                        if curr % (10 * 1024 * 1024) < 512 * 1024:
                            print(f"  {curr/1024/1024:.1f} MB ({curr/expected_size*100:.1f}%)...", flush=True)
                            
            if curr >= expected_size:
                print("Download complete!")
                break
        except Exception as e:
            print(f"Attempt {attempt+1} interrupted: {e}. Re-resolving URL...")
            time.sleep(2)
            cdn_url, expected_size = get_cdn_url(vid)
            
    if part_mp4.exists() and part_mp4.stat().st_size >= expected_size:
        if target_mp4.exists():
            target_mp4.unlink()
        part_mp4.rename(target_mp4)
        raw = target_mp4.read_bytes()
        sha256 = hashlib.sha256(raw).hexdigest()
        print(f"SUCCESS! {len(raw)/1024/1024:.2f} MB, SHA256: {sha256}")
        return True
    else:
        print(f"Incomplete download for {source_id}")
        return False

if __name__ == '__main__':
    items = [
        ("hb-ppchaonengxuan-7609991984049434862", "v2700fgi0000d6e1dufog65u04mv6gog", "一个人逛吃哈尔滨美食～超长20分钟谁敢全看完哈哈哈"),
        ("hb-xiaohao-7656653557063955386", "v2800fgi0000d90u55fog65grt911nl0", "128的烤冷面")
    ]
    for sid, vid, title in items:
        download(sid, vid, title)
