import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

intake = Path("map-base/.local/video-intake")
targets = [
    "hb-二百者也-7399924817459219751",
    "hb-刘雨鑫JASON-7290460823955197241",
    "hb-小蒲同学-7684246987718093043",
    "hb-崔佳楠-7308658908573256998",
    "hb-小颓废的嘴-7560616038187126025",
    "hb-玲子reiko-7605863016671792427",
    "hb-小笼人-7358179621713595674",
    "hb-李哥我饿了-7460829367191571747"
]

for t in targets:
    p = intake / t / "source.mp4"
    if not p.exists():
        continue
    print(f"=== {t} ===")
    for sec in [1, 3, 6, 10, 15, 20, 25, 30]:
        img = intake / t / f"test_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-y", "-ss", str(sec), "-i", str(p), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                t_str = " | ".join(texts)
                print(f"  {sec}s: {t_str[:120]}")
            img.unlink(missing_ok=True)
