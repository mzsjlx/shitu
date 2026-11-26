import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
for s in [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]:
    p = f'output/research/chengdu/frames_wen/frame_{s:02d}s.jpg'
    img = cv2.imread(p)
    if img is None:
        continue
    h, w, _ = img.shape
    # Crop different areas if needed, or run OCR on whole image
    res, _ = ocr(img)
    print(f"\n--- Frame {s}s ---")
    if res:
        for b, t, s_score in res:
            print(f"  {t}")
