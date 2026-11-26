import subprocess, json
from pathlib import Path

video_path = Path(r"D:\Antigravity\地图\map-base\.local\video-intake\hz-shiyideliangsan-7670185446282245307\source.mp4")
out_frames_dir = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\frames_shiyi")
out_frames_dir.mkdir(parents=True, exist_ok=True)

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

# Extract 1 frame every 3 seconds
cmd = [
    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
    "-i", str(video_path),
    "-vf", "fps=1/3,scale=720:-1",
    str(out_frames_dir / "frame_%03d.jpg")
]
subprocess.run(cmd, check=True)
frames = list(out_frames_dir.glob("*.jpg"))
print(f"Extracted {len(frames)} frames to {out_frames_dir}")
