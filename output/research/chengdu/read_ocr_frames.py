import json
import glob
import os
from rapidocr_onnxruntime import RapidOCR

ocr = RapidOCR()

def process_dir(dir_path, json_out):
    results = {}
    files = sorted(glob.glob(os.path.join(dir_path, "*.jpg")))
    for f in files:
        base = os.path.basename(f)
        res, _ = ocr(f)
        lines = [r[1] for r in res] if res else []
        results[base] = lines
    with open(json_out, "w", encoding="utf-8") as out:
        json.dump(results, out, ensure_ascii=False, indent=2)
    return results

for d in ['frames_huoguo', 'frames_renyi1', 'frames_renyi2', 'frames_wow', 'frames_xiaozhen']:
    p = os.path.join('output/research/chengdu', d)
    if os.path.exists(p):
        out_json = p + '.json'
        res = process_dir(p, out_json)
        print(f"Processed {d}: {len(res)} frames")
