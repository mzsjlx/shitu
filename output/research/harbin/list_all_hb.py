import json
from pathlib import Path

intake = Path("map-base/.local/video-intake")
b2_items = {it.get("sourceId"): it for it in json.load(open("output/research/harbin/batch2_resolved.json", encoding="utf-8"))}

for d in sorted(intake.iterdir()):
    if not d.is_dir() or not d.name.startswith("hb-"):
        continue
    info = b2_items.get(d.name, {})
    mp4 = d / "source.mp4"
    if mp4.exists():
        sz_mb = mp4.stat().st_size / (1024*1024)
        author = info.get("author") or "未知"
        title = (info.get("title") or "")[:35]
        print(f"{d.name} ({sz_mb:.1f}MB): [{author}] {title}")
