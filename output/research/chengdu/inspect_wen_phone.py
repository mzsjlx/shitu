import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
img = cv2.imread('output/research/chengdu/frames_wen/frame_28s.jpg')
h, w, _ = img.shape

# Let's crop the center / phone area
# Also crop frame 21s, 22s, 42s, 43s
with open('output/research/chengdu/wen_phone_ocr.txt', 'w', encoding='utf-8') as f:
    for s in [21, 22, 23, 24, 27, 28, 29, 30, 41, 42, 43, 44, 45]:
        p = f'output/research/chengdu/frames_wen/frame_{s:02d}s.jpg'
        im = cv2.imread(p)
        if im is None: continue
        res, _ = ocr(im)
        f.write(f"=== Frame {s}s ===\n")
        if res:
            for item in res:
                text = item[1]
                f.write(f"  {text} | {item[0]}\n")
