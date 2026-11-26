import os
import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

FFMPEG = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

def analyze_video(video_path, out_dir, name):
    out_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        FFMPEG, '-y', '-i', str(video_path),
        '-vf', 'fps=1,scale=720:-1',
        str(out_dir / 'f_%04d.jpg')
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    engine = RapidOCR()
    results = []
    frames = sorted(out_dir.glob('f_*.jpg'))
    lines_out = []
    for i, f in enumerate(frames):
        sec = float(i)
        ocr_res, _ = engine(str(f))
        lines = []
        if ocr_res:
            for item in ocr_res:
                lines.append(item[1])
        text = " | ".join(lines)
        results.append({'sec': sec, 'frame': f.name, 'text': text})
        lines_out.append(f"{sec:5.1f}s | {text}")
    with open(out_dir / 'ocr_summary.json', 'w', encoding='utf-8') as out:
        json.dump(results, out, ensure_ascii=False, indent=2)
    with open(out_dir.parent / f"{name}_lines.txt", 'w', encoding='utf-8') as f:
        f.write("\n".join(lines_out))
    print(f"Processed {len(frames)} frames for {name}.")

# Aji 7577624241508551942
analyze_video(
    Path(r'map-base/.local/video-intake/cd-aji-7577624241508551942/source.mp4'),
    Path(r'output/research/chengdu/aji_analysis'),
    'aji'
)

# Fengwei 7561724633356569913
analyze_video(
    Path(r'map-base/.local/video-intake/cd-fengwei-7561724633356569913/source.mp4'),
    Path(r'output/research/chengdu/fengwei_analysis'),
    'fengwei'
)
