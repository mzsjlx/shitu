import cv2
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
intake = Path(r"D:\Antigravity\地图\map-base\.local\video-intake\hz-jiding-7709105067328419515.mp4")
out_dir = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\inspect_jiding")
out_dir.mkdir(parents=True, exist_ok=True)

cap = cv2.VideoCapture(str(intake))
fps = cap.get(cv2.CAP_PROP_FPS)

for sec in range(0, 60, 1):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(sec * fps))
    ret, frame = cap.read()
    if not ret: break
    res, _ = ocr(frame)
    if res:
        texts = [r[1] for r in res if float(r[2]) > 0.5]
        joined = " | ".join(texts)
        if any(k in joined for k in ["煮", "关东", "CHICKEN", "ODEN", "鸟", "鸡", "店", "慢"]):
            print(f"{sec:>2}s: {joined}")
            cv2.imwrite(str(out_dir / f"frame_{sec:03d}.jpg"), frame)

cap.release()
