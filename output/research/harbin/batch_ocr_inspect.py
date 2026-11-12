import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
frames_base = root / "output/research/harbin/frames"
frames_base.mkdir(parents=True, exist_ok=True)

with open(root / "output/research/harbin/batch1_resolved.json", "r", encoding="utf-8") as f:
    items = json.load(f)

ocr = RapidOCR()

def inspect_video(source_id, max_seconds=60, fps=1):
    mp4 = intake_dir / source_id / "source.mp4"
    if not mp4.exists():
        print(f"Skipping {source_id}, source.mp4 not found.")
        return
        
    out_dir = frames_base / source_id
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if frames already exist
    existing = list(out_dir.glob("frame_*.jpg"))
    if not existing:
        print(f"Extracting frames for {source_id} (0-{max_seconds}s, fps={fps})...")
        cmd = [
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-ss", "0", "-i", str(mp4),
            "-t", str(max_seconds),
            "-vf", f"fps={fps},scale=720:-1",
            str(out_dir / "frame_%03d.jpg")
        ]
        subprocess.run(cmd, check=True)
        existing = sorted(list(out_dir.glob("frame_*.jpg")))
        
    print(f"Running OCR on {len(existing)} frames of {source_id}...")
    keywords = ['街', '路', '道', '区', '店', '馆', '坊', '居', '号', '哈', '市', '串', '肚', '包', '肉', '烧烤', '大鹅', '冷面', '盒饭', '老']
    findings = []
    for f in existing:
        res, _ = ocr(str(f))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            line = " | ".join(texts)
            if any(k in line for k in keywords):
                findings.append(f"{f.name}: {line}")
                
    result_txt = out_dir / "ocr_findings.txt"
    result_txt.write_text("\n".join(findings), encoding="utf-8")
    print(f"Saved {len(findings)} lines of findings to {result_txt}")
    for l in findings[:10]:
        print("  ", l)

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        inspect_video(sys.argv[1])
    else:
        # Check all available source folders
        for item in items:
            source_id = item.get('sourceId')
            if source_id and (intake_dir / source_id / "source.mp4").exists():
                inspect_video(source_id)
