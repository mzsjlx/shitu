import urllib.request
import json
import re
import time
import os
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

raw_batch2 = [
    ("特别乌啦啦", "https://v.douyin.com/HPIKk-ay2zk/"),
    ("喵喵酱", "https://v.douyin.com/LldJNE4d2D4/"),
    ("小笼人", "https://v.douyin.com/IZXagvAVUPo/"),
    ("王大锤（美食排雷&分享）", "https://v.douyin.com/_C40o5hF15E/"),
    ("老韩头", "https://v.douyin.com/8XV-huEO4sg/"),
    ("庞师不是师", "https://v.douyin.com/IjhwqSbujAc/"),
    ("猴儿甜猴儿甜", "https://v.douyin.com/CTQQ7k3_Zgk/"),
    ("盈盈吃不饱🍖", "https://v.douyin.com/S0dYHsIMCg4/"),
    ("特厨隋坡（重新出发版）", "https://v.douyin.com/lMyokdDDk-4/"),
    ("二百者也", "https://v.douyin.com/My7u_Kh1tfE/"),
    ("特别乌啦啦", "https://v.douyin.com/bAprtztSy8Y/"),
    ("小蒲同学", "https://v.douyin.com/BuG88WNQbyU/"),
    ("咸鱼不是keii", "https://v.douyin.com/oMOaqpNTY9o/"),
    ("小笼人", "https://v.douyin.com/FTmVARS1EiM/"),
    ("达哥在上海", "https://v.douyin.com/C68no__udEo/"),
    ("花二Strange", "https://v.douyin.com/MzFw-ZDQpVU/"),
    ("笑Smile", "https://v.douyin.com/TpkClN5JOAc/"),
    ("一朵金花", "https://v.douyin.com/q2SsA6iImn8/"), # 齐齐哈尔
    ("玲子reiko", "https://v.douyin.com/peod9WX4C8s/"),
    ("阿羡吃不饱", "https://v.douyin.com/UzJXQ67l3Eo/"),
    ("玲子reiko", "https://v.douyin.com/IR51xSu1Yac/"),
    ("盗月社食遇记", "https://v.douyin.com/Wl3fY7OF0Mw/"),
    ("汤氏熊", "https://v.douyin.com/B4NIeP08tzQ/"),
    ("二百者也", "https://v.douyin.com/EgRbH0w0h58/"),
    ("阿羡吃不饱", "https://v.douyin.com/YqrRlGUdX8U/"),
    ("给我囊次一口", "https://v.douyin.com/RNwPtg8CZag/"),
    ("玲子reiko", "https://v.douyin.com/ca74NvO6H6c/"),
    ("杨草莓熊", "https://v.douyin.com/340faI0rmFA/"),
    ("芋泥啵啵🍯", "https://v.douyin.com/JLy6YYqT1F4/"),
    ("李哥我饿了", "https://v.douyin.com/FftUM9HN1ZQ/"),
    ("野生Bunny", "https://v.douyin.com/41vgluJdkO0/"),
    ("崔佳楠", "https://v.douyin.com/l2cFIhZwb1Q/"),
    ("真探唐仁杰", "https://v.douyin.com/3RgZoXkqkMA/"),
    ("小颓废的嘴", "https://v.douyin.com/qX7uhrtB3JY/"),
    ("刘雨鑫JASON", "https://v.douyin.com/Wra5VDGimvY/"),
    ("东北两口子全国炫饭", "https://v.douyin.com/Q4CHFE7LA1E/"),
    ("杨温柔今天吃点啥", "https://v.douyin.com/8tCzAjKlsH0/"),
    ("刘雨鑫JASON", "https://v.douyin.com/uutMMeldDtw/"),
    ("小饭熊不正常", "https://v.douyin.com/TBpR0Kn5bQg/"),
    ("鲨鲨又馋了", "https://v.douyin.com/UoyexFVYyjc/"),
    ("刘雨鑫JASON", "https://v.douyin.com/_3cYWWBp1sg/"),
    ("海吃王", "https://v.douyin.com/rO44DiAhkQA/"),
    ("杨温柔今天吃点啥", "https://v.douyin.com/9pZcYP4hRrc/"),
    ("刘雨鑫JASON", "https://v.douyin.com/cydwJOuvbtc/"),
    ("刘雨鑫JASON", "https://v.douyin.com/hPGFVeydWoc/"),
    ("岛民大白", "https://v.douyin.com/HTlorL8chIU/")
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
            time.sleep(1)
    return None

def get_redirected_cdn_url(vid):
    for ratio in ['720p', '540p', 'default']:
        url = f'https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio={ratio}&line=0'
        req = urllib.request.Request(url, headers={'User-Agent': mobile_ua})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                cdn_url = resp.geturl()
                content_len = resp.headers.get('Content-Length')
                size = int(content_len) if content_len else 0
                return cdn_url, size
        except Exception as e:
            time.sleep(1)
    return None, 0

out_json = root / "output/research/harbin/batch2_resolved.json"
resolved_list = []
if out_json.exists():
    try:
        with open(out_json, "r", encoding="utf-8") as f:
            resolved_list = json.load(f)
    except:
        pass

resolved_map = {item['shareURL']: item for item in resolved_list}

print(f"=== Starting Batch 2 Resolution & Download: {len(raw_batch2)} items ===\n", flush=True)

for idx, (hint_author, short_url) in enumerate(raw_batch2, 1):
    print(f"[{idx}/{len(raw_batch2)}] {hint_author} -> {short_url}", flush=True)
    if short_url in resolved_map and resolved_map[short_url].get('sourceSHA256'):
        print(f"  Already resolved and downloaded: {resolved_map[short_url]['sourceId']}", flush=True)
        continue
        
    aweme_id, full_url = resolve_short_url(short_url)
    if not aweme_id:
        print(f"  FAILED to resolve aweme_id for {short_url}", flush=True)
        continue
        
    detail = fetch_aweme_detail(aweme_id)
    if not detail:
        print(f"  FAILED to fetch detail for {aweme_id}", flush=True)
        continue
        
    author_info = detail.get('author', {})
    nickname = author_info.get('nickname', hint_author)
    desc = detail.get('desc', '')
    create_time = detail.get('create_time', 0)
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-11-14'
    
    video = detail.get('video', {})
    duration_ms = video.get('duration', 0)
    duration_sec = round(duration_ms / 1000.0, 2)
    
    play_addr = video.get('play_addr', {})
    vid = play_addr.get('uri', '')
    
    clean_nick = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]', '', nickname)[:8] or 'author'
    source_id = f"hb-{clean_nick}-{aweme_id}"
    
    item_record = {
        "index": idx,
        "sourceId": source_id,
        "author": nickname,
        "title": desc.split('#')[0].strip() or desc[:60],
        "url": f"https://www.douyin.com/video/{aweme_id}",
        "shareURL": short_url,
        "awemeId": aweme_id,
        "publishedOn": pub_date,
        "durationSeconds": duration_sec,
        "vid": vid,
        "desc": desc
    }
    
    # 跨城过滤检测
    if "齐齐哈尔" in desc and "哈尔滨" not in desc:
        item_record['excluded'] = True
        item_record['excludeReason'] = "齐齐哈尔跨城"
        print(f"  [CROSS-CITY EXCLUDED] {desc[:30]}...", flush=True)
        resolved_map[short_url] = item_record
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(list(resolved_map.values()), f, ensure_ascii=False, indent=2)
        continue
        
    # 下载视频
    target_dir = intake_dir / source_id
    target_dir.mkdir(parents=True, exist_ok=True)
    target_mp4 = target_dir / "source.mp4"
    part_mp4 = target_dir / "source.mp4.part"
    
    if target_mp4.exists() and target_mp4.stat().st_size > 1000000:
        raw = target_mp4.read_bytes()
        sha256 = hashlib.sha256(raw).hexdigest()
        item_record['sourceSHA256'] = sha256
        item_record['fileSize'] = len(raw)
        print(f"  Already downloaded ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256[:8]}...", flush=True)
    else:
        cdn_url, expected_size = get_redirected_cdn_url(vid)
        if cdn_url:
            print(f"  Downloading ({expected_size/1024/1024:.1f} MB)...", flush=True)
            try:
                req = urllib.request.Request(cdn_url, headers={'User-Agent': desktop_ua})
                with urllib.request.urlopen(req, timeout=30) as resp, open(part_mp4, 'wb') as f_out:
                    while True:
                        chunk = resp.read(256 * 1024)
                        if not chunk:
                            break
                        f_out.write(chunk)
                part_mp4.rename(target_mp4)
                raw = target_mp4.read_bytes()
                sha256 = hashlib.sha256(raw).hexdigest()
                item_record['sourceSHA256'] = sha256
                item_record['fileSize'] = len(raw)
                print(f"  SUCCESS! SHA256: {sha256[:8]}...", flush=True)
            except Exception as e:
                print(f"  Download error: {e}", flush=True)
                
    resolved_map[short_url] = item_record
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(list(resolved_map.values()), f, ensure_ascii=False, indent=2)
        
    time.sleep(1)

print("\n=== Resolution & Download Finished ===", flush=True)
