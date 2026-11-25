import os
import json
import hashlib
import urllib.request
from pathlib import Path

META_PATH = Path('output/research/chengdu/batch3_sources_meta.json')
INTAKE_BASE = Path('map-base/.local/video-intake')

with open(META_PATH, 'r', encoding='utf-8') as f:
    sources = json.load(f)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.douyin.com/'
}

for s in sources:
    source_id = s['sourceId']
    play_addr = s['playAddr']
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / 'source.mp4'
    sha_file = out_dir / 'source.sha256'

    print(f"\nProcessing {source_id} ({s['author']})...")
    if out_file.exists() and sha_file.exists() and out_file.stat().st_size > 1000000:
        with open(sha_file, 'r', encoding='utf-8') as sf:
            cached_sha = sf.read().strip()
        print(f"  Already exists ({out_file.stat().st_size} bytes, SHA256: {cached_sha[:12]}...)")
        s['sourceSHA256'] = cached_sha
        continue

    print(f"  Downloading from CDN: {play_addr[:80]}...")
    req = urllib.request.Request(play_addr, headers=HEADERS)
    h = hashlib.sha256()
    total = 0
    with urllib.request.urlopen(req, timeout=60) as resp, open(out_file, 'wb') as out_f:
        while True:
            chunk = resp.read(1024 * 512)
            if not chunk:
                break
            out_f.write(chunk)
            h.update(chunk)
            total += len(chunk)
            print(f"\r  Downloaded: {total / (1024*1024):.2f} MB", end='', flush=True)
    
    sha256_val = h.hexdigest()
    print(f"\n  Done! {total} bytes, SHA256: {sha256_val}")
    with open(sha_file, 'w', encoding='utf-8') as sf:
        sf.write(sha256_val + '\n')
    s['sourceSHA256'] = sha256_val

with open(META_PATH, 'w', encoding='utf-8') as f:
    json.dump(sources, f, ensure_ascii=False, indent=2)

print("\nAll batch 3 sources downloaded successfully!")
