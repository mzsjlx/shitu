import json

with open('output/research/chengdu/renyi_shancheng_analysis/ocr_summary.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

lines = []
for item in items:
    text = item['text']
    for kw in ['店', '街', '路', '道', '市', '区', '馆', '摊', '夜', '螺', '骨', '重庆', '成都', '山城']:
        if kw in text and len(text) > 3:
            lines.append(f"{item['sec']:5.1f}s: {text}")
            break

with open('output/research/chengdu/renyi_shancheng_kw.txt', 'w', encoding='utf-8') as out:
    out.write("\n".join(lines))
