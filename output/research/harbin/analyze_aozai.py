import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
source_mp4 = root / "map-base/.local/video-intake/hb-aozai-7671974217537115874/source.mp4"
out_dir = root / "output/research/harbin/frames/aozai"
out_dir.mkdir(parents=True, exist_ok=True)

# Extract frames from 0 to 40 seconds at 2 fps
cmd = [
    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
    "-ss", "0", "-i", str(source_mp4),
    "-t", "40",
    "-vf", "fps=2,scale=720:-1",
    str(out_dir / "aozai_%03d.jpg")
]
subprocess.run(cmd, check=True)

frames = sorted(list(out_dir.glob("aozai_*.jpg")))
print(f"Extracted {len(frames)} frames for aozai.")

ocr = RapidOCR()
for f in frames:
    res, _ = ocr(str(f))
    if res:
        texts = [r[1] for r in res if float(r[2]) > 0.4]
        line = " | ".join(texts)
        if any(k in line for k in ['烧烤', '串', '店', '街', '路', '门', '号', '哈', '区', '羊', '肉']):
            print(f"{f.name}: {line}")
