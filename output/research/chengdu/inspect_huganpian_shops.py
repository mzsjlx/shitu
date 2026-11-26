import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
frames_dir = Path('output/research/chengdu/huganpian_analysis')

def check_range(start_sec, end_sec, label):
    print(f"\n=== Checking {label} ({start_sec}s - {end_sec}s) ===")
    for sec in range(start_sec, end_sec + 1):
        fpath = frames_dir / f"f_{sec:04d}.jpg"
        if not fpath.exists():
            continue
        img = cv2.imread(str(fpath))
        res, _ = engine(img)
        if res:
            texts = [r[1] for r in res]
            print(f"{sec}s: {texts}")

check_range(10, 25, "Shop 1 Tihua")
check_range(88, 98, "Shop 2 Maokaoya")
check_range(148, 160, "Shop 3 Night Market")
