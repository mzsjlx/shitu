import json
import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

def scan_video(source_id, timestamps):
    mp4 = intake_dir / source_id / "source.mp4"
    if not mp4.exists():
        print(f"Missing: {mp4}")
        return
    print(f"\n=== Scanning {source_id} ===", flush=True)
    for t in timestamps:
        img = intake_dir / source_id / f"deep_{t}.jpg"
        subprocess.run([
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(t), "-i", str(mp4), "-frames:v", "1",
            "-vf", "scale=720:-1", str(img)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.45]
                valid = [t for t in texts if len(t) > 1]
                if valid:
                    print(f"  [{t:4.1f}s] {' | '.join(valid)[:120]}", flush=True)
            img.unlink(missing_ok=True)

# 1. Liuyuxin (find storefront)
scan_video("hb-liuyuxin-7464616074248555828", [0.5, 1.0, 1.5, 2.0, 4.0, 7.5, 8.0, 8.5, 9.0, 11.0, 13.0, 15.0, 17.0, 20.0])

# 6. Liuyikou (find all 3 spicy noodle shops)
scan_video("hb-liuyikou-7619254660604247721", [3.0, 6.0, 9.0, 12.0, 15.0, 18.0, 22.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0])

# 9. Shenshiyi (find restaurant name)
scan_video("hb-shenshiyi-7694949290490716787", [2.0, 5.0, 8.0, 12.0, 15.0, 18.0, 20.0, 22.0, 25.0, 30.0])

# 11. Wangmian (find spicy noodle shop details)
scan_video("hb-wangmian-7608143548450848699", [5.0, 8.0, 11.0, 13.0, 15.0, 18.0, 20.0, 25.0, 30.0])

# 13. Rikku (find bakery & restaurant names)
scan_video("hb-rikkuxianbuxian-7626363099980762313", [65.0, 70.0, 75.0, 105.0, 110.0, 115.0, 195.0, 200.0, 205.0, 210.0, 235.0, 240.0])
