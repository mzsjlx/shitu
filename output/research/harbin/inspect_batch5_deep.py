import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    "hb-liuyuxin-7597760285105065251",
    "hb-miantiaoren-7640056445471985510",
    "hb-pangshi-7452648281902959926",
    "hb-pangshi-7454378546878762252",
    "hb-xiaohao-7656653557063955386",
    "hb-xiaozhen-7392155991103655218",
    "hb-yitiaodafeie-7310156328402423091",
    "hb-yunibobo-7233354874224725287",
    "hb-小笼人-7358179621713595674",
    "hb-小笼人-7573646761845298934",
    "hb-小饭熊不正常-7429264519756614949",
    "hb-杨草莓熊-7603573604471421305",
    "hb-老韩头-7536144975332691257",
    "hb-芋泥啵啵-7430361167408663845",
    "hb-阿羡吃不饱-7628879370845202794"
]

print(f"Inspecting {len(targets)} candidates...")

for t in targets:
    mp4 = intake / t / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=== {t} ===")
    for sec in [2, 5, 10, 16, 25, 40]:
        img = intake / t / f"sample_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                line = " | ".join(texts)
                print(f"  {sec}s: {line[:120]}")
            img.unlink(missing_ok=True)
