import json, hashlib
from pathlib import Path

worktree = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
intake_dir = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
vlib_path = worktree / "data/cities/hangzhou/video-library.json"

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))

for s in vlib["sources"]:
    if "sourceSHA256" not in s or not s["sourceSHA256"]:
        mp4_path = intake_dir / f"{s['id']}.mp4"
        if mp4_path.exists():
            h = hashlib.sha256(mp4_path.read_bytes()).hexdigest()
            s["sourceSHA256"] = h
            print(f"Set sha256 for {s['id']}: {h}")
        else:
            print(f"MISSING MP4: {mp4_path}")

vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print("Done updating sourceSHA256!")
