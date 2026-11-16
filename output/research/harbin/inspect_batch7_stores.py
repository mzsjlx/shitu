import json
import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
res_file = root / "output/research/harbin/batch7_resolved.json"
out_report = root / "output/research/harbin/batch7_inspection.txt"
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

with open(res_file, "r", encoding="utf-8") as f:
    items = json.load(f)

ocr = RapidOCR()

lines = []
def log(msg):
    print(msg, flush=True)
    lines.append(msg)

log(f"=== Inspecting {len(items)} items from Batch 7 ===\n")

for it in items:
    sid = it.get('sourceId')
    author = it.get('author')
    title = it.get('title')
    desc = it.get('desc', '')
    dur = it.get('durationSeconds', 0)
    
    log(f"\n=======================================================")
    log(f"[{it.get('index')}] {author} | {sid} ({dur}s)")
    log(f"Title: {title}")
    log(f"Desc: {desc}")
    if it.get('excluded'):
        log(f"EXCLUDED: {it.get('excludeReason')}")
        continue
        
    mp4 = intake_dir / sid / "source.mp4"
    if not mp4.exists():
        log(f"Video missing: {mp4}")
        continue
        
    # Sample seconds
    sample_secs = [2, 5, 8, 12, 18, 25, 35]
    if dur > 60:
        sample_secs += [50, 75, 100]
    if dur > 180:
        sample_secs += [150, 200, 250]
        
    log("OCR Key Frames:")
    for sec in sample_secs:
        if sec >= dur:
            continue
        img = intake_dir / sid / f"sample_{sec}s.jpg"
        subprocess.run([
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", str(sec), "-i", str(mp4), "-frames:v", "1",
            "-vf", "scale=720:-1", str(img)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if img.exists():
            res, _ = ocr(str(img))
            if res:
                texts = [r[1] for r in res if float(r[2]) > 0.45]
                valid = [t for t in texts if len(t) > 1]
                if valid:
                    log(f"  [{sec:3d}s] {' | '.join(valid)[:130]}")
            img.unlink(missing_ok=True)

with open(out_report, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

log(f"\nSaved inspection to {out_report}")
