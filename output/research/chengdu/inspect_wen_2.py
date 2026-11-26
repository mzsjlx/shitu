import os, cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

with open('output/research/chengdu/wen_45_120.txt', 'w', encoding='utf-8') as f:
    for s in range(44, 120, 2):
        frame_idx = int(s * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            res, _ = ocr(frame)
            if res:
                texts = [r[1] for r in res]
                f.write(f"[{s:03d}s]: {' | '.join(texts)}\n")

cap.release()
