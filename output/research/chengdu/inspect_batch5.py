import os
import json
import sys
import time
from pathlib import Path
import cv2
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ocr = RapidOCR()
INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')
OUT_DIR = Path(r'output/research/chengdu/batch5_inspection')
OUT_DIR.mkdir(parents=True, exist_ok=True)

batch5_sources = [
    ("岛民大白", "daomindabai", "7703823334010051003"),
    ("小紧张的虫虫", "xiaojinzhangdechongchong", "7498312599780560147"),
    ("特别乌啦啦", "wulala", "7560927991686008098"),
    ("JoJo觅食", "jojomishi", "7704936890641747227"),
    ("是 Simon 啊", "shisimon", "7641414725993719515"),
    ("贺千万。", "heqianwan", "7616015531045363578"),
    ("霹雳干饭记", "piliganfanji", "7700130613965155529"),
    ("马伯骞", "maboqian", "7628555606619063478"),
    ("小解", "xiaojie", "7614776037532110143")
]

results = []

for author, slug, aweme_id in batch5_sources:
    source_id = f"cd-{slug}-{aweme_id}"
    mp4_path = INTAKE_BASE / source_id / 'source.mp4'
    detail_path = DETAILS_BASE / f"{source_id}.json"
    
    if not mp4_path.exists():
        print(f"Skipping {source_id}: source.mp4 not found yet.")
        continue
        
    detail = {}
    if detail_path.exists():
        try:
            with open(detail_path, 'r', encoding='utf-8') as f:
                detail = json.load(f)
        except Exception:
            pass
            
    desc = detail.get('desc', '')
    poi_info = detail.get('poi_info') or {}
    poi_name = poi_info.get('poi_name', '')
    poi_addr = poi_info.get('address_info', {}).get('address', '')
    poi_lng = poi_info.get('poi_longitude')
    poi_lat = poi_info.get('poi_latitude')
    
    cap = cv2.VideoCapture(str(mp4_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    
    print(f"\n==========================================")
    print(f"Inspecting {author} [{source_id}] (Duration: {duration:.1f}s)")
    print(f"Desc: {desc[:60]}")
    if poi_name:
        print(f"POI: {poi_name} | {poi_addr} | [{poi_lng}, {poi_lat}]")
        
    # Sample every 5 seconds for short videos, or every 8-10 seconds for long videos
    step = 5.0 if duration < 180 else (8.0 if duration < 360 else 12.0)
    curr_s = 1.0
    detected_frames = []
    
    while curr_s < duration - 1.0:
        cap.set(cv2.CAP_PROP_POS_MSEC, curr_s * 1000)
        ret, frame = cap.read()
        if not ret:
            curr_s += step
            continue
            
        res, _ = ocr(frame)
        if res:
            texts = [r[1] for r in res if float(r[2]) > 0.55]
            if texts:
                # Keep significant texts
                line_summary = " | ".join(texts)
                detected_frames.append({
                    "second": round(curr_s, 1),
                    "texts": texts
                })
                # If frame contains potential keywords
                keywords = ["店", "馆", "面", "粉", "火锅", "冒菜", "蹄花", "肥肠", "烤", "串", "街", "路", "巷", "号", "地址", "元", "自选"]
                has_kw = any(k in line_summary for k in keywords)
                if has_kw and len(texts) > 1:
                    print(f"  [{curr_s:.1f}s]: {line_summary[:80]}")
                    
        curr_s += step
        
    cap.release()
    
    results.append({
        "source_id": source_id,
        "author": author,
        "slug": slug,
        "aweme_id": aweme_id,
        "desc": desc,
        "duration": duration,
        "poi_info": {
            "name": poi_name,
            "address": poi_addr,
            "longitude": poi_lng,
            "latitude": poi_lat
        },
        "detected_frames": detected_frames
    })

out_file = OUT_DIR / "summary_batch5.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nSaved batch 5 inspection results to {out_file}")
