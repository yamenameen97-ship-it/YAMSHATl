from __future__ import annotations

import mimetypes
import os
import uuid
from io import BytesIO
from pathlib import Path

from flask import send_file
from werkzeug.utils import secure_filename

from db import db_cursor


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


def serve_media_file(storage_key: str, upload_dir: Path):
    safe_key = _normalize_storage_key(storage_key)
    if not safe_key:
        raise FileNotFoundError

    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT original_name, content_type, binary_data FROM media_files WHERE storage_key=%s LIMIT 1",
            (safe_key,),
        )
        row = cur.fetchone()

    if row and row.get("binary_data") is not None:
        response = send_file(
            BytesIO(row["binary_data"]),
            mimetype=row.get("content_type") or "application/octet-stream",
            download_name=row.get("original_name") or safe_key,
            conditional=True,
            max_age=31536000,
        )
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        response.headers["X-Media-Storage"] = "database"
        return response

    file_path = upload_dir / safe_key
    if file_path.exists() and file_path.is_file():
        response = send_file(file_path, conditional=True, max_age=31536000)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        response.headers["X-Media-Storage"] = "filesystem"
        return response

    raise FileNotFoundError
