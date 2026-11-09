import cv2
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
cap = cv2.VideoCapture('map-base/.local/video-intake/cd-airousi-7692002207759109426/source.mp4')
fps = cap.get(cv2.CAP_PROP_FPS)

with open('output/research/chengdu/airousi_text_utf8.txt', 'w', encoding='utf-8') as out:
    for sec in [18, 20, 22, 24, 25, 26, 28, 30]:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(sec * fps))
        ret, frame = cap.read()
        if ret:
            res, _ = engine(frame)
            lines = [r[1] for r in res] if res else []
            out.write(f'{sec}s: {lines}\n')
cap.release()
