import json
from pathlib import Path

DETAILS_BASE = Path(r'output/research/chengdu/details')
with open(r'output/research/chengdu/batch2_sources_meta.json', 'r', encoding='utf-8') as f:
    sources = json.load(f)

lines = []
for item in sources:
    source_id = item['sourceId']
    detail_path = DETAILS_BASE / f"{source_id}.json"
    if not detail_path.exists():
        continue
    with open(detail_path, 'r', encoding='utf-8') as f:
        d = json.load(f)

    poi = d.get('poi_info', {})
    text_extra = d.get('text_extra', [])
    lines.append(f"[{item['index']}/12] {source_id} ({item['author']})")
    lines.append(f"  Title: {item['title']}")
    lines.append(f"  Duration: {item['durationSeconds']}s, Published: {item['publishedOn']}")
    if poi:
        lines.append(f"  POI Name: {poi.get('poi_name')}")
        lines.append(f"  POI City: {poi.get('city_name')}")
        lines.append(f"  POI Address: {poi.get('address')}")
        lines.append(f"  POI Latitude: {poi.get('poi_latitude')}, Longitude: {poi.get('poi_longitude')}")
        lines.append(f"  POI ID: {poi.get('poi_id')}")
    else:
        lines.append("  POI: None")
    
    tags = [te.get('hashtag_name') for te in text_extra if te.get('type') == 0 and te.get('hashtag_name')]
    if tags:
        lines.append(f"  Tags: {', '.join(tags)}")
    lines.append("")

out_file = Path(r'output/research/chengdu/batch2_poi_summary.txt')
with open(out_file, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines))

print(f"Saved to {out_file}")
