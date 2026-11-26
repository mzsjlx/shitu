import subprocess, json
from pathlib import Path

ffmpeg = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
root = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
downloaded = json.loads(Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch1_downloaded.json").read_text(encoding="utf8"))

corrupt_list = []
for item in downloaded:
    sid = item["source_id"]
    vid = root / sid / "source.mp4"
    if not vid.exists():
        print(f"{sid}: MISSING")
        corrupt_list.append(sid)
        continue
    sz = vid.stat().st_size
    dur = item["duration_seconds"]
    # seek near end to test completeness
    p = subprocess.run(
        [ffmpeg, "-v", "error", "-ss", str(max(0, dur - 4)), "-i", str(vid), "-frames:v", "1", "-f", "null", "-"],
        stderr=subprocess.PIPE, text=True
    )
    is_ok = ("partial file" not in p.stderr) and ("Invalid NAL unit" not in p.stderr) and ("Decoding error" not in p.stderr)
    status_str = "OK" if is_ok else "TRUNCATED"
    print(f"{sid:40s} | {dur:6.1f}s | {sz:10d} bytes | {status_str}")
    if not is_ok:
        corrupt_list.append(sid)

print(f"\nTotal checked: {len(downloaded)}, corrupt/truncated: {len(corrupt_list)}")
print("Corrupt list:", corrupt_list)
