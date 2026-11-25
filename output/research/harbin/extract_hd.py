import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
source_mp4 = root / "map-base/.local/video-intake/hb-liuyuxin-7464616074248555828/source.mp4"
out_dir = root / "output/research/harbin/frames/liuyuxin_hd"
out_dir.mkdir(parents=True, exist_ok=True)

# Extract frames from 0 to 30 seconds at 2 fps
cmd = [
    ffmpeg_exe, "-hide_banner", "-loglevel", "error", "-y",
    "-ss", "0", "-i", str(source_mp4),
    "-t", "30",
    "-vf", "fps=2",
    str(out_dir / "hd_%03d.jpg")
]
subprocess.run(cmd, check=True)
print("Extracted HD frames from 0-30s.")
