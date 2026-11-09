import os
import subprocess
import json
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
video_pp = r"map-base\.local\video-intake\cd-ppchaonengxuan-7551750117855202601\source.mp4"
out_dir = "output/research/chengdu/frames_pp"
os.makedirs(out_dir, exist_ok=True)

# 844s video. Sample every 30s
timestamps = list(range(5, 840, 30))
results = {}

for ts in timestamps:
    img_name = f"frame_{int(ts)}s.jpg"
    img_path = os.path.join(out_dir, img_name)
    if not os.path.exists(img_path):
        cmd = [
            FFMPEG, "-y",
            "-ss", str(ts),
            "-i", video_pp,
            "-vframes", "1",
            "-vf", "scale=960:-1",
            img_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    if os.path.exists(img_path):
        res, _ = ocr(img_path)
        lines = [r[1] for r in res] if res else []
        results[ts] = lines
        print(f"[{ts}s]:", " | ".join(lines), flush=True)

with open("output/research/chengdu/pp_ocr_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
