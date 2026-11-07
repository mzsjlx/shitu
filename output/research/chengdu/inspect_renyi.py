import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-renyi-7606583802420317455/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

with open('output/research/chengdu/renyi_all_shops.txt', 'w', encoding='utf-8') as f:
    for s in range(10, 134, 1):
        frame_idx = int(s * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            res, _ = ocr(frame)
            if res:
                texts = [r[1] for r in res]
                f.write(f"[{s:03d}s]: {' | '.join(texts)}\n")

cap.release()
