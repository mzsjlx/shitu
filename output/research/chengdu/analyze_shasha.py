import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
ffmpeg = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

p = Path('output/research/chengdu/shasha_frames')
p.mkdir(parents=True, exist_ok=True)

# Sample 1 frame every 15s
cmd = [ffmpeg, '-y', '-i', 'map-base/.local/video-intake/cd-shashayouchanle-7694250186420137125/source.mp4', '-vf', 'fps=1/15', '-q:v', '3', str(p / 'f_%03d.jpg')]
subprocess.run(cmd, capture_output=True)

results = []
for f in sorted(p.glob('f_*.jpg')):
    idx = int(f.stem.split('_')[1])
    sec = idx * 15
    res, _ = engine(str(f))
    if res:
        texts = [item[1].strip() for item in res if len(item[1].strip()) > 1]
        if texts:
            results.append({'sec': sec, 'texts': texts})

with open('output/research/chengdu/shasha_ocr.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

print('Done shasha analysis, frames with text:', len(results))
