import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
img = cv2.imread('output/research/chengdu/frames_wen/frame_28s.jpg')
# Let's crop the top part of the phone
# In 1080x1920 video or whatever resolution it is:
h, w, _ = img.shape
print("Image shape:", w, h)

# Phone is held in hand in upper-right or middle.
# Let's crop several bounding boxes and run OCR
crops = [
    ("phone_full", img[0:int(h*0.6), int(w*0.4):w]),
    ("phone_top", img[0:int(h*0.35), int(w*0.5):w]),
]

with open('output/research/chengdu/wen_phone_crop_ocr.txt', 'w', encoding='utf-8') as f:
    for name, c in crops:
        cv2.imwrite(f'output/research/chengdu/frames_wen/{name}.jpg', c)
        res, _ = ocr(c)
        f.write(f"\n--- {name} ---\n")
        if res:
            for item in res:
                f.write(f"{item[1]} | {item[0]}\n")
