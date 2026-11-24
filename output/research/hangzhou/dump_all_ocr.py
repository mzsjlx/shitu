import json
from pathlib import Path

data = json.load(open(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch5_ocr.json", encoding="utf-8"))

for vid in ["hz-yangsang-7653525512216707913", "hz-niuniu-7646324850500266737", "hz-jieou-7641070065438731368", "hz-jiding-7709105067328419515"]:
    info = data[vid]
    out_lines = [f"=== {vid} (Duration: {info['duration']:.1f}s) ==="]
    for t in info["timeline"]:
        out_lines.append(f"{t['sec']:>6.1f}s: {t['text']}")
    txt_path = Path(rf"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\{vid}_ocr.txt")
    txt_path.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"Wrote {txt_path.name} ({len(out_lines)} lines)")
