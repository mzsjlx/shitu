import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch8/batch8_ocr_results.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

with open('output/research/chengdu/batch8/batch8_sources_meta.json', 'r', encoding='utf-8') as f:
    meta_list = json.load(f)

meta_by_id = {m['sourceId']: m for m in meta_list}

print("=== Analyzing 24 Videos ===")
for source_id, data in ocr_data.items():
    author = data.get('author', '')
    title = data.get('title', '')
    duration = data.get('duration', 0)
    ocr_items = data.get('ocr', [])
    
    print(f"\n-------------------------------------------------------------")
    print(f"[{source_id}] {author} ({duration}s)")
    print(f"Title: {title}")
    
    # scan all lines for store clues
    found = []
    for item in ocr_items:
        t = item['time']
        for l in item['lines']:
            if len(l) > 2 and any(k in l for k in ['店', '馆', '火锅', '烧烤', '大排档', '冒菜', '粉', '面', '兔', '串串', '排挡', '路', '街']):
                found.append((t, l))
    
    if found:
        print("  Candidate lines:")
        for t, l in found[:8]:
            print(f"    [{t}s] {l}")
        if len(found) > 8:
            print(f"    ... total matches: {len(found)}")
