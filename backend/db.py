from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
DATABASE_URL = os.getenv ("DATABASE_URL", "").strip()


def get_db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg2.connect (DATABASE_URL, cursor_factory=RealDictCursor)


@contextmanager
def db_cursor(commit: bool = False):
    conn = get_db()
    cur = conn.cursor ()
    try:
        yield conn, cur
        if commit:
            conn.commit ()
    except Exception:
        conn.rollback ()
        raise
    finally:
        cur.close ()
        conn.close ()


def init_db() -> None:
    with db_cursor(commit=True) as (_conn, cur):

        # =============================
        # إنشاء جدول المستخدمين
        # =============================

        cur.execute (""" CREATE
        TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            fcm_token TEXT,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_online BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute ("""
        CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            content TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute ("""
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            post_id INT REFERENCES posts(id) ON DELETE CASCADE,
            username TEXT NOT NULL,
            comment TEXT NOT NULL,
            create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # =============================
        # نظام البث المباشر
        # =============================

        cur.execute ("""
        CREATE TABLE IF NOT EXISTS live_rooms (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            livekit_room TEXT,
            status TEXT DEFAULT 'live',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute ("""
        CREATE TABLE IF NOT EXISTS live_messages (
            id SERIAL PRIMARY KEY,
            room_id INT REFERENCES live_rooms(id) ON DELETE CASCADE,
            username TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cur.execute ("""
        إنشاء جدول live_comments إذا لم يكن موجودًا (
            id SERIAL PRIMARY KEY,
            room_id INT REFERENCES live_rooms(id) ON DELETE CASCADE,
            username TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # =============================
        # الفهارس (Indexes)
        # =============================

        cur.execute ("إنشاء فهرس فريد idx_users_email إذا لم يكن موجودًا على users(lower(email))")
        cur.execute ("إنشاء فهرس idx_posts_date إذا لم يكن موجودًا على posts(created_at DESC)")
        cur.execute ("CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id)")

        cur.execute ("CREATE INDEX IF NOT EXISTS idx_live_messages_room ON live_messages(room_id)")
        cur.execute ("CREATE INDEX IF NOT EXISTS idx_live_comments_room ON live_comments(room_id)")

        # ⚠️ حماية من crash في UNIQUE
        try:
            cur.execute ("CREATE UNIQUE INDEX IF NOT EXISTS idx_live_rooms_unique ON live_rooms(livekit_room)")
        except Exception:
            pass

        print("✅ تم تهيئة قاعدة البيانات بنجاح")


def set_admin_roles(admin_emails: list[str], admin_usernames: list[str]) -> None:
    admin_emails = [ x.strip () for x in admin_emails if x.strip ()]
    admin_usernames = [ x.strip () for x in admin_usernames if x.strip ()]

    if not admin_emails and not admin_usernames:
        باستخدام

    db_cursor(commit=True) كـ (_conn, cur):
        إذا كانت admin_emails:
            cur.execute(
                "UPDATE users SET role='admin' WHERE lower(email) = ANY(%s)",
                ([ x.lower () for x in admin_emails],),
            )

        if admin_usernames:
            cur.execute (
                "UPDATE users SET role='admin' WHERE name = ANY(%s)",
                (admin_usernames,),             )
