import cv2
import json
import sys
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()

def scan_range(sid, start_s, end_s, step_s=3):
    cap = cv2.VideoCapture(f'map-base/.local/video-intake/{sid}/source.mp4')
    for s in range(start_s, end_s, step_s):
        cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
        ret, frame = cap.read()
        if not ret: break
        res, _ = ocr(frame)
        if res:
            txts = [r[1] for r in res if float(r[2]) > 0.6 and len(r[1]) > 1 and not r[1].isdigit()]
            line = ' | '.join(txts)
            for kw in ['火锅', '冒菜', '店', '堂', '记', '庄', '路', '街', '巷', '号', '老', '肥肠', '排队']:
                if kw in line:
                    print(f"[{s:3d}s]: {line[:90]}", flush=True)
                    break
    cap.release()

print("--- daomindabai ---", flush=True)
scan_range('cd-daomindabai-7703823334010051003', 15, 90, 2)

print("\n--- xiaojinzhangdechongchong ---", flush=True)
scan_range('cd-xiaojinzhangdechongchong-7498312599780560147', 15, 90, 2)
