import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch6_sources_meta.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for it in items:
    s_id = it['sourceId']
    p = f'output/research/chengdu/details/{s_id}.json'
    try:
        with open(p, 'r', encoding='utf-8') as df:
            detail = json.load(df)
        poi = detail.get('poi_info', {}) or {}
        poi_name = poi.get('poi_name', '')
        poi_addr = poi.get('address', '')
        poi_lon = poi.get('poi_longitude', '')
        poi_lat = poi.get('poi_latitude', '')
        poi_city = poi.get('city', '')
        print(f"[{it['index']}] {it['author']} ({s_id}):")
        print(f"    POI Name: {poi_name} | City: {poi_city}")
        print(f"    Address: {poi_addr}")
        print(f"    Coord: [{poi_lon}, {poi_lat}]")
    except Exception as e:
        print(f"[{it['index']}] {s_id}: error loading detail {e}")
