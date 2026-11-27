import json

with open('output/research/chengdu/cd-erbaizheye-7571507105111362862_ocr.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for it in items:
    sec = it['second']
    if (16.0 <= sec <= 26.0) or (198.0 <= sec <= 204.0) or (270.0 <= sec <= 276.0):
        print(f"[{sec:5.1f}s] {it['frame']}: {it['texts']}")
