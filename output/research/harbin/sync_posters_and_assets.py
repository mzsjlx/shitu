import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[3]
clips_base = root / "map-base/.local/video-clips"
assets_posters_base = root / "map-base/assets/video-posters"
report_path = clips_base / "report.json"
rep = json.load(open(report_path, encoding="utf-8"))

posters_hb_path = root / "map-base/data/cities/harbin/video-posters.json"
posters_hb = json.load(open(posters_hb_path, encoding="utf-8"))

posters_global_path = root / "map-base/data/video-posters.json"
posters_global = json.load(open(posters_global_path, encoding="utf-8"))

assets_hb_path = root / "map-base/data/cities/harbin/video-library-assets.json"
assets_hb = json.load(open(assets_hb_path, encoding="utf-8"))

harbin_records = [r for r in rep["records"] if r["sourceId"].startswith("hb-")]
print(f"Syncing {len(harbin_records)} Harbin records...")

for r in harbin_records:
    sid = r["sourceId"]
    seg_id = r["id"]
    m_key = r["mediaKey"]
    poster_name = r["poster"]
    
    src_poster = clips_base / sid / poster_name
    dest_dir = assets_posters_base / sid
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_poster = dest_dir / poster_name
    
    if src_poster.exists():
        shutil.copyfile(src_poster, dest_poster)
        
    rel_poster_path = f"assets/video-posters/{sid}/{poster_name}"
    
    # 1. Update video-posters.json
    p_entry = {
        "sourceId": sid,
        "sourceSHA256": r["sourceSHA256"],
        "mediaKey": m_key,
        "path": rel_poster_path,
        "sha256": r["posterSHA256"],
        "bytes": r["posterBytes"]
    }
    posters_hb["segments"][seg_id] = p_entry
    posters_global["segments"][seg_id] = p_entry
    
    # 2. Update video-library-assets.json
    if "segments" not in assets_hb:
        assets_hb["segments"] = {}
    assets_hb["segments"][seg_id] = {
        "clip": f"./media/videos/{sid}/{r['clip']}",
        "poster": f"./media/videos/{sid}/{poster_name}",
        "durationSeconds": round(r["end"] - r["start"], 1)
    }

# Clean stray top-level segment keys
for k in list(assets_hb.keys()):
    if k.startswith("hb-"):
        del assets_hb[k]

# Save updated json files
with open(posters_hb_path, "w", encoding="utf-8") as f:
    json.dump(posters_hb, f, ensure_ascii=False, indent=2)

with open(posters_global_path, "w", encoding="utf-8") as f:
    json.dump(posters_global, f, ensure_ascii=False, indent=2)

with open(assets_hb_path, "w", encoding="utf-8") as f:
    json.dump(assets_hb, f, ensure_ascii=False, indent=2)

print(f"Posters and assets synced successfully: {len(posters_hb['segments'])} in posters_hb, {len(assets_hb)} in assets_hb.")
