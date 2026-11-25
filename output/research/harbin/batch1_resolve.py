import urllib.request
import json
import re
import time
from pathlib import Path

raw_inputs = [
    ("盗月社食遇记", "https://v.douyin.com/CN9I3pp3wbM/"),
    ("特别乌啦啦", "https://v.douyin.com/p1D3MIRjh38/"),
    ("澳仔", "https://v.douyin.com/tAvkSsYJUXw/"),
    ("小豪饿了", "https://v.douyin.com/bVN-gXFAyd8/"),
    ("刘雨鑫JASON", "https://v.douyin.com/76UHKtD9FD8/"),
    ("PP超能炫", "https://v.douyin.com/Xf2nvi4DBQs/"),
    ("面条人", "https://v.douyin.com/KkspUiY02Js/"),
    ("面条人", "https://v.douyin.com/i7TILrCQkhw/"),
    ("庞师不是师", "https://v.douyin.com/eNuarDVA0tQ/"),
    ("董春辉", "https://v.douyin.com/HBf0jPwhEo4/"),
    ("小珍来咯…", "https://v.douyin.com/i1991L4KSfw/"),
    ("王宁", "https://v.douyin.com/PSaS4jHgsz4/"),
    ("刘雨鑫JASON", "https://v.douyin.com/22YhbtA-IbM/"),
    ("芋泥啵啵🍯", "https://v.douyin.com/sp3mIMQd5Ro/"),
    ("庞师不是师", "https://v.douyin.com/e9qcSz1Sk-U/"),
    ("小珍来咯…", "https://v.douyin.com/mgYnUDhjZLU/"),
    ("橘子公主", "https://v.douyin.com/NlJsataPGXc/"),
    ("一条大肥鹅", "https://v.douyin.com/dKk8PixOamY/")
]

desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

def resolve_short_url(short_url):
    req = urllib.request.Request(short_url, headers={'User-Agent': desktop_ua})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            final_url = resp.geturl()
            match = re.search(r'/video/(\d+)', final_url)
            if match:
                return match.group(1), final_url
    except Exception as e:
        print(f"Error resolving {short_url}: {e}")
    return None, None

def fetch_aweme_detail(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {aweme_id}: {e}")
            time.sleep(1)
    return None

results = []
print(f"=== Resolving {len(raw_inputs)} Douyin Video Sources for Harbin ===\n")

for idx, (hint_author, short_url) in enumerate(raw_inputs, 1):
    print(f"[{idx}/{len(raw_inputs)}] Processing {hint_author}: {short_url}...")
    aweme_id, full_url = resolve_short_url(short_url)
    if not aweme_id:
        print(f"  FAILED to resolve aweme_id for {short_url}")
        continue
    
    print(f"  Aweme ID: {aweme_id}")
    detail = fetch_aweme_detail(aweme_id)
    if not detail:
        print(f"  FAILED to fetch detail for {aweme_id}")
        continue
    
    author_info = detail.get('author', {})
    nickname = author_info.get('nickname', hint_author)
    sec_uid = author_info.get('sec_uid', '')
    desc = detail.get('desc', '')
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-11-12'
    
    video = detail.get('video', {})
    duration_ms = video.get('duration', 0)
    duration_sec = round(duration_ms / 1000.0, 2)
    
    play_addr = video.get('play_addr', {})
    vid = play_addr.get('uri', '')
    download_url = f"https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio=default&line=0" if vid else ""
    
    # Pick cover
    cover_url = ""
    cover_obj = video.get('cover', {}) or video.get('origin_cover', {})
    if cover_obj.get('url_list'):
        cover_url = cover_obj['url_list'][0]
        
    source_id = f"hb-{re.sub(r'[^a-z0-9]', '', nickname.lower())[:12] or 'video'}-{aweme_id}"
    
    item = {
        "index": idx,
        "sourceId": source_id,
        "author": nickname,
        "title": desc.split('#')[0].strip() or desc[:60],
        "fullDesc": desc,
        "awemeId": aweme_id,
        "url": f"https://www.douyin.com/video/{aweme_id}",
        "shareURL": short_url,
        "publishedOn": pub_date,
        "durationSeconds": duration_sec,
        "vid": vid,
        "downloadUrl": download_url,
        "coverUrl": cover_url
    }
    results.append(item)
    print(f"  OK: {nickname} - \"{item['title'][:40]}\" ({duration_sec}s, {pub_date})")
    time.sleep(0.5)

out_file = Path("output/research/harbin/batch1_resolved.json")
out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"\nSuccessfully resolved {len(results)}/{len(raw_inputs)} sources to {out_file}!")
