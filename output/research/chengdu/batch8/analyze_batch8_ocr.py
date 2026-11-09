import os
import sys
import glob
import json
import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')

FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

INTAKE_BASE = Path(r"map-base/.local/video-intake")
FRAMES_BASE = Path(r"output/research/chengdu/frames_batch8")
FRAMES_BASE.mkdir(parents=True, exist_ok=True)

with open(r"output/research/chengdu/batch8/batch8_sources_meta.json", "r", encoding="utf-8") as f:
    sources = json.load(f)

all_results = {}

for s in sources:
    source_id = s["sourceId"]
    author = s["author"]
    title = s["title"]
    duration = s.get("durationSeconds", 60)
    mp4_path = INTAKE_BASE / source_id / "source.mp4"
    if not mp4_path.exists():
        print(f"Skipping {source_id}, file not found: {mp4_path}")
        continue
    
    print(f"\n=======================================================")
    print(f"Processing {source_id} ({author}) - Duration: {duration}s")
    print(f"Title: {title}")
    
    out_dir = FRAMES_BASE / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_times = [0.5, 1.5, 3.0, 5.0, 8.0, 12.0, 16.0, 20.0, 25.0, 30.0]
    t = 40.0
    while t < duration - 2.0:
        sample_times.append(t)
        t += 15.0
        
    print(f"Extracting {len(sample_times)} frames...")
    extracted_frames = []
    for st in sample_times:
        frame_name = f"f_{int(st*10):05d}.jpg"
        frame_path = out_dir / frame_name
        if not frame_path.exists() or frame_path.stat().st_size == 0:
            cmd = [
                FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
                "-ss", str(st),
                "-i", str(mp4_path),
                "-frames:v", "1",
                "-q:v", "3",
                str(frame_path)
            ]
            subprocess.run(cmd)
        if frame_path.exists():
            extracted_frames.append((st, frame_path))
            
    print(f"Running OCR on {len(extracted_frames)} frames...")
    ocr_texts = []
    seen_texts = set()
    for st, fp in extracted_frames:
        res, _ = ocr(str(fp))
        if res:
            lines = [r[1] for r in res]
            new_lines = [l for l in lines if l not in seen_texts]
            for l in new_lines:
                seen_texts.add(l)
            if new_lines:
                ocr_texts.append({
                    "time": st,
                    "frame": fp.name,
                    "lines": lines
                })
                
    all_results[source_id] = {
        "author": author,
        "title": title,
        "duration": duration,
        "poiName": s.get("poiName", ""),
        "ocr": ocr_texts
    }
    
    print(f"Detected lines sample:")
    for item in ocr_texts[:8]:
        print(f"  [{item['time']}s]: {', '.join(item['lines'][:5])}")

out_json = Path(r"output/research/chengdu/batch8/batch8_ocr_results.json")
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\nAll OCR completed and saved to {out_json}")
