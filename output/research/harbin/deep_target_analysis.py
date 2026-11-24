import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
intake = root / "map-base/.local/video-intake"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
ocr = RapidOCR()

targets = [
    ("洪剑涛-张家清真小吃", "hb-hongjiantao-7455514963512282426", [5, 8, 12, 20, 25, 30, 200]),
    ("同一种调调-小安利", "hb-tongyizhongdiaodiao-7271545349351689526", [4, 6, 8, 12, 16]),
    ("小曹和辉哥-清真老馆子", "hb-xiaocaohehuige-7572409902087675107", [4, 8, 12, 16, 20, 30, 275]),
    ("岛民大白-锅包肉", "hb-daomindabai-7447440540515208508", [4, 8, 12, 16, 20, 25, 30, 50, 75, 275]),
    ("小刘-小军麻辣面", "hb-geixiaoliuliuyikou-7687315511633627769", [16, 18, 20, 24, 28, 32]),
    ("蛋壳Danke-原炉具百姓", "hb-dankedanke-7445571121983933715", [18, 22, 25, 28, 35, 45]),
    ("小可-李桂鑫麻辣烫", "hb-xiaokeriji-7640089065266233777", [18, 20, 22, 24, 28])
]

out_txt = root / "output/research/harbin/deep_target_results.txt"
lines = []

for name, sid, secs in targets:
    mp4 = intake / sid / "source.mp4"
    if not mp4.exists():
        continue
    header = f"\n=== {name} ({sid}) ==="
    print(header, flush=True)
    lines.append(header)
    for s in secs:
        img = intake / sid / f"inspect_deep_{s}.jpg"
        subprocess.run([
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(s), "-i", str(mp4), "-frames:v", "1",
            "-vf", "scale=1080:-1", str(img)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.4]
                row = f"  [{s:3d}s] " + " | ".join(texts)
                print(row, flush=True)
                lines.append(row)
            img.unlink(missing_ok=True)

with open(out_txt, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"\nDone! Written to {out_txt}", flush=True)
