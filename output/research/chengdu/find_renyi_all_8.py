import os
import subprocess
import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
video_renyi = r"map-base\.local\video-intake\cd-renyi-7606583802420317455\source.mp4"
out_dir = "output/research/chengdu/frames_renyi1_titles"
os.makedirs(out_dir, exist_ok=True)

# check every second in the transition zones
zones = list(range(13, 23)) + list(range(23, 33)) + list(range(34, 46)) + list(range(49, 62)) + list(range(99, 112))

for ts in zones:
    img_path = os.path.join(out_dir, f"f_{ts:03d}s.jpg")
    if not os.path.exists(img_path):
        cmd = [FFMPEG, "-y", "-ss", str(ts), "-i", video_renyi, "-vframes", "1", "-vf", "scale=960:-1", img_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        for line in lines:
            if "第" in line or "家" in line or "店" in line or "馆" in line or "人均" in line:
                print(f"[{ts:03d}s]: {' | '.join(lines)}", flush=True)
                break
