import os
import sys
import subprocess
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')

FFMPEG = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

videos = [
    ("cd-jigelebuqide-7541289429587987755", [0.5, 2.0, 5.0, 10.0, 25.0]),
    ("cd-wowxingge-7685637264814247187", [0.5, 1.5, 3.0, 10.0, 20.0, 30.0, 45.0, 60.0]),
    ("cd-airousi-7692002207759109426", [0.5, 2.0, 5.0, 10.0, 20.0, 25.0, 30.0, 45.0]),
    ("cd-sangesan-7584859074635943217", [15.0, 25.0, 30.0, 45.0, 60.0, 90.0, 120.0, 150.0, 160.0, 180.0, 240.0, 270.0, 300.0]),
    ("cd-xulaosihebeijiang-7703881917602516258", [0.5, 2.0, 3.0, 5.0, 15.0, 25.0, 30.0, 50.0]),
    ("cd-xiaobeiele-7584331173757848874", [1.0, 3.0, 8.0, 12.0, 16.0, 20.0, 35.0, 40.0, 50.0]),
    ("cd-tiaojieshuachengdu-7667130769399205155", [1.0, 3.0, 15.0, 20.0, 25.0, 30.0, 50.0, 70.0, 100.0, 115.0, 130.0, 160.0, 175.0])
]

out_report = []

for sid, times in videos:
    mp4 = f"map-base/.local/video-intake/{sid}/source.mp4"
    out_dir = f"output/research/chengdu/inspect_frames/{sid}"
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"\n================ {sid} ================")
    out_report.append(f"\n================ {sid} ================\n")
    for t in times:
        out_jpg = f"{out_dir}/f_{int(t*10):04d}.jpg"
        if not os.path.exists(out_jpg):
            subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(t), "-i", mp4, "-frames:v", "1", out_jpg])
        res, _ = ocr(out_jpg)
        lines = [r[1] for r in res] if res else []
        log_line = f"[{t:5.1f}s]: {' | '.join(lines)}"
        print(log_line)
        out_report.append(log_line + "\n")

with open("output/research/chengdu/inspect_all_output.txt", "w", encoding="utf-8") as f:
    f.writelines(out_report)

print("\nDone! Saved to output/research/chengdu/inspect_all_output.txt")
