import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('output/research/chengdu/batch8/batch8_sources_meta.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

for r in res:
    has_sha = 'OK' if r.get('sourceSHA256') else 'MISSING'
    title = r.get('title', '')[:45].replace('\n', ' ')
    print(f"[{r.get('index')}] {r.get('author')}: {r.get('sourceId')} ({has_sha}) - {title}")
