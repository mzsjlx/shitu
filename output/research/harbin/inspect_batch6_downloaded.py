import json

data = json.load(open("output/research/harbin/batch6_resolved.json", encoding="utf-8"))
for i, item in enumerate(data):
    if item.get("sourceSHA256"):
        print(f"[{item.get('author')}] ({item.get('sourceId')}): {item.get('title')}")
        desc = (item.get("desc") or "")[:90]
        print(f"   Desc: {desc}")
