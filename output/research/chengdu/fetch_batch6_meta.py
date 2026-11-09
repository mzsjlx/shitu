import os
import re
import json
import time
import urllib.request
from pathlib import Path

links = [
    ("演员王迅", "wangxun", "https://v.douyin.com/N5hPdi-OZ0Y/"),
    ("丹牛食", "danniushi", "https://v.douyin.com/-0hfL6zWl78/"),
    ("密子君", "mizijun", "https://v.douyin.com/MhbbOmre_ws/"),
    ("丹妮妮妮妮", "danninini", "https://v.douyin.com/fwejLaH1wYQ/"),
    ("演员王迅", "wangxun", "https://v.douyin.com/QJXttJ1ogJo/"),
    ("丹妮妮妮妮", "danninini", "https://v.douyin.com/uiojTW6MdLQ/"),
    ("火锅车手", "huoguocheshou", "https://v.douyin.com/jvWtRVSZF-A/"),
    ("周柏伶", "zhouboling", "https://v.douyin.com/gtVVXgfA2Mo/"),
    ("Renyi毅哥", "renyi", "https://v.douyin.com/ZRlMb6QDfN8/"),
    ("一坨小草莓", "yituoxiaocaomei", "https://v.douyin.com/oiICn0P38vY/"),
    ("Renyi毅哥", "renyi", "https://v.douyin.com/-DsNmLHsRbs/"),
    ("丹妮妮妮妮", "danninini", "https://v.douyin.com/-w8aExCMhvQ/"),
    ("鸡哥了不得", "jigelebuqide", "https://v.douyin.com/ksh9lMTf0Y4/"),
    ("PP超能炫", "ppchaonengxuan", "https://v.douyin.com/YAnkBTvtxVg/"),
    ("wow醒哥", "wowxingge", "https://v.douyin.com/awhrQ3-KZCs/"),
    ("小珍来咯…", "xiaozhen", "https://v.douyin.com/MeQCwLe5Mp4/"),
    ("王勉", "wangmian", "https://v.douyin.com/DkFHqN6oyqQ/"),
    ("哇塞几张", "wasaijizhang", "https://v.douyin.com/_ZjdwUTltBg/")
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
    print(f"\n[{idx}/{len(links)}] Resolving {author_raw}: {short_url}")
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
        "playAddr": play_addrs[0] if play_addrs else "",
        "playAddrs": play_addrs
    })

summary_path = Path(r'output/research/chengdu/batch6_sources_meta.json')
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nAll {len(results)} sources resolved and saved to {summary_path}")
