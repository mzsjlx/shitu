import os
import json
import subprocess
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
ffmpeg = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

INTAKE_BASE = Path(r'map-base/.local/video-intake')
DETAILS_BASE = Path(r'output/research/chengdu/details')
OUT_RESEARCH = Path(r'output/research/chengdu/batch4_inspection')
OUT_RESEARCH.mkdir(parents=True, exist_ok=True)

sources = [
    'cd-mizijun-7496389147616218379',
    'cd-yangdui-7618146716805614874',
    'cd-shashayouchanle-7694250186420137125',
    'cd-xiehuangbao-7670453083968785664',
    'cd-rourou-7024754924965661956',
    'cd-yizhihedapang-7661852443047369078',
    'cd-renyi-7514320630787919167',
    'cd-yangdui-7683090587154779401',
    'cd-wangxun-7609124019572428095',
    'cd-wulala-7078883833852087566',
    'cd-xiaozhang-7640394328993233657'
]

summary = {}

for sid in sources:
    mp4 = INTAKE_BASE / sid / 'source.mp4'
    if not mp4.exists():
        print(f"Skipping {sid}, no mp4")
        continue
    
    det_file = DETAILS_BASE / f"{sid}.json"
    det = {}
    if det_file.exists():
        with open(det_file, 'r', encoding='utf-8') as f:
            det = json.load(f)
    
    poi_info = det.get('poi_info', {})
    desc = det.get('desc', '')
    
    frames_dir = OUT_RESEARCH / sid
    frames_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract 1 frame every 12 seconds up to 25 frames
    cmd = [
        ffmpeg, '-y', '-i', str(mp4),
        '-vf', 'fps=1/12',
        '-vframes', '25',
        '-q:v', '3',
        str(frames_dir / 'f_%02d.jpg')
    ]
    subprocess.run(cmd, capture_output=True)
    
    texts_by_time = []
    seen = set()
    for f in sorted(frames_dir.glob('f_*.jpg')):
        frame_idx = int(f.stem.split('_')[1])
        sec = frame_idx * 12
        res, _ = engine(str(f))
        if res:
            for item in res:
                t = item[1].strip()
                if len(t) > 1 and t not in seen:
                    seen.add(t)
                    texts_by_time.append({'sec': sec, 'text': t})
                    
    summary[sid] = {
        'desc': desc,
        'poi_name': poi_info.get('poi_name', ''),
        'poi_address': poi_info.get('address', ''),
        'poi_city': poi_info.get('city', ''),
        'texts': texts_by_time
    }
    print(f"Processed {sid}: {len(texts_by_time)} texts extracted.")

with open(OUT_RESEARCH / 'summary_batch4.json', 'w', encoding='utf-8') as out:
    json.dump(summary, out, ensure_ascii=False, indent=2)

print("Batch 4 shop inspection completed successfully!")
