import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch6_sources_meta.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    poi = item.get('poiName') or 'None'
    print(f"[{item['index']}] {item['sourceId']} | {item['author']} | {item['publishedOn']} | {item['durationSeconds']}s | POI: {poi}")
    print(f"    Title: {item['title'][:80]}")
