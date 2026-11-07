import os
import re
import json
import time
import urllib.request
from pathlib import Path

links = [
    ("肉肉大搜索", "rourou", "https://v.douyin.com/u14sw86QcaQ/"),
    ("锋味", "fengwei", "https://v.douyin.com/3n9JS0qI3-s/"),
    ("变成护肝片", "huganpian", "https://v.douyin.com/VWEjB8kdj7o/"),
    ("丹妮妮妮妮", "danninini", "https://v.douyin.com/3Ewdzuv_Z94/"),
    ("Renyi毅哥", "renyi", "https://v.douyin.com/b_MN6WqsZ9Q/"),
    ("密子君", "mizijun", "https://v.douyin.com/1EtToX-i75w/"),
    ("小解", "xiaojie", "https://v.douyin.com/iZBrPNULxTA/"),
    ("阿鸡", "aji", "https://v.douyin.com/xtqWdRO-WbM/"),
    ("演员王迅", "wangxun", "https://v.douyin.com/O-6OCE2bjTg/"),
    ("希希吃不胖", "xixichibupang", "https://v.douyin.com/yNBg7530onI/"),
    ("丹妮妮妮妮", "danninini", "https://v.douyin.com/NymZleQssAM/"),
    ("Renyi毅哥", "renyi", "https://v.douyin.com/K6k6ECK9t28/")
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}

DETAILS_BASE = Path(r'output/research/chengdu/details')
DETAILS_BASE.mkdir(parents=True, exist_ok=True)

def resolve_url(short_url):
    req = urllib.request.Request(short_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.geturl()
    except urllib.error.HTTPError as e:
        return e.url or e.headers.get('Location') or short_url
    except Exception as e:
        print(f"Error resolving {short_url}: {e}")
        return short_url

results = []

for idx, (author_raw, slug, short_url) in enumerate(links, 1):
    print(f"\n[{idx}/12] Resolving {author_raw}: {short_url}")
    long_url = resolve_url(short_url)
    print("  Long URL:", long_url)
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
    if detail_path.exists():
        try:
            with open(detail_path, 'r', encoding='utf-8') as f:
                aweme_detail = json.load(f)
            print("  Loaded cached detail.")
        except Exception:
            pass

    if not aweme_detail:
        api_url = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
        try:
            api_req = urllib.request.Request(api_url, headers=HEADERS)
            with urllib.request.urlopen(api_req, timeout=15) as resp:
                detail_data = json.loads(resp.read().decode('utf-8'))
                aweme_detail = detail_data.get('aweme_detail', {})
                if aweme_detail:
                    with open(detail_path, 'w', encoding='utf-8') as f:
                        json.dump(aweme_detail, f, ensure_ascii=False, indent=2)
                    print(f"  Fetched & saved detail to {detail_path}")
                else:
                    print(f"  WARNING: Empty aweme_detail for {aweme_id}")
        except Exception as e:
            print(f"  ERROR fetching detail: {e}")

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

    results.append({
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
        "hasPlayAddr": len(play_addrs) > 0,
        "playAddr": play_addrs[0] if play_addrs else ""
    })

summary_path = Path(r'output/research/chengdu/batch2_sources_meta.json')
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nAll 12 sources resolved and saved to {summary_path}")
