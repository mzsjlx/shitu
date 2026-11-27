import shutil
from pathlib import Path

dirs = [
    Path(r"D:\Antigravity\地图\map-base\.local\video-intake"),
    Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\map-base\.local\video-intake")
]

batch5_ids = [
    "hz-yangsang-7653525512216707913",
    "hz-niuniu-7646324850500266737",
    "hz-jieou-7641070065438731368",
    "hz-jiding-7709105067328419515"
]

for d in dirs:
    if not d.exists(): continue
    for sid in batch5_ids:
        single_mp4 = d / f"{sid}.mp4"
        sub_dir = d / sid
        sub_dir.mkdir(parents=True, exist_ok=True)
        target = sub_dir / "source.mp4"
        if single_mp4.exists() and not target.exists():
            shutil.copy2(single_mp4, target)
            print(f"Copied {single_mp4.name} -> {target}")
        elif target.exists():
            print(f"Already exists: {target}")

print("Done organizing intake directories!")
