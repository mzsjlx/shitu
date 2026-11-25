import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[3]
intake_dir = root / "map-base/.local/video-intake"
clips_dir = root / "map-base/.local/video-clips"
posters_dir = root / "map-base/assets/video-posters"

id_map = {
    "hb-真探唐仁杰-7293734337541918003": "hb-tangrenjie-7293734337541918003",
    "hb-特厨隋坡重新出发-7532707521379699968": "hb-suipo-7532707521379699968",
    "hb-玲子reiko-7607291212181163300": "hb-lingzi-7607291212181163300",
    "hb-给我囊次一口-7599605004614756837": "hb-nangci-7599605004614756837",
    "hb-刘雨鑫JASON-7460912322115112204": "hb-liuyuxin-7460912322115112204",
    "hb-特别乌啦啦-7585062675730779427": "hb-wulala-7585062675730779427",
    "hb-达哥在上海-7419632775109578025": "hb-dage-7419632775109578025"
}

# 1. Rename directories
for old_id, new_id in id_map.items():
    # intake
    p_in = intake_dir / old_id
    if p_in.exists():
        p_in_new = intake_dir / new_id
        if p_in_new.exists():
            shutil.rmtree(p_in_new)
        p_in.rename(p_in_new)
        
    # clips
    p_cl = clips_dir / old_id
    if p_cl.exists():
        p_cl_new = clips_dir / new_id
        if p_cl_new.exists():
            shutil.rmtree(p_cl_new)
        p_cl.rename(p_cl_new)
        
    # posters
    p_po = posters_dir / old_id
    if p_po.exists():
        p_po_new = posters_dir / new_id
        if p_po_new.exists():
            shutil.rmtree(p_po_new)
        p_po.rename(p_po_new)

# 2. Update video-library.json
vl_path = root / "map-base/data/cities/harbin/video-library.json"
vl = json.load(open(vl_path, encoding="utf-8"))
for s in vl["sources"]:
    if s["id"] in id_map:
        s["id"] = id_map[s["id"]]
with open(vl_path, "w", encoding="utf-8") as f:
    json.dump(vl, f, ensure_ascii=False, indent=2)

# 3. Update report.json
rep_path = root / "map-base/.local/video-clips/report.json"
if rep_path.exists():
    rep = json.load(open(rep_path, encoding="utf-8"))
    for r in rep.get("records", []):
        if r.get("sourceId") in id_map:
            r["sourceId"] = id_map[r["sourceId"]]
            r["mediaKey"] = f"harbin-{r['sourceId']}-{r['id']}"
    with open(rep_path, "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=2)

# 4. Update posters json
for p_path in [root / "map-base/data/cities/harbin/video-posters.json", root / "map-base/data/video-posters.json"]:
    if p_path.exists():
        pj = json.load(open(p_path, encoding="utf-8"))
        for seg_id, item in pj.get("segments", {}).items():
            if item.get("sourceId") in id_map:
                old_sid = item["sourceId"]
                new_sid = id_map[old_sid]
                item["sourceId"] = new_sid
                item["path"] = item["path"].replace(old_sid, new_sid)
        with open(p_path, "w", encoding="utf-8") as f:
            json.dump(pj, f, ensure_ascii=False, indent=2)

# 5. Update assets json
as_path = root / "map-base/data/cities/harbin/video-library-assets.json"
if as_path.exists():
    as_j = json.load(open(as_path, encoding="utf-8"))
    for seg_id, item in as_j.get("segments", {}).items():
        for old_sid, new_sid in id_map.items():
            if old_sid in item["clip"]:
                item["clip"] = item["clip"].replace(old_sid, new_sid)
            if old_sid in item["poster"]:
                item["poster"] = item["poster"].replace(old_sid, new_sid)
    with open(as_path, "w", encoding="utf-8") as f:
        json.dump(as_j, f, ensure_ascii=False, indent=2)

print("ID normalization complete!")
