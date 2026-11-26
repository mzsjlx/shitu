import os
import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

d = "output/research/chengdu/danniushi_key_shops"
for f in sorted(os.listdir(d)):
    if f.endswith(".jpg"):
        p = os.path.join(d, f)
        res, _ = ocr(p)
        lines = [r[1] for r in res] if res else []
        print(f"=== {f} ===")
        print("  " + " | ".join(lines))
