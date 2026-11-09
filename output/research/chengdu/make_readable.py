import json

with open('output/research/chengdu/batch7_ocr_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('output/research/chengdu/batch7_readable_summary.txt', 'w', encoding='utf-8') as out:
    for sid, info in data.items():
        out.write('====================================================================\n')
        out.write(f"{sid} | {info['author']} | {info['title']}\n")
        out.write(f"Duration: {info['duration']}s\n")
        for o in info['ocr']:
            line_str = ' | '.join(o['lines'])
            out.write(f"  [{o['time']:5.1f}s] {line_str}\n")

print("Saved to output/research/chengdu/batch7_readable_summary.txt")
