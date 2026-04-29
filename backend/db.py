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
    return bool(cur.fetchone()["exists"])


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


def init_db() -> None:
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                media TEXT,
                likes INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id INT REFERENCES posts(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS reels (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                video TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS post_likes (
                id SERIAL PRIMARY KEY,
                post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, username)
            )
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_rooms (
                id SERIAL PRIMARY KEY,
                host_id INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'live',
                stream_mode TEXT NOT NULL DEFAULT 'livekit_sfu',
                livekit_room TEXT NOT NULL UNIQUE,
                platform TEXT DEFAULT 'web',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_viewers (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL REFERENCES live_rooms(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                socket_id TEXT,
                platform TEXT DEFAULT 'web',
                device_type TEXT DEFAULT 'browser',
                is_host BOOLEAN NOT NULL DEFAULT FALSE,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_comments (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL REFERENCES live_rooms(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_messages (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL REFERENCES live_rooms(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_gifts (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL REFERENCES live_rooms(id) ON DELETE CASCADE,
                sender INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                gift_name TEXT NOT NULL,
                gift_value INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS live_likes (
                id SERIAL PRIMARY KEY,
                room_id INT NOT NULL REFERENCES live_rooms(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                username TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        for table_name, column_name, ddl in [
            ("users", "role", "TEXT NOT NULL DEFAULT 'user'"),
            ("users", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("posts", "media", "TEXT"),
            ("posts", "likes", "INT NOT NULL DEFAULT 0"),
            ("posts", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("comments", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("reels", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("messages", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_rooms", "host_id", "INT"),
            ("live_rooms", "username", "TEXT NOT NULL DEFAULT ''"),
            ("live_rooms", "title", "TEXT NOT NULL DEFAULT ''"),
            ("live_rooms", "status", "TEXT NOT NULL DEFAULT 'live'"),
            ("live_rooms", "stream_mode", "TEXT NOT NULL DEFAULT 'livekit_sfu'"),
            ("live_rooms", "livekit_room", "TEXT NOT NULL DEFAULT ''"),
            ("live_rooms", "platform", "TEXT DEFAULT 'web'"),
            ("live_rooms", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_rooms", "ended_at", "TIMESTAMP NULL"),
            ("live_viewers", "user_id", "INT"),
            ("live_viewers", "socket_id", "TEXT"),
            ("live_viewers", "platform", "TEXT DEFAULT 'web'"),
            ("live_viewers", "device_type", "TEXT DEFAULT 'browser'"),
            ("live_viewers", "is_host", "BOOLEAN NOT NULL DEFAULT FALSE"),
            ("live_viewers", "active", "BOOLEAN NOT NULL DEFAULT TRUE"),
            ("live_viewers", "joined_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_viewers", "last_seen", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_comments", "user_id", "INT"),
            ("live_comments", "username", "TEXT NOT NULL DEFAULT ''"),
            ("live_comments", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_messages", "user_id", "INT"),
            ("live_messages", "username", "TEXT NOT NULL DEFAULT ''"),
            ("live_messages", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_gifts", "sender", "INT"),
            ("live_gifts", "username", "TEXT NOT NULL DEFAULT ''"),
            ("live_gifts", "gift_name", "TEXT NOT NULL DEFAULT ''"),
            ("live_gifts", "gift_value", "INT NOT NULL DEFAULT 0"),
            ("live_gifts", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("live_likes", "user_id", "INT"),
            ("live_likes", "username", "TEXT NOT NULL DEFAULT ''"),
            ("live_likes", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
        ]:
            if _table_exists(cur, table_name):
                _ensure_column(cur, table_name, column_name, ddl)

        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_unique ON users(name)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender, receiver, created_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_rooms_status ON live_rooms(status, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_viewers_room_active ON live_viewers(room_id, active, last_seen DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_comments_room ON live_comments(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_messages_room ON live_messages(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_gifts_room ON live_gifts(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_likes_room ON live_likes(room_id, created_at DESC)")


def set_admin_roles(admin_emails: list[str], admin_usernames: list[str]) -> None:
    admin_emails = [value.strip() for value in admin_emails if value.strip()]
    admin_usernames = [value.strip() for value in admin_usernames if value.strip()]
    if not admin_emails and not admin_usernames:
        return

    with db_cursor(commit=True) as (_conn, cur):
        if admin_emails:
            cur.execute("UPDATE users SET role='admin' WHERE email = ANY(%s)", (admin_emails,))
        if admin_usernames:
            cur.execute("UPDATE users SET role='admin' WHERE name = ANY(%s)", (admin_usernames,))
