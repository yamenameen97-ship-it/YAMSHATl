from __future__ import annotations

import mimetypes
import os
import re
import uuid
from io import BytesIO
from pathlib import Path

from flask import Response, request, send_file
from werkzeug.utils import secure_filename

from db import db_cursor

_RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


def _normalize_storage_key(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if "/uploads/" in text:
        text = text.split("/uploads/")[-1].split("?")[0]
    return Path(text).name


def save_media_upload(file_storage, allowed_exts: set[str], upload_dir: Path) -> str:
    raw_name = secure_filename(file_storage.filename or "")
    if not raw_name:
        raise ValueError("اسم الملف غير صالح")

    ext = Path(raw_name).suffix.lower().replace(".", "")
    if ext not in allowed_exts:
        raise ValueError("نوع الملف غير مدعوم")

    storage_key = f"{uuid.uuid4().hex}.{ext}"
    content_type = (getattr(file_storage, "mimetype", "") or mimetypes.guess_type(raw_name)[0] or "application/octet-stream").strip()
    payload = file_storage.read()
    if not payload:
        raise ValueError("الملف المرفوع فارغ")

    upload_dir.mkdir(parents=True, exist_ok=True)
    try:
        (upload_dir / storage_key).write_bytes(payload)
    except OSError:
        pass

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            INSERT INTO media_files(storage_key, original_name, content_type, file_size, binary_data)
            VALUES(%s,%s,%s,%s,%s)
            ON CONFLICT (storage_key)
            DO UPDATE SET
                original_name = EXCLUDED.original_name,
                content_type = EXCLUDED.content_type,
                file_size = EXCLUDED.file_size,
                binary_data = EXCLUDED.binary_data,
                created_at = CURRENT_TIMESTAMP
            """,
            (storage_key, raw_name, content_type, len(payload), payload),
        )

    return storage_key


def delete_media_file(media_value: str | None, upload_dir: Path) -> None:
    storage_key = _normalize_storage_key(media_value)
    if not storage_key:
        return

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("DELETE FROM media_files WHERE storage_key=%s", (storage_key,))

    file_path = upload_dir / storage_key
    if file_path.exists() and file_path.is_file():
        try:
            os.remove(file_path)
        except OSError:
            pass


def _byte_range_from_request(total_size: int) -> tuple[int, int] | None:
    range_header = str(request.headers.get("Range") or "").strip()
    if not range_header:
        return None
    match = _RANGE_RE.match(range_header)
    if not match or total_size <= 0:
        return None

    start_raw, end_raw = match.groups()
    if start_raw == "" and end_raw == "":
        return None

    if start_raw == "":
        suffix_length = int(end_raw or 0)
        if suffix_length <= 0:
            return None
        start = max(total_size - suffix_length, 0)
        end = total_size - 1
        return start, end

    start = int(start_raw)
    end = int(end_raw) if end_raw else total_size - 1
    if start >= total_size:
        return None
    end = min(end, total_size - 1)
    if end < start:
        return None
    return start, end


def _build_partial_response(payload: bytes, content_type: str, download_name: str) -> Response:
    total_size = len(payload)
    byte_range = _byte_range_from_request(total_size)
    if not byte_range:
        response = send_file(
            BytesIO(payload),
            mimetype=content_type or "application/octet-stream",
            download_name=download_name,
            conditional=False,
            max_age=31536000,
        )
        response.headers["Content-Length"] = str(total_size)
        response.headers["Accept-Ranges"] = "bytes"
        return response

    start, end = byte_range
    chunk = payload[start : end + 1]
    response = Response(chunk, 206, mimetype=content_type or "application/octet-stream", direct_passthrough=True)
    response.headers["Content-Range"] = f"bytes {start}-{end}/{total_size}"
    response.headers["Accept-Ranges"] = "bytes"
    response.headers["Content-Length"] = str(len(chunk))
    response.headers["Content-Disposition"] = f'inline; filename="{download_name}"'
    return response


def serve_media_file(storage_key: str, upload_dir: Path):
    safe_key = _normalize_storage_key(storage_key)
    if not safe_key:
        raise FileNotFoundError

    file_path = upload_dir / safe_key
    if file_path.exists() and file_path.is_file():
        response = send_file(file_path, conditional=True, max_age=31536000)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        response.headers["Accept-Ranges"] = "bytes"
        response.headers["X-Media-Storage"] = "filesystem"
        return response

    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT original_name, content_type, binary_data FROM media_files WHERE storage_key=%s LIMIT 1",
            (safe_key,),
        )
        row = cur.fetchone()

    if row and row.get("binary_data") is not None:
        response = _build_partial_response(
            row["binary_data"],
            row.get("content_type") or "application/octet-stream",
            row.get("original_name") or safe_key,
        )
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        response.headers["X-Media-Storage"] = "database"
        return response

    raise FileNotFoundError
