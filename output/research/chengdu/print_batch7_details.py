import json

with open('output/research/chengdu/batch7_ocr_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for sid, info in data.items():
    print('====================================================================')
    print(sid, '|', info['author'], '|', info['title'])
    print('Duration:', info['duration'])
    for o in info['ocr']:
        line_str = ' | '.join(o['lines'])
        print(f"  [{o['time']:5.1f}s] {line_str}")
