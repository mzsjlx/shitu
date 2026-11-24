import subprocess, json
from pathlib import Path

ffmpeg_exe = r"D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
worktree_root = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep")
map_base = worktree_root / "map-base"
intake_dir = Path(r"D:\Antigravity\地图\map-base\.local\video-intake")
dist_media = map_base / "dist/media/videos"
dist_media.mkdir(parents=True, exist_ok=True)
data_posters_dir = map_base / "data/cities/hangzhou/posters"
data_posters_dir.mkdir(parents=True, exist_ok=True)
dist_posters_dir = map_base / "dist/data/cities/hangzhou/posters"
dist_posters_dir.mkdir(parents=True, exist_ok=True)

new_clips = [
    {
        "source_id": "hz-guotao-7710122962640301242",
        "segment_id": "hz-guotao-xiaobai-canguan",
        "start": 28,
        "end": 68,
        "poster_sec": 45,
        "sub_id": "hz-guotao-xiaobai"
    },
    {
        "source_id": "hz-yikoutianlajiao-7624473783088435313",
        "segment_id": "hz-yikou-wushan-kaoqin",
        "start": 14,
        "end": 26,
        "poster_sec": 20,
        "sub_id": "hz-yikou-wushan"
    },
    {
        "source_id": "hz-yikoutianlajiao-7624473783088435313",
        "segment_id": "hz-yikou-wumingshi-mianguan",
        "start": 89,
        "end": 101,
        "poster_sec": 95,
        "sub_id": "hz-yikou-wumingshi"
    },
    {
        "source_id": "hz-yikoutianlajiao-7624473783088435313",
        "segment_id": "hz-yikou-nanfang-dabao",
        "start": 26,
        "end": 39,
        "poster_sec": 33,
        "sub_id": "hz-yikou-nanfang"
    },
    {
        "source_id": "hz-youyou-7509435211135307066",
        "segment_id": "hz-youyou-jinzhongbang",
        "start": 250,
        "end": 285,
        "poster_sec": 268,
        "sub_id": "hz-youyou-jinzhongbang"
    },
    {
        "source_id": "hz-youyou-7509435211135307066",
        "segment_id": "hz-youyou-xiaolao-huntun",
        "start": 20,
        "end": 50,
        "poster_sec": 35,
        "sub_id": "hz-youyou-xiaolao"
    },
    {
        "source_id": "hz-panghuyimiba-7709339095310422629",
        "segment_id": "hz-panghu-aqian-mianguan",
        "start": 8,
        "end": 38,
        "poster_sec": 20,
        "sub_id": "hz-panghu-aqian"
    }
]

generated_clips = {}

for clip in new_clips:
    s_id = clip["source_id"]
    seg_id = clip["segment_id"]
    src_mp4 = intake_dir / s_id / "source.mp4"
    if not src_mp4.exists():
        print(f"ERROR: {src_mp4} not found!")
        continue
    
    # 1. Output directory in dist/media/videos/<source_id>
    out_source_dir = dist_media / s_id
    out_source_dir.mkdir(parents=True, exist_ok=True)
    
    # Simple hash for filename
    clip_filename = f"{clip['sub_id']}.mp4"
    out_clip_path = out_source_dir / clip_filename
    
    # Generate MP4 clip with ffmpeg
    dur = clip["end"] - clip["start"]
    cmd_clip = [
        ffmpeg_exe, "-y",
        "-ss", str(clip["start"]),
        "-t", str(dur),
        "-i", str(src_mp4),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(out_clip_path)
    ]
    subprocess.run(cmd_clip, capture_output=True)
    print(f"Generated clip {out_clip_path.name} ({out_clip_path.stat().st_size} bytes)")
    
    # Generate Poster JPG
    poster_filename = f"{seg_id}.jpg"
    poster_data_path = data_posters_dir / poster_filename
    poster_dist_path = dist_posters_dir / poster_filename
    cmd_poster = [
        ffmpeg_exe, "-y",
        "-ss", str(clip["poster_sec"]),
        "-i", str(src_mp4),
        "-vframes", "1",
        "-q:v", "3",
        str(poster_data_path)
    ]
    subprocess.run(cmd_poster, capture_output=True)
    import shutil
    shutil.copy2(poster_data_path, poster_dist_path)
    print(f"Generated poster {poster_filename} ({poster_data_path.stat().st_size} bytes)")
    
    generated_clips[seg_id] = {
        "clip_file": f"media/videos/{s_id}/{clip_filename}",
        "poster_file": f"data/cities/hangzhou/posters/{poster_filename}"
    }

print("\nAll 7 clips & posters generated successfully!")
