import os
import subprocess
import json
import glob
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

def extract_and_ocr(video_path, timestamps, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    results = {}
    for ts in timestamps:
        img_name = f"frame_{int(ts)}s.jpg"
        img_path = os.path.join(out_dir, img_name)
        if not os.path.exists(img_path):
            cmd = [
                FFMPEG, "-y",
                "-ss", str(ts),
                "-i", video_path,
                "-vframes", "1",
                "-vf", "scale=960:-1",
                img_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if os.path.exists(img_path):
            res, _ = ocr(img_path)
            lines = [r[1] for r in res] if res else []
            results[ts] = lines
    return results

# 1. huoguocheshou: cd-huoguocheshou-7652876209759522086 (蹄花)
# 438s total. Let's sample every 15s in the beginning (0 to 60s) and end
video_huoguo = r"map-base\.local\video-intake\cd-huoguocheshou-7652876209759522086\source.mp4"
huoguo_res = extract_and_ocr(video_huoguo, [2, 5, 8, 12, 18, 25, 35, 50, 70, 100, 150, 200, 300, 400], "output/research/chengdu/frames_huoguo")
print("=== HUOGUO CHESHOU ===")
for ts, lines in huoguo_res.items():
    print(f"[{ts}s]:", " | ".join(lines))

# 2. renyi_3days: cd-renyi-7606583802420317455 (134s)
video_renyi1 = r"map-base\.local\video-intake\cd-renyi-7606583802420317455\source.mp4"
renyi1_res = extract_and_ocr(video_renyi1, [2, 6, 12, 20, 30, 45, 60, 75, 90, 105, 120], "output/research/chengdu/frames_renyi1")
print("\n=== RENYI 3 DAYS ===")
for ts, lines in renyi1_res.items():
    print(f"[{ts}s]:", " | ".join(lines))

# 3. renyi_shaokao: cd-renyi-7327176467857558838 (172s)
video_renyi2 = r"map-base\.local\video-intake\cd-renyi-7327176467857558838\source.mp4"
renyi2_res = extract_and_ocr(video_renyi2, [2, 5, 10, 18, 25, 40, 60, 80, 100, 120, 150], "output/research/chengdu/frames_renyi2")
print("\n=== RENYI SHAOKAO ===")
for ts, lines in renyi2_res.items():
    print(f"[{ts}s]:", " | ".join(lines))

# 4. wowxingge: cd-wowxingge-7683461500186496307 (422s)
video_wow = r"map-base\.local\video-intake\cd-wowxingge-7683461500186496307\source.mp4"
wow_res = extract_and_ocr(video_wow, [2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300], "output/research/chengdu/frames_wow")
print("\n=== WOW XINGGE ===")
for ts, lines in wow_res.items():
    print(f"[{ts}s]:", " | ".join(lines))

# 5. xiaozhen: cd-xiaozhen-7628908247805725986 (663s)
video_xiao = r"map-base\.local\video-intake\cd-xiaozhen-7628908247805725986\source.mp4"
xiao_res = extract_and_ocr(video_xiao, [2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 500], "output/research/chengdu/frames_xiaozhen")
print("\n=== XIAO ZHEN ===")
for ts, lines in xiao_res.items():
    print(f"[{ts}s]:", " | ".join(lines))
