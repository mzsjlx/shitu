"""Compare video-planning anchors directly with their frozen original OSM PBF."""
import argparse
import hashlib
import json
import math
import shutil
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import osmium


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--snapshot', type=Path, default=Path('data/video-batch3-open-anchors.json'))
parser.add_argument('--pbf', type=Path, default=Path('.local/chongqing-261025.osm.pbf'))
parser.add_argument('--report', type=Path, default=Path('VIDEO-BATCH3-ANCHOR-SOURCE-QA.json'))
parser.add_argument('--verified-on', default=datetime.now(timezone(timedelta(hours=8))).date().isoformat())
args = parser.parse_args()


def local_path(value):
    result = (ROOT / value).resolve()
    if not result.is_relative_to(ROOT):
        parser.error('Snapshot and report must stay within the project.')
    return result


snapshot_path = local_path(args.snapshot)
report_path = local_path(args.report)
pbf_path = (ROOT / args.pbf).resolve()
checks = []
anchor_results = []
report = {
    'verifiedOn': args.verified_on,
    'scope': 'Independent preservation audit against the frozen original PBF; '
             'not a shop-branch, entrance, operating-status or walking-access verification.',
    'snapshot': snapshot_path.relative_to(ROOT).as_posix(),
    'sourceFile': pbf_path.name,
    'coordinateToleranceDegrees': 1e-9,
    'checks': checks,
    'anchors': anchor_results,
}


def check(name, passed, detail=None):
    row = {'name': name, 'passed': bool(passed)}
    if detail is not None:
        row['detail'] = detail
    checks.append(row)
    return bool(passed)


def point(value):
    return (isinstance(value, list) and len(value) == 2
            and all(isinstance(n, (int, float)) and not isinstance(n, bool)
                    and math.isfinite(n) for n in value))


def same_point(left, right):
    return (point(left) and point(right)
            and all(abs(a - b) <= 1e-9 for a, b in zip(left, right)))


def audit():
    raw = snapshot_path.read_bytes()
    report['snapshotSHA256'] = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw)
    anchors = data.get('anchors')
    if not check('Snapshot schema and WGS84 declaration',
                 data.get('schemaVersion') == 1 and data.get('coordinateSystem') == 'WGS84'
                 and isinstance(anchors, list) and bool(anchors)):
        return
    identities = [(a.get('type'), a.get('id')) for a in anchors]
    valid_ids = all(t in ('node', 'way') and isinstance(i, int) and i > 0
                    for t, i in identities)
    if not check('Unique original node/way identities',
                 valid_ids and len(set(identities)) == len(identities)):
        return
    source = data.get('source', {})
    with pbf_path.open('rb') as stream:
        actual_hash = hashlib.file_digest(stream, 'sha256').hexdigest()
    report.update(sourceSHA256=actual_hash, sourceDate=source.get('date'))
    if not check('Original PBF SHA256 matches the snapshot source',
                 actual_hash == source.get('sha256')):
        return

    wanted_ways = {a['id'] for a in anchors if a['type'] == 'way'}
    wanted_nodes = {a['id'] for a in anchors if a['type'] == 'node'}
    original_ways = {}
    original_nodes = {}
    # Windows libosmium needs an ASCII source pathname. Nothing in the public
    # snapshot is used to invent a missing source node or reorder source ways.
    with tempfile.TemporaryDirectory(prefix='shitu-batch3-anchor-audit-') as temp:
        ascii_pbf = Path(temp) / 'original.osm.pbf'
        shutil.copyfile(pbf_path, ascii_pbf)
        with ascii_pbf.open('rb') as stream:
            if not check('ASCII temporary PBF copy has identical bytes',
                         hashlib.file_digest(stream, 'sha256').hexdigest() == actual_hash):
                return
        for way in osmium.FileProcessor(str(ascii_pbf), osmium.osm.WAY):
            if way.id not in wanted_ways:
                continue
            refs = [node.ref for node in way.nodes]
            original_ways[way.id] = {
                'nodeIds': refs,
                'tags': {tag.k: tag.v for tag in way.tags},
            }
            wanted_nodes.update(refs)
        for node in osmium.FileProcessor(str(ascii_pbf), osmium.osm.NODE):
            if node.id not in wanted_nodes:
                continue
            original_nodes[node.id] = {
                'coordinates': [node.location.lon, node.location.lat] if node.location.valid() else None,
                'tags': {tag.k: tag.v for tag in node.tags},
            }

    check('Every anchor way exists in the frozen PBF',
          set(original_ways) == wanted_ways,
          {'requested': len(wanted_ways), 'found': len(original_ways)})
    missing_nodes = sorted(wanted_nodes - original_nodes.keys())
    check('All standalone and way-referenced source nodes exist', not missing_nodes,
          {'requested': len(wanted_nodes), 'found': len(original_nodes),
           'missingNodeIds': missing_nodes[:30]})

    for saved in anchors:
        kind, ident = saved['type'], saved['id']
        original = (original_ways if kind == 'way' else original_nodes).get(ident)
        row = {'type': kind, 'id': ident, 'name': saved.get('name'), 'checks': []}
        anchor_results.append(row)

        def anchor_check(label, passed):
            row['checks'].append({'name': label, 'passed': bool(passed)})

        anchor_check('Object exists in original PBF', original is not None)
        if original is None:
            row['passed'] = False
            continue
        # The retained snapshots store full original tags, rather than a
        # rendering subset. Checking both directions also catches missing tags.
        anchor_check('All retained tags exactly equal original tags',
                     saved.get('tags') == original['tags'])
        anchor_check('Display name equals original name tag',
                     saved.get('name', '') == original['tags'].get('name', ''))
        if kind == 'node':
            anchor_check('Node coordinate is the original source coordinate',
                         same_point(saved.get('coordinates'), original['coordinates']))
            row['representativeMethod'] = 'original-node-coordinate'
        else:
            refs = original['nodeIds']
            source_geometry = [original_nodes.get(i, {}).get('coordinates') for i in refs]
            complete = bool(refs) and all(point(p) for p in source_geometry)
            anchor_check('Complete original ordered node coordinates are available', complete)
            if 'nodeIds' in saved:
                anchor_check('Saved nodeIds preserve complete original node order',
                             saved['nodeIds'] == refs)
                row['savedNodeIdsPresent'] = True
            else:
                row['savedNodeIdsPresent'] = False
            saved_geometry = saved.get('geometry')
            geometry_equal = (complete and isinstance(saved_geometry, list)
                              and len(saved_geometry) == len(source_geometry)
                              and all(same_point(a, b) for a, b
                                      in zip(saved_geometry, source_geometry)))
            anchor_check('Complete geometry follows original node coordinates and order', geometry_equal)
            if complete:
                mean = [sum(p[k] for p in source_geometry) / len(source_geometry) for k in (0, 1)]
                anchor_check('Representative coordinate equals original geometry arithmetic mean',
                             same_point(saved.get('coordinates'), mean))
                row['representativeCoordinateFromPBF'] = mean
            row['representativeMethod'] = 'mean-of-full-original-ordered-node-coordinates'
            row['originalNodeCount'] = len(refs)
        row['passed'] = all(c['passed'] for c in row['checks'])

    check('Every retained anchor matches its independent original-source checks',
          all(a['passed'] for a in anchor_results))
    # The root agent may append newly verified anchors while this audit runs.
    # A report is only valid for the exact input bytes inspected above.
    check('Snapshot unchanged during audit',
          hashlib.sha256(snapshot_path.read_bytes()).hexdigest() == report['snapshotSHA256'])
    report['counts'] = {
        'anchors': len(anchors), 'standaloneNodes': len(anchors) - len(wanted_ways),
        'ways': len(wanted_ways), 'originalSourceNodes': len(wanted_nodes),
        'waysWithSavedNodeIds': sum(a['type'] == 'way' and 'nodeIds' in a for a in anchors),
        'geometryOnlyWays': sum(a['type'] == 'way' and 'nodeIds' not in a for a in anchors),
    }


try:
    audit()
except Exception as error:
    check('Audit completed without source or parsing errors', False,
          {'errorType': type(error).__name__, 'message': str(error)})
report['passed'] = bool(checks) and all(c['passed'] for c in checks)
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'passed': report['passed'], 'counts': report.get('counts'),
                  'failedChecks': [c for c in checks if not c['passed']],
                  'report': report_path.relative_to(ROOT).as_posix()}, ensure_ascii=False))
raise SystemExit(0 if report['passed'] else 1)
