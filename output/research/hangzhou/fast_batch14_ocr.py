import os, sys, json, subprocess, glob, time
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
info_path = worktree_root / "output/research/hangzhou/batch14_downloaded.json"

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

with open(info_path, 'r', encoding='utf-8') as f:
    items = json.load(f)

ocr = RapidOCR()
temp_dir = map_base / ".local/temp_ocr_frames_batch14"
temp_dir.mkdir(parents=True, exist_ok=True)

all_results = {}

for it in items:
    s_id = it['id']
    author = it['author']
    title = it['title']
    mp4_path = intake_dir / s_id / "source.mp4"
    
    print(f"\n==========================================", flush=True)
    print(f"Processing: {author} ({s_id})", flush=True)
    
    if not mp4_path.exists():
        print(f"File not found: {mp4_path}", flush=True)
        continue

    # Clean temp dir
    for f in temp_dir.glob("*.jpg"):
        try: f.unlink()
        except: pass
        
    # Extract 1 frame every 2.5 seconds via ffmpeg
    cmd = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(mp4_path),
        "-vf", "fps=1/2.5,scale=720:-1",
        "-q:v", "3",
        str(temp_dir / "frame_%04d.jpg")
    ]
    t0 = time.time()
    subprocess.run(cmd, check=True)
    frames = sorted(temp_dir.glob("frame_*.jpg"))
    print(f"Extracted {len(frames)} frames in {time.time()-t0:.2f}s", flush=True)
    
    matches = []
    for idx, f_path in enumerate(frames):
        sec = round(idx * 2.5, 1)
        res, _ = ocr(str(f_path))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.5]
            if texts:
                matches.append({"sec": sec, "text": " ".join(texts)})
                
    print(f"OCR finished for {s_id}: {len(matches)} frames with text", flush=True)
    all_results[s_id] = {
        "author": author,
        "title": title,
        "poi": it.get('poi_info', {}),
        "matches": matches
    }

out_path = worktree_root / "output/research/hangzhou/batch14_ocr_summary.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\nAll done! Saved to {out_path}", flush=True)
