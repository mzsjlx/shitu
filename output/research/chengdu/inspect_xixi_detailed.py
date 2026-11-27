import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
frames_dir = Path('output/research/chengdu/xixichibupang_analysis')

for i in range(22):
    fpath = frames_dir / f"f_{i:04d}.jpg"
    if not fpath.exists():
        continue
    img = cv2.imread(str(fpath))
    # Top 30%, Middle, Bottom 30%
    h, w, _ = img.shape
    top = img[0:int(h*0.35), :]
    mid = img[int(h*0.3):int(h*0.7), :]
    bot = img[int(h*0.65):, :]
    
    r_top, _ = engine(top)
    r_mid, _ = engine(mid)
    r_bot, _ = engine(bot)
    
    texts = []
    if r_top: texts.extend([f"top:{t[1]}" for t in r_top])
    if r_mid: texts.extend([f"mid:{t[1]}" for t in r_mid])
    if r_bot: texts.extend([f"bot:{t[1]}" for t in r_bot])
    if texts:
        print(f"Sec {i}: {', '.join(texts)}")
