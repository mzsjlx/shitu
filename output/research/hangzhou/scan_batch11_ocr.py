import os, sys, json
import cv2
from rapidocr_onnxruntime import RapidOCR

worktree_root = r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep"
intake_dir = os.path.join(worktree_root, "map-base", ".local", "video-intake")
info_path = os.path.join(worktree_root, "output", "research", "hangzhou", "batch11_downloaded.json")

with open(info_path, 'r', encoding='utf-8') as f:
    items = json.load(f)

ocr = RapidOCR()
all_results = {}

for it in items:
    s_id = it['id']
    author = it['author']
    title = it['title']
    mp4_path = os.path.join(intake_dir, s_id, "source.mp4")
    
    print(f"\n==========================================")
    print(f"Processing: {author} ({s_id})")
    print(f"POI in metadata: {it['poi_info'].get('poi_name', 'None')}")
    
    if not os.path.exists(mp4_path):
        print(f"File not found: {mp4_path}")
        continue
        
    cap = cv2.VideoCapture(mp4_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    print(f"Duration: {duration:.1f}s, total_frames: {total_frames}")
    
    video_matches = []
    # Sample every 1.5 seconds for higher precision
    interval = int(fps * 1.5)
    frame_idx = 0
    while frame_idx < total_frames:
        cap.set(cv2.CAP_PROP_POS_MSEC, (frame_idx / fps) * 1000.0)
        ret, frame = cap.read()
        if not ret:
            break
        res, _ = ocr(frame)
        sec = frame_idx / fps
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.5]
            line = ' '.join(texts)
            video_matches.append({"sec": round(sec, 2), "text": line})
        frame_idx += interval
        
    cap.release()
    print(f"Found {len(video_matches)} frames with text")
    all_results[s_id] = {
        "author": author,
        "title": title,
        "duration": duration,
        "poi": it['poi_info'],
        "frames": video_matches
    }

out_path = os.path.join(worktree_root, "output", "research", "hangzhou", "batch11_ocr_summary.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"Saved OCR summary to {out_path}")
