import shutil, json
from pathlib import Path

src_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base")
dst_root = Path(r"D:\Antigravity\地图\map-base")

src_dist = src_root / "dist"
dst_dist = dst_root / "dist"

# 1. Copy data/cities/hangzhou
src_hz_data = src_dist / "data/cities/hangzhou"
dst_hz_data = dst_dist / "data/cities/hangzhou"
if src_hz_data.exists():
    shutil.copytree(src_hz_data, dst_hz_data, dirs_exist_ok=True)
    print("Copied dist/data/cities/hangzhou")

# 2. Copy preview-hangzhou.html
for f in ["preview-hangzhou.html", "preview.html"]:
    sf = src_dist / f
    df = dst_dist / f
    if sf.exists() and f == "preview-hangzhou.html":
        shutil.copy2(sf, df)
        print(f"Copied {f}")

# 3. Copy app.js, app.css, index.html if needed
for f in ["index.html"]:
    shutil.copy2(src_dist / f, dst_dist / f)

# 4. Copy posters for hangzhou
src_posters = src_dist / "assets/video-posters"
dst_posters = dst_dist / "assets/video-posters"
if src_posters.exists():
    for p in src_posters.glob("hz-*"):
        dp = dst_posters / p.name
        if p.is_dir():
            shutil.copytree(p, dp, dirs_exist_ok=True)
            print(f"Copied poster dir {p.name}")

# 5. Copy video clips for hangzhou
src_videos = src_dist / "media/videos"
dst_videos = dst_dist / "media/videos"
dst_videos.mkdir(parents=True, exist_ok=True)
if src_videos.exists():
    for v in src_videos.glob("hz-*.mp4"):
        shutil.copy2(v, dst_videos / v.name)
    print("Copied hangzhou video clips")

# 6. Merge config/cities.json
src_cfg = json.loads((src_dist / "config/cities.json").read_text(encoding="utf-8"))
dst_cfg_file = dst_dist / "config/cities.json"
if dst_cfg_file.exists():
    dst_cfg = json.loads(dst_cfg_file.read_text(encoding="utf-8"))
    if "hangzhou" in src_cfg.get("cities", {}):
        dst_cfg.setdefault("cities", {})["hangzhou"] = src_cfg["cities"]["hangzhou"]
        dst_cfg_file.write_text(json.dumps(dst_cfg, ensure_ascii=False, indent=2), encoding="utf-8")
        print("Merged hangzhou into dst config/cities.json")

# 7. Merge video-library-assets.json
src_assets = json.loads((src_dist / "data/video-library-assets.json").read_text(encoding="utf-8"))
dst_assets_file = dst_dist / "data/video-library-assets.json"
if dst_assets_file.exists():
    dst_assets = json.loads(dst_assets_file.read_text(encoding="utf-8"))
    for k, v in src_assets.get("segments", {}).items():
        if k.startswith("hz-"):
            dst_assets.setdefault("segments", {})[k] = v
    dst_assets_file.write_text(json.dumps(dst_assets, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Merged hangzhou segments into dst data/video-library-assets.json")

print("All synced successfully to root map-base/dist!")
