import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    "hb-wulala-7270343915872505143",
    "hb-fengfeng-7633725862973587558",
    "hb-xiaotui-7554309439802543387",
    "hb-daoyueshe-7600245288900529454",
    "hb-lige-7537340285953592595",
    "hb-caomeixiong-7592438166386019237"
]

for t in targets:
    mp4 = intake / t / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=== {t} ===")
    for sec in [1, 3, 6, 10, 16, 25, 35]:
        img = intake / t / f"test_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                line = " | ".join(texts)
                print(f"  {sec}s: {line[:120]}")
            img.unlink(missing_ok=True)
