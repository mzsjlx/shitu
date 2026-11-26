import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch11_ocr_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Inspect video 2 in detail
v2 = data['hz-ayufadiansha-7707536598476524826']
print("Video 2 title:", v2['title'])
print("Total matches:", len(v2['matches']))

# Let's print unique sections or store transitions
for m in v2['matches']:
    txt = m['text']
    for kw in ['Bistro', 'PICABOCATA', 'PICATHAM', '好绿', '友·小海鲜', 'PICATAPA', 'La Gauche', 'Koyo', '古新里', '第一家', '第二家', '第三家', '第四家', '第五家', '第1家', '第2家', '第3家', '第4家', '第5家', '店', '餐', '推荐']:
        if kw in txt:
            print(f"[{m['sec']:5.1f}s] {txt[:100]}")
            break
