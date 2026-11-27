import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch7_ocr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for vid, item in data.items():
    author = item['author']
    print(f"\n==========================================")
    print(f"=== {author} ({vid}) ===")
    print("Title:", item['title'])
    print("POI:", item.get('poi', ''))
    print(f"Duration: {item['duration']:.1f}s")
    print("All OCR matches:")
    for sec, line in item['matches']:
        print(f"  [{sec:5.1f}s] {line}")
