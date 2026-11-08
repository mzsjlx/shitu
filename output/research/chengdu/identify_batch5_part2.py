import cv2
import json
import sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()

def inspect_video(sid, author, seconds=[3, 6, 10, 15, 20, 30, 45, 60]):
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

inspect_video('cd-jojomishi-7704936890641747227', 'JoJo觅食', [3, 8, 15, 30, 60, 90, 150, 250, 350, 450, 550])
inspect_video('cd-shisimon-7641414725993719515', '是 Simon 啊', [2, 5, 8, 12, 16])
inspect_video('cd-heqianwan-7616015531045363578', '贺千万。', [2, 5, 8, 11, 14])
inspect_video('cd-piliganfanji-7700130613965155529', '霹雳干饭记', [3, 8, 15, 30, 50, 80, 110, 140, 170])
inspect_video('cd-maboqian-7628555606619063478', '马伯骞', [3, 10, 25, 45, 70, 100, 150, 200, 250, 300])
inspect_video('cd-xiaojie-7614776037532110143', '小解', [3, 8, 20, 40, 70, 100, 130, 160, 190, 220])
