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


# =========================
# إنشاء الجداول بشكل صحيح
# =========================

def init_db() -> None:
    with db_cursor(commit=True) as (_conn, cur):

        # ================= USERS =================
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT,
            role TEXT DEFAULT 'user'
        )
        """)

        # ================= LIVE ROOMS =================
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

        # ================= LIVE MESSAGES =================
        cur.execute("""
        CREATE TABLE IF NOT EXISTS live_messages (
            id SERIAL PRIMARY KEY,
            room_id INT,
            user_id INT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT live_messages_room_id_fkey
                FOREIGN KEY (room_id)
                REFERENCES live_rooms(id)
                ON DELETE CASCADE
        )
        """)

        # ================= إصلاح العلاقات القديمة =================
        # حذف constraint القديم إذا ما فيه CASCADE
        cur.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'live_messages_room_id_fkey'
            ) THEN
                ALTER TABLE live_messages
                DROP CONSTRAINT live_messages_room_id_fkey;
            END IF;
        END $$;
        """)

        # إعادة إضافته مع CASCADE
        cur.execute("""
        ALTER TABLE live_messages
        ADD CONSTRAINT live_messages_room_id_fkey
        FOREIGN KEY (room_id)
        REFERENCES live_rooms(id)
        ON DELETE CASCADE;
        """)

        # ================= تنظيف آمن =================

        # حذف الغرف الفارغة (CASCADE يحذف الرسائل تلقائي)
        cur.execute("""
        DELETE FROM live_rooms
        WHERE livekit_room IS NULL OR livekit_room = ''
        """)

        # حذف التكرار
        cur.execute("""
        DELETE FROM live_rooms a
        USING live_rooms b
        WHERE a.id < b.id
        AND a.livekit_room = b.livekit_room
        """)

        # ================= INDEXES =================

        cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
        ON users(lower(email))
        """)

        cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_unique
        ON users(name)
        """)

        cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_live_rooms_livekit_room_unique
        ON live_rooms(livekit_room)
        """)


# =========================
# صلاحيات الأدمن
# =========================

def set_admin_roles(admin_emails: list[str], admin_usernames: list[str]) -> None:
    admin_emails = [v.strip() for v in admin_emails if v.strip()]
    admin_usernames = [v.strip() for v in admin_usernames if v.strip()]

    if not admin_emails and not admin_usernames:
        return

    with db_cursor(commit=True) as (_conn, cur):
        if admin_emails:
            cur.execute(
                "UPDATE users SET role='admin' WHERE lower(email)=ANY(%s)",
                ([v.lower() for v in admin_emails],)
            )

        if admin_usernames:
            cur.execute(
                "UPDATE users SET role='admin' WHERE name=ANY(%s)",
                (admin_usernames,)
            )
