import os
import json
import hashlib
import urllib.request
from pathlib import Path

INTAKE_BASE = Path(r'map-base/.local/video-intake')
INTAKE_BASE.mkdir(parents=True, exist_ok=True)

with open(r'output/research/chengdu/batch2_sources_meta.json', 'r', encoding='utf-8') as f:
    sources = json.load(f)

for item in sources:
    source_id = item['sourceId']
    detail_path = Path(r'output/research/chengdu/details') / f"{source_id}.json"
    
    out_dir = INTAKE_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'

    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 100000:
        with open(out_sha, 'r', encoding='utf-8') as f:
            sha = f.read().strip()
        print(f"[{item['index']}/12] Already downloaded {source_id}: {out_mp4.stat().st_size} bytes, SHA256={sha[:12]}...")
        item['sha256'] = sha
        item['fileSize'] = out_mp4.stat().st_size
        continue

    print(f"\n[{item['index']}/12] Downloading {source_id}...")
    with open(detail_path, 'r', encoding='utf-8') as f:
        d = json.load(f)

    video_info = d.get('video', {})
    urls = []
    if 'play_addr' in video_info and 'url_list' in video_info['play_addr']:
        urls.extend(video_info['play_addr']['url_list'])
    if 'play_addr_h264' in video_info and 'url_list' in video_info['play_addr_h264']:
        urls.extend(video_info['play_addr_h264']['url_list'])

    # Also try replacing playwm with play or vice versa
    extra_urls = []
    for u in urls:
        if 'playwm' in u:
            extra_urls.append(u.replace('playwm', 'play'))
    urls.extend(extra_urls)

    success = False
    for u in urls:
        for ref in [None, 'https://www.douyin.com/', 'https://www.iesdouyin.com/']:
            for ua in [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36'
            ]:
                headers = {'User-Agent': ua}
                if ref:
                    headers['Referer'] = ref
                req = urllib.request.Request(u, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        content_type = resp.headers.get('Content-Type', '')
                        content_len = resp.headers.get('Content-Length')
                        print(f"  Connected to {u[:40]}... (type: {content_type}, len: {content_len})")
                        with open(out_mp4, 'wb') as f_out:
                            while True:
                                chunk = resp.read(65536)
                                if not chunk:
                                    break
                                f_out.write(chunk)
                        file_size = out_mp4.stat().st_size
                        if file_size > 50000:
                            print(f"  Downloaded: {file_size} bytes")
                            with open(out_mp4, 'rb') as f_sha:
                                sha = hashlib.sha256(f_sha.read()).hexdigest()
                            with open(out_sha, 'w', encoding='utf-8') as f_out_sha:
                                f_out_sha.write(sha + '\n')
                            print(f"  SHA256: {sha}")
                            item['sha256'] = sha
                            item['fileSize'] = file_size
                            success = True
                            break
                        else:
                            print(f"  File too small ({file_size} bytes), retrying...")
                except Exception as e:
                    pass
            if success:
                break
        if success:
            break

    if not success:
        print(f"  FAILED to download {source_id}!")

with open(r'output/research/chengdu/batch2_sources_meta.json', 'w', encoding='utf-8') as f:
    json.dump(sources, f, ensure_ascii=False, indent=2)

print("\nFinished download process.")
