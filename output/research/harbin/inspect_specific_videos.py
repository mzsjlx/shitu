import subprocess
import json
import hashlib
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
ocr = RapidOCR()

targets = [
    ("hb-xiaohao-7656653557063955386", [5, 10, 20, 30, 45, 60, 120, 200]),
    ("hb-ppchaonengxuan-7609991984049434862", [5, 15, 30, 60, 120, 180, 240, 360, 480, 600]),
    ("hb-miantiaoren-7640056445471985510", [2, 5, 10, 15, 20, 30, 45, 60, 90]),
    ("hb-pangshi-7454378546878762252", [2, 5, 10, 15, 20, 30, 45, 60, 90, 120]),
    ("hb-wangning-7458201688441244947", [2, 5, 10, 15, 20, 30, 45, 60, 90]),
    ("hb-liuyuxin-7597760285105065251", [2, 5, 10, 15, 20, 30, 45, 60, 90]),
    ("hb-yunibobo-7233354874224725287", [2, 5, 10, 15, 20, 30, 45, 60, 90]),
    ("hb-pangshi-7452648281902959926", [5, 15, 30, 60, 120, 180, 240, 300]),
    ("hb-xiaozhen-7392155991103655218", [2, 5, 10, 15, 20, 30, 45, 60, 90, 120]),
    ("hb-yitiaodafeie-7310156328402423091", [2, 5, 10, 15, 20, 30, 45, 60, 90])
]

out_base = root / "output/research/harbin/targeted_ocr"
out_base.mkdir(parents=True, exist_ok=True)

summary = {}

for sid, timestamps in targets:
    mp4 = intake_dir / sid / "source.mp4"
    if not mp4.exists():
        print(f"Missing {sid}")
        continue
    tdir = out_base / sid
    tdir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n==========================================")
    print(f"Inspecting {sid}...")
    lines = []
    for sec in timestamps:
        frame_path = tdir / f"sec_{sec:03d}.jpg"
        if not frame_path.exists():
            cmd = [
                ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
                "-ss", str(sec),
                "-i", str(mp4),
                "-vframes", "1",
                "-vf", "scale=640:-1",
                str(frame_path)
            ]
            subprocess.run(cmd, check=True)
        res, _ = ocr(str(frame_path))
        if res:
            text = " | ".join([r[1] for r in res if float(r[2]) > 0.4])
            print(f"  {sec:3d}s: {text}")
            lines.append(f"{sec}s: {text}")
    summary[sid] = lines

(out_base / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print("\nTargeted OCR Complete!")
