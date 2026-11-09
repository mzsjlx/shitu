import json
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')

for f in sorted(glob.glob('output/research/chengdu/frames_*.json')):
    print(f"\n================ {f} ================")
    data = json.load(open(f, encoding='utf-8'))
    for k, v in data.items():
        if v:
            print(f"{k}: {' | '.join(v)}")
