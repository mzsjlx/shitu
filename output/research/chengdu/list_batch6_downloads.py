import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch6_sources_meta.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for it in items:
    s_id = it['sourceId']
    mp4 = Path('map-base/.local/video-intake/' + s_id + '/source.mp4')
    sha_file = Path('map-base/.local/video-intake/' + s_id + '/source.sha256')
    sha = sha_file.read_text('utf-8').strip() if sha_file.exists() else 'MISSING'
    size = mp4.stat().st_size if mp4.exists() else 0
    print(f"{it['index']:2d}. {s_id} | {size:10d} bytes | {sha} | {it['author']}")
