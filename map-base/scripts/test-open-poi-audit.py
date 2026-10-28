#!/usr/bin/env python3
"""Exercise matching, geographic bounds, and provenance on synthetic POIs."""

import importlib.util
import json
import tempfile
from pathlib import Path

import osmium
import pyarrow as pa
import pyarrow.parquet as pq
from shapely.geometry import Point


ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("poi_audit", ROOT / "scripts/audit-open-pois.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
target = {"id": "test", "name": "三样子", "key": audit.normalize("三样子")}

assert audit.matches(["三樣子"], [target])[0]["kind"] == "exact"
assert audit.matches(["重庆三樣子"], [target])[0]["kind"] == "partial"
assert not audit.matches(["不相关餐厅"], [target])
assert audit.overture_labels({"primary": "A", "common": [("zh-Hant", "三樣子")],
                              "rules": [{"value": "别名"}]}) == ["A", "三樣子", "别名"]
assert not audit.matches(["三樣子"], [{"id": "short", "name": "三样", "key": audit.normalize("三样")}])

source = [{"dataset": "test", "license": "CC0-1.0"}]
rows = [
    {"id": "inside", "names": {"primary": "三樣子"}, "addresses": None, "sources": source,
     "geometry": Point(106.5, 29.5).wkb, "version": 1, "confidence": 0.8, "operating_status": "open"},
    {"id": "outside", "names": {"primary": "三樣子"}, "addresses": None, "sources": source,
     "geometry": Point(106.7, 29.5).wkb, "version": 1, "confidence": 0.8, "operating_status": "open"},
    {"id": "bad-geometry", "names": {"primary": "三樣子"}, "addresses": None, "sources": source,
     "geometry": None, "version": 1, "confidence": 0.8, "operating_status": "open"},
]
with tempfile.TemporaryDirectory(prefix="shitu-poi-test-") as directory:
    path = Path(directory) / "sample.parquet"
    pq.write_table(pa.Table.from_pylist(rows), path)
    bounds = (106.4, 29.4, 106.8, 29.6)
    manifest = path.with_name(path.name + ".meta.json")
    metadata = {"sha256": audit.digest(path), "release": "test", "downloadBounds": bounds}
    manifest.write_text(json.dumps(metadata), encoding="utf-8")
    result = audit.audit_places(path, (106.4, 29.4, 106.6, 29.6), bounds, "test", [target])
    assert result["inputRows"] == 3 and result["pointRowsInBounds"] == 1
    assert result["unusableOrNonPointRows"] == 1 and len(result["candidates"]) == 1
    assert result["candidates"][0]["id"] == "inside"
    assert result["candidates"][0]["sources"][0]["license"] == "CC0-1.0"
    metadata["sha256"] = "wrong"
    manifest.write_text(json.dumps(metadata), encoding="utf-8")
    try:
        audit.audit_places(path, (106.4, 29.4, 106.6, 29.6), bounds, "test", [target])
    except ValueError:
        pass
    else:
        raise AssertionError("A manifest with a wrong hash must not be accepted")

    pbf = Path(directory) / "fixture.osm.pbf"
    writer = osmium.SimpleWriter(str(pbf))
    writer.add_node(osmium.osm.mutable.Node(id=1, location=(106.5, 29.5),
                                           tags={"name": "三樣子", "amenity": "restaurant"}))
    writer.add_node(osmium.osm.mutable.Node(id=2, location=(106.7, 29.5), tags={"name": "三樣子"}))
    writer.add_node(osmium.osm.mutable.Node(id=3, location=(106.51, 29.51)))
    writer.add_way(osmium.osm.mutable.Way(id=10, nodes=[1, 3], tags={"name": "三樣子"}))
    writer.add_relation(osmium.osm.mutable.Relation(id=11, members=[("w", 10, "")],
                                                    tags={"name": "三樣子"}))
    writer.close()
    osm = audit.audit_osm(pbf, (106.4, 29.4, 106.6, 29.6), "synthetic", [target])
    assert [(entry["type"], entry["id"]) for entry in osm["candidates"]] == [("node", 1), ("way", 10)]
    assert osm["candidates"][0]["tags"]["amenity"] == "restaurant"
    assert [(entry["type"], entry["id"]) for entry in osm["unresolvedNamedObjects"]] == [("relation", 11)]

print("PASS: names, aliases, bounds, OSM nodes/ways/relations, geometry and manifest/source provenance")
