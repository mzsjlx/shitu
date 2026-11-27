import os
import cv2
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR()

for f in sorted(os.listdir('output/research/chengdu/details_frames')):
    if f.startswith('airousi_'):
        p = os.path.join('output/research/chengdu/details_frames', f)
        res, _ = ocr(p)
        print(f, [r[1] for r in res] if res else [])
