import cv2
import json
import sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()

target_sid = sys.argv[1] if len(sys.argv) > 1 else 'cd-daomindabai-7703823334010051003'
mp4_path = Path(f'map-base/.local/video-intake/{target_sid}/source.mp4')
if not mp4_path.exists():
    print(f"File not found: {mp4_path}")
    sys.exit(1)

cap = cv2.VideoCapture(str(mp4_path))
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
dur = total / fps
print(f"[{target_sid}] Duration: {dur:.1f}s, FPS: {fps}", flush=True)

# Inspect every 2 seconds in the first 45 seconds, plus sampled later
sample_times = [1, 2, 3, 4, 5, 7, 9, 12, 15, 18, 22, 26, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300]
for s in sample_times:
    if s >= dur: break
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, frame = cap.read()
    if not ret: continue
    res, _ = ocr(frame)
    if res:
        txts = [r[1] for r in res if float(r[2]) > 0.55]
        # filter noise
        txts = [t for t in txts if len(t) > 1 and not t.isdigit()]
        if txts:
            print(f"  [{s:3d}s]: {' | '.join(txts[:8])}", flush=True)

cap.release()
