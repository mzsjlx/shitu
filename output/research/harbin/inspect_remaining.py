import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    ("高文麒", "hb-gaowenqi-7592085607636159759", [5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180, 240]),
    ("嘴嘴儿", "hb-zuizuier-7633399357451161222", [10, 20, 30, 60, 90, 150, 180, 200, 220, 240, 260]),
    ("阿聋", "hb-along-7645264982153628928", [10, 20, 30, 60, 90, 120, 180, 240, 300])
]

for author, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=== {author} ({sid}) ===")
    for s in secs:
        img = Path(f"temp_ins_{s}.jpg")
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=1080:-1", str(img)])
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                print(f"[{s:3d}s] " + " | ".join(texts)[:130])
            img.unlink()
