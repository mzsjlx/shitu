from pathlib import Path
from rapidocr_onnxruntime import RapidOCR
import json

frames_dir = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\frames_shiyi")
ocr = RapidOCR()

frames = sorted(frames_dir.glob("frame_*.jpg"))
print(f"Running OCR on {len(frames)} frames...")

results = []
for f in frames:
    idx = int(f.stem.split('_')[1])
    sec = (idx - 1) * 3
    res, _ = ocr(str(f))
    texts = [line[1] for line in res] if res else []
    print(f"[{sec:03d}s] {texts}")
    results.append({'second': sec, 'texts': texts})

out_json = frames_dir.parent / "shiyi_ocr.json"
out_json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf8')
print("Saved to", out_json)
