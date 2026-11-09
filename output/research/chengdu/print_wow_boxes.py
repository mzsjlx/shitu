import sys
import glob
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

for f in sorted(glob.glob('output/research/chengdu/frames_wow_detailed/*.jpg')):
    res, _ = ocr(f)
    print(f"\n--- {f} ---")
    if res:
        for r in res:
            # print text and bounding box
            print(f"  {r[1]} @ {r[0]}")
