import cv2
import sys
from rapidocr_onnxruntime import RapidOCR
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-daomindabai-7703823334010051003/source.mp4')
for s in [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120, 130, 140, 160, 180, 200, 240, 280, 310]:
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, frame = cap.read()
    if not ret: continue
    res, _ = ocr(frame)
    if res:
        txts = [r[1] for r in res if float(r[2]) > 0.55 and len(r[1]) > 1 and not r[1].isdigit()]
        for t in txts:
            if any(k in t for k in ['火锅', '老', '肚', '肉', '街', '巷', '堂', '记', '庄', '坪', '里']):
                print(f"[{s:3d}s]: {' | '.join(txts[:6])}", flush=True)
                break
cap.release()
