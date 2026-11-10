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

from pathlib import Path
root = str(Path(__file__).resolve().parents[3])
resolved_file = f'{root}/output/research/chaoshan/batch7-resolved-urls.json'
out_research = f'{root}/output/research/chaoshan'
raw_research = f'{root}/map-base/.local/raw-source-review'
os.makedirs(raw_research, exist_ok=True)
intake_root = f'{root}/map-base/.local/video-intake'

with open(resolved_file, 'r', encoding='utf-8') as f:
    items = json.load(f)

# Define sourceId mapping
slug_map = {
    "小张一人食": "xiaozhang",
    "778潮汕寻食小分队": "qiqiba",
    "邓炫疯疯": "dengxuan",
    "阿超在广东": "achao",
    "敢敢LETS GO": "gangan",
    "大椰吖": "daya",
    "小珍来咯…": "xiaozhen",
    "Mark吃深圳": "mark",
    "小林探": "xiaolin"
}

source_items = []
for item in items:
    author = item["author_hint"]
    aweme_id = item["aweme_id"]
    slug = slug_map.get(author, "author")
    source_id = f"chaoshan-{slug}-{aweme_id}"
    source_items.append({
        "source_id": source_id,
        "author": author,
        "share_url": item["share_url"],
        "aweme_id": aweme_id,
        "final_url": item["final_url"]
    })

print(f"Total {len(source_items)} items to process in Batch 7.")

# Launch playwright once
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    for item in source_items:
        source_id = item['source_id']
        vid = item['aweme_id']
        author = item['author']
        url = f'https://www.douyin.com/video/{vid}'
        json_path = os.path.join(raw_research, f'source-{source_id}.json')

        print(f"\n==========================================")
        print(f"Fetching metadata [{source_id}] ({author})")
        print(f"URL: {url}")

        if os.path.exists(json_path):
            print(f"Metadata already exists at {json_path}")
            continue

        captured = {}
        page = context.new_page()

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
            print(f"Navigation warning: {e}")
        finally:
            page.close()

        if 'aweme_detail' in captured:
            with open(json_path, 'w', encoding='utf-8') as jf:
                json.dump(captured['aweme_detail'], jf, ensure_ascii=False, indent=2)
            print(f"Successfully saved {json_path}")
        else:
            print(f"WARNING: aweme_detail not captured for {source_id}")

    browser.close()

# Now download videos & compute hashes & durations
summary = []
for item in source_items:
    source_id = item['source_id']
    vid = item['aweme_id']
    author = item['author']
    json_path = os.path.join(raw_research, f'source-{source_id}.json')
    out_dir = os.path.join(intake_root, source_id)
    os.makedirs(out_dir, exist_ok=True)
    mp4_path = os.path.join(out_dir, 'source.mp4')

    if not os.path.exists(json_path):
        print(f"Skipping {source_id}: missing metadata")
        continue

    with open(json_path, 'r', encoding='utf-8') as jf:
        ad = json.load(jf)

    desc = ad.get('desc', '')
    create_time = ad.get('create_time', 0)
    published_on = time.strftime('%Y-%m-%d', time.localtime(create_time)) if create_time else ''

    # Get author real nickname if available
    real_author = ad.get('author', {}).get('nickname', author)

    video = ad.get('video', {})
    play_url = None
    bit_rates = video.get('bit_rate', [])
    if bit_rates:
        for br in sorted(bit_rates, key=lambda x: x.get('bit_rate', 0), reverse=True):
            urls = br.get('play_addr', {}).get('url_list', [])
            if urls:
                play_url = urls[0]
                break
    if not play_url:
        urls = video.get('play_addr', {}).get('url_list', [])
        if urls:
            play_url = urls[0]

    if not os.path.exists(mp4_path) or os.path.getsize(mp4_path) == 0:
        if not play_url:
            print(f"No play_url for {source_id}")
            continue
        print(f"\nDownloading MP4 for {source_id}...")
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
        print(f"\nFinished download {source_id}: {os.path.getsize(mp4_path)} bytes")

    # SHA256
    with open(mp4_path, 'rb') as f_in:
        sha256 = hashlib.sha256(f_in.read()).hexdigest()

    # ffprobe exact duration
    ffprobe_cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height,duration', '-of', 'json', mp4_path]
    probe_res = subprocess.run(ffprobe_cmd, capture_output=True, text=True, check=True)
    probe_data = json.loads(probe_res.stdout)
    dur_exact = float(probe_data['format']['duration'])

    print(f"[{source_id}] {real_author}: {dur_exact:.2f}s | {sha256[:16]}... | {desc[:40]}")

    summary.append({
        'sourceId': source_id,
        'author': real_author,
        'shareUrl': item['share_url'],
        'awemeId': vid,
        'originalTitle': desc,
        'publishedOn': published_on,
        'sha256': sha256,
        'sizeBytes': os.path.getsize(mp4_path),
        'durationExact': dur_exact,
        'durationSeconds': int(round(dur_exact))
    })

summary_path = f'{out_research}/batch7-sources-summary.json'
with open(summary_path, 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print(f"\n==========================================")
print(f"Batch 7 intake completed. Processed {len(summary)}/{len(source_items)} sources.")
print(f"Summary saved to {summary_path}")
