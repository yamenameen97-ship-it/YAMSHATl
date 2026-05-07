from __future__ import annotations

import re
from datetime import datetime

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.admin_access import is_primary_admin_email
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base

CURRENT_ALEMBIC_REVISION = '20260506_0003'
LEGACY_USER_TABLE_NAMES = ('suser', 'user')
REQUIRED_SCHEMA_COLUMNS: dict[str, set[str]] = {
    'users': {'username', 'email', 'hashed_password', 'role', 'is_active', 'email_verified'},
    'posts': {'user_id'},
    'comments': {'user_id', 'content'},
    'messages': {'sender_id', 'receiver_id', 'content'},
}


def _table_exists(engine: Engine, table_name: str) -> bool:
    return table_name in inspect(engine).get_table_names()


def _column_names(engine: Engine, table_name: str) -> set[str]:
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return set()
    return {column['name'] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(engine: Engine, table_name: str, column_name: str, column_definition: str) -> None:
    if not _table_exists(engine, table_name):
        return
    existing_columns = _column_names(engine, table_name)
    if column_name in existing_columns:
        return
    with engine.begin() as connection:
        connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_definition}'))


def _looks_like_hash(value: str | None) -> bool:
    raw = (value or '').strip()
    return raw.startswith(('pbkdf2:', 'scrypt:', 'argon2:'))


def _normalize_username(value: str | None, email: str | None, user_id: int, used: set[str]) -> str:
    source = (value or '').strip() or (email or '').split('@')[0].strip() or f'user_{user_id}'
    normalized = re.sub(r'\s+', '_', source)
    normalized = re.sub(r'[^\w.-]+', '_', normalized, flags=re.UNICODE)
    normalized = normalized.strip('._-') or f'user_{user_id}'
    candidate = normalized[:50]
    if candidate not in used:
        used.add(candidate)
        return candidate

    suffix = f'_{user_id}'
    trimmed = candidate[: max(1, 50 - len(suffix))]
    unique_candidate = f'{trimmed}{suffix}'
    used.add(unique_candidate)
    return unique_candidate


def _set_alembic_revision(engine: Engine, revision: str = CURRENT_ALEMBIC_REVISION) -> None:
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)'))
        connection.execute(text('DELETE FROM alembic_version'))
        connection.execute(text('INSERT INTO alembic_version (version_num) VALUES (:revision)'), {'revision': revision})


def _adopt_legacy_users_table(engine: Engine) -> None:
    if _table_exists(engine, 'users'):
        return

    for legacy_table in LEGACY_USER_TABLE_NAMES:
        if not _table_exists(engine, legacy_table):
            continue
        with engine.begin() as connection:
            connection.execute(text(f'ALTER TABLE {legacy_table} RENAME TO users'))
        return


def _schema_needs_normalization(engine: Engine, existing_tables: list[str] | None = None) -> bool:
    tables = set(existing_tables or inspect(engine).get_table_names())
    if not tables:
        return True

    if any(table in tables for table in LEGACY_USER_TABLE_NAMES):
        return True

    for table_name, required_columns in REQUIRED_SCHEMA_COLUMNS.items():
        if table_name not in tables:
            continue
        if not required_columns.issubset(_column_names(engine, table_name)):
            return True

    return False


def _migrate_users_table(engine: Engine) -> None:
    if not _table_exists(engine, 'users'):
        return

    _add_column_if_missing(engine, 'users', 'username', 'username VARCHAR(50)')
    _add_column_if_missing(engine, 'users', 'avatar', 'avatar VARCHAR(500)')
    _add_column_if_missing(engine, 'users', 'hashed_password', 'hashed_password VARCHAR(255)')
    _add_column_if_missing(engine, 'users', 'role', "role VARCHAR(20) DEFAULT 'user'")
    _add_column_if_missing(engine, 'users', 'is_active', 'is_active BOOLEAN DEFAULT TRUE')
    _add_column_if_missing(engine, 'users', 'email_verified', 'email_verified BOOLEAN DEFAULT TRUE')
    _add_column_if_missing(engine, 'users', 'email_verification_code', 'email_verification_code VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'email_verification_expires_at', 'email_verification_expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'password_reset_code', 'password_reset_code VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'password_reset_expires_at', 'password_reset_expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'refresh_token_hash', 'refresh_token_hash VARCHAR(255)')
    _add_column_if_missing(engine, 'users', 'refresh_token_expires_at', 'refresh_token_expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'password_changed_at', 'password_changed_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'followers_count', 'followers_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'following_count', 'following_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'fcm_token', 'fcm_token VARCHAR(1024)')
    _add_column_if_missing(engine, 'users', 'last_login_at', 'last_login_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'banned_at', 'banned_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'created_at', 'created_at TIMESTAMP NULL')

    columns = _column_names(engine, 'users')
    select_columns = [
        'id',
        *[
            column
            for column in [
                'name',
                'username',
                'email',
                'password',
                'hashed_password',
                'role',
                'is_active',
                'email_verified',
                'email_verification_code',
                'email_verification_expires_at',
                'created_at',
            ]
            if column in columns
        ],
    ]

    with engine.begin() as connection:
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM users ORDER BY id ASC")).mappings().all()
        used_usernames = {str(row['username']).strip() for row in rows if row.get('username')}

        for row in rows:
            updates: dict[str, object] = {}
            username = str(row.get('username') or '').strip()
            email = str(row.get('email') or '').strip().lower() or None
            if not username:
                updates['username'] = _normalize_username(row.get('name'), email, int(row['id']), used_usernames)

            stored_password = row.get('hashed_password') or row.get('password')
            if stored_password:
                stored_password = str(stored_password)
            if not stored_password:
                updates['hashed_password'] = hash_password(f'ChangeMe_{row["id"]}')
            elif not _looks_like_hash(stored_password):
                updates['hashed_password'] = hash_password(stored_password)

            current_role = str(row.get('role') or '').strip().lower()
            desired_role = 'admin' if is_primary_admin_email(email) else 'user'
            if current_role != desired_role:
                updates['role'] = desired_role
            if row.get('is_active') is None:
                updates['is_active'] = True
            if is_primary_admin_email(email):
                if row.get('email_verified') is not True:
                    updates['email_verified'] = True
                if 'email_verification_code' in columns and row.get('email_verification_code') not in (None, ''):
                    updates['email_verification_code'] = None
                if 'email_verification_expires_at' in columns and row.get('email_verification_expires_at') is not None:
                    updates['email_verification_expires_at'] = None
            elif row.get('email_verified') is None:
                updates['email_verified'] = True
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()

            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE users SET {assignments} WHERE id = :id'), updates)


def _load_user_lookup(connection) -> dict[str, int]:
    result = connection.execute(text('SELECT id, username, email FROM users')).mappings().all()
    lookup: dict[str, int] = {}
    for row in result:
        user_id = int(row['id'])
        username = str(row.get('username') or '').strip()
        email = str(row.get('email') or '').strip()
        if username:
            lookup[username] = user_id
        if email:
            lookup[email] = user_id
            lookup[email.split('@')[0]] = user_id
    return lookup


def _migrate_posts_table(engine: Engine) -> None:
    if not _table_exists(engine, 'posts'):
        return

    _add_column_if_missing(engine, 'posts', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'posts', 'image_url', 'image_url TEXT')
    _add_column_if_missing(engine, 'posts', 'created_at', 'created_at TIMESTAMP NULL')

    columns = _column_names(engine, 'posts')
    select_columns = ['id', *[column for column in ['user_id', 'username', 'media', 'image_url', 'created_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM posts ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('user_id') is None:
                legacy_username = str(row.get('username') or '').strip()
                mapped_user_id = user_lookup.get(legacy_username)
                if mapped_user_id is not None:
                    updates['user_id'] = mapped_user_id
            if row.get('image_url') in (None, '') and row.get('media') not in (None, ''):
                updates['image_url'] = row.get('media')
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE posts SET {assignments} WHERE id = :id'), updates)


def _migrate_comments_table(engine: Engine) -> None:
    if not _table_exists(engine, 'comments'):
        return

    _add_column_if_missing(engine, 'comments', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'comments', 'content', 'content TEXT')
    _add_column_if_missing(engine, 'comments', 'created_at', 'created_at TIMESTAMP NULL')

    columns = _column_names(engine, 'comments')
    select_columns = ['id', *[column for column in ['user_id', 'username', 'comment', 'content', 'created_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM comments ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('user_id') is None:
                legacy_username = str(row.get('username') or '').strip()
                mapped_user_id = user_lookup.get(legacy_username)
                if mapped_user_id is not None:
                    updates['user_id'] = mapped_user_id
            if row.get('content') in (None, '') and row.get('comment') not in (None, ''):
                updates['content'] = row.get('comment')
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE comments SET {assignments} WHERE id = :id'), updates)


def _migrate_messages_table(engine: Engine) -> None:
    if not _table_exists(engine, 'messages'):
        return

    _add_column_if_missing(engine, 'messages', 'sender_id', 'sender_id INTEGER')
    _add_column_if_missing(engine, 'messages', 'receiver_id', 'receiver_id INTEGER')
    _add_column_if_missing(engine, 'messages', 'content', 'content TEXT')
    _add_column_if_missing(engine, 'messages', 'media_url', 'media_url TEXT')
    _add_column_if_missing(engine, 'messages', 'message_type', "message_type VARCHAR(20) DEFAULT 'text'")
    _add_column_if_missing(engine, 'messages', 'client_id', 'client_id VARCHAR(80)')
    _add_column_if_missing(engine, 'messages', 'is_delivered', 'is_delivered BOOLEAN DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'delivered_at', 'delivered_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'is_seen', 'is_seen BOOLEAN DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'seen_at', 'seen_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'deleted_at', 'deleted_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'created_at', 'created_at TIMESTAMP NULL')

    columns = _column_names(engine, 'messages')
    select_columns = ['id', *[column for column in ['sender_id', 'receiver_id', 'sender', 'receiver', 'message', 'content', 'message_type', 'created_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM messages ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('sender_id') is None:
                sender_name = str(row.get('sender') or '').strip()
                mapped_sender_id = user_lookup.get(sender_name)
                if mapped_sender_id is not None:
                    updates['sender_id'] = mapped_sender_id
            if row.get('receiver_id') is None:
                receiver_name = str(row.get('receiver') or '').strip()
                mapped_receiver_id = user_lookup.get(receiver_name)
                if mapped_receiver_id is not None:
                    updates['receiver_id'] = mapped_receiver_id
            if row.get('content') in (None, '') and row.get('message') not in (None, ''):
                updates['content'] = row.get('message')
            if row.get('message_type') in (None, ''):
                updates['message_type'] = 'text'
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE messages SET {assignments} WHERE id = :id'), updates)


def initialize_database(engine: Engine, force: bool = False) -> None:
    existing_tables = inspect(engine).get_table_names()
    should_bootstrap = force or settings.DB_BOOTSTRAP_ON_START or _schema_needs_normalization(engine, existing_tables)
    if not should_bootstrap:
        return

    _adopt_legacy_users_table(engine)
    Base.metadata.create_all(bind=engine)
    _migrate_users_table(engine)
    Base.metadata.create_all(bind=engine)
    _migrate_posts_table(engine)
    _migrate_comments_table(engine)
    _migrate_messages_table(engine)
    Base.metadata.create_all(bind=engine)
    _set_alembic_revision(engine)
