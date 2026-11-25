import os
import json
import hashlib
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')

ids = [
    'cd-yangdui-7683090587154779401',
    'cd-wangxun-7609124019572428095',
    'cd-wulala-7078883833852087566',
    'cd-xiaozhang-7640394328993233657'
]

for idx, sid in enumerate(ids, 1):
    detail_path = DETAILS_BASE / f"{sid}.json"
    if not detail_path.exists():
        print(f"[{idx}/4] {sid}: detail JSON missing!")
        continue
    
    with open(detail_path, 'r', encoding='utf-8') as f:
        detail = json.load(f)
    
    video_info = detail.get('video', {})
    urls = []
    if 'play_addr' in video_info and 'url_list' in video_info['play_addr']:
        urls.extend(video_info['play_addr']['url_list'])
    if 'play_addr_h264' in video_info and 'url_list' in video_info['play_addr_h264']:
        urls.extend(video_info['play_addr_h264']['url_list'])
    
    out_dir = INTAKE_BASE / sid
    out_dir.mkdir(parents=True, exist_ok=True)
    out_mp4 = out_dir / 'source.mp4'
    out_sha = out_dir / 'source.sha256'
    
    if out_mp4.exists() and out_sha.exists() and out_mp4.stat().st_size > 1000000:
        print(f"[{idx}/4] {sid}: already exists ({out_mp4.stat().st_size} bytes)")
        continue
    
    print(f"\n[{idx}/4] Downloading {sid} ({len(urls)} CDN URLs available)...")
    downloaded = False
    for u_idx, u in enumerate(urls, 1):
        print(f"  Attempting CDN {u_idx}...")
        tmp_mp4 = out_dir / 'source.tmp'
        if tmp_mp4.exists():
            tmp_mp4.unlink()
        
        # Use curl.exe to stream with proper headers and resume if needed
        cmd = [
            'curl.exe', '-L', '--max-time', '180',
            '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '-H', 'Referer: https://www.douyin.com/',
            u, '-o', str(tmp_mp4)
        ]
        res = subprocess.run(cmd, capture_output=True)
        if tmp_mp4.exists() and tmp_mp4.stat().st_size > 1000000:
            # Check sha256
            h = hashlib.sha256()
            with open(tmp_mp4, 'rb') as f_in:
                while chunk := f_in.read(1048576):
                    h.update(chunk)
            sha = h.hexdigest()
            if out_mp4.exists():
                out_mp4.unlink()
            tmp_mp4.rename(out_mp4)
            with open(out_sha, 'w', encoding='utf-8') as f_sha:
                f_sha.write(sha + '\n')
            print(f"  Success! Size: {out_mp4.stat().st_size} bytes, SHA256: {sha[:16]}...")
            downloaded = True
            break
        else:
            print(f"  CDN {u_idx} failed or file too small: {res.stderr.decode('utf-8', errors='ignore')[:200]}")
            if tmp_mp4.exists():
                tmp_mp4.unlink()
    
    if not downloaded:
        print(f"  ERROR: Failed to download {sid} from all CDN URLs.")
