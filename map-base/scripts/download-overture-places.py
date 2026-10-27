#!/usr/bin/env python3
"""Download an Overture Places bbox sample for offline review only."""

import argparse
import hashlib
import json
import re
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.fs as fs
import pyarrow.parquet as pq


ROOT = Path(__file__).resolve().parent.parent


def bbox_arg(value):
    try:
        box = tuple(float(part) for part in value.split(","))
        if len(box) != 4 or not (-180 <= box[0] < box[2] <= 180 and -90 <= box[1] < box[3] <= 90):
            raise ValueError()
        return box
    except ValueError as exc:
        raise argparse.ArgumentTypeError("bbox must be west,south,east,north in WGS84") from exc


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            result.update(chunk)
    return result.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bbox", type=bbox_arg, required=True)
    parser.add_argument("--release", required=True, help="exact release, e.g. 2026-10-21.0")
    parser.add_argument("--output", required=True, help="new .parquet filename in map-base/.local")
    args = parser.parse_args()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}\.\d+", args.release):
        parser.error("--release must be an exact dated Overture release")
    if Path(args.output).name != args.output or not args.output.endswith(".parquet"):
        parser.error("--output must be a .parquet filename, not a path")
    directory = ROOT / ".local"
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / args.output
    manifest = directory / (args.output + ".meta.json")
    if output.exists() or manifest.exists():
        parser.error("output or manifest already exists; choose a new filename")
    source = f"overturemaps-us-west-2/release/{args.release}/theme=places/type=place"
    s3 = fs.S3FileSystem(anonymous=True, region="us-west-2", connect_timeout=12, request_timeout=25)
    dataset = ds.dataset(source, filesystem=s3, format="parquet")
    west, south, east, north = args.bbox
    area = ((pc.field("bbox", "xmin") <= east) & (pc.field("bbox", "xmax") >= west)
            & (pc.field("bbox", "ymin") <= north) & (pc.field("bbox", "ymax") >= south))
    columns = ["id", "names", "addresses", "sources", "geometry", "version", "confidence", "operating_status"]
    table = dataset.to_table(columns=columns, filter=area)
    # Exclusive creation avoids overwriting an existing file, even if another process starts.
    created_output = False
    created_manifest = False
    try:
        with output.open("xb") as stream:
            created_output = True
            pq.write_table(table, stream, compression="zstd")
        metadata = {"source": f"s3://{source}/", "release": args.release, "downloadBounds": args.bbox,
                    "rows": table.num_rows, "sha256": digest(output),
                    "notice": "Sample only. A name match does not establish branch or entrance."}
        with manifest.open("x", encoding="utf-8") as stream:
            created_manifest = True
            stream.write(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    except Exception:
        if created_output:
            output.unlink(missing_ok=True)
        if created_manifest:
            manifest.unlink(missing_ok=True)
        raise
    print(f"Saved {table.num_rows} rows to {output}; metadata: {manifest}")


if __name__ == "__main__":
    main()
