import cv2, json, subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
intake = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
out_dir = worktree_root / "output/research/hangzhou"

videos = [
    {"id": "hz-yangsang-7653525512216707913", "file": "hz-yangsang-7653525512216707913.mp4", "step_sec": 10},
    {"id": "hz-niuniu-7646324850500266737", "file": "hz-niuniu-7646324850500266737.mp4", "step_sec": 3},
    {"id": "hz-jieou-7641070065438731368", "file": "hz-jieou-7641070065438731368.mp4", "step_sec": 2},
    {"id": "hz-jiding-7709105067328419515", "file": "hz-jiding-7709105067328419515.mp4", "step_sec": 3}
]

results = {}

for v in videos:
    vid_id = v["id"]
    p = intake / v["file"]
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

out_file = out_dir / "batch5_ocr.json"
out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Done scanning! Saved to {out_file}")
