import cv2
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
img = cv2.imread('output/research/chengdu/frames_wen/frame_28s.jpg')
h, w, _ = img.shape

# Let's crop the phone screen tightly. Where is the phone?
# In frame_28s, let's find where the phone is located.
# Coordinates from previous OCR:
# "692元": [1675, 41]
# "158元单人餐": [1488, 132]
# So the phone is roughly between x: 1200..1800, y: 0..600!
phone = img[0:700, 1200:1920]
cv2.imwrite('output/research/chengdu/frames_wen/phone_zoom.jpg', phone)

# Let's upscale phone 2x and contrast enhance
phone_2x = cv2.resize(phone, (0,0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
cv2.imwrite('output/research/chengdu/frames_wen/phone_zoom_2x.jpg', phone_2x)

res, _ = ocr(phone_2x)
with open('output/research/chengdu/wen_phone_zoom_ocr.txt', 'w', encoding='utf-8') as f:
    if res:
        for item in res:
            f.write(f"{item[1]} | {item[0]}\n")
