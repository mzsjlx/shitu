import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
city_id = 'chengdu'
video_lib_path = root / f'map-base/data/cities/{city_id}/video-library.json'
report_path = root / 'map-base/.local/video-clips/report.json'
ffmpeg_bin = r'D:\Python\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'

lib = json.loads(video_lib_path.read_text(encoding='utf8'))
report_data = json.loads(report_path.read_text(encoding='utf8')) if report_path.exists() else {'records': []}
records_by_id = {r['id']: r for r in report_data.get('records', [])}

results = []
all_passed = True
checked_ids = []

for s in lib['sources']:
    source_id = s['id']
    for seg in s['segments']:
        seg_id = seg['id']
        checked_ids.append(seg_id)
        clip_dir = root / f'map-base/.local/video-clips/{source_id}'
        # find matching mp4
        mp4_files = list(clip_dir.glob(f"{seg_id}*.mp4")) if clip_dir.exists() else []
        if not mp4_files:
            # try finding in subdirectories or by base name
            mp4_files = list(clip_dir.glob("*.mp4")) if clip_dir.exists() else []
            # filter by segment id or pattern
            matched = [f for f in mp4_files if seg_id in f.name]
            if matched:
                mp4_files = matched
        
        if not mp4_files:
            print(f"Missing clip file for {seg_id} in {clip_dir}")
            all_passed = False
            results.append({'id': seg_id, 'status': 'missing_file'})
            continue
            
        clip_file = mp4_files[0]
        
        # probe using ffmpeg
        proc = subprocess.run([ffmpeg_bin, '-hide_banner', '-i', str(clip_file)], capture_output=True, text=True)
        err = proc.stderr
        
        has_h264 = 'h264' in err.lower() or 'avc' in err.lower()
        has_aac = 'aac' in err.lower()
        
        # quick decode test (check first 10 seconds or full if shorter)
        decode_proc = subprocess.run([ffmpeg_bin, '-v', 'error', '-i', str(clip_file), '-t', '10', '-f', 'null', '-'], capture_output=True, text=True)
        decode_ok = decode_proc.returncode == 0 and len(decode_proc.stderr.strip()) == 0
        
        if not (has_h264 and has_aac and decode_ok):
            print(f"Clip {seg_id} failed check: h264={has_h264}, aac={has_aac}, decode_ok={decode_ok}, err={decode_proc.stderr}")
            all_passed = False
            results.append({'id': seg_id, 'status': 'failed', 'h264': has_h264, 'aac': has_aac, 'decode_ok': decode_ok})
        else:
            results.append({'id': seg_id, 'status': 'ok', 'file': clip_file.name})

qa_out = {
    'verifiedOn': '2026-11-12',
    'clipsProbedAndDecoded': len([r for r in results if r['status'] == 'ok']),
    'totalChengduClips': len(checked_ids),
    'passed': all_passed and len(results) == len(checked_ids),
    'ids': checked_ids
}

out_file = root / 'output/research/chengdu/integration-media-qa-20261112.json'
out_file.write_text(json.dumps(qa_out, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(f"Media QA complete: {qa_out['clipsProbedAndDecoded']}/{qa_out['totalChengduClips']} passed={qa_out['passed']}")
