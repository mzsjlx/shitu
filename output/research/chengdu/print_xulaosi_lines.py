import json
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR()

lines = []
for name in ['xulaosi_0001.jpg', 'xulaosi_0004.jpg', 'xulaosi_0008.jpg', 'xulaosi_0015.jpg', 'xulaosi_0022.jpg', 'xulaosi_0030.jpg']:
    p = 'output/research/chengdu/details_frames/' + name
    res, _ = ocr(p)
    lines.append('=== ' + name + ' ===')
    if res:
        for r in res:
            lines.append(r[1])

with open('output/research/chengdu/xulaosi_lines_utf8.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Written UTF-8 file!')
