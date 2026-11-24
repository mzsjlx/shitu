import os, sys, json
import cv2
from rapidocr_onnxruntime import RapidOCR

worktree_root = r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep"
intake_dir = os.path.join(worktree_root, "map-base", ".local", "video-intake")
info_path = os.path.join(worktree_root, "output", "research", "hangzhou", "batch7_downloaded.json")

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
    print(f"Title: {title}")
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
    # Sample every 2.5 seconds
    interval = int(fps * 2.5)
    frame_idx = 0
    while frame_idx < total_frames:
        cap.set(cv2.CAP_PROP_POS_MSEC, (frame_idx / fps) * 1000.0)
        ret, frame = cap.read()
        if not ret:
            break
        res, _ = ocr(frame)
        sec = frame_idx / fps
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.6]
            line = ' '.join(texts)
            for keyword in ['面', '店', '馆', '记', '楼', '烤', '肉', '小吃', '炸', '鸡', '饭', '菜', '排骨', '蒸', '西湖', '杭州', '萧山', '山楂', '外婆家', '楼外楼', '知味观']:
                if keyword in line:
                    video_matches.append((sec, line))
                    break
        frame_idx += interval
        
    cap.release()
    print(f"Found {len(video_matches)} OCR matches:")
    for sec, line in video_matches[:25]:
        print(f"  [{sec:5.1f}s] {line[:90]}")
        
    all_results[s_id] = {
        "author": author,
        "title": title,
        "duration": duration,
        "poi": it['poi_info'].get('poi_name', ''),
        "matches": video_matches
    }

out_path = os.path.join(worktree_root, "output", "research", "hangzhou", "batch7_ocr.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\nAll done! Saved OCR summary to {out_path}")
