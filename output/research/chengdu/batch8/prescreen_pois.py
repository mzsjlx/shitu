import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch8/batch8_sources_meta.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for item in items:
    source_id = item['sourceId']
    author = item['author']
    idx = item['index']
    detail_path = Path(f'output/research/chengdu/details/{source_id}.json')
    desc = ''
    poi_info = {}
    if detail_path.exists():
        with open(detail_path, 'r', encoding='utf-8') as df:
            detail = json.load(df)
            desc = detail.get('desc', '')
            poi_info = detail.get('poi_info', {})
    
    poi_name = poi_info.get('poi_name', '')
    address = poi_info.get('address_info', {}).get('address', '')
    city = poi_info.get('address_info', {}).get('city', '')
    
    print(f"\n-----------------------------------------------------------")
    print(f"[{idx}] {source_id} | Author: {author}")
    print(f"Title: {desc.replace(chr(10), ' ')}")
    if poi_name:
        print(f"POI: {poi_name} | City: {city} | Addr: {address}")
