import json

items = json.load(open('output/research/harbin/batch2_resolved.json', encoding='utf-8'))
for i, it in enumerate(items, 1):
    sha = it.get('sourceSHA256')
    if sha:
        print(f"[{i}] {it['author']} ({it['durationSeconds']}s): {it['title']}")
        print(f"    Desc: {it['desc'][:80]}")
        print(f"    SourceId: {it['sourceId']}")
