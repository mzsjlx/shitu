import os
import sys
import json
import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

FFMPEG = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
INTAKE_BASE = Path(r'map-base/.local/video-intake')
OUTPUT_BASE = Path(r'output/research/chengdu')

ocr = RapidOCR()

sources = [
    ("cd-suipo-7513669075017501992", 2.0),
    ("cd-wasaijizhang-7622980347575192832", 2.5),
    ("cd-erbaizheye-7571507105111362862", 2.0)
]

for source_id, interval in sources:
    video_path = INTAKE_BASE / source_id / 'source.mp4'
    if not video_path.exists():
        print(f"Skipping {source_id}, file not found.")
        continue
    
    frames_dir = OUTPUT_BASE / f"{source_id}_frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    summary_file = OUTPUT_BASE / f"{source_id}_ocr.txt"

    print(f"\n=== Extracting frames for {source_id} (interval {interval}s) ===")
    # Extract frames
    frame_pattern = str(frames_dir / "frame_%04d.jpg")
    cmd = [
        FFMPEG, '-hide_banner', '-loglevel', 'error', '-y',
        '-i', str(video_path),
        '-vf', f'fps=1/{interval}',
        '-q:v', '3',
        frame_pattern
    ]
    subprocess.run(cmd, check=True)

    frames = sorted(list(frames_dir.glob("frame_*.jpg")))
    print(f"Extracted {len(frames)} frames. Running RapidOCR...")

    results = []
    lines_found = []

    for idx, f in enumerate(frames):
        sec = round(idx * interval, 2)
        ocr_res, _ = ocr(str(f))
        texts = []
        if ocr_res:
            for item in ocr_res:
                txt = item[1].strip()
                if txt:
                    texts.append(txt)
        if texts:
            line_str = f"[{sec:6.1f}s] {' | '.join(texts)}"
            lines_found.append(line_str)
            results.append({
                "second": sec,
                "frame": f.name,
                "texts": texts
            })
        if idx % 20 == 0:
            print(f"  Processed {idx}/{len(frames)} frames...")

    with open(summary_file, 'w', encoding='utf-8') as sf:
        sf.write('\n'.join(lines_found) + '\n')
    
    with open(OUTPUT_BASE / f"{source_id}_ocr.json", 'w', encoding='utf-8') as jf:
        json.dump(results, jf, ensure_ascii=False, indent=2)

    print(f"Completed OCR for {source_id}: {len(results)} frames with text written to {summary_file}")
