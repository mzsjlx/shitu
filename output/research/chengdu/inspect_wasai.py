from rapidocr_onnxruntime import RapidOCR
from pathlib import Path

ocr = RapidOCR()
frames_dir = Path('output/research/chengdu/cd-wasaijizhang-7622980347575192832_frames')

# Inspect around 35s - 45s (breakfast shop name), 160s - 180s (lunch shop name), 305s - 325s (dinner shop name)
check_frames = [
    (14, 17, "Breakfast shop name"),
    (65, 75, "Lunch shop name"),
    (123, 130, "Dinner shop name")
]

lines = []
for start_idx, end_idx, label in check_frames:
    lines.append(f"\n=== {label} (frames {start_idx} to {end_idx}) ===")
    for i in range(start_idx, end_idx + 1):
        f = frames_dir / f"frame_{i:04d}.jpg"
        if not f.exists():
            continue
        res, _ = ocr(str(f))
        if res:
            txts = [r[1] for r in res]
            lines.append(f"[{i*2.5:5.1f}s, frame_{i:04d}] " + " | ".join(txts))

with open('output/research/chengdu/inspect_wasai_shops.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print("Wrote inspect_wasai_shops.txt")
