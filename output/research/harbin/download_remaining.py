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

def resolve_best_stream(aweme_id):
    url = f'https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0'
    req = urllib.request.Request(url, headers=headers_mobile)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    video = data['aweme_detail']['video']
    bitrates = video.get('bit_rate', [])
    
    best_candidate = None
    for b in bitrates:
        gear = b.get('gear_name', '')
        size = b.get('play_addr', {}).get('data_size', 0)
        if ('1080' in gear or '720' in gear) and 20*1024*1024 < size < 300*1024*1024:
            best_candidate = b
            break
            
    if not best_candidate and bitrates:
        candidates = sorted(bitrates, key=lambda x: x.get('play_addr', {}).get('data_size', 0))
        for b in candidates:
            if b.get('play_addr', {}).get('data_size', 0) > 15*1024*1024:
                best_candidate = b
                break
        if not best_candidate:
            best_candidate = candidates[-1]

    if best_candidate:
        best_url = best_candidate['play_addr']['url_list'][0]
        best_size = best_candidate['play_addr'].get('data_size', 0)
    else:
        url_list = video.get('play_addr', {}).get('url_list', [])
        best_url = url_list[0] if url_list else None
        best_size = video.get('play_addr', {}).get('data_size', 0)
        
    return best_url, best_size

def download_source(item):
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
        print(f"Already exists ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256}")
        item['sourceSHA256'] = sha256
        item['fileSize'] = len(raw)
        return item

    if target_mp4.exists() and not part_mp4.exists():
        target_mp4.rename(part_mp4)
        
    print("Resolving optimal stream...")
    stream_url, expected_size = resolve_best_stream(item['awemeId'])
    print(f"Target size: {expected_size / 1024 / 1024:.2f} MB")
    
    current_size = part_mp4.stat().st_size if part_mp4.exists() else 0
    max_retries = 8
    
    for attempt in range(max_retries):
        try:
            req_headers = dict(headers_stream)
            if current_size > 0:
                req_headers['Range'] = f'bytes={current_size}-'
                print(f"Resuming from {current_size / 1024 / 1024:.2f} MB...")
                
            req = urllib.request.Request(stream_url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                mode = 'ab' if current_size > 0 and resp.status == 206 else 'wb'
                if mode == 'wb':
                    current_size = 0
                with open(part_mp4, mode) as f_out:
                    while True:
                        chunk = resp.read(128 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        current_size += len(chunk)
                        if current_size % (5 * 1024 * 1024) < 128 * 1024:
                            print(f"Downloaded {current_size / 1024 / 1024:.1f} MB / {expected_size / 1024 / 1024:.1f} MB...", flush=True)
            part_mp4.rename(target_mp4)
            raw = target_mp4.read_bytes()
            sha256 = hashlib.sha256(raw).hexdigest()
            print(f"Success! Final: {len(raw)/1024/1024:.2f} MB, SHA256: {sha256}")
            item['sourceSHA256'] = sha256
            item['fileSize'] = len(raw)
            return item
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}. Retrying in 2s...")
            time.sleep(2)
            if part_mp4.exists():
                current_size = part_mp4.stat().st_size
                
    print(f"FAILED to download {source_id} after {max_retries} attempts.")
    return None

if __name__ == '__main__':
    # Remaining indices: 1, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18
    remaining = [1, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18]
    for idx in remaining:
        item = next(it for it in items if it['index'] == idx)
        download_source(item)
        
    with open(root / "output/research/harbin/batch1_resolved.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print("\nAll remaining downloads finished!")
