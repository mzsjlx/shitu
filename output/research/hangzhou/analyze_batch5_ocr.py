import json

data = json.load(open(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch5_ocr.json", encoding="utf-8"))

for vid, info in data.items():
    print("=" * 60)
    dur = info["duration"]
    print(f"VIDEO: {vid} (Duration: {dur:.1f}s)")
    timeline = info["timeline"]
    for t in timeline:
        txt = t["text"]
        sec = t["sec"]
        print(f"  [{sec:>6.1f}s] {txt}")
