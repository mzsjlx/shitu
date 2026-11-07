import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
frames_dir = Path('output/research/chengdu/renyi_shancheng_analysis')

# Check first 30 frames
for i in range(1, 35):
    fname = f"f_{i:04d}.jpg"
    fpath = frames_dir / fname
    if not fpath.exists():
        continue
    img = cv2.imread(str(fpath))
    res, _ = engine(img)
    if res:
        texts = [r[1] for r in res]
        print(f"{fname}: {texts}")
