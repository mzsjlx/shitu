import os
import glob
import sys
import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

d = "output/research/chengdu/frames_renyi1_all"
files = sorted(glob.glob(os.path.join(d, "*.jpg")))

for f in files:
    # crop top banner (y: 0 to 250)
    img = Image.open(f)
    top_crop = np.array(img.crop((0, 0, img.width, int(img.height * 0.35))))
    res, _ = ocr(top_crop)
    lines = [r[1] for r in res] if res else []
    if lines:
        print(f"[{os.path.basename(f)} top]: {' | '.join(lines)}", flush=True)
