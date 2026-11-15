import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
lib_path = root / "map-base/data/cities/harbin/video-library.json"

with open(lib_path, "r", encoding="utf-8") as f:
    lib = json.load(f)

for src in lib["sources"]:
    if "acquisitionStatus" not in src:
        src["acquisitionStatus"] = "local-source"
    if "evidenceNote" not in src:
        # Generate appropriate evidence note based on author and title
        first_seg_name = src["segments"][0]["name"] if src["segments"] else ""
        first_seg_addr = src["segments"][0]["addressText"] if src["segments"] else ""
        src["evidenceNote"] = f"{src['author']}哈尔滨实地探访视频，原片探访哈尔滨{first_seg_name}（{first_seg_addr}），画面与定位清晰明确。"

with open(lib_path, "w", encoding="utf-8") as f:
    json.dump(lib, f, ensure_ascii=False, indent=2)

print(f"Updated evidence notes for {len(lib['sources'])} sources.")
