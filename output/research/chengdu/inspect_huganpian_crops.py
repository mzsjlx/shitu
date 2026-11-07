import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
frames_dir = Path('output/research/chengdu/huganpian_analysis')

def inspect_img(idx):
    img = cv2.imread(str(frames_dir / f"f_{idx:04d}.jpg"))
    if img is None:
        return
    h, w, _ = img.shape
    # Check full and crops
    res_full, _ = engine(img)
    print(f"\n--- Frame {idx} ({w}x{h}) ---")
    if res_full:
        for r in res_full:
            print("  full:", r[1])

for idx in [17, 18, 19, 24, 25, 41, 42, 90, 91, 92, 126, 127, 152, 153, 154, 155]:
    inspect_img(idx)
