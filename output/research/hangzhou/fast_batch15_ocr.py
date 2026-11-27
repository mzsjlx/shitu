import os, sys, json, subprocess, glob, time
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = map_base / ".local/video-intake"
info_path = worktree_root / "output/research/hangzhou/batch15_downloaded.json"
out_path = worktree_root / "output/research/hangzhou/batch15_ocr_summary.json"

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

with open(info_path, 'r', encoding='utf-8') as f:
    items = json.load(f)

all_results = {}
if out_path.exists():
    try:
        all_results = json.loads(out_path.read_text(encoding='utf-8'))
    except Exception:
        all_results = {}

ocr = RapidOCR()
temp_dir = map_base / ".local/temp_ocr_frames_batch15"
temp_dir.mkdir(parents=True, exist_ok=True)

for it in items:
    s_id = it.get('source_id') or it.get('id')
    if s_id in all_results and all_results[s_id].get('matches'):
        print(f"Skipping already completed: {s_id}", flush=True)
        continue
    author = it['author']
    title = it['title']
    mp4_path = intake_dir / s_id / "source.mp4"
    if not mp4_path.exists():
        mp4_path = intake_dir / f"{s_id}.mp4"
    
    print(f"\n==========================================", flush=True)
    print(f"Processing: {author} ({s_id})", flush=True)
    
    if not mp4_path.exists():
        print(f"File not found: {mp4_path}", flush=True)
        continue

    for f in temp_dir.glob("*.jpg"):
        try: f.unlink()
        except: pass
        
    cmd = [
        ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(mp4_path),
        "-vf", "fps=1/3,scale=640:-1",
        "-q:v", "3",
        str(temp_dir / "frame_%04d.jpg")
    ]
    t0 = time.time()
    subprocess.run(cmd, check=True)
    frames = sorted(temp_dir.glob("frame_*.jpg"))
    print(f"Extracted {len(frames)} frames in {time.time()-t0:.2f}s", flush=True)
    
    matches = []
    t_ocr = time.time()
    for idx, f_path in enumerate(frames):
        sec = round(idx * 3.0, 1)
        res, _ = ocr(str(f_path))
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.5]
            if texts:
                matches.append({"sec": sec, "text": " ".join(texts)})
        if (idx + 1) % 50 == 0:
            print(f"  Progress: {idx+1}/{len(frames)} frames ({time.time()-t_ocr:.1f}s)", flush=True)
                
    print(f"OCR finished for {s_id}: {len(matches)} frames with text in {time.time()-t_ocr:.1f}s", flush=True)
    all_results[s_id] = {
        "author": author,
        "title": title,
        "poi": it.get('poi_info', {}),
        "matches": matches
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\nAll done! Saved to {out_path}", flush=True)
