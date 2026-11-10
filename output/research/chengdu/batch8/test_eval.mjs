
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
