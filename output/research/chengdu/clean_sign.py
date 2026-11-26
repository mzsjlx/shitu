import cv2, glob
from rapidocr_onnxruntime import RapidOCR
engine = RapidOCR()
with open('output/research/chengdu/sign_clean.txt', 'w', encoding='utf-8') as out:
    for f in sorted(glob.glob('output/research/chengdu/inspect_airousi_sign_*.jpg')):
        img = cv2.imread(f)
        h, w = img.shape[:2]
        top_crop = img[:int(h*0.5), :]
        res, _ = engine(top_crop)
        txts = [r[1] for r in res] if res else []
        out.write(f'{f}: {txts}\n')
