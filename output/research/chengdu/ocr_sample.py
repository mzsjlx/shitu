import subprocess
import json
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
ffmpeg = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

def ocr_video(mp4_path, interval=5, max_seconds=120):
    tmp_dir = Path('output/research/chengdu/tmp_frames')
    tmp_dir.mkdir(parents=True, exist_ok=True)
    
    # Clean previous
    for f in tmp_dir.glob('*.jpg'):
        f.unlink()
        
    cmd = [
        ffmpeg, '-y', '-i', str(mp4_path),
        '-vf', f'fps=1/{interval}',
        '-q:v', '2',
        str(tmp_dir / 'frame_%03d.jpg')
    ]
    subprocess.run(cmd, capture_output=True)
    
    lines_found = []
    for f in sorted(tmp_dir.glob('frame_*.jpg')):
        res, _ = engine(str(f))
        if res:
            for item in res:
                text = item[1].strip()
                if text and len(text) > 1 and text not in lines_found:
                    lines_found.append(text)
    return lines_found

if __name__ == '__main__':
    lines = ocr_video(r'map-base/.local/video-intake/cd-bozai-7286785550986611983/source.mp4', interval=3)
    print("Bozai OCR results:")
    for l in lines:
        print(" ", l)
