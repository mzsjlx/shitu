#!/usr/bin/env python3
"""Find review candidates in local open POI data; never updates map data."""

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
import unicodedata
from contextlib import contextmanager
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parent.parent
CONVERT = OpenCC("t2s").convert
OSM_NAME_TAGS = ("name", "alt_name", "official_name", "name:zh", "name:zh-Hans", "name:zh-Hant", "name:en")
OSM_EVIDENCE_TAGS = OSM_NAME_TAGS + (
    "amenity", "shop", "cuisine", "addr:street", "addr:housenumber", "addr:unit", "addr:full", "building", "operator",
)


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            result.update(chunk)
    return result.hexdigest()


def bbox_arg(value):
    try:
        box = tuple(float(part) for part in value.split(","))
        if len(box) != 4 or not (-180 <= box[0] < box[2] <= 180 and -90 <= box[1] < box[3] <= 90):
            raise ValueError()
        return box
    except ValueError as exc:
        raise argparse.ArgumentTypeError("bbox must be west,south,east,north in WGS84") from exc


def inside(point, box):
    return box[0] <= point[0] <= box[2] and box[1] <= point[1] <= box[3]


def covers(outer, inner):
    return outer[0] <= inner[0] and outer[1] <= inner[1] and outer[2] >= inner[2] and outer[3] >= inner[3]


def normalize(value):
    text = CONVERT(unicodedata.normalize("NFKC", str(value or ""))).casefold()
    return re.sub(r"[^\w\u4e00-\u9fff]", "", text)


def matches(labels, targets):
    normalized = [(label, normalize(label)) for label in labels if isinstance(label, str)]
    found = []
    for target in targets:
        key = target["key"]
        if len(key) < 3:
            continue
        matched = [(label, value) for label, value in normalized if len(value) >= 3 and (key in value or value in key)]
        if matched:
            found.append({
                "targetId": target["id"],
                "targetName": target["name"],
                "labels": [label for label, _ in matched],
                "kind": "exact" if any(key == value for _, value in matched) else "partial",
            })
    return found


def overture_labels(names):
    names = names or {}
    labels = [names.get("primary")]
    common = names.get("common") or []
    if isinstance(common, dict):
        labels.extend(common.values())
    else:
        for entry in common:
            if isinstance(entry, dict):
                labels.append(entry.get("value"))
            elif isinstance(entry, (tuple, list)) and len(entry) == 2:
                labels.append(entry[1])
    labels.extend(entry.get("value") for entry in (names.get("rules") or []) if isinstance(entry, dict))
    return [label for label in labels if isinstance(label, str)]


def audit_places(path, box, input_box, release, targets):
    import pyarrow.parquet as parquet
    from shapely import wkb

    file_sha256 = digest(path)
    manifest_path = path.with_name(path.name + ".meta.json")
    manifest_status = "not present; release and input bounds supplied by caller"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if (manifest.get("sha256") != file_sha256 or manifest.get("release") != release
                or tuple(manifest.get("downloadBounds") or ()) != tuple(input_box)):
            raise ValueError("Places sample does not match its manifest, release, or declared bounds")
        manifest_status = "sample hash, release and input bounds match local manifest"
    columns = ["id", "names", "addresses", "sources", "geometry", "version", "confidence", "operating_status"]
    table = parquet.read_table(path, columns=columns)
    checked, unusable_geometry, candidates = 0, 0, []
    for row in table.to_pylist():
        try:
            geometry = wkb.loads(row["geometry"]) if row.get("geometry") else None
        except Exception:
            geometry = None
        if geometry is None or geometry.geom_type != "Point" or geometry.is_empty:
            unusable_geometry += 1
            continue
        point = [geometry.x, geometry.y]
        if not inside(point, box):
            continue
        checked += 1
        hits = matches(overture_labels(row.get("names")), targets)
        if hits:
            candidates.append({
                "id": row["id"], "matches": hits, "coordinates": point,
                "addresses": row.get("addresses"), "sources": row.get("sources"),
                "version": row.get("version"), "confidence": row.get("confidence"),
                "operatingStatus": row.get("operating_status"),
            })
    return {
        "provider": "Overture Maps Foundation Places", "release": release,
        "source": f"s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/",
        "file": path.name, "sha256": file_sha256, "declaredInputBounds": input_box,
        "manifestStatus": manifest_status,
        "inputRows": table.num_rows, "pointRowsInBounds": checked,
        "unusableOrNonPointRows": unusable_geometry, "candidates": candidates,
    }


@contextmanager
def osm_reader_path(path):
    # Some Windows pyosmium builds cannot open paths containing Chinese characters.
    if sys.platform == "win32" and not str(path).isascii():
        with tempfile.TemporaryDirectory(prefix="shitu-osm-audit-") as directory:
            copy = Path(directory) / "input.osm.pbf"
            if not str(copy).isascii():
                raise ValueError("pyosmium requires an ASCII temp path on this Windows installation; set TEMP to one")
            shutil.copyfile(path, copy)
            if digest(copy) != digest(path):
                raise ValueError("Temporary OSM copy did not match the original")
            yield copy
    else:
        yield path


def audit_osm(path, box, source_url, targets):
    import osmium

    candidates, ways, unresolved = [], [], []
    with osm_reader_path(path) as reader_path:
        reader = osmium.io.Reader(str(reader_path))
        try:
            replication = reader.header().get("osmosis_replication_timestamp")
        finally:
            reader.close()
        for obj in osmium.FileProcessor(str(reader_path)):
            tags = {tag.k: tag.v for tag in obj.tags if tag.k in OSM_EVIDENCE_TAGS}
            labels = []
            for key in OSM_NAME_TAGS:
                if key in tags:
                    labels.extend(part.strip() for part in tags[key].split(";") if part.strip())
            if not labels:
                continue
            hits = matches(labels, targets)
            if not hits:
                continue
            row = {"id": obj.id, "matches": hits, "tags": tags, "version": obj.version,
                   "timestamp": str(obj.timestamp)}
            if obj.is_node():
                row["type"] = "node"
                if obj.location.valid():
                    point = [obj.location.lon, obj.location.lat]
                    if inside(point, box):
                        row["coordinates"] = point
                        candidates.append(row)
                else:
                    unresolved.append({**row, "reason": "node has no usable coordinates"})
            elif obj.is_way():
                ways.append(({**row, "type": "way"}, [node.ref for node in obj.nodes]))
            elif obj.is_relation():
                unresolved.append({**row, "type": "relation", "reason": "relation location not resolved"})
        refs = {node_id for _, nodes in ways for node_id in nodes}
        points = {}
        if refs:
            for obj in osmium.FileProcessor(str(reader_path), osmium.osm.NODE):
                if obj.id in refs and obj.location.valid():
                    points[obj.id] = [obj.location.lon, obj.location.lat]
        for row, nodes in ways:
            coords = [points[node_id] for node_id in nodes if node_id in points]
            if not nodes or len(coords) != len(nodes):
                unresolved.append({**row, "reason": "way nodes could not all be resolved"})
                continue
            # Bounding-box overlap is deliberately broad; a reviewer must inspect the way.
            way_box = (min(p[0] for p in coords), min(p[1] for p in coords),
                       max(p[0] for p in coords), max(p[1] for p in coords))
            if way_box[0] <= box[2] and way_box[2] >= box[0] and way_box[1] <= box[3] and way_box[3] >= box[1]:
                candidates.append({**row, "geometryBounds": way_box, "nodeCount": len(coords)})
    return {
        "provider": "OpenStreetMap via Geofabrik", "source": source_url,
        "file": path.name, "sha256": digest(path), "replicationTimestamp": replication,
        "candidates": candidates, "unresolvedNamedObjects": unresolved,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bbox", type=bbox_arg, required=True, help="query bounds: west,south,east,north, WGS84")
    parser.add_argument("--pbf", type=Path, help="local Geofabrik OSM extract")
    parser.add_argument("--osm-url", help="source URL for the exact OSM extract")
    parser.add_argument("--places", type=Path, help="local Overture Places GeoParquet sample")
    parser.add_argument("--places-input-bbox", type=bbox_arg, help="bounds used to download the Places sample")
    parser.add_argument("--release", help="Overture release used to download the sample")
    parser.add_argument("--output", help="report filename within map-base/.local (otherwise print JSON)")
    args = parser.parse_args()
    if not args.pbf and not args.places:
        parser.error("supply --pbf, --places, or both")
    if args.places and (not args.places_input_bbox or not args.release):
        parser.error("--places requires --places-input-bbox and --release for provenance")
    if args.places and not covers(args.places_input_bbox, args.bbox):
        parser.error("the supplied Places sample bounds must cover the requested query bounds")
    if args.output and (Path(args.output).name != args.output or args.output in (".", "..")):
        parser.error("--output must be a filename, not a path")
    if args.output and (ROOT / ".local" / args.output).exists():
        parser.error("output already exists; choose a new filename")
    catalog = json.loads((ROOT / "data/video-library.json").read_text(encoding="utf-8"))
    targets = [{"id": segment["id"], "name": segment["name"], "key": normalize(segment["name"])}
               for source in catalog["sources"] for segment in source["segments"]]
    result = {
        "queryBounds": args.bbox, "catalog": "data/video-library.json", "targetCount": len(targets),
        "excludedShortTargetIds": [target["id"] for target in targets if len(target["key"]) < 3],
        "method": "NFKC, traditional-to-simplified, casefold; exact or substring name match, minimum 3 characters",
        "notice": "Review candidates only: name matches do not establish branch, entrance, permission, or route eligibility.",
        "sources": [],
    }
    if args.pbf:
        result["sources"].append(audit_osm(args.pbf.resolve(strict=True), args.bbox, args.osm_url, targets))
    if args.places:
        result["sources"].append(audit_places(args.places.resolve(strict=True), args.bbox, args.places_input_bbox, args.release, targets))
    report = json.dumps(result, ensure_ascii=False, indent=2, default=str) + "\n"
    if args.output:
        output = ROOT / ".local" / args.output
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("x", encoding="utf-8") as stream:
            stream.write(report)
        print(f"Review report: {output}")
    else:
        print(report, end="")


if __name__ == "__main__":
    main()
