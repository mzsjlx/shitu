import urllib.request
import json
import os
import hashlib
import time
from pathlib import Path

root = Path('.').resolve()
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

def resolve_download_url(item):
    aweme_id = item['awemeId']
    url = f'https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0'
    req = urllib.request.Request(url, headers=headers_mobile)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    video = data['aweme_detail']['video']
    bitrates = video.get('bit_rate', [])
    
    # Priority: find a 720p or 1080p stream whose size is between 15MB and 150MB
    candidate = None
    for b in bitrates:
        gear = b.get('gear_name', '')
        size = b.get('play_addr', {}).get('data_size', 0)
        if ('720' in gear or '540' in gear or '1080' in gear) and 15*1024*1024 < size < 150*1024*1024:
            candidate = b
            break
            
    if candidate:
        return candidate['play_addr']['url_list'][0], candidate['play_addr'].get('data_size', 0)
        
    # Fallback to play_addr
    play_addr = video.get('play_addr', {})
    if play_addr.get('url_list'):
        return play_addr['url_list'][0], play_addr.get('data_size', 0)
        
    # Fallback to vid direct
    vid = video.get('vid') or item.get('vid')
    if vid:
        direct = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio=default&line=0"
        return direct, 0
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
        print(f"Already exists ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256}")
        item['sourceSHA256'] = sha256
        item['fileSize'] = len(raw)
        return item
        
    stream_url, exp_size = resolve_download_url(item)
    print(f"Stream resolved. Size: {exp_size/1024/1024:.2f} MB")
    
    curr = part_mp4.stat().st_size if part_mp4.exists() else 0
    max_retries = 6
    for attempt in range(max_retries):
        try:
            req_headers = dict(headers_stream)
            if curr > 0:
                req_headers['Range'] = f'bytes={curr}-'
            req = urllib.request.Request(stream_url, headers=req_headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                mode = 'ab' if curr > 0 and resp.status == 206 else 'wb'
                if mode == 'wb':
                    curr = 0
                with open(part_mp4, mode) as f_out:
                    while True:
                        chunk = resp.read(128 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                        curr += len(chunk)
                        if curr % (5 * 1024 * 1024) < 128 * 1024:
                            print(f"Downloaded {curr/1024/1024:.1f} MB...", flush=True)
            part_mp4.rename(target_mp4)
            raw = target_mp4.read_bytes()
            sha256 = hashlib.sha256(raw).hexdigest()
            print(f"Success! {len(raw)/1024/1024:.2f} MB, SHA256: {sha256}")
            item['sourceSHA256'] = sha256
            item['fileSize'] = len(raw)
            return item
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {e}. Retrying...")
            time.sleep(2)
            if part_mp4.exists():
                curr = part_mp4.stat().st_size
    print(f"Failed to download {source_id}")
    return None

if __name__ == '__main__':
    # Let's download items 11 (xiaozhen - 东北副食品商场), 9 (pangshi - 红专街早市), 17 (juzigongzhu - 12元盒饭)
    targets = [11, 9, 17]
    for idx in targets:
        it = next(item for item in items if item['index'] == idx)
        download_item(it)
        
    with open(root / "output/research/harbin/batch1_resolved.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print("\nTarget downloads finished.")
