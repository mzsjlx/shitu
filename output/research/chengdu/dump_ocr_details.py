import json

with open('output/research/chengdu/batch7_ocr_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for target in ['cd-wowxingge-7685637264814247187', 'cd-airousi-7692002207759109426', 'cd-tiaojieshuachengdu-7667130769399205155']:
    item = data.get(target, {})
    with open(f'output/research/chengdu/{target}_all_ocr.txt', 'w', encoding='utf-8') as out:
        out.write(f"TITLE: {item.get('title')}\n")
        out.write(f"POI: {item.get('poiName')}\n")
        for f_entry in item.get('ocr', []):
            time_val = f_entry.get('time')
            lines = f_entry.get('lines', [])
            if lines:
                out.write(f"[{time_val}s] {' | '.join(lines)}\n")
