import json
import hashlib
from pathlib import Path

root = Path('.').resolve()
lib_path = root / 'map-base/data/cities/harbin/video-library.json'
with open(lib_path, 'r', encoding='utf-8') as f:
    lib = json.load(f)

print(f"Checking {len(lib['sources'])} sources in harbin video library...")
all_matched = True
for s in lib['sources']:
    sid = s['id']
    mp4 = root / f"map-base/.local/video-intake/{sid}/source.mp4"
    if not mp4.exists():
        print(f"❌ {sid}: file not found at {mp4}")
        all_matched = False
        continue
    raw = mp4.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    expected = s['sourceSHA256']
    if sha == expected:
        print(f"✅ {sid}: SHA256 MATCH! ({len(raw)/1024/1024:.2f} MB)")
    else:
        print(f"❌ {sid}: SHA256 MISMATCH! Actual {sha} != Expected {expected}")
        all_matched = False

if all_matched:
    print("\n🎉 ALL INTAKE FILES VERIFIED 100% PERFECTLY!")
