import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch11_ocr_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for s_id, d in data.items():
    print('==============================')
    print('ID:', s_id, '| Author:', d['author'])
    print('Title:', d['title'].replace('\n', ' ')[:70])
    print('POI:', d.get('poi', {}).get('poi_name'))
    keywords = ['店', '馆', '记', '楼', '烧', '肉', '饭', '面', '鱼', '鸡', '居酒屋', '食堂', '铁板', '自助', '锅', '餐厅', '路', '街', '区', '号', '牛', '大渔', '东盛', '一绪', '漂亮', '私房']
    for m in d['matches']:
        txt = m['text']
        if any(k in txt for k in keywords):
            print(f"  [{m['sec']:5.1f}s] {txt[:90]}")
