import cv2
import json
import sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()

def inspect_video(sid, author, seconds=[3, 6, 10, 15, 20, 30, 45]):
    mp4_path = Path(f'map-base/.local/video-intake/{sid}/source.mp4')
    if not mp4_path.exists():
        print(f"[{sid}] MP4 not found", flush=True)
        return
    cap = cv2.VideoCapture(str(mp4_path))
    dur = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) / (cap.get(cv2.CAP_PROP_FPS) or 30.0)
    print(f"\n=== {author} ({sid}) [Duration: {dur:.1f}s] ===", flush=True)
    
    for s in seconds:
        if s >= dur: break
        cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
        ret, frame = cap.read()
        if not ret: continue
        res, _ = ocr(frame)
        if res:
            txts = [r[1] for r in res if float(r[2]) > 0.55 and len(r[1]) > 1 and not r[1].isdigit()]
            print(f"  [{s:2d}s]: {' | '.join(txts[:8])}", flush=True)
    cap.release()

inspect_video('cd-daomindabai-7703823334010051003', '岛民大白', [2, 5, 8, 12, 16, 20, 25, 30, 45, 60])
inspect_video('cd-xiaojinzhangdechongchong-7498312599780560147', '小紧张的虫虫', [2, 5, 8, 12, 16, 20, 25, 30, 45, 60])
inspect_video('cd-wulala-7560927991686008098', '特别乌啦啦', [2, 5, 8, 12, 16, 20, 25, 30, 45, 60])
