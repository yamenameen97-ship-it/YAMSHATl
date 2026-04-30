from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def get_db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


@contextmanager
def db_cursor(commit: bool = False):
    conn = get_db()
    cur = conn.cursor()
    try:
        yield conn, cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def _table_exists(cur, table_name: str) -> bool:
    cur.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema='public' AND table_name=%s
        ) AS exists
        """,
        (table_name,),
    )
    return bool((cur.fetchone() or {}).get("exists"))


def _get_columns(cur, table_name: str) -> set[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s
        """,
        (table_name,),
    )
    return {row["column_name"] for row in cur.fetchall()}


def _ensure_column(cur, table_name: str, column_name: str, ddl: str) -> None:
    if column_name not in _get_columns(cur, table_name):
        cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}")


def _get_column_data_type(cur, table_name: str, column_name: str) -> str | None:
    cur.execute(
        """
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s AND column_name=%s
        LIMIT 1
        """,
        (table_name, column_name),
    )
    row = cur.fetchone() or {}
    return row.get("data_type")


def _coerce_column_to_boolean(cur, table_name: str, column_name: str) -> None:
    data_type = _get_column_data_type(cur, table_name, column_name)
    if not data_type or data_type == "boolean":
        return

    cur.execute(f"ALTER TABLE {table_name} ALTER COLUMN {column_name} DROP DEFAULT")
    cur.execute(
        f"""
        ALTER TABLE {table_name}
        ALTER COLUMN {column_name} TYPE BOOLEAN
        USING CASE
            WHEN {column_name} IS NULL THEN FALSE
            WHEN lower(trim({column_name}::text)) IN ('1','true','t','yes','y','on') THEN TRUE
            ELSE FALSE
        END
        """
    )
    cur.execute(f"UPDATE {table_name} SET {column_name}=FALSE WHERE {column_name} IS NULL")
    cur.execute(f"ALTER TABLE {table_name} ALTER COLUMN {column_name} SET DEFAULT FALSE")
    cur.execute(f"ALTER TABLE {table_name} ALTER COLUMN {column_name} SET NOT NULL")


def init_db() -> None:
    with db_cursor(commit=True) as (_conn, cur):

        # --- (كل الجداول كما هي بدون تغيير) ---

        cur.execute("""
        CREATE TABLE IF NOT EXISTS live_rooms (
            id SERIAL PRIMARY KEY,
            host_id INT REFERENCES users(id) ON DELETE SET NULL,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'live',
            stream_mode TEXT NOT NULL DEFAULT 'livekit_sfu',
            livekit_room TEXT NOT NULL,
            platform TEXT DEFAULT 'web',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL
        )
        """)

        # --- إصلاح المشكلة ---
        cur.execute("""
        DELETE FROM live_rooms
        WHERE livekit_room IS NULL OR livekit_room = ''
        """)

        cur.execute("""
        DELETE FROM live_rooms a
        USING live_rooms b
        WHERE a.id < b.id
        AND a.livekit_room = b.livekit_room
        """)

        # --- باقي الأكواد كما هي ---
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(lower(email))")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_unique ON users(name)")

        # --- تم استبدال هذا السطر ---
        cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_live_rooms_livekit_room_unique
        ON live_rooms(livekit_room)
        """)


def set_admin_roles(admin_emails: list[str], admin_usernames: list[str]) -> None:
    admin_emails = [v.strip() for v in admin_emails if v.strip()]
    admin_usernames = [v.strip() for v in admin_usernames if v.strip()]
    if not admin_emails and not admin_usernames:
        return

    with db_cursor(commit=True) as (_conn, cur):
        if admin_emails:
            cur.execute("UPDATE users SET role='admin' WHERE lower(email)=ANY(%s)", ([v.lower() for v in admin_emails],))
        if admin_usernames:
            cur.execute("UPDATE users SET role='admin' WHERE name=ANY(%s)", (admin_usernames,))
