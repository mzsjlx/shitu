import os
import sys
import re
import json
import time
import hashlib
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch8/items.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

slug_map = {
    "小解": "xiaojie",
    "徐老斯和bee酱": "xulaosihebeijiang",
    "丹牛食": "danniushi",
    "张喜喜": "zhangxixi",
    "小周和小张": "xiaozhouhexiaozhang",
    "刘雨鑫JASON": "liuyuxin",
    "丹妮妮妮妮": "danninini",
    "特厨隋坡（重新出发版）": "suipo",
    "演员王迅": "wangxun",
    "小紧张的虫虫": "xiaojinzhangdechongchong",
    "杨队！快来吃点！": "yangdui",
    "Renyi毅哥": "renyiyige",
    "队长0527": "duizhang0527",
    "盗月社食遇记": "daoyueshe",
    "巨爱吃的周嘉伟": "zhoujiawei",
    "小珍来咯…": "xiaozhen",
    "橘子公主": "juzigongzhu",
    "千金饱了": "qianjinbaole",
    "叫我Finn": "finn",
    "小笼人": "xiaolongren",
    "淦诗岐": "ganshiqi"
}

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}

DETAILS_BASE = Path(r'output/research/chengdu/details')
DETAILS_BASE.mkdir(parents=True, exist_ok=True)
INTAKE_BASE = Path(r'map-base/.local/video-intake')
INTAKE_BASE.mkdir(parents=True, exist_ok=True)

def resolve_url(short_url):
    req = urllib.request.Request(short_url, headers=HEADERS_MOBILE)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.geturl()
    except urllib.error.HTTPError as e:
        return e.url or e.headers.get('Location') or short_url
    except Exception as e:
        print(f"Error resolving {short_url}: {e}")
        return short_url

results = []

for item in items:
    idx = item["index"]
    author_raw = item["author"]
    short_url = item["shareUrl"]
    slug = slug_map.get(author_raw, re.sub(r'[^a-zA-Z0-9]', '', author_raw).lower() or f"author{idx}")
    
    print(f"\n[{idx}/{len(items)}] Resolving {author_raw}: {short_url}")
    long_url = resolve_url(short_url)
    m = re.search(r'video/(\d+)', long_url)
    if not m:
        m = re.search(r'modal_id=(\d+)', long_url)
    if not m:
        print("  ERROR: could not find aweme_id in", long_url)
        continue
    aweme_id = m.group(1)
    source_id = f"cd-{slug}-{aweme_id}"
    print(f"  Aweme ID: {aweme_id} -> Source ID: {source_id}")

    detail_path = DETAILS_BASE / f"{source_id}.json"
    aweme_detail = {}
    
    api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    try:
        api_req = urllib.request.Request(api_url, headers=HEADERS_MOBILE)
        with urllib.request.urlopen(api_req, timeout=15) as resp:
            detail_data = json.loads(resp.read().decode('utf-8'))
            aweme_detail = detail_data.get('aweme_detail', {})
            if aweme_detail:
                with open(detail_path, 'w', encoding='utf-8') as f:
                    json.dump(aweme_detail, f, ensure_ascii=False, indent=2)
                print(f"  Fetched & saved detail to {detail_path}")
    except Exception as e:
        print(f"  ERROR fetching detail: {e}")
        if detail_path.exists():
            with open(detail_path, 'r', encoding='utf-8') as f:
                aweme_detail = json.load(f)

    desc = aweme_detail.get('desc', '')
    author_info = aweme_detail.get('author', {})
    nickname = author_info.get('nickname', author_raw)
    create_time = aweme_detail.get('create_time', 0)
    published_on = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else ''
    video_info = aweme_detail.get('video', {})
    duration = video_info.get('duration', 0) / 1000.0
    poi_info = aweme_detail.get('poi_info', {})
    poi_name = poi_info.get('poi_name', '') if poi_info else ''

    play_addrs = video_info.get('play_addr', {}).get('url_list', [])
    if not play_addrs:
        play_addrs = video_info.get('play_addr_h264', {}).get('url_list', [])

    item_meta = {
        "index": idx,
        "sourceId": source_id,
        "author": nickname,
        "authorSlug": slug,
        "awemeId": aweme_id,
        "shareUrl": short_url,
        "canonicalUrl": f"https://www.douyin.com/video/{aweme_id}",
        "title": desc.replace('\n', ' ').strip(),
        "publishedOn": published_on,
        "durationSeconds": round(duration, 2),
        "poiName": poi_name,
        "playAddrs": play_addrs
    }

    # Download MP4
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 500000:
        with open(out_sha, 'r', encoding='utf-8') as sf:
            sha256 = sf.read().strip()
        print(f"  Already downloaded: {out_mp4.stat().st_size} bytes, SHA: {sha256[:12]}...")
        item_meta["sourceSHA256"] = sha256
    elif play_addrs:
        print(f"  Downloading MP4 to {out_mp4}...")
        download_success = False
        for p_url in play_addrs:
            try:
                d_req = urllib.request.Request(p_url, headers=HEADERS_MOBILE)
                hasher = hashlib.sha256()
                with urllib.request.urlopen(d_req, timeout=30) as resp, open(out_mp4, 'wb') as out_f:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        hasher.update(chunk)
                sha256 = hasher.hexdigest()
                with open(out_sha, 'w', encoding='utf-8') as sf:
                    sf.write(sha256 + '\n')
                item_meta["sourceSHA256"] = sha256
                print(f"  Downloaded: {out_mp4.stat().st_size} bytes, SHA: {sha256[:12]}...")
                download_success = True
                break
            except Exception as de:
                print(f"    Failed with {p_url[:50]}...: {de}")
        if not download_success:
            print("  FAILED to download MP4!")
    else:
        print("  WARNING: No play_addrs found!")

    results.append(item_meta)
    time.sleep(0.5)

with open('output/research/chengdu/batch8/batch8_sources_meta.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n=== Batch 8 Fetch Complete! ===")
