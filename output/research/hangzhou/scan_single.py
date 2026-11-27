import cv2, json, os, time
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()
v_path = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base\.local\video-intake\hz-xuetumudeduo-7710663227746651392\source.mp4")
cap = cv2.VideoCapture(str(v_path))
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"Duration: {duration:.1f}s, total_frames: {total_frames}")

ocr_records = []
step_sec = 2.0
curr_sec = 0.0

while curr_sec < duration:
    frame_idx = int(curr_sec * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if not ret:
        break
    result, _ = ocr(frame)
    if result:
        texts = [line[1] for line in result if float(line[2]) > 0.6]
        if texts:
            ocr_records.append({"sec": round(curr_sec, 1), "texts": texts})
    curr_sec += step_sec

cap.release()

out_txt = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\hz-xuetumudeduo-7710663227746651392_ocr.txt")
with open(out_txt, "w", encoding="utf-8") as f:
    for r in ocr_records:
        sec = r["sec"]
        line = " | ".join(r["texts"])
        f.write(f"[{sec}s] {line}\n")
print(f"Done! Saved {len(ocr_records)} frames to {out_txt}")
