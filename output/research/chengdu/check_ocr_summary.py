import json

with open('output/research/chengdu/batch7_ocr_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('output/research/chengdu/summary_out.txt', 'w', encoding='utf-8') as out:
    for k, v in data.items():
        out.write(f'KEY: {k}\n')
        if isinstance(v, dict):
            for subk, subv in v.items():
                out.write(f'  {subk}: {str(subv)[:120]}\n')
        else:
            out.write(f'  VALUE: {str(v)[:120]}\n')
