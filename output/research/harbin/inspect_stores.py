import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
resolved_json = root / "output/research/harbin/batch6_resolved.json"

with open(resolved_json, "r", encoding="utf-8") as f:
    items = json.load(f)

print(f"=== Total Resolved Items: {len(items)} ===")
for item in items:
    print(f"\n[{item['index']}] {item['author']} ({item['slug']})")
    print(f"  Title: {item['title']}")
    print(f"  Desc: {item.get('desc', '')[:100]}")
    if item.get('sourceSHA256'):
        print(f"  File size: {item.get('fileSize', 0)/1024/1024:.2f} MB, Source: {item['sourceId']}")
    elif item.get('excluded'):
        print(f"  Excluded: {item.get('excludeReason')}")
