import sys
import os
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

d = "output/research/chengdu/frames_huoguo_detailed"
for f in sorted(os.listdir(d)):
    if f.startswith("f_09") or f.startswith("f_10"):
        p = os.path.join(d, f)
        res, _ = ocr(p)
        print(f"=== {f} ===")
        if res:
            for r in res:
                print(f"  {r[1]}")
