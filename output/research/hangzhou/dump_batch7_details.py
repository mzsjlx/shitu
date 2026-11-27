import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch7_ocr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for k in ['hz-laozhou-7684560071607854419', 'hz-techusuibian-7260306990604340495', 'hz-laozhou-7608491980360158662', 'hz-gebideyumu-7690844662713886634']:
    it = data[k]
    print(f"\n=== {it['author']} ({k}) ===")
    for sec, line in it['matches']:
        print(f"  [{sec:5.1f}s] {line}")
