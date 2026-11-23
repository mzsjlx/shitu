import json
with open('map-base/data/cities/harbin/video-library.json', 'r', encoding='utf-8') as f:
    lib = json.load(f)

for s in lib['sources']:
    for seg in s['segments']:
        if seg['id'] in ['hb-lingzi-daolishichang', 'hb-lingzi-hongzhuanzaoshi']:
            print(f"ID: {seg['id']}")
            print(f"  Name: {repr(seg['name'])}")
            print(f"  Category: {repr(seg['category'])}")
            print(f"  Coordinates: {seg['coordinates']}")
