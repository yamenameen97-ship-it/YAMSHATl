"""
v88.17 — Deep root-cause patch for Voice Rooms creation failure
================================================================
هذا الملف يُشغَّل من داخل `initialize_database` (bootstrap.py) لضمان أن جداول
الغرف الصوتية موجودة **بأي ثمن**، حتى لو فشلت `Base.metadata.create_all`
بسبب أخطاء FK/sequence على PostgreSQL في Render.

السبب الجذري السابق (v88.13) لم يكفِ:
  • `_ensure_voice_rooms_tables` كان يعتمد على `Base.metadata.create_all`،
    وإذا فشل بسبب FK إلى `groups.id` (اللي قد لا يكون موجود بعد) الجدول
    لا يُنشأ نهائياً → 500 من `create_room` → فرونت يعرض
    "خدمة الغرف الصوتية غير متوفرة حالياً".
  • هنا نُنشئ الجداول بـ raw SQL بدون أي FK، ثم نضيف الأعمدة الاختيارية
    بشكل idempotent. هذا يعمل حتى لو كانت `groups` غير موجودة.
"""
from __future__ import annotations
import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

_log = logging.getLogger(__name__)


_CREATE_VOICE_ROOMS_PG = """
CREATE TABLE IF NOT EXISTS voice_rooms (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    group_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    cover_image VARCHAR(500) NULL,
    background_id INTEGER NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'general',
    language VARCHAR(10) NOT NULL DEFAULT 'ar',
    seats_count INTEGER NOT NULL DEFAULT 8,
    max_listeners INTEGER NOT NULL DEFAULT 1000,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    agora_channel VARCHAR(120) NULL UNIQUE,
    current_listeners INTEGER NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 0,
    total_gifts_value INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP NULL
);
"""

_CREATE_VOICE_ROOM_MEMBERS_PG = """
CREATE TABLE IF NOT EXISTS voice_room_members (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'listener',
    seat_index INTEGER NULL,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP NULL
);
"""

_CREATE_VOICE_ROOM_MESSAGES_PG = """
CREATE TABLE IF NOT EXISTS voice_room_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    msg_type VARCHAR(20) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
"""

_CREATE_VOICE_ROOMS_SQLITE = """
CREATE TABLE IF NOT EXISTS voice_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    group_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    cover_image VARCHAR(500) NULL,
    background_id INTEGER NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'general',
    language VARCHAR(10) NOT NULL DEFAULT 'ar',
    seats_count INTEGER NOT NULL DEFAULT 8,
    max_listeners INTEGER NOT NULL DEFAULT 1000,
    is_private BOOLEAN NOT NULL DEFAULT 0,
    password_hash VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    agora_channel VARCHAR(120) NULL UNIQUE,
    current_listeners INTEGER NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 0,
    total_gifts_value INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL
);
"""

_CREATE_VOICE_ROOM_MEMBERS_SQLITE = """
CREATE TABLE IF NOT EXISTS voice_room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'listener',
    seat_index INTEGER NULL,
    is_muted BOOLEAN NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT 0,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL
);
"""

_CREATE_VOICE_ROOM_MESSAGES_SQLITE = """
CREATE TABLE IF NOT EXISTS voice_room_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    msg_type VARCHAR(20) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def _column_names(engine: Engine, table_name: str) -> set[str]:
    try:
        insp = inspect(engine)
        if table_name not in insp.get_table_names():
            return set()
        return {c['name'] for c in insp.get_columns(table_name)}
    except Exception:
        return set()


def _table_exists(engine: Engine, table_name: str) -> bool:
    try:
        return table_name in inspect(engine).get_table_names()
    except Exception:
        return False


def _safe_exec(engine: Engine, sql: str, description: str) -> bool:
    try:
        with engine.begin() as conn:
            conn.execute(text(sql))
        _log.info("[voice_rooms.patch] %s ✅", description)
        return True
    except Exception as exc:
        _log.warning("[voice_rooms.patch] %s failed: %s", description, exc)
        return False


def ensure_voice_rooms_hard(engine: Engine) -> None:
    """
    ضمان جذري لوجود جداول الغرف الصوتية.
    - يستخدم raw SQL بدون FK لتفادي فشل FK constraints.
    - idempotent: يمكن استدعاؤه أكثر من مرة بأمان.
    - يعمل على PostgreSQL و SQLite.
    """
    dialect = engine.dialect.name
    _log.info("[voice_rooms.patch] starting hard-guarantee (dialect=%s)", dialect)

    if dialect == "postgresql":
        create_rooms = _CREATE_VOICE_ROOMS_PG
        create_members = _CREATE_VOICE_ROOM_MEMBERS_PG
        create_messages = _CREATE_VOICE_ROOM_MESSAGES_PG
    else:
        create_rooms = _CREATE_VOICE_ROOMS_SQLITE
        create_members = _CREATE_VOICE_ROOM_MEMBERS_SQLITE
        create_messages = _CREATE_VOICE_ROOM_MESSAGES_SQLITE

    _safe_exec(engine, create_rooms, "CREATE voice_rooms")
    _safe_exec(engine, create_members, "CREATE voice_room_members")
    _safe_exec(engine, create_messages, "CREATE voice_room_messages")

    # الأعمدة الاختيارية التي أُضيفت في v88.13
    if _table_exists(engine, "voice_rooms"):
        cols = _column_names(engine, "voice_rooms")
        if "group_id" not in cols:
            _safe_exec(
                engine,
                "ALTER TABLE voice_rooms ADD COLUMN group_id VARCHAR(36) NULL",
                "ADD voice_rooms.group_id",
            )

    # الفهارس الأساسية
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_rooms_owner_id ON voice_rooms(owner_id)",
        "INDEX voice_rooms.owner_id",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_rooms_group_id ON voice_rooms(group_id)",
        "INDEX voice_rooms.group_id",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_rooms_category ON voice_rooms(category)",
        "INDEX voice_rooms.category",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_rooms_is_active ON voice_rooms(is_active)",
        "INDEX voice_rooms.is_active",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_room_members_room_id ON voice_room_members(room_id)",
        "INDEX voice_room_members.room_id",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_room_members_user_id ON voice_room_members(user_id)",
        "INDEX voice_room_members.user_id",
    )
    _safe_exec(
        engine,
        "CREATE INDEX IF NOT EXISTS ix_voice_room_messages_room_id ON voice_room_messages(room_id)",
        "INDEX voice_room_messages.room_id",
    )

    # تحقق نهائي
    final_tables = set()
    try:
        final_tables = set(inspect(engine).get_table_names())
    except Exception:
        pass

    for t in ("voice_rooms", "voice_room_members", "voice_room_messages"):
        if t in final_tables:
            _log.info("[voice_rooms.patch] ✅ %s exists", t)
        else:
            _log.error("[voice_rooms.patch] ❌ %s still MISSING after patch!", t)
