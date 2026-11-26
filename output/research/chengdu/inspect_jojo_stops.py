import cv2, sys
from rapidocr_onnxruntime import RapidOCR
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-jojomishi-7704936890641747227/source.mp4')

print("--- JoJo Stop 1 (40s-120s) ---")
for s in [45, 60, 75, 90, 105, 120]:
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, f = cap.read()
    if not ret: continue
    res, _ = ocr(f)
    print(f'[{s}s]:', ' | '.join([r[1] for r in res]) if res else 'None')

print("\n--- JoJo Stop 2 (200s-300s) ---")
for s in [200, 220, 240, 260, 280]:
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, f = cap.read()
    if not ret: continue
    res, _ = ocr(f)
    print(f'[{s}s]:', ' | '.join([r[1] for r in res]) if res else 'None')

print("\n--- JoJo Stop 3 (380s-500s) ---")
for s in [380, 400, 420, 440, 460]:
    cap.set(cv2.CAP_PROP_POS_MSEC, s * 1000)
    ret, f = cap.read()
    if not ret: continue
    res, _ = ocr(f)
    print(f'[{s}s]:', ' | '.join([r[1] for r in res]) if res else 'None')

cap.release()
