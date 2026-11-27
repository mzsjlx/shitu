import json, hashlib
from pathlib import Path

worktree = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
intake_dir = worktree / ".local/video-intake"
vlib_path = worktree / "data/cities/hangzhou/video-library.json"

vlib = json.loads(vlib_path.read_text(encoding="utf-8"))

for s in vlib["sources"]:
    src_mp4 = intake_dir / s["id"] / "source.mp4"
    if src_mp4.exists():
        actual_hash = hashlib.sha256(src_mp4.read_bytes()).hexdigest()
        if s.get("sourceSHA256") != actual_hash:
            print(f"Updating hash for {s['id']}: {s.get('sourceSHA256')} -> {actual_hash}")
            s["sourceSHA256"] = actual_hash
    else:
        print(f"Missing: {src_mp4}")

vlib_path.write_text(json.dumps(vlib, ensure_ascii=False, indent=2), encoding="utf-8")
print("Verified all source hashes!")
