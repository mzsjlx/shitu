import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('map-base/data/cities/chengdu/video-library.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('Total sources:', len(d.get('sources', [])))
total_segs = 0
for s in d.get('sources', []):
    for seg in s.get('segments', []):
        total_segs += 1
        name = seg.get('name', '')
        place_id = seg.get('placeId', '')
        coords = seg.get('coordinates')
        cat = seg.get('category')
        print(f"{seg['id']}: {name} [{cat}] -> {coords} (placeId: {place_id})")
print('Total segments:', total_segs)
