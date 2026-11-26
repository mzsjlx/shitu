import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch11_ocr_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

v2 = data['hz-ayufadiansha-7707536598476524826']
for m in v2['matches']:
    # remove the header tokens
    clean = m['text']
    for h in ['PICATHAM', 'PICABOCATA', '好绿', '泰餐', 'brunch', 'Bistro', '友·小海鲜', 'PICATAPA', 'La Gauche', 'LaGauche', 'Koyo', '西班牙餐', '古新里', '日法融合', '素材来源于网络']:
        clean = clean.replace(h, '')
    clean = clean.strip()
    if clean:
        print(f"[{m['sec']:5.1f}s] {clean[:70]}")
