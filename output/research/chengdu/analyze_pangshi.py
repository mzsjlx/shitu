import os
import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

FFMPEG = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
VIDEO_PATH = r'd:\Antigravity\地图\map-base\.local\video-intake\cd-pangshi-7645208472996950386\source.mp4'
OUT_DIR = Path(r'output/research/chengdu/pangshi_analysis')
OUT_DIR.mkdir(parents=True, exist_ok=True)

cmd = [
    FFMPEG, '-y', '-i', VIDEO_PATH,
    '-vf', 'fps=0.5,scale=720:-1',
    str(OUT_DIR / 'f_%04d.jpg')
]
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

engine = RapidOCR()
results = []
frames = sorted(OUT_DIR.glob('f_*.jpg'))

lines_out = []
for i, f in enumerate(frames):
    sec = i * 2.0
    ocr_res, _ = engine(str(f))
    lines = []
    if ocr_res:
        for item in ocr_res:
            lines.append(item[1])
    text = " | ".join(lines)
    results.append({'sec': sec, 'frame': f.name, 'text': text})
    lines_out.append(f"{sec:5.1f}s | {text}")

with open(OUT_DIR / 'ocr_summary.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

with open(r'output/research/chengdu/pangshi_lines.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(lines_out))

print(f"Processed {len(frames)} frames for pangshi.")
