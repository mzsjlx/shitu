import json
from pathlib import Path

path = Path(r"D:\Antigravity\地图\.local\worktrees\hangzhou-prep\output\research\hangzhou\batch1_downloaded.json")
data = json.loads(path.read_text(encoding="utf8"))
for i, item in enumerate(data):
    title = item['title'].replace('\n', ' ')[:60]
    print(f"[{i+1:02d}] {item['source_id']} | {item['author']} ({item['duration_seconds']}s)")
    print(f"     Title: {title}")
