import os
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR
import cv2

engine = RapidOCR()
frames = sorted(Path('output/research/chengdu/xixichibupang_analysis').glob('*.jpg'))
print(f"Xixichibupang frames count: {len(frames)}")

for f in frames:
    img = cv2.imread(str(f))
    res, _ = engine(img)
    if res:
        print(f"{f.name}:")
        for r in res:
            print("  ", r[1])
