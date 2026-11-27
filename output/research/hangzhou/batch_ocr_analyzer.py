import subprocess, json, sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
root = Path(r"D:\Antigravity\地图")
intake_dir = root / "map-base/.local/video-intake"

def analyze_video(source_id, interval=5.0, max_dur=None):
    video_path = intake_dir / source_id / "source.mp4"
    if not video_path.exists():
        print(f"File not found: {video_path}")
        return []
    
    # Get duration
    cmd = [ffmpeg_exe, "-hide_banner", "-i", str(video_path)]
    p = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding='utf-8', errors='ignore')
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d.]+)", p.stderr)
    if not m:
        return []
    dur = float(m.group(1))*3600 + float(m.group(2))*60 + float(m.group(3))
    if max_dur:
        dur = min(dur, max_dur)
    
    tmp_dir = root / f".local/worktrees/hangzhou-prep/output/research/hangzhou/tmp_frames/{source_id}"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract frames at interval
    timestamps = []
    t = 2.0
    while t < dur - 2.0:
        timestamps.append(t)
        t += interval
    
    results = []
    for sec in timestamps:
        frame_file = tmp_dir / f"f_{int(sec):04d}.jpg"
        if not frame_file.exists():
            subprocess.run([
                ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
                "-ss", str(sec), "-i", str(video_path),
                "-vframes", "1", "-q:v", "3", str(frame_file)
            ])
        if frame_file.exists():
            ocr_res, _ = ocr(str(frame_file))
            texts = [r[1] for r in ocr_res] if ocr_res else []
            # Keep interesting texts
            combined = " | ".join(texts)
            results.append({"second": sec, "text": combined})
            # Clean up frame to save space
            try:
                frame_file.unlink()
            except:
                pass
    try:
        tmp_dir.rmdir()
    except:
        pass
    return results

if __name__ == "__main__":
    sid = sys.argv[1]
    res = analyze_video(sid, interval=float(sys.argv[2]) if len(sys.argv)>2 else 5.0)
    out_file = root / f".local/worktrees/hangzhou-prep/output/research/hangzhou/{sid}_ocr.json"
    out_file.write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf8")
    print(f"Saved {len(res)} frames OCR to {out_file}")
