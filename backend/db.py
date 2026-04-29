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
            CREATE TABLE IF NOT EXISTS user_devices (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                platform TEXT DEFAULT 'android',
                app_version TEXT DEFAULT '',
                last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
            CREATE TABLE IF NOT EXISTS stories (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                media TEXT NOT NULL,
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
            CREATE TABLE IF NOT EXISTS reel_likes (
                id SERIAL PRIMARY KEY,
                reel_id INT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(reel_id, username)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS reel_comments (
                id SERIAL PRIMARY KEY,
                reel_id INT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                comment TEXT NOT NULL,
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
            CREATE TABLE IF NOT EXISTS followers (
                id SERIAL PRIMARY KEY,
                follower TEXT NOT NULL,
                following TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower, following)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS blocked_users (
                id SERIAL PRIMARY KEY,
                blocker TEXT NOT NULL,
                blocked TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(blocker, blocked)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                text TEXT NOT NULL,
                message TEXT NOT NULL,
                seen BOOLEAN NOT NULL DEFAULT FALSE,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                reporter TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_value TEXT NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS friend_requests (
                id SERIAL PRIMARY KEY,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                owner TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(group_id, username)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS group_posts (
                id SERIAL PRIMARY KEY,
                group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS coins (
                username TEXT PRIMARY KEY,
                balance INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS gifts (
                id SERIAL PRIMARY KEY,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                gift TEXT NOT NULL,
                value INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                identifier TEXT NOT NULL,
                delivery_target TEXT NOT NULL,
                channel TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                request_token TEXT NOT NULL UNIQUE,
                reset_token TEXT,
                attempts INT NOT NULL DEFAULT 0,
                verified_at TIMESTAMP NULL,
                expires_at TIMESTAMP NOT NULL,
                consumed_at TIMESTAMP NULL,
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
            ("stories", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("reels", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("messages", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("notifications", "text", "TEXT NOT NULL DEFAULT ''"),
            ("notifications", "message", "TEXT NOT NULL DEFAULT ''"),
            ("notifications", "seen", "BOOLEAN NOT NULL DEFAULT FALSE"),
            ("notifications", "is_read", "BOOLEAN NOT NULL DEFAULT FALSE"),
            ("notifications", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("reports", "status", "TEXT NOT NULL DEFAULT 'open'"),
            ("reports", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("friend_requests", "status", "TEXT NOT NULL DEFAULT 'pending'"),
            ("friend_requests", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("groups", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("group_members", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("group_posts", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("coins", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("gifts", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
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
            ("password_reset_codes", "reset_token", "TEXT"),
            ("password_reset_codes", "attempts", "INT NOT NULL DEFAULT 0"),
            ("password_reset_codes", "verified_at", "TIMESTAMP NULL"),
            ("password_reset_codes", "expires_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("password_reset_codes", "consumed_at", "TIMESTAMP NULL"),
            ("password_reset_codes", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
        ]:
            if _table_exists(cur, table_name):
                _ensure_column(cur, table_name, column_name, ddl)

        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(lower(email))")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_unique ON users(name)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender, receiver, created_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_followers_following ON followers(following)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_notifications_username ON notifications(username, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_rooms_status ON live_rooms(status, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_viewers_room_active ON live_viewers(room_id, active, last_seen DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_comments_room ON live_comments(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_messages_room ON live_messages(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_gifts_room ON live_gifts(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_live_likes_room ON live_likes(room_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_user_created ON password_reset_codes(user_id, created_at DESC)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_active_lookup ON password_reset_codes(request_token, expires_at DESC)")


def set_admin_roles(admin_emails: list[str], admin_usernames: list[str]) -> None:
    admin_emails = [value.strip() for value in admin_emails if value.strip()]
    admin_usernames = [value.strip() for value in admin_usernames if value.strip()]
    if not admin_emails and not admin_usernames:
        return

    with db_cursor(commit=True) as (_conn, cur):
        if admin_emails:
            cur.execute("UPDATE users SET role='admin' WHERE lower(email) = ANY(%s)", ([value.lower() for value in admin_emails],))
        if admin_usernames:
            cur.execute("UPDATE users SET role='admin' WHERE name = ANY(%s)", (admin_usernames,))
