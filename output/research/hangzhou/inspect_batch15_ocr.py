import json
from pathlib import Path

ocr_path = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch15_ocr_summary.json")
lib_path = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base\data\cities\hangzhou\video-library.json")

with open(ocr_path, "r", encoding="utf-8") as f:
    d = json.load(f)

with open(lib_path, "r", encoding="utf-8") as f:
    lib = json.load(f)

existing_stores = []
for s in lib["sources"]:
    for seg in s.get("segments", []):
        existing_stores.append((seg["name"], seg.get("coordinates"), seg.get("district", "")))

print(f"Existing stores count: {len(existing_stores)}")
for k, v in d.items():
    print("\n==========================================")
    print(f"ID: {k} | Author: {v['author']} | Title: {v['title']}")
    for m in v["matches"]:
        print(f"  [{m['sec']:5.1f}s] {m['text']}")
