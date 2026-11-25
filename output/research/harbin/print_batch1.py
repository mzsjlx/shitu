import json

with open('output/research/harbin/batch1_resolved.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for item in items:
    print(f"[{item['index']:02d}] {item['author']} ({item['durationSeconds']}s, {item['publishedOn']}):")
    print(f"     标题: {item['title']}")
    print(f"     链接: {item['url']}")
