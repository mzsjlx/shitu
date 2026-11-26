import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch15_ocr_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for s_id, d in data.items():
    print('==============================')
    print('ID:', s_id, '| Author:', d['author'])
    print('Title:', d['title'].replace('\n', ' ')[:70])
    print('POI:', d.get('poi', {}).get('poi_name'))
    keywords = ['店', '馆', '记', '楼', '烧', '肉', '饭', '面', '粉', '鱼', '鸡', '串', '夜市', '小吃', '西湖', '街', '路', '巷', '弄', '号', '拌面', '酥鱼', '羊肉', '炸酱面', 'mama', '炸串', '杭帮菜']
    for m in d['matches']:
        txt = m['text']
        if any(k in txt for k in keywords):
            print(f"  [{m['sec']:5.1f}s] {txt[:95]}")
