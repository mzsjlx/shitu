import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

targets = [
    ("cd-liuyuxin-7608971956116917519", [5, 10, 15, 20, 25, 30, 45, 60]),
    ("cd-yangdui-7701272428579802368", [10, 20, 30, 40, 50, 60, 70, 80]),
    ("cd-renyiyige-7591742533558914346", [5, 10, 15, 20, 25, 30, 40, 60]),
    ("cd-xiaozhen-7644496437832600838", [10, 20, 30, 40, 50, 60]),
    ("cd-juzigongzhu-7615894254908476681", [5, 10, 15, 20, 25, 30, 45]),
    ("cd-xiaolongren-7381768360482114870", [10, 30, 60, 120, 200, 300, 400, 500])
]

out_dir = Path("output/research/chengdu/batch8/deep_inspect")
out_dir.mkdir(parents=True, exist_ok=True)

for sid, times in targets:
    mp4 = Path(f"map-base/.local/video-intake/{sid}/source.mp4")
    print(f"\n=== Inspecting {sid} ===")
    for t in times:
        fp = out_dir / f"{sid}_{t}.jpg"
        if not fp.exists():
            cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-q:v", "3", str(fp)]
            subprocess.run(cmd)
        if fp.exists():
            res, _ = ocr(str(fp))
            if res:
                print(f"  [{t}s]", [r[1] for r in res])
