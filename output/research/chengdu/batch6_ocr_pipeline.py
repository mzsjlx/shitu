import os
import subprocess
import json
import sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
FFMPEG = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
ocr = RapidOCR()

targets = [
    ("danniushi", "map-base/.local/video-intake/cd-danniushi-7644571662289046818/source.mp4", 1200, 30),
    ("huoguocheshou", "map-base/.local/video-intake/cd-huoguocheshou-7652876209759522086/source.mp4", 438, 15),
    ("renyi_3days", "map-base/.local/video-intake/cd-renyi-7606583802420317455/source.mp4", 134, 5),
    ("renyi_shaokao", "map-base/.local/video-intake/cd-renyi-7327176467857558838/source.mp4", 172, 6),
    ("ppchaonengxuan", "map-base/.local/video-intake/cd-ppchaonengxuan-7551750117855202601/source.mp4", 844, 20),
    ("wowxingge", "map-base/.local/video-intake/cd-wowxingge-7683461500186496307/source.mp4", 422, 10),
    ("xiaozhen", "map-base/.local/video-intake/cd-xiaozhen-7628908247805725986/source.mp4", 663, 15)
]

out_summary = {}

for name, vpath, duration, step in targets:
    print(f"\n=== Analyzing {name} ===")
    fdir = Path(f'output/research/chengdu/frames_{name}')
    fdir.mkdir(parents=True, exist_ok=True)
    
    # Extract frames
    subprocess.run([
        FFMPEG, '-y', '-i', vpath, '-vf', f'fps=1/{step}', '-q:v', '3', str(fdir / 'f_%04d.jpg')
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    frames = sorted(list(fdir.glob('*.jpg')))
    print(f"Extracted {len(frames)} frames for {name}")
    
    results = []
    for idx, f in enumerate(frames):
        sec = idx * step
        res, _ = ocr(str(f))
        lines = [line[1].strip() for line in res] if res else []
        results.append({"frame": f.name, "second": sec, "lines": lines})
        
    out_summary[name] = results
    
    # Save individual JSON
    with open(f'output/research/chengdu/{name}_ocr.json', 'w', encoding='utf-8') as jf:
        json.dump(results, jf, ensure_ascii=False, indent=2)

print("\n=== All OCR completed ===")
