#!/usr/bin/env python3
"""Mirror iOS or RADMIR Windows CDN manifests into Cloudflare R2."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import PurePosixPath
from urllib.parse import quote
from urllib.request import Request, urlopen


PLATFORMS = {
    "ios": {
        "base": "https://dl.hasslecdn.com/game/1.8.9.4/iOS",
        "key_prefix": "iOS",
    },
    "windows": {
        "base": "https://rdmr-cdn.samp-dl.com/game/main/build",
        "key_prefix": "build",
    },
}
USER_AGENT = "prime-rp-platform-r2-mirror/1.0"


@dataclass(frozen=True)
class Object:
    url: str
    key: str
    size: int
    md5: str


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"})
    with urlopen(request, timeout=90) as response:
        return response.read()


def safe_path(value: object) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError(f"unsafe manifest path: {value!r}")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise ValueError(f"unsafe manifest path: {value!r}")
    return "/".join(path.parts)


def build_inventory(platform: str) -> tuple[list[Object], bytes, bytes]:
    config = PLATFORMS[platform]
    base = config["base"]
    key_prefix = config["key_prefix"]
    files_body = fetch(f"{base}/files.json")
    archives_body = fetch(f"{base}/archives.json")
    files_doc = json.loads(files_body)
    archives_doc = json.loads(archives_body)
    if not isinstance(files_doc, dict) or not isinstance(files_doc.get("list"), list):
        raise ValueError("files.json does not contain list")
    if not isinstance(archives_doc, dict):
        raise ValueError("archives.json is not an object")

    objects: list[Object] = []
    seen: set[str] = set()

    def add(path_value: object, size_value: object, hash_value: object) -> None:
        path = safe_path(path_value)
        if not isinstance(size_value, int) or isinstance(size_value, bool) or size_value < 0:
            raise ValueError(f"invalid size for {path}: {size_value!r}")
        if not isinstance(hash_value, str) or not re.fullmatch(r"[0-9a-fA-F]{32}", hash_value):
            raise ValueError(f"invalid MD5 for {path}")
        key = f"{key_prefix}/files/{path}"
        if key in seen:
            raise ValueError(f"duplicate key: {key}")
        seen.add(key)
        url = f"{base}/files/{quote(path, safe='/-._~')}"
        objects.append(Object(url, key, size_value, hash_value.lower()))

    for record in archives_doc.values():
        if not isinstance(record, dict):
            raise ValueError("invalid archive record")
        add(record.get("path"), record.get("size"), record.get("hash"))

    for record in files_doc["list"]:
        if not isinstance(record, dict):
            raise ValueError("invalid files.json entry")
        if record.get("archive") == -1:
            add(record.get("path"), record.get("size"), record.get("hash"))

    for name, body in (("files.json", files_body), ("archives.json", archives_body)):
        key = f"{key_prefix}/{name}"
        seen.add(key)
        objects.append(Object(f"{base}/{name}", key, len(body), hashlib.md5(body, usedforsecurity=False).hexdigest()))

    return objects, files_body, archives_body


def validate_target(bucket: str, prefix: str) -> str:
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", bucket):
        raise ValueError("invalid R2 bucket name")
    prefix = prefix.strip("/")
    if prefix and any(part in (".", "..") for part in prefix.split("/")):
        raise ValueError("invalid object prefix")
    return f"r2:{bucket}/{prefix}" if prefix else f"r2:{bucket}"


def preflight(objects: list[Object]) -> None:
    print(f"Source preflight passed: {len(objects)} objects; {sum(x.size for x in objects):,} bytes.")


def upload(objects: list[Object], target: str, overwrite: bool) -> None:
    with tempfile.NamedTemporaryFile("w", newline="", encoding="utf-8", suffix=".csv", delete=False) as handle:
        csv_path = handle.name
        writer = csv.writer(handle, lineterminator="\n")
        for obj in objects:
            writer.writerow((obj.url, obj.key))
    args = ["rclone", "copyurl", "--urls", csv_path, target, "--transfers", "1",
            "--checkers", "2", "--retries", "10", "--low-level-retries", "20",
            "--s3-upload-cutoff", "16M", "--s3-upload-concurrency", "1",
            "--stats", "30s", "--header-download", "Accept-Encoding: identity"]
    if not overwrite:
        args.append("--no-clobber")
    try:
        print(f"Uploading {len(objects)} objects to {target}; existing objects are preserved.")
        subprocess.run(args, check=True)
    finally:
        try:
            os.unlink(csv_path)
        except FileNotFoundError:
            pass


def verify(objects: list[Object], target: str) -> None:
    failures: list[str] = []
    for index, obj in enumerate(objects, 1):
        remote = f"{target}/{obj.key}"
        process = subprocess.run(["rclone", "cat", remote], capture_output=True)
        if process.returncode:
            failures.append(f"{obj.key}: {process.stderr.decode(errors='replace').strip()}")
        else:
            digest = hashlib.md5(process.stdout, usedforsecurity=False).hexdigest()
            if len(process.stdout) != obj.size or digest != obj.md5:
                failures.append(f"{obj.key}: checksum/size mismatch")
        if index % 100 == 0 or index == len(objects):
            print(f"Verified {index}/{len(objects)}", flush=True)
    if failures:
        raise RuntimeError("\n".join(failures[:20]))
    print(f"R2 verification passed: {len(objects)} objects.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("preflight", "upload", "verify"))
    parser.add_argument("--platform", choices=tuple(PLATFORMS), required=True)
    parser.add_argument("--bucket")
    parser.add_argument("--prefix", default="")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    try:
        objects, _, _ = build_inventory(args.platform)
        print(f"{args.platform}: {len(objects)} objects; {sum(x.size for x in objects):,} bytes.", flush=True)
        if args.mode == "preflight":
            preflight(objects)
            return 0
        if not args.bucket:
            parser.error("--bucket is required")
        target = validate_target(args.bucket, args.prefix)
        if args.mode == "upload":
            preflight(objects)
            upload(objects, target, args.overwrite)
        else:
            verify(objects, target)
        return 0
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
