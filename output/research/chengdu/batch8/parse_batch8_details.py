import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch8/batch8_ocr_results.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

for source_id, data in ocr_data.items():
    author = data.get('author', '')
    title = data.get('title', '')
    duration = data.get('duration', 0)
    ocr_list = data.get('ocr', [])
    
    print(f"\n=======================================================")
    print(f"Source: {source_id} | Author: {author} | Duration: {duration}s")
    print(f"Title: {title}")
    print("Key OCR lines:")
    all_lines = []
    for item in ocr_list:
        t = item['time']
        lines = item['lines']
        joined = " / ".join(lines)
        # print if interesting keywords
        all_lines.append(f"[{t}s] {joined}")
    for l in all_lines[:15]:
        print("  ", l[:120])
    if len(all_lines) > 15:
        print("   ... (total lines count:", len(all_lines), ")")
        # print last 5 lines
        for l in all_lines[-5:]:
            print("  ", l[:120])
