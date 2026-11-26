import json

with open('output/research/chengdu/xiaojunmao_analysis/ocr_summary.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

lines_out = []
for item in items:
    text = item['text']
    sec = item['sec']
    lines_out.append(f"{sec:5.1f}s | {text}")

with open('output/research/chengdu/xiaojunmao_lines.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(lines_out))
print("Wrote lines to xiaojunmao_lines.txt")
