import cv2, json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
intake = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base\.local\video-intake")
worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
out_dir = worktree_root / "output/research/hangzhou"

videos = [
    {"id": "hz-hongshuqin-7705236533049150771", "step_sec": 4},
    {"id": "hz-xuetumudeduo-7710663227746651392", "step_sec": 4},
    {"id": "hz-meiweishuangxiangpao-7662581743693712666", "step_sec": 4},
    {"id": "hz-luxiaojun-7598141820270284041", "step_sec": 4},
    {"id": "hz-yizhikaizi-7563346249122843930", "step_sec": 5}
]

results = {}

for v in videos:
    vid_id = v["id"]
    p = intake / vid_id / "source.mp4"
    if not p.exists():
        print(f"Skipping {vid_id}, not found")
        continue
    cap = cv2.VideoCapture(str(p))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    print(f"Scanning {vid_id} (Duration: {duration:.1f}s, FPS: {fps:.1f})...")
    
    step_sec = v["step_sec"]
    step_frames = int(fps * step_sec)
    
    timeline = []
    frame_idx = 0
    
    while frame_idx < total_frames:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            break
        sec = frame_idx / fps
        res, _ = ocr(frame)
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.5]
            joined = " | ".join(texts)
            timeline.append({"sec": round(sec, 1), "text": joined})
        frame_idx += step_frames
        
    cap.release()
    results[vid_id] = {
        "duration": duration,
        "timeline": timeline
    }
    
    # Also dump individual txt
    txt_lines = [f"=== {vid_id} (Duration: {duration:.1f}s) ==="]
    for t in timeline:
        txt_lines.append(f"{t['sec']:>6.1f}s: {t['text']}")
    (out_dir / f"{vid_id}_ocr.txt").write_text("\n".join(txt_lines), encoding="utf-8")
    print(f"Dumped {vid_id}_ocr.txt")

out_file = out_dir / "batch6_ocr.json"
out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Done scanning batch 6! Saved to {out_file}")
