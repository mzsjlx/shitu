import subprocess
import json
import re
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

# Let's inspect the downloaded directories
resolved_json = Path("output/research/harbin/batch6_resolved.json")
if not resolved_json.exists():
    print("Resolved json not found")
    exit(0)

with open(resolved_json, "r", encoding="utf-8") as f:
    items = json.load(f)

print(f"Loaded {len(items)} resolved items.", flush=True)

for item in items:
    if item.get('excluded'):
        continue
    sid = item['sourceId']
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    
    print(f"\n==========================================", flush=True)
    print(f"[{item['index']}] {item['author']} - {item['title']}", flush=True)
    print(f"Source ID: {sid}", flush=True)
    print(f"Duration: {item.get('durationSeconds')}s", flush=True)
    
    # Check title / desc for store names first
    desc = item.get('desc', '')
    
    # Sample frames across the video
    dur = int(item.get('durationSeconds', 60))
    sample_secs = [2, 5, 10, 15, 25, 40]
    if dur > 100:
        sample_secs.extend([60, 90, 120])
    sample_secs = [s for s in sample_secs if s < dur]
    
    collected_texts = []
    for s in sample_secs:
        img_path = intake / sid / f"_ocr_{s}.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img_path.exists():
            res, _ = ocr(str(img_path))
            if res:
                t_list = [r[1] for r in res if float(r[2]) > 0.5]
                line = " | ".join(t_list)
                if line:
                    collected_texts.append(f"{s}s: {line}")
            img_path.unlink(missing_ok=True)
            
    for t in collected_texts[:6]:
        print(f"  {t[:100]}", flush=True)
