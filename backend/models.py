from __future__ import annotations

from pathlib import Path
import hashlib
import os
import re
import sqlite3
from typing import Iterable

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = (
    os.environ.get("DATABASE_URL")
    or os.environ.get("RENDER_POSTGRES_URL")
    or os.environ.get("POSTGRES_URL")
    or ""
).strip()
USE_POSTGRES = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")
DEFAULT_DB_PATH = "/var/data/yamshat.db" if os.environ.get("RENDER") else str(BASE_DIR / "database.db")
DB_PATH = Path(os.environ.get("DB_PATH", DEFAULT_DB_PATH))
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

if USE_POSTGRES:
    import psycopg
    from psycopg.rows import dict_row


CREATE_TABLE_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower TEXT NOT NULL,
        following TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower, following)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        media TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        video TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reel_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reel_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reel_id, username),
        FOREIGN KEY(reel_id) REFERENCES reels(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reel_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reel_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(reel_id) REFERENCES reels(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        receiver TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        receiver TEXT,
        status TEXT DEFAULT 'pending'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        owner TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        username TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS group_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        username TEXT,
        content TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS live_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        title TEXT,
        status TEXT DEFAULT 'live'
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS blocked_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blocker TEXT NOT NULL,
        blocked TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker, blocked)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_value TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS live_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES live_rooms(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS live_viewers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        viewer_token TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES live_rooms(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS live_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        target TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES live_rooms(id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        "user" TEXT,
        event TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
]


def _adapt_statement_for_postgres(sql: str) -> str:
    updated = re.sub(r"INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT", "SERIAL PRIMARY KEY", sql, flags=re.IGNORECASE)
    updated = re.sub(r"\bDATETIME\b", "TIMESTAMP", updated, flags=re.IGNORECASE)
    return updated


class CursorWrapper:
    def __init__(self, cursor, use_postgres: bool):
        self._cursor = cursor
        self._use_postgres = use_postgres
        self.lastrowid = None

    def execute(self, query: str, params: Iterable | None = None):
        sql = query
        if self._use_postgres:
            sql = sql.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            if "INSERT OR IGNORE INTO" in query and "ON CONFLICT" not in sql.upper():
                sql = f"{sql} ON CONFLICT DO NOTHING"
            sql = sql.replace("?", "%s")
        self._cursor.execute(sql, tuple(params or ()))
        if not self._use_postgres:
            self.lastrowid = getattr(self._cursor, "lastrowid", None)
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        return self._cursor.close()

    def __iter__(self):
        return iter(self._cursor)

    def __getattr__(self, item):
        return getattr(self._cursor, item)


class ConnectionWrapper:
    def __init__(self, connection, use_postgres: bool):
        self._connection = connection
        self._use_postgres = use_postgres

    def cursor(self):
        return CursorWrapper(self._connection.cursor(), self._use_postgres)

    def commit(self):
        return self._connection.commit()

    def rollback(self):
        return self._connection.rollback()

    def close(self):
        return self._connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type:
                self.rollback()
            else:
                self.commit()
        finally:
            self.close()

    def __getattr__(self, item):
        return getattr(self._connection, item)



def get_connection() -> ConnectionWrapper:
    if USE_POSTGRES:
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        return ConnectionWrapper(conn, True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return ConnectionWrapper(conn, False)



def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()



def ensure_column(cursor, table: str, column: str, ddl: str) -> None:
    if USE_POSTGRES:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=?
            """,
            (table,),
        )
        columns = {row["column_name"] for row in cursor.fetchall()}
    else:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = {row[1] for row in cursor.fetchall()}

    if column not in columns:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")



def insert_and_get_id(cursor, query: str, params: Iterable | None = None) -> int:
    if USE_POSTGRES:
        sql = query.rstrip().rstrip(";") + " RETURNING id"
        cursor.execute(sql, params or ())
        row = cursor.fetchone()
        return int(row["id"])
    cursor.execute(query, params or ())
    return int(cursor.lastrowid or 0)



def recent_timestamp_condition(column: str, seconds: int) -> str:
    safe_seconds = max(int(seconds), 1)
    if USE_POSTGRES:
        return f"{column} >= CURRENT_TIMESTAMP - INTERVAL '{safe_seconds} seconds'"
    return f"{column} >= datetime('now', '-{safe_seconds} seconds')"



def init_db() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    for statement in CREATE_TABLE_STATEMENTS:
        cursor.execute(_adapt_statement_for_postgres(statement) if USE_POSTGRES else statement)

    ensure_column(cursor, "users", "fcm_token", "TEXT")
    ensure_column(cursor, "posts", "media", "TEXT")

    conn.commit()
    conn.close()
