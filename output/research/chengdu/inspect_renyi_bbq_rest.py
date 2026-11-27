import os
import subprocess
import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
video_renyi2 = r"map-base\.local\video-intake\cd-renyi-7327176467857558838\source.mp4"
out_dir = "output/research/chengdu/frames_renyi2_shop"

for ts in range(35, 90, 4):
    img_path = os.path.join(out_dir, f"f_{ts:02d}s.jpg")
    if not os.path.exists(img_path):
        cmd = [FFMPEG, "-y", "-ss", str(ts), "-i", video_renyi2, "-vframes", "1", "-vf", "scale=960:-1", img_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        if lines:
            print(f"[{ts:02d}s]: {' | '.join(lines)}", flush=True)

for ts in range(115, 172, 5):
    img_path = os.path.join(out_dir, f"f_{ts:03d}s.jpg")
    if not os.path.exists(img_path):
        cmd = [FFMPEG, "-y", "-ss", str(ts), "-i", video_renyi2, "-vframes", "1", "-vf", "scale=960:-1", img_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        if lines:
            print(f"[{ts:03d}s]: {' | '.join(lines)}", flush=True)
