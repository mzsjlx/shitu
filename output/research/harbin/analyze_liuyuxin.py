import subprocess
import os
from pathlib import Path

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
source_mp4 = root / "map-base/.local/video-intake/hb-liuyuxin-7464616074248555828/source.mp4"
out_dir = root / "output/research/harbin/frames/liuyuxin"
out_dir.mkdir(parents=True, exist_ok=True)

# Extract 1 frame every 4 seconds
cmd = [
    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(source_mp4),
    "-vf", "fps=1/4,scale=720:-1",
    str(out_dir / "frame_%03d.jpg")
]
subprocess.run(cmd, check=True)

frames = sorted(list(out_dir.glob("frame_*.jpg")))
print(f"Extracted {len(frames)} frames.")

# Run rapidocr if available
try:
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
    print("Running OCR on frames...")
    results = {}
    for f in frames:
        sec = (int(f.stem.split('_')[1]) - 1) * 4
        res, _ = ocr(str(f))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.6]
            line = " | ".join(texts)
            if line:
                print(f"[{sec:03d}s] {line}")
                results[sec] = texts
except Exception as e:
    print(f"OCR not available or failed: {e}")
