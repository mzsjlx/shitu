import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
intake = Path(r"D:\Antigravity\地图\map-base\.local\video-intake\hz-yangsang-7653525512216707913.mp4")
cap = cv2.VideoCapture(str(intake))
fps = cap.get(cv2.CAP_PROP_FPS)

for sec in range(70, 160, 2):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(sec * fps))
    ret, frame = cap.read()
    if not ret:
        break
    res, _ = ocr(frame)
    if res:
        texts = [r[1] for r in res if float(r[2]) > 0.5]
        joined = " | ".join(texts)
        print(f"{sec:>3}s: {joined}")

cap.release()
