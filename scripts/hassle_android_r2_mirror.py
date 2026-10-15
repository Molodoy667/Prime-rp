
#!/usr/bin/env python3
"""Stream the public Android resource manifest set into an R2 rclone remote.

No resource payload is written to local disk. Only manifests and a temporary
CSV URL list are kept in memory/temporary storage. Requires Python 3.10+ and
an rclone remote named ``r2`` configured for the destination Cloudflare R2.
"""

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
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


CDN_BASE = "https://dl.hasslecdn.com/game/1.8.9.4"
PLATFORM = "Android"
EXPECTED_ARCHIVES = 64
EXPECTED_LOOSE_FILES = 833
EXPECTED_RESOURCE_ENTRIES = 33_822
EXPECTED_OBJECTS = 899
USER_AGENT = "hassle-android-r2-mirror/1.0"


@dataclass(frozen=True)
class Object:
    url: str
    key: str
    size: int
    md5: str
    content_type: str


def request_bytes(url: str, *, method: str = "GET") -> tuple[bytes, dict[str, str]]:
    request = Request(
        url,
        method=method,
        headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"},
    )
    with urlopen(request, timeout=45) as response:
        body = response.read() if method == "GET" else b""
        return body, {k.lower(): v for k, v in response.headers.items()}


def fetch_json(url: str) -> tuple[object, bytes]:
    body, headers = request_bytes(url)
    if not 200 <= int(headers.get(":status", "200")) < 300:
        raise RuntimeError(f"Unexpected HTTP response for {url}")
    try:
        return json.loads(body), body
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Invalid JSON from {url}: {exc}") from exc


def safe_relative_path(value: object) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError(f"Unsafe manifest path: {value!r}")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise ValueError(f"Unsafe manifest path: {value!r}")
    return "/".join(path.parts)


def source_url(path: str) -> str:
    encoded = quote(path, safe="/-._~")
    return f"{CDN_BASE}/{PLATFORM}/files/{encoded}"


def build_inventory() -> tuple[list[Object], bytes, bytes]:
    files_doc, files_body = fetch_json(f"{CDN_BASE}/{PLATFORM}/files.json")
    archives_doc, archives_body = fetch_json(f"{CDN_BASE}/{PLATFORM}/archives.json")
    if not isinstance(files_doc, dict) or not isinstance(files_doc.get("list"), list):
        raise ValueError("files.json does not contain a list array")
    if len(files_doc["list"]) != EXPECTED_RESOURCE_ENTRIES:
        raise ValueError(f"Expected {EXPECTED_RESOURCE_ENTRIES} resource entries, found {len(files_doc['list'])}")
    if not isinstance(archives_doc, dict):
        raise ValueError("archives.json is not a JSON object")

    archives: dict[int, dict[str, object]] = {}
    for raw_index, record in archives_doc.items():
        index = int(raw_index)
        if not isinstance(record, dict):
            raise ValueError(f"Invalid archive record {raw_index}")
        archives[index] = record
    if len(archives) != EXPECTED_ARCHIVES or set(archives) != set(range(EXPECTED_ARCHIVES)):
        raise ValueError(f"Expected archive indices 0..63, found {sorted(archives)}")

    objects: list[Object] = []
    seen: set[str] = set()

    def add(path_value: object, size_value: object, md5_value: object) -> None:
        path = safe_relative_path(path_value)
        if isinstance(size_value, bool) or not isinstance(size_value, int) or size_value < 0:
            raise ValueError(f"Invalid size for {path}: {size_value!r}")
        if not isinstance(md5_value, str) or not re.fullmatch(r"[0-9a-fA-F]{32}", md5_value):
            raise ValueError(f"Invalid MD5 field for {path}")
        key = f"{PLATFORM}/files/{path}"
        if key in seen:
            raise ValueError(f"Duplicate R2 key: {key}")
        seen.add(key)
        objects.append(Object(source_url(path), key, size_value, md5_value.lower(), "application/octet-stream"))

    for index, record in archives.items():
        add(record.get("path"), record.get("size"), record.get("hash"))

    loose_count = 0
    for record in files_doc["list"]:
        if not isinstance(record, dict):
            raise ValueError("Invalid files.json entry")
        archive = record.get("archive")
        if isinstance(archive, bool) or not isinstance(archive, int):
            raise ValueError(f"Invalid archive index for {record.get('path')!r}")
        if archive == -1:
            loose_count += 1
            add(record.get("path"), record.get("size"), record.get("hash"))
        elif archive not in archives:
            raise ValueError(f"Manifest references unknown archive index {archive}")

    if loose_count != EXPECTED_LOOSE_FILES:
        raise ValueError(f"Expected {EXPECTED_LOOSE_FILES} loose files, found {loose_count}")
    if len(objects) != EXPECTED_ARCHIVES + EXPECTED_LOOSE_FILES:
        raise ValueError(f"Unexpected payload object count: {len(objects)}")

    for name, body in (("files.json", files_body), ("archives.json", archives_body)):
        key = f"{PLATFORM}/{name}"
        if key in seen:
            raise ValueError(f"Manifest key collides with payload: {key}")
        seen.add(key)
        objects.append(
            Object(
                f"{CDN_BASE}/{PLATFORM}/{name}",
                key,
                len(body),
                hashlib.md5(body, usedforsecurity=False).hexdigest(),
                "application/json",
            )
        )
    if len(objects) != EXPECTED_OBJECTS:
        raise ValueError(f"Expected {EXPECTED_OBJECTS} total objects, found {len(objects)}")
    return objects, files_body, archives_body


def head_one(obj: Object) -> tuple[str, str | None, str | None]:
    last_error = "unknown error"
    for attempt in range(4):
        try:
            _, headers = request_bytes(obj.url, method="HEAD")
            length = headers.get("content-length")
            # Some CDN HEAD responses expose a compressed JSON representation;
            # verify JSON GET bodies by byte count and MD5 instead.
            if length is not None and not obj.key.endswith(".json") and int(length) != obj.size:
                return obj.key, length, f"Content-Length {length} != manifest {obj.size}"
            return obj.key, length, None
        except HTTPError as exc:
            last_error = f"HTTP {exc.code}"
            if exc.code not in (429, 500, 502, 503, 504):
                break
        except (URLError, TimeoutError, ValueError) as exc:
            last_error = str(exc)
        time.sleep(min(2**attempt, 8))
    return obj.key, None, last_error


def preflight(objects: list[Object]) -> None:
    failures: list[str] = []
    unknown_length: list[str] = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(head_one, obj) for obj in objects]
        for future in as_completed(futures):
            key, length, error = future.result()
            if error:
                failures.append(f"{key}: {error}")
            elif length is None:
                unknown_length.append(key)
    if failures:
        raise RuntimeError("Source preflight failed:\n" + "\n".join(sorted(failures)))
    print(f"Source HEAD: {len(objects)}/{len(objects)} HTTP 200; sizes matched when Content-Length was present.")
    if unknown_length:
        print(f"No Content-Length on {len(unknown_length)} HEAD responses; stream verification will check bytes and MD5.")


def validate_target(bucket: str, prefix: str) -> str:
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", bucket):
        raise ValueError("Invalid R2 bucket name")
    prefix = prefix.strip("/")
    if prefix and any(part in (".", "..") for part in prefix.split("/")):
        raise ValueError("Invalid R2 object prefix")
    if not prefix:
        raise ValueError("A non-empty R2 prefix is required")
    return f"r2:{bucket}/{prefix}"


def verify(objects: list[Object], target: str) -> None:
    failures: list[str] = []
    for index, obj in enumerate(objects, 1):
        remote = f"{target}/{obj.key}"
        proc = subprocess.Popen(["rclone", "cat", remote], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        assert proc.stdout is not None
        digest = hashlib.md5(usedforsecurity=False)
        size = 0
        while chunk := proc.stdout.read(1024 * 1024):
            size += len(chunk)
            digest.update(chunk)
        stderr = proc.stderr.read() if proc.stderr else b""
        code = proc.wait()
        if code:
            failures.append(f"{obj.key}: rclone cat failed ({stderr.decode(errors='replace').strip()})")
        elif size != obj.size or digest.hexdigest() != obj.md5:
            failures.append(
                f"{obj.key}: got {size} bytes / MD5 {digest.hexdigest()}, expected {obj.size} / {obj.md5}"
            )
        if index % 25 == 0 or index == len(objects):
            print(f"R2 checksum audit: {index}/{len(objects)}")
    if failures:
        raise RuntimeError("R2 checksum audit failed:\n" + "\n".join(failures))
    print(f"R2 checksum audit passed: {len(objects)}/{len(objects)} objects.")


def upload(objects: list[Object], target: str, overwrite: bool) -> None:
    base_args = [
        "rclone",
        "copyurl",
        "--transfers", "1",
        "--checkers", "2",
        "--retries", "10",
        "--low-level-retries", "20",
        "--s3-upload-cutoff", "16M",
        "--s3-upload-concurrency", "1",
        "--stats", "30s",
        "--header-download", "Accept-Encoding: identity",
    ]
    print(f"Streaming {len(objects)} objects to {target}; local temporary data is only the URL list.")
    for index, obj in enumerate(objects, 1):
        args = [*base_args, obj.url, f"{target}/{obj.key}"]
        if not overwrite:
            args.append("--no-clobber")
        proc = subprocess.run(args, text=True, capture_output=True)
        if proc.returncode and "file already exist" not in (proc.stderr or ""):
            raise subprocess.CalledProcessError(
                proc.returncode,
                args,
                output=proc.stdout,
                stderr=proc.stderr,
            )
        if index % 25 == 0 or index == len(objects):
            state = "checked/skipped existing" if proc.returncode else "uploaded"
            print(f"Processed: {index}/{len(objects)} objects ({state})")
    verify(objects, target)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("preflight", "upload", "verify"))
    parser.add_argument("--bucket")
    parser.add_argument("--prefix", default="game/1.8.9.4")
    parser.add_argument("--overwrite", action="store_true", help="overwrite existing R2 keys instead of resuming")
    args = parser.parse_args()

    try:
        objects, _, _ = build_inventory()
        total = sum(obj.size for obj in objects)
        print(f"Android inventory: {len(objects)} objects; manifest sizes sum to {total:,} bytes.")
        if args.mode == "preflight":
            preflight(objects)
            return 0
        if not args.bucket:
            parser.error("--bucket is required for upload/verify")
        target = validate_target(args.bucket, args.prefix)
        if args.mode == "upload":
            preflight(objects)
            upload(objects, target, args.overwrite)
        else:
            verify(objects, target)
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

