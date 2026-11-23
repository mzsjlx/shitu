import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake = Path("map-base/.local/video-intake")

targets = [
    # 素十二
    ("素十二", "hb-sushier-7629937787806876530", [5, 15, 25, 40, 60, 80, 100, 120]),
    # 锅包肉肉
    ("锅包肉肉", "hb-guobaorourou-7628142458585586865", [8, 12, 16, 25, 35, 50, 70]),
    # 姚十八
    ("姚十八", "hb-yaoshiba-7579959689283194150", [8, 15, 25, 35, 45, 55, 75]),
    # 广广
    ("广广", "hb-guangguang-7610107597731634358", [8, 15, 30, 60, 90, 120, 150]),
    # 林晨睡
    ("林晨睡", "hb-linchenshui-7584347255247818035", [10, 20, 30, 60, 100, 150, 200])
]

for author, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    print(f"\n=================== {author} ({sid}) ===================", flush=True)
    for sec in secs:
        img = intake / sid / f"extra_{sec}s.jpg"
        subprocess.run([ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(sec), "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-1", str(img)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                print(f"  [{sec:3d}s] {' | '.join(texts)}", flush=True)
            img.unlink(missing_ok=True)
