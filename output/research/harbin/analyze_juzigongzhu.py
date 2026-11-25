import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path('.').resolve()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
source_mp4 = root / "map-base/.local/video-intake/hb-juzigongzhu-7330178597065461029/source.mp4"
out_dir = root / "output/research/harbin/frames/juzigongzhu"
out_dir.mkdir(parents=True, exist_ok=True)

# Extract frames from 0 to 40 seconds at 1 fps
cmd = [
    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
    "-ss", "0", "-i", str(source_mp4),
    "-t", "40",
    "-vf", "fps=1,scale=720:-1",
    str(out_dir / "juzi_%03d.jpg")
]
subprocess.run(cmd, check=True)

frames = sorted(list(out_dir.glob("juzi_*.jpg")))
print(f"Extracted {len(frames)} frames for juzigongzhu.")

ocr = RapidOCR()
for f in frames:
    res, _ = ocr(str(f))
    if res:
        texts = [r[1] for r in res if float(r[2]) > 0.4]
        line = " | ".join(texts)
        print(f"{f.name}: {line}")
