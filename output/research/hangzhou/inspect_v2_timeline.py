import json

with open(r'D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch11_ocr_summary.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

v2 = data['hz-ayufadiansha-7707536598476524826']
# Check frames for highlight or specific store names
stores = ['友·小海鲜', 'PICATAPA', 'PICABOCATA', 'PICATHAM', '好绿', 'La Gauche', 'Koyo', '古新里']

for m in v2['matches']:
    txt = m['text']
    # Check if there is a store title card
    for s in stores:
        if s in txt:
            # check words after s or nearby
            pass

# Let's inspect frames around 120s, 180s, 240s, 300s, 360s
for sec in range(0, 453, 15):
    # find match closest to sec
    closest = min(v2['matches'], key=lambda m: abs(m['sec'] - sec))
    print(f"[{closest['sec']}s] {closest['text'][:80]}")
