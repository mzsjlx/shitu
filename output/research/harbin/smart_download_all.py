import urllib.request
import json
import os
import hashlib
import time
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

resolved_path = root / "output/research/harbin/batch1_resolved.json"
with open(resolved_path, "r", encoding="utf-8") as f:
    items = json.load(f)

headers_mobile = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
}

author_slug_map = {
    "盗月社食遇记": "daoyueshe",
    "特别乌啦啦": "wulala",
    "澳仔": "aozai",
    "小豪饿了": "xiaohao",
    "刘雨鑫JASON": "liuyuxin",
    "PP超能炫": "ppchaonengxuan",
    "面条人": "miantiaoren",
    "庞师不是师": "pangshi",
    "董春辉": "dongchunhui",
    "小珍来咯…": "xiaozhen",
    "王宁": "wangning",
    "芋泥啵啵🍯": "yunibobo",
    "橘子公主": "juzigongzhu",
    "一条大肥鹅": "yitiaodafeie"
}

def get_redirected_cdn_url(vid):
    for ratio in ['720p', '540p', 'default']:
        url = f'https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio={ratio}&line=0'
        req = urllib.request.Request(url, headers=headers_mobile)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                cdn_url = resp.geturl()
                content_len = resp.headers.get('Content-Length')
                size = int(content_len) if content_len else 0
                return cdn_url, size
        except Exception as e:
            time.sleep(1)
    return None, 0

def download_item(item):
    author = item['author']
    slug = author_slug_map.get(author, 'author')
    source_id = f"hb-{slug}-{item['awemeId']}"
    item['sourceId'] = source_id
    
    target_dir = intake_dir / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = target_dir / "source.mp4"
    part_mp4 = target_dir / "source.mp4.part"
    
    print(f"\n==========================================")
    print(f"[{item['index']}] {author} - {source_id}")
    print(f"Title: {item['title']}")
    
    if target_mp4.exists() and target_mp4.stat().st_size > 1000000:
        raw = target_mp4.read_bytes()
        sha256 = hashlib.sha256(raw).hexdigest()
        print(f"Already downloaded ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256}")
        item['sourceSHA256'] = sha256
        item['fileSize'] = len(raw)
        return True

    vid = item.get('vid')
    if not vid:
        print("Missing vid! Skipping.")
        return False
        
    print("Resolving CDN stream with dynamic redirect...")
    cdn_url, expected_size = get_redirected_cdn_url(vid)
    if not cdn_url:
        print(f"Failed to get CDN URL for {vid}")
        return False
        
    print(f"Stream resolved. Size: {expected_size/1024/1024:.2f} MB")
    
    curr = part_mp4.stat().st_size if part_mp4.exists() else 0
    max_retries = 10
    
    for attempt in range(max_retries):
        try:
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
                        chunk = resp.read(256 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        curr += len(chunk)
                        if curr % (10 * 1024 * 1024) < 256 * 1024:
                            pct = (curr / expected_size * 100) if expected_size > 0 else 0
                            print(f"  {curr/1024/1024:.1f} MB ({pct:.1f}%)...", flush=True)
                            
            part_mp4.rename(target_mp4)
            raw = target_mp4.read_bytes()
            sha256 = hashlib.sha256(raw).hexdigest()
            print(f"SUCCESS! {len(raw)/1024/1024:.2f} MB, SHA256: {sha256}")
            item['sourceSHA256'] = sha256
            item['fileSize'] = len(raw)
            return True
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}. Re-resolving CDN URL...")
            time.sleep(2)
            cdn_url, expected_size = get_redirected_cdn_url(vid)
            if part_mp4.exists():
                curr = part_mp4.stat().st_size
                
    print(f"FAILED to download {source_id} after {max_retries} attempts.")
    return False

if __name__ == '__main__':
    # All 18 items
    indices = [1, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18]
    success_count = 0
    for idx in indices:
        item = next(it for it in items if it['index'] == idx)
        ok = download_item(item)
        if ok:
            success_count += 1
            with open(resolved_path, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
                
    print(f"\n==========================================")
    print(f"Downloaded {success_count} / {len(indices)} remaining videos!")
