import os
import sys
import re
import json
import time
import hashlib
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

links = [
    ("鸡哥了不得", "jigelebuqide", "https://v.douyin.com/b38kdos_5E4/"),
    ("wow醒哥", "wowxingge", "https://v.douyin.com/2iNm5nABjHI/"),
    ("爱肉丝", "airousi", "https://v.douyin.com/vLITayURMb0/"),
    ("三个叁", "sangesan", "https://v.douyin.com/90MkUAZSf3c/"),
    ("徐老斯和bee酱", "xulaosihebeijiang", "https://v.douyin.com/262gghtlREg/"),
    ("小贝饿了", "xiaobeiele", "https://v.douyin.com/QVTAtndjk-I/"),
    ("挑姐耍成都", "tiaojieshuachengdu", "https://v.douyin.com/sQU2NbY_0Eo/")
]

HEADERS_MOBILE = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
}
HEADERS_DESKTOP = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.douyin.com/'
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
    
    # Try fetching fresh detail
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
    else:
        print(f"  Downloading video...")
        download_success = False
        for p_url in play_addrs:
            try:
                d_req = urllib.request.Request(p_url, headers=HEADERS_DESKTOP)
                with urllib.request.urlopen(d_req, timeout=30) as resp:
                    data = resp.read()
                    if len(data) > 500000:
                        with open(out_mp4, 'wb') as vf:
                            vf.write(data)
                        sha256 = hashlib.sha256(data).hexdigest()
                        with open(out_sha, 'w', encoding='utf-8') as sf:
                            sf.write(sha256)
                        print(f"  Downloaded: {len(data)} bytes, SHA: {sha256[:12]}...")
                        download_success = True
                        break
            except Exception as de:
                print(f"  Download error with url {p_url[:40]}...: {de}")
        if not download_success:
            print(f"  FAILED to download {source_id}!")

    item_meta["sourceSHA256"] = sha256 if out_sha.exists() else ""
    results.append(item_meta)

summary_path = Path(r'output/research/chengdu/batch7_sources_meta.json')
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nAll {len(results)} Batch 7 sources resolved and downloaded to {summary_path}")
