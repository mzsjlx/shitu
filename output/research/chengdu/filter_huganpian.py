import json

with open('output/research/chengdu/huganpian_analysis/ocr_summary.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for item in items:
    sec = item['sec']
    text = item['text']
    if (10 <= sec <= 25) or (85 <= sec <= 98) or (150 <= sec <= 165):
        if text.strip():
            print(f"{sec:5.1f}s: {text}")
