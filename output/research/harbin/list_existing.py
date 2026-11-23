import json
with open('map-base/data/cities/harbin/video-library.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total sources: {len(data['sources'])}")
for i, s in enumerate(data['sources'], 1):
    print(f"{i:2d}. {s['id']} ({s.get('author')})")

print("\nAll Place IDs:")
places = set()
for s in data['sources']:
    for seg in s['segments']:
        pid = seg.get('placeId') or seg['id']
        places.add(pid)
print(f"Total distinct places: {len(places)}")
