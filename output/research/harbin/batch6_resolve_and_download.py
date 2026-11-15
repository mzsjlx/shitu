import urllib.request
import json
import re
import time
import os
import hashlib
import socket
from pathlib import Path

socket.setdefaulttimeout(15)

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
intake_dir.mkdir(parents=True, exist_ok=True)

raw_batch6 = [
    ("素十二", "https://v.douyin.com/FHwnOnH88zo/", "sushier"),
    ("特别乌啦啦", "https://v.douyin.com/XQ2Nz8wz-bg/", "wulala"),
    ("李哥我饿了", "https://v.douyin.com/NZw6ffxFlcE/", "lige"),
    ("盗月社食遇记", "https://v.douyin.com/_uy0iKaoKl8/", "daoyueshe"),
    ("风风", "https://v.douyin.com/JyBT0xgPSrQ/", "fengfeng"),
    ("看球组个局", "https://v.douyin.com/YX1gcZqyC1Q/", "kanqiuzugeju"),
    ("林晨睡", "https://v.douyin.com/WtEieESZ_2U/", "linchenshui"),
    ("一朵金花", "https://v.douyin.com/HHdSuGCHnk8/", "yiduojinhua"), # 延吉
    ("小紧张的虫虫", "https://v.douyin.com/X9KAHyvp8_o/", "chongchong"),
    ("李哥我饿了", "https://v.douyin.com/pByJ48uaLJg/", "lige"),
    ("杨草莓熊", "https://v.douyin.com/rAFn6bh1CWE/", "caomeixiong"),
    ("小颓废的嘴", "https://v.douyin.com/0bulyGH0XHM/", "xiaotui"),
    ("南京刘好燃", "https://v.douyin.com/GhXHFnwYzsI/", "liuhaoran"),
    ("小紧张的虫虫", "https://v.douyin.com/y3V3Ol47kow/", "chongchong"),
    ("姚十八的小号", "https://v.douyin.com/xnypVDctQjI/", "yaoshiba"),
    ("特厨魏味", "https://v.douyin.com/r6H5MY1f9QA/ ", "weiwei"),
    ("稳仔", "https://v.douyin.com/ahaFU0SN02s/", "wenzai"),
    ("刘雨鑫JASON", "https://v.douyin.com/H6fLlkkBkhs/", "liuyuxin"),
    ("锅包肉肉。（尔滨版）", "https://v.douyin.com/arqltPyCtbw/", "guobaorourou"),
    ("PP超能炫", "https://v.douyin.com/-Mlz7aMTxMY/", "ppchaonengxuan"),
    ("廣廣", "https://v.douyin.com/1njZ-5VLqHE/", "guangguang"),
    ("刘雨鑫JASON", "https://v.douyin.com/KMPlCq0EPSM/", "liuyuxin"),
    ("钮祜禄小刺猬", "https://v.douyin.com/6g_EGCeWMwQ/", "xiaociwei"),
    ("小颖同学", "https://v.douyin.com/34HFNbaQhsE/", "xiaoying"),
    ("哈尔滨贪吃王👑", "https://v.douyin.com/jkcRJQYw3VQ/", "tanchiwang")
]

desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
mobile_ua = "Mozilla/5.0 (Linux; Android 13; 2210132C Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"

def resolve_short_url(short_url):
    req = urllib.request.Request(short_url.strip(), headers={'User-Agent': desktop_ua})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
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

out_json = root / "output/research/harbin/batch6_resolved.json"
resolved_list = []
if out_json.exists():
    try:
        with open(out_json, "r", encoding="utf-8") as f:
            resolved_list = json.load(f)
    except:
        pass

resolved_map = {item['shareURL']: item for item in resolved_list}

print(f"=== Starting Batch 6 Resolution & Download: {len(raw_batch6)} items ===\n", flush=True)

for idx, (hint_author, short_url, slug) in enumerate(raw_batch6, 1):
    clean_url = short_url.strip()
    print(f"[{idx}/{len(raw_batch6)}] {hint_author} ({slug}) -> {clean_url}", flush=True)
    if clean_url in resolved_map and resolved_map[clean_url].get('sourceSHA256'):
        print(f"  Already resolved and downloaded: {resolved_map[clean_url]['sourceId']}", flush=True)
        continue
        
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
    pub_date = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else '2026-11-15'
    
    video = detail.get('video', {})
    duration_ms = video.get('duration', 0)
    duration_sec = round(duration_ms / 1000.0, 2)
    
    play_addr = video.get('play_addr', {})
    vid = play_addr.get('uri', '')
    
    source_id = f"hb-{slug}-{aweme_id}"
    
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
        "desc": desc
    }
    
    # 跨城过滤检测 (延吉等吉林/辽宁跨城内容)
    if "延吉" in desc and "哈尔滨" not in desc:
        item_record['excluded'] = True
        item_record['excludeReason'] = "延吉跨城（吉林延边）"
        print(f"  [CROSS-CITY EXCLUDED] {desc[:30]}...", flush=True)
        resolved_map[clean_url] = item_record
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
        if part_mp4.exists():
            try:
                part_mp4.unlink()
            except:
                pass
        success = False
        for ratio in ['720p', '540p', 'default']:
            if success:
                break
            for line in [0, 1]:
                url = f'https://aweme.snssdk.com/aweme/v1/play/?video_id={vid}&ratio={ratio}&line={line}'
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': mobile_ua})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        cdn_url = resp.geturl()
                    
                    req2 = urllib.request.Request(cdn_url, headers={'User-Agent': desktop_ua})
                    with urllib.request.urlopen(req2, timeout=15) as resp2, open(part_mp4, 'wb') as f_out:
                        while True:
                            chunk = resp2.read(512 * 1024)
                            if not chunk:
                                break
                            f_out.write(chunk)
                    if part_mp4.exists() and part_mp4.stat().st_size > 100000:
                        part_mp4.rename(target_mp4)
                        raw = target_mp4.read_bytes()
                        sha256 = hashlib.sha256(raw).hexdigest()
                        item_record['sourceSHA256'] = sha256
                        item_record['fileSize'] = len(raw)
                        print(f"  SUCCESS! ({len(raw)/1024/1024:.2f} MB), SHA256: {sha256[:8]}...", flush=True)
                        success = True
                        break
                except Exception as e:
                    print(f"    Download try ({ratio}, line={line}) failed: {e}", flush=True)
                    if part_mp4.exists():
                        try:
                            part_mp4.unlink()
                        except:
                            pass
                    time.sleep(1)
        if not success:
            print(f"  FAILED to download video for {clean_url}", flush=True)
                
    resolved_map[clean_url] = item_record
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(list(resolved_map.values()), f, ensure_ascii=False, indent=2)
        
    time.sleep(1)

print("\n=== Resolution & Download Finished ===", flush=True)
