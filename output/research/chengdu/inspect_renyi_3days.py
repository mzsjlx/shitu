import os
import subprocess
import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
video_renyi = r"map-base\.local\video-intake\cd-renyi-7606583802420317455\source.mp4"
out_dir = "output/research/chengdu/frames_renyi1_all"
os.makedirs(out_dir, exist_ok=True)

for ts in range(1, 134, 4):
    img_path = os.path.join(out_dir, f"f_{ts:03d}s.jpg")
    if not os.path.exists(img_path):
        cmd = [FFMPEG, "-y", "-ss", str(ts), "-i", video_renyi, "-vframes", "1", "-vf", "scale=960:-1", img_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        if lines:
            print(f"[{ts:03d}s]: {' | '.join(lines)}", flush=True)
