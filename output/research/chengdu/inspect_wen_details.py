import cv2, os
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-wenyoulala-7528381853955411210/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

# Let's inspect tableware, napkins, menu cover, elevator, or end of video (800s to 865s)
times_to_check = [40, 41, 42, 43, 44, 45, 46, 50, 60, 70, 80, 100, 150, 200, 300, 400, 500, 600, 700, 800, 820, 840, 850, 860]

with open('output/research/chengdu/wen_details_check.txt', 'w', encoding='utf-8') as f:
    for s in times_to_check:
        frame_idx = int(s * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            res, _ = ocr(frame)
            if res:
                texts = [r[1] for r in res]
                f.write(f"[{s:03d}s]: {' | '.join(texts)}\n")

cap.release()
