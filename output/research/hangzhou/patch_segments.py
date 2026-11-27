import json
from pathlib import Path

worktree = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
vlib_path = worktree / "data/cities/hangzhou/video-library.json"

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))

batch5_source_ids = {
    "hz-yangsang-7653525512216707913",
    "hz-niuniu-7646324850500266737",
    "hz-jieou-7641070065438731368",
    "hz-jiding-7709105067328419515"
}

for s in vlib["sources"]:
    if s["id"] in batch5_source_ids:
        for seg in s["segments"]:
            seg["routeEligible"] = False
            seg["coordinateSystem"] = "WGS84"
            seg["locationStatus"] = "approximate"
            if "planningLocation" not in seg:
                seg["planningLocation"] = {
                    "accuracy": "approximate",
                    "label": seg["name"]
                }
            if "addressNote" not in seg:
                seg["addressNote"] = "真实探店实拍，经度纬度吸附杭州开放道路网络。"

vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print("Updated segments with routeEligible: false and standard fields.")
