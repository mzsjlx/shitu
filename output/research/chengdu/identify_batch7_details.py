import os
import sys
import subprocess
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

def extract_and_ocr(mp4, seconds, out_prefix):
    os.makedirs(os.path.dirname(out_prefix), exist_ok=True)
    results = []
    for s in seconds:
        out_jpg = f"{out_prefix}_{int(s*10):04d}.jpg"
        if not os.path.exists(out_jpg):
            subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-i", mp4, "-frames:v", "1", out_jpg])
        res, _ = ocr(out_jpg)
        lines = [r[1] for r in res] if res else []
        results.append((s, lines))
    return results

# 1. Inspect wowxingge bbq (0-25s)
print("--- 1. wowxingge BBQ ---")
res_wow = extract_and_ocr(
    "map-base/.local/video-intake/cd-wowxingge-7685637264814247187/source.mp4",
    [0.1, 0.3, 0.6, 1.0, 1.8, 2.5, 4.0, 6.0, 8.0, 12.0, 15.0, 18.0, 22.0, 28.0],
    "output/research/chengdu/details_frames/wow"
)
for s, l in res_wow:
    print(f"wow [{s}s]: {l}")

# 2. Inspect airousi bbq (0-20s)
print("\n--- 2. airousi BBQ ---")
res_ai = extract_and_ocr(
    "map-base/.local/video-intake/cd-airousi-7692002207759109426/source.mp4",
    [0.2, 0.8, 1.2, 2.0, 3.5, 6.0, 9.0, 14.0, 18.0, 22.0, 26.0, 32.0],
    "output/research/chengdu/details_frames/airousi"
)
for s, l in res_ai:
    print(f"airousi [{s}s]: {l}")

# 3. Inspect xulaosihebeijiang (0-20s)
print("\n--- 3. xulaosihebeijiang ---")
res_xu = extract_and_ocr(
    "map-base/.local/video-intake/cd-xulaosihebeijiang-7703881917602516258/source.mp4",
    [0.1, 0.4, 0.8, 1.5, 2.2, 3.0, 4.0, 6.0, 8.0, 11.0, 14.0, 18.0, 22.0],
    "output/research/chengdu/details_frames/xulaosi"
)
for s, l in res_xu:
    print(f"xulaosi [{s}s]: {l}")

# 4. Inspect xiaobeiele (0-25s)
print("\n--- 4. xiaobeiele ---")
res_xiao = extract_and_ocr(
    "map-base/.local/video-intake/cd-xiaobeiele-7584331173757848874/source.mp4",
    [0.2, 0.8, 1.5, 2.5, 4.0, 6.0, 9.0, 11.0, 14.0, 18.0, 22.0, 28.0, 33.0],
    "output/research/chengdu/details_frames/xiaobeiele"
)
for s, l in res_xiao:
    print(f"xiaobeiele [{s}s]: {l}")

# 5. Inspect sangesan shops (30-300s)
print("\n--- 5. sangesan shops ---")
res_san = extract_and_ocr(
    "map-base/.local/video-intake/cd-sangesan-7584859074635943217/source.mp4",
    [35.0, 42.0, 50.0, 70.0, 110.0, 140.0, 155.0, 165.0, 170.0, 210.0, 245.0, 255.0, 265.0, 275.0, 285.0],
    "output/research/chengdu/details_frames/sangesan"
)
for s, l in res_san:
    print(f"sangesan [{s}s]: {l}")
