import os
import subprocess
import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
video_wow = r"map-base\.local\video-intake\cd-wowxingge-7683461500186496307\source.mp4"
out_dir = "output/research/chengdu/frames_wow_detailed"
os.makedirs(out_dir, exist_ok=True)

for ts in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]:
    img_path = os.path.join(out_dir, f"f_{ts:02d}s.jpg")
    if not os.path.exists(img_path):
        cmd = [FFMPEG, "-y", "-ss", str(ts), "-i", video_wow, "-vframes", "1", "-vf", "scale=960:-1", img_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        if lines:
            print(f"[{ts:02d}s]: {' | '.join(lines)}")
