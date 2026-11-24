import urllib.request
import json
import re
import time
import os
import hashlib
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)
out_json = root / "output/research/harbin/batch8_resolved.json"

raw_batch8 = [
    ("刘雨鑫JASON", "https://v.douyin.com/TpUoYLI8X4k/", "liuyuxin"),
    ("PP超能炫", "https://v.douyin.com/Mh_ZebTX9fM/", "ppchaonengxuan"),
    ("一只蒸包zz", "https://v.douyin.com/Bm5is0EXL18/", "yizhezhengbao"),
    ("鸡哥了不得", "https://v.douyin.com/czB7U0HqXCc/", "jige"),
    ("姚十八的小号", "https://v.douyin.com/c42UCTdpQUk/", "yaoshiba"),
    ("刘一口", "https://v.douyin.com/6zSjHYDS5iw/", "liuyikou"),
    ("明明的幸福生活", "https://v.douyin.com/GaOSzr0Z2pM/", "mingming"),
    ("小旋宝宝", "https://v.douyin.com/UMFjkC-TVLY/", "xiaoxuanbaobao"),
    ("沈十一（重生版）", "https://v.douyin.com/W1T60DRDS2k/", "shenshiyi"),
    ("小牙一杯", "https://v.douyin.com/BOqE4UQs33o/", "xiaoyayibei"),
    ("王勉", "https://v.douyin.com/OJgu7InmbbU/", "wangmian"),
    ("是圆子", "https://v.douyin.com/xhCpNGhk-Tg/", "shiyuanzi"),
    ("rikku闲不咸", "https://v.douyin.com/FdnPZRxUKQA/", "rikkuxianbuxian")
]

desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
mobile_ua = "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36"

def resolve_short_url(short_url):
    req = urllib.request.Request(short_url.strip(), headers={'User-Agent': desktop_ua})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            final_url = resp.geturl()
            match = re.search(r'/video/(\d+)', final_url)
            if match:
                return match.group(1), final_url
    except Exception as e:
        print(f"Error resolving {short_url}: {e}", flush=True)
    return None, None

def fetch_aweme_detail(aweme_id):
    endpoint = f"https://api.amemv.com/aweme/v1/aweme/detail/?aweme_id={aweme_id}&aid=6383&device_platform=web&version_code=190500&version_name=19.5.0"
    req = urllib.request.Request(endpoint, headers={'User-Agent': mobile_ua, 'Accept': 'application/json, text/plain, */*'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('status_code') == 0 and 'aweme_detail' in data:
                    return data['aweme_detail']
        except Exception as e:
            time.sleep(1)
    return None

resolved_list = []
if out_json.exists():
    try:
        with open(out_json, "r", encoding="utf-8") as f:
            resolved_list = json.load(f)
    except:
        pass

resolved_map = {item['shareURL']: item for item in resolved_list}

print(f"=== Starting Batch 8 Resolution and Download ({len(raw_batch8)} Items) ===\n", flush=True)

for idx, (hint_author, short_url, slug) in enumerate(raw_batch8, 1):
    clean_url = short_url.strip()
    if clean_url in resolved_map and resolved_map[clean_url].get('sourceSHA256'):
        print(f"[{idx}/{len(raw_batch8)}] ALREADY READY: {hint_author} -> {resolved_map[clean_url].get('sourceId')}", flush=True)
        continue
    if clean_url in resolved_map and resolved_map[clean_url].get('excluded'):
        print(f"[{idx}/{len(raw_batch8)}] ALREADY EXCLUDED: {hint_author} -> {clean_url}", flush=True)
        continue
        
    print(f"[{idx}/{len(raw_batch8)}] Resolving: {hint_author} ({slug}) -> {clean_url}", flush=True)
    aweme_id, full_url = resolve_short_url(clean_url)
    if not aweme_id:
        print(f"  FAILED to resolve aweme_id for {clean_url}", flush=True)
        continue
        
    detail = fetch_aweme_detail(aweme_id)
    if not detail:
        print(f"  FAILED to fetch detail for {aweme_id}", flush=True)
        continue
        
    author_info = detail.get('author', {})
    nickname = author_info.get('nickname', hint_author)
    desc = detail.get('desc', '')
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-11-16'
    
    video = detail.get('video', {})
    duration_ms = video.get('duration', 0)
    duration_sec = round(duration_ms / 1000.0, 2)
    play_addr = video.get('play_addr', {})
    vid = play_addr.get('uri', '')
    source_id = f"hb-{slug}-{aweme_id}"
    
    poi = detail.get('poi_info', {})
    poi_name = poi.get('poi_name', '')
    poi_addr = poi.get('address_info', {}).get('simple_addr', '')
    
    item_record = {
        "index": idx,
        "sourceId": source_id,
        "slug": slug,
        "author": nickname,
        "title": desc.split('#')[0].strip() or desc[:60],
        "url": f"https://www.douyin.com/video/{aweme_id}",
        "shareURL": clean_url,
        "awemeId": aweme_id,
        "publishedOn": pub_date,
        "durationSeconds": duration_sec,
        "vid": vid,
        "desc": desc,
        "poiName": poi_name,
        "poiAddr": poi_addr
    }
    
    # Check cross-city
    if ("沈阳" in desc or "延吉" in desc or "齐齐哈尔" in desc) and "哈尔滨" not in desc and "尔滨" not in desc:
        item_record['excluded'] = True
        item_record['excludeReason'] = "明确跨城非哈尔滨"
        print(f"  [CROSS-CITY EXCLUDED] {desc[:30]}...", flush=True)
        resolved_map[clean_url] = item_record
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(list(resolved_map.values()), f, ensure_ascii=False, indent=2)
        continue
        
    target_dir = intake_dir / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = target_dir / "source.mp4"
    part_mp4 = target_dir / "source.mp4.part"
    
    candidates = list(play_addr.get('url_list', []))
    for ratio in ['540p', '720p', 'default']:
        for line in [0, 1]:
            candidates.append(f"https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio={ratio}&line={line}")

    if target_mp4.exists() and target_mp4.stat().st_size > 1000000:
        raw = target_mp4.read_bytes()
        sha256 = hashlib.sha256(raw).hexdigest()
        item_record['sourceSHA256'] = sha256
        item_record['fileSize'] = len(raw)
        print(f"  Already downloaded ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256[:8]}...", flush=True)
    else:
        if part_mp4.exists():
            part_mp4.unlink()
        success = False
        for c_idx, play_url in enumerate(candidates):
            if success:
                break
            print(f"  Downloading via curl (candidate {c_idx+1}/{len(candidates)})...", flush=True)
            cmd = [
                "curl.exe", "-L", "-s", "--connect-timeout", "8",
                "--speed-time", "10", "--speed-limit", "10000",
                "-m", "90",
                "-H", f"User-Agent: {mobile_ua}",
                "-o", str(part_mp4),
                play_url
            ]
            res = subprocess.run(cmd)
            if part_mp4.exists() and part_mp4.stat().st_size > 100000:
                part_mp4.rename(target_mp4)
                raw = target_mp4.read_bytes()
                sha256 = hashlib.sha256(raw).hexdigest()
                item_record['sourceSHA256'] = sha256
                item_record['fileSize'] = len(raw)
                print(f"  SUCCESS! ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256[:8]}...", flush=True)
                success = True
                break
            else:
                if part_mp4.exists():
                    try:
                        part_mp4.unlink()
                    except:
                        pass
        if not success:
            print(f"  FAILED to download video for {clean_url}", flush=True)
            
    resolved_map[clean_url] = item_record
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(list(resolved_map.values()), f, ensure_ascii=False, indent=2)
    time.sleep(1)

print("\n=== Batch 8 All Downloads Finished ===", flush=True)
