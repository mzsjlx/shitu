import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
frames_base = root / "output/research/harbin/frames"

b2_path = root / "output/research/harbin/batch2_resolved.json"
items = json.load(open(b2_path, encoding="utf-8"))

ocr = RapidOCR()

target_sources = [
    it for it in items if it.get("sourceSHA256") and not it.get("excluded")
]

print(f"Scanning {len(target_sources)} downloaded sources...")

for it in target_sources:
    sid = it["sourceId"]
    mp4 = intake_dir / sid / "source.mp4"
    if not mp4.exists():
        continue
        
    out_dir = frames_base / sid
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = sorted(list(out_dir.glob("f_*.jpg")))
    
    if not existing:
        # Sample 10 frames across the video (at 5%, 15%, 25%, 35%, 45%, 55%, 65%, 75%, 85%, 95%)
        dur = it.get("durationSeconds", 60)
        time_points = [round(dur * p) for p in [0.05, 0.12, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85]]
        for idx, tp in enumerate(time_points):
            f_path = out_dir / f"f_{idx:02d}_{tp}s.jpg"
            if not f_path.exists():
                cmd = [
                    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", str(tp), "-i", str(mp4),
                    "-frames:v", "1", "-vf", "scale=720:-1",
                    str(f_path)
                ]
                try:
                    subprocess.run(cmd, timeout=10)
                except:
                    pass
        existing = sorted(list(out_dir.glob("f_*.jpg")))
        
    findings = []
    for f in existing:
        res, _ = ocr(str(f))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            line = " | ".join(texts)
            findings.append(f"{f.name}: {line}")
            
    res_file = out_dir / "sampled_ocr.txt"
    res_file.write_text("\n".join(findings), encoding="utf-8")
    
    # check for shop keywords
    shop_lines = [l for l in findings if any(k in l for k in ['店', '馆', '楼', '菜馆', '肉', '烧烤', '大鹅', '冷面', '盒饭', '老', '菜市', '早市', '居', '坊'])]
    print(f"\n[{it['author']}] {it['title'][:35]} ({len(shop_lines)} shop cues):")
    for sl in shop_lines[:4]:
        print("  ", sl[:100])
