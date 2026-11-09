# -*- coding: utf-8 -*-
import os
import sys
import json
import time
import hashlib
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

root = 'D:/codex/美食网站/.local/worktrees/chaoshan'
resolved_file = f'{root}/output/research/chaoshan/batch6-resolved-urls.json'
out_research = f'{root}/output/research/chaoshan'
intake_root = f'{root}/map-base/.local/video-intake'

with open(resolved_file, 'r', encoding='utf-8') as f:
    items = json.load(f)

summary = []

for item in items:
    source_id = item['source_id']
    vid = item['aweme_id']
    author = item['author']
    url = f'https://www.douyin.com/video/{vid}'
    
    out_dir = os.path.join(intake_root, source_id)
    os.makedirs(out_dir, exist_ok=True)
    mp4_path = os.path.join(out_dir, 'source.mp4')
    json_path = os.path.join(out_research, f'source-{source_id}.json')

    print(f"\n==========================================")
    print(f"Processing [{source_id}] ({author})")
    print(f"URL: {url}")

    ad = None
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as jf:
                ad = json.load(jf)
            print(f"Loaded existing metadata from {json_path}")
        except Exception:
            ad = None

    if not ad:
        captured = {}
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            def on_resp(resp):
                if 'aweme/detail' in resp.url:
                    try:
                        data = resp.json()
                        if 'aweme_detail' in data:
                            captured['aweme_detail'] = data['aweme_detail']
                    except Exception:
                        pass
            page.on('response', on_resp)
            try:
                page.goto(url, timeout=30000, wait_until='domcontentloaded')
                page.wait_for_timeout(3500)
            except Exception as e:
                print(f"Page navigation warning: {e}")
            finally:
                browser.close()

        if 'aweme_detail' in captured:
            ad = captured['aweme_detail']
            with open(json_path, 'w', encoding='utf-8') as jf:
                json.dump(ad, jf, ensure_ascii=False, indent=2)
            print(f"Saved captured metadata to {json_path}")
        else:
            print(f"Failed to capture aweme_detail for {source_id}")
            continue

    # Download MP4 if not exists or 0 bytes
    desc = ad.get('desc', '')
    create_time = ad.get('create_time', 0)
    published_on = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else ''
    
    video = ad.get('video', {})
    play_url = None
    bit_rates = video.get('bit_rate', [])
    if bit_rates:
        for br in sorted(bit_rates, key=lambda x: x.get('bit_rate', 0), reverse=True):
            urls = br.get('play_addr', {}).get('url_list', [])
            if urls:
                play_url = urls[0]
                print(f"Selected gear {br.get('gear_name')}, bitrate {br.get('bit_rate')}")
                break
    if not play_url:
        urls = video.get('play_addr', {}).get('url_list', [])
        if urls:
            play_url = urls[0]

    if not os.path.exists(mp4_path) or os.path.getsize(mp4_path) == 0:
        if not play_url:
            print(f"No play_url found for {source_id}")
            continue
        print(f"Downloading MP4 from {play_url[:80]}...")
        req = urllib.request.Request(play_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.douyin.com/'
        })
        with urllib.request.urlopen(req, timeout=60) as resp, open(mp4_path, 'wb') as f_out:
            downloaded = 0
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                f_out.write(chunk)
                downloaded += len(chunk)
                print(f"Downloaded {downloaded / 1024 / 1024:.2f} MB...", end='\r')
        print(f"\nFinished download: {os.path.getsize(mp4_path)} bytes")

    # Calculate SHA256
    with open(mp4_path, 'rb') as f_in:
        sha256 = hashlib.sha256(f_in.read()).hexdigest()

    # ffprobe exact duration
    ffprobe_cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height,duration', '-of', 'json', mp4_path]
    probe_res = subprocess.run(ffprobe_cmd, capture_output=True, text=True, check=True)
    probe_data = json.loads(probe_res.stdout)
    dur_exact = float(probe_data['format']['duration'])

    print(f"SHA256: {sha256}")
    print(f"Duration: {dur_exact:.2f}s ({int(round(dur_exact))}s)")
    print(f"Desc: {desc}")
    print(f"Published: {published_on}")

    summary.append({
        'sourceId': source_id,
        'author': author,
        'shareUrl': item['short_url'],
        'awemeId': vid,
        'originalTitle': desc,
        'publishedOn': published_on,
        'sha256': sha256,
        'sizeBytes': os.path.getsize(mp4_path),
        'durationExact': dur_exact,
        'durationSeconds': int(round(dur_exact)),
        'userNote': item['user_note']
    })

summary_path = f'{out_research}/batch6-sources-summary.json'
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print(f"\n==========================================")
print(f"Batch 6 intake completed. Processed {len(summary)}/{len(items)} sources.")
print(f"Summary written to {summary_path}")
