import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
intake_dir = root / "map-base/.local/video-intake"
ocr_dir = root / "output/research/harbin/ocr_batch"
ocr_dir.mkdir(parents=True, exist_ok=True)

sources = [
    "hb-miantiaoren-7665314978568737498",
    "hb-miantiaoren-7640056445471985510",
    "hb-pangshi-7454378546878762252",
    "hb-wangning-7458201688441244947",
    "hb-liuyuxin-7597760285105065251",
    "hb-yunibobo-7233354874224725287",
    "hb-pangshi-7452648281902959926",
    "hb-xiaozhen-7392155991103655218",
    "hb-yitiaodafeie-7310156328402423091"
]

ocr = RapidOCR()

def process_video(sid):
    mp4 = intake_dir / sid / "source.mp4"
    if not mp4.exists():
        print(f"Skipping {sid}, no source.mp4")
        return
        
    v_frames = ocr_dir / sid
    v_frames.mkdir(parents=True, exist_ok=True)
    
    # Extract 1 frame every 4 seconds
    frames = list(v_frames.glob("*.jpg"))
    if not frames:
        cmd = [
            ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(mp4),
            "-vf", "fps=1/4,scale=720:-1",
            str(v_frames / "f_%04d.jpg")
        ]
        subprocess.run(cmd, check=True)
        frames = sorted(list(v_frames.glob("*.jpg")))
        
    print(f"\n--- {sid} ({len(frames)} frames) ---")
    results = []
    for f in frames:
        sec = int(f.stem.split('_')[1]) * 4
        m, s = divmod(sec, 60)
        res, _ = ocr(str(f))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.4]
            line = " | ".join(texts)
            results.append(f"{m:02d}:{s:02d} ({f.name}): {line}")
            
    out_file = ocr_dir / f"{sid}.txt"
    out_file.write_text("\n".join(results), encoding="utf-8")
    print(f"Saved {len(results)} lines to {out_file.name}")
    # Print key lines with store/food keywords
    keywords = ['店', '馆', '坊', '居', '号', '街', '路', '道', '区', '串', '肚', '烧烤', '大鹅', '冷面', '盒饭', '肉', '包', '早市', '夜市', '排骨']
    for r in results:
        if any(k in r for k in keywords):
            print("  ", r)

if __name__ == '__main__':
    for s in sources:
        process_video(s)
