import sys
from rapidocr_onnxruntime import RapidOCR

sys.stdout.reconfigure(encoding='utf-8')
ocr = RapidOCR()

for f in ['output/research/chengdu/frames_xiaozhen/frame_45s.jpg', 'output/research/chengdu/frames_xiaozhen/frame_60s.jpg', 'output/research/chengdu/frames_xiaozhen/frame_30s.jpg']:
    res, _ = ocr(f)
    print(f"=== {f} ===")
    if res:
        for r in res:
            print(f"  {r[1]} (score: {r[2]:.2f})")
