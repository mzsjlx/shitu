import re
import json

# Let's inspect map-base/src/video-library-model.js logic:
# if(![segment.start,segment.end,segment.posterSecond].every(Number.isFinite)||segment.start<previous||segment.end<=segment.start||segment.end>source.durationSeconds||segment.posterSecond<segment.start||segment.posterSecond>=segment.end)throw new Error('视频分段时间无效或重叠');

with open('output/research/chengdu/batch8/batch8_sources_meta.json', 'r', encoding='utf-8') as f:
    meta = json.load(f)

# Also let's inspect the batch8Sources directly by reading generate_batch8_full.mjs
with open('output/research/chengdu/batch8/generate_batch8_full.mjs', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's run node to evaluate batch8Sources
import subprocess
node_code = """
import fs from 'node:fs';
import path from 'node:path';
const text = fs.readFileSync('output/research/chengdu/batch8/generate_batch8_full.mjs', 'utf8');
const startIdx = text.indexOf('const batch8Sources = [');
const endIdx = text.indexOf('// Combine existing sources and Batch 8 sources');
const code = text.slice(startIdx, endIdx);
const sandbox = new Function(code + '; return batch8Sources;')();
for (const s of sandbox) {
  let prev = 0;
  for (const seg of (s.segments || [])) {
    if (!Number.isFinite(seg.start) || !Number.isFinite(seg.end) || !Number.isFinite(seg.posterSecond)) {
      console.log('Finite error:', s.id, seg.id);
    }
    if (seg.start < prev) {
      console.log('Order/Overlap error:', s.id, 'seg:', seg.id, 'start:', seg.start, 'prev:', prev);
    }
    if (seg.end <= seg.start) {
      console.log('End <= start error:', s.id, seg.id);
    }
    if (seg.end > s.durationSeconds) {
      console.log('End > duration error:', s.id, seg.id, 'end:', seg.end, 'dur:', s.durationSeconds);
    }
    if (seg.posterSecond < seg.start || seg.posterSecond >= seg.end) {
      console.log('Poster range error:', s.id, seg.id, 'poster:', seg.posterSecond, 'start:', seg.start, 'end:', seg.end);
    }
    prev = seg.end;
  }
}
"""
with open('output/research/chengdu/batch8/test_eval.mjs', 'w', encoding='utf-8') as f:
    f.write(node_code)

res = subprocess.run(['node', 'output/research/chengdu/batch8/test_eval.mjs'], capture_output=True, text=True)
print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
