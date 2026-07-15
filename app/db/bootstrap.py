from __future__ import annotations

import re
from datetime import datetime

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.admin_access import is_primary_admin_email
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.base import Base

CURRENT_ALEMBIC_REVISION = '20260605_0005'
LEGACY_USER_TABLE_NAMES = ('suser', 'user')
DEFAULT_SUBSCRIBER = {
    'username': ((settings.DEMO_ACCOUNT_EMAIL or 'yasryameen21@gmail.com').split('@')[0] or 'yasryameen21').strip().lower(),
    'email': (settings.DEMO_ACCOUNT_EMAIL or 'yasryameen21@gmail.com').strip().lower(),
    'password': settings.DEMO_ACCOUNT_PASSWORD or '12345678',
}
DEFAULT_PRIMARY_ADMIN = {
    'username': ((settings.PRIMARY_ADMIN_EMAIL or 'yamenameen97@gmail.com').split('@')[0] or 'yamenameen97').strip().lower(),
    'email': (settings.PRIMARY_ADMIN_EMAIL or 'yamenameen97@gmail.com').strip().lower(),
    'password': settings.PRIMARY_ADMIN_PASSWORD or 'yamen1234',
}
REQUIRED_SCHEMA_COLUMNS: dict[str, set[str]] = {
    'users': {
        'username',
        'email',
        'hashed_password',
        'role',
        'is_active',
        'email_verified',
        'refresh_token_hash',
        'refresh_token_expires_at',
        'refresh_token_device_hash',
        'refresh_token_ip_hash',
        'refresh_token_user_agent_hash',
        'refresh_token_session_id',
        'refresh_token_rotated_at',
        'last_login_ip_hash',
        'last_login_user_agent_hash',
        'last_device_id_hash',
        'last_admin_ip_hash',
        'last_admin_user_agent_hash',
        'two_factor_enabled',
        'two_factor_method',
        'suspicious_login_count',
        'password_reset_code',
        'password_reset_expires_at',
        'email_verification_code',
        'email_verification_expires_at',
        'password_changed_at',
        'phone_number',
        'phone_verified',
        'phone_verification_code',
        'phone_verification_expires_at',
        'phone_verification_attempts',
        'phone_verification_locked_until',
    },
    'audit_logs': {'action', 'entity_type', 'description', 'meta', 'created_at'},
    'user_sessions': {'user_id', 'session_key', 'refresh_token_hash', 'expires_at', 'revoked_at', 'last_seen_at'},
    'login_challenges': {'user_id', 'challenge_id', 'code_hash', 'challenge_type', 'expires_at', 'consumed_at'},
    'posts': {'user_id', 'username', 'media', 'image_url', 'media_json', 'is_draft'},
    'comments': {'user_id', 'username', 'comment', 'content'},
    'messages': {'sender_id', 'receiver_id', 'sender', 'receiver', 'message', 'content'},
    'notifications': {'user_id', 'type', 'title', 'body', 'data', 'is_read', 'created_at'},
    'live_room_sessions': {'host_user_id', 'host_username', 'title', 'stream_status', 'is_active', 'is_public', 'extra_json', 'last_activity_at'},
    'reels': {'user_id', 'video_url', 'thumbnail_url', 'caption', 'category', 'duration', 'likes_count', 'comments_count', 'shares_count', 'views_count', 'is_deleted', 'created_at', 'updated_at'},
    'reel_likes': {'reel_id', 'user_id', 'created_at'},
    'reel_views': {'reel_id', 'user_id', 'viewed_at'},
    'saved_reels': {'reel_id', 'user_id', 'saved_at'},
    # v85.5 — جدول تعليقات الريلز الجديد
    'reel_comments': {'reel_id', 'user_id', 'parent_id', 'username', 'content', 'likes_count', 'is_hidden', 'created_at', 'updated_at'},
}
REQUIRED_TABLES = {
    'users',
    'user_sessions',
    'audit_logs',
    'login_challenges',
    'notifications',
    'live_room_sessions',
    'reels',
    'reel_likes',
    'reel_views',
    'saved_reels',
    'reel_comments',  # v85.5
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


def _drop_not_null_if_possible(engine: Engine, table_name: str, column_name: str) -> None:
    if not _table_exists(engine, table_name):
        return
    if engine.dialect.name != 'postgresql':
        return
    inspector = inspect(engine)
    nullable = None
    for column in inspector.get_columns(table_name):
        if column.get('name') == column_name:
            nullable = column.get('nullable')
            break
    if nullable is not False:
        return
    with engine.begin() as connection:
        connection.execute(text(f'ALTER TABLE {table_name} ALTER COLUMN {column_name} DROP NOT NULL'))


def _column_nullable(engine: Engine, table_name: str, column_name: str) -> bool | None:
    if not _table_exists(engine, table_name):
        return None
    inspector = inspect(engine)
    for column in inspector.get_columns(table_name):
        if column.get('name') == column_name:
            return column.get('nullable')
    return None


def _legacy_compatibility_needs_bootstrap(engine: Engine) -> bool:
    compatibility_targets = [
        ('posts', 'username'),
        ('posts', 'media'),
        ('comments', 'username'),
        ('comments', 'comment'),
        ('messages', 'sender'),
        ('messages', 'receiver'),
        ('messages', 'message'),
    ]
    for table_name, column_name in compatibility_targets:
        nullable = _column_nullable(engine, table_name, column_name)
        if nullable is False:
            return True
    return False


def _looks_like_hash(value: str | None) -> bool:
    raw = (value or '').strip()
    return raw.startswith(('pbkdf2:', 'scrypt:', 'argon2:'))


def _password_matches(plain_password: str, stored_password: str | None) -> bool:
    raw = (stored_password or '').strip()
    if not raw:
        return False
    if plain_password == raw:
        return True
    try:
        return verify_password(plain_password, raw)
    except Exception:
        return False


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

    if not REQUIRED_TABLES.issubset(tables):
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
    _add_column_if_missing(engine, 'users', 'refresh_token_device_hash', 'refresh_token_device_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'refresh_token_ip_hash', 'refresh_token_ip_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'refresh_token_user_agent_hash', 'refresh_token_user_agent_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'refresh_token_session_id', 'refresh_token_session_id VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'refresh_token_rotated_at', 'refresh_token_rotated_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'password_changed_at', 'password_changed_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'followers_count', 'followers_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'following_count', 'following_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'fcm_token', 'fcm_token VARCHAR(1024)')
    _add_column_if_missing(engine, 'users', 'last_login_at', 'last_login_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'last_login_ip_hash', 'last_login_ip_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'last_login_user_agent_hash', 'last_login_user_agent_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'last_device_id_hash', 'last_device_id_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'last_admin_ip_hash', 'last_admin_ip_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'last_admin_user_agent_hash', 'last_admin_user_agent_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'social_provider', 'social_provider VARCHAR(40)')
    _add_column_if_missing(engine, 'users', 'social_subject', 'social_subject VARCHAR(255)')
    _add_column_if_missing(engine, 'users', 'two_factor_enabled', 'two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'users', 'two_factor_method', "two_factor_method VARCHAR(40) NOT NULL DEFAULT 'email'")
    _add_column_if_missing(engine, 'users', 'suspicious_login_count', 'suspicious_login_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'banned_at', 'banned_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'created_at', 'created_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'phone_number', 'phone_number VARCHAR(20)')
    _add_column_if_missing(engine, 'users', 'phone_verified', 'phone_verified BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'users', 'phone_verification_code', 'phone_verification_code VARCHAR(128)')
    _add_column_if_missing(engine, 'users', 'phone_verification_expires_at', 'phone_verification_expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'users', 'phone_verification_attempts', 'phone_verification_attempts INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'users', 'phone_verification_locked_until', 'phone_verification_locked_until TIMESTAMP NULL')

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
                'followers_count',
                'following_count',
                'two_factor_enabled',
                'two_factor_method',
                'suspicious_login_count',
                'last_admin_ip_hash',
                'last_admin_user_agent_hash',
                'refresh_token_device_hash',
                'refresh_token_ip_hash',
                'refresh_token_user_agent_hash',
                'refresh_token_session_id',
                'refresh_token_rotated_at',
                'created_at',
                'phone_number',
                'phone_verified',
                'phone_verification_code',
                'phone_verification_expires_at',
                'phone_verification_attempts',
                'phone_verification_locked_until',
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
            if row.get('followers_count') is None:
                updates['followers_count'] = 0
            if row.get('following_count') is None:
                updates['following_count'] = 0
            if row.get('two_factor_enabled') is None:
                updates['two_factor_enabled'] = False
            if row.get('two_factor_method') in (None, ''):
                updates['two_factor_method'] = 'email'
            if row.get('suspicious_login_count') is None:
                updates['suspicious_login_count'] = 0
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if row.get('phone_verified') is None:
                updates['phone_verified'] = False
            if row.get('phone_verification_attempts') is None:
                updates['phone_verification_attempts'] = 0

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
            lookup[username.lower()] = user_id
            lookup[username.lstrip('@')] = user_id
            lookup[username.lower().lstrip('@')] = user_id
        if email:
            lookup[email] = user_id
            lookup[email.lower()] = user_id
            lookup[email.split('@')[0]] = user_id
            lookup[email.lower().split('@')[0]] = user_id
    return lookup


def _migrate_posts_table(engine: Engine) -> None:
    if not _table_exists(engine, 'posts'):
        return

    _add_column_if_missing(engine, 'posts', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'posts', 'username', 'username TEXT')
    _add_column_if_missing(engine, 'posts', 'media', 'media TEXT')
    _add_column_if_missing(engine, 'posts', 'image_url', 'image_url TEXT')
    _add_column_if_missing(engine, 'posts', 'content_html', 'content_html TEXT')
    _add_column_if_missing(engine, 'posts', 'media_json', 'media_json TEXT')
    _add_column_if_missing(engine, 'posts', 'hashtags_json', 'hashtags_json TEXT')
    _add_column_if_missing(engine, 'posts', 'mentions_json', 'mentions_json TEXT')
    _add_column_if_missing(engine, 'posts', 'poll_options_json', 'poll_options_json TEXT')
    _add_column_if_missing(engine, 'posts', 'is_draft', 'is_draft BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'posts', 'is_pinned', 'is_pinned BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'posts', 'allow_comments', 'allow_comments BOOLEAN NOT NULL DEFAULT TRUE')
    _add_column_if_missing(engine, 'posts', 'scheduled_at', 'scheduled_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'posts', 'published_at', 'published_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'posts', 'pinned_at', 'pinned_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'posts', 'updated_at', 'updated_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'posts', 'last_edited_at', 'last_edited_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'posts', 'edit_count', 'edit_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'posts', 'share_count', 'share_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'posts', 'save_count', 'save_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'posts', 'created_at', 'created_at TIMESTAMP NULL')

    _drop_not_null_if_possible(engine, 'posts', 'username')
    _drop_not_null_if_possible(engine, 'posts', 'media')

    columns = _column_names(engine, 'posts')
    select_columns = ['id', *[column for column in ['user_id', 'username', 'media', 'image_url', 'media_json', 'created_at', 'updated_at', 'published_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM posts ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('user_id') is None:
                legacy_username = str(row.get('username') or '').strip()
                mapped_user_id = user_lookup.get(legacy_username) or user_lookup.get(legacy_username.lower())
                if mapped_user_id is not None:
                    updates['user_id'] = mapped_user_id
            effective_image_url = row.get('image_url') or row.get('media')
            if row.get('image_url') in (None, '') and row.get('media') not in (None, ''):
                updates['image_url'] = row.get('media')
            if row.get('media_json') in (None, '') and effective_image_url not in (None, ''):
                updates['media_json'] = f'["{effective_image_url}"]'
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if row.get('updated_at') is None:
                updates['updated_at'] = row.get('created_at') or datetime.utcnow()
            if row.get('published_at') is None:
                updates['published_at'] = row.get('created_at') or datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE posts SET {assignments} WHERE id = :id'), updates)


def _migrate_comments_table(engine: Engine) -> None:
    if not _table_exists(engine, 'comments'):
        return

    _add_column_if_missing(engine, 'comments', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'comments', 'username', 'username TEXT')
    _add_column_if_missing(engine, 'comments', 'comment', 'comment TEXT')
    _add_column_if_missing(engine, 'comments', 'parent_id', 'parent_id INTEGER NULL')
    _add_column_if_missing(engine, 'comments', 'content', 'content TEXT')
    _add_column_if_missing(engine, 'comments', 'mentions_json', 'mentions_json TEXT')
    _add_column_if_missing(engine, 'comments', 'likes_count', 'likes_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'comments', 'is_pinned', 'is_pinned BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'comments', 'is_hidden', 'is_hidden BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'comments', 'created_at', 'created_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'comments', 'updated_at', 'updated_at TIMESTAMP NULL')

    _drop_not_null_if_possible(engine, 'comments', 'username')
    _drop_not_null_if_possible(engine, 'comments', 'comment')

    columns = _column_names(engine, 'comments')
    select_columns = ['id', *[column for column in ['user_id', 'username', 'comment', 'content', 'created_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM comments ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('user_id') is None:
                legacy_username = str(row.get('username') or '').strip()
                mapped_user_id = user_lookup.get(legacy_username) or user_lookup.get(legacy_username.lower())
                if mapped_user_id is not None:
                    updates['user_id'] = mapped_user_id
            if row.get('content') in (None, '') and row.get('comment') not in (None, ''):
                updates['content'] = row.get('comment')
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            updates.setdefault('likes_count', 0)
            updates.setdefault('is_pinned', False)
            updates.setdefault('is_hidden', False)
            if row.get('created_at') is not None:
                updates.setdefault('updated_at', row.get('created_at'))
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE comments SET {assignments} WHERE id = :id'), updates)


def _migrate_messages_table(engine: Engine) -> None:
    if not _table_exists(engine, 'messages'):
        return

    _add_column_if_missing(engine, 'messages', 'sender_id', 'sender_id INTEGER')
    _add_column_if_missing(engine, 'messages', 'receiver_id', 'receiver_id INTEGER')
    _add_column_if_missing(engine, 'messages', 'sender', 'sender VARCHAR(80)')
    _add_column_if_missing(engine, 'messages', 'receiver', 'receiver VARCHAR(80)')
    _add_column_if_missing(engine, 'messages', 'message', 'message TEXT')
    _add_column_if_missing(engine, 'messages', 'content', 'content TEXT')
    _add_column_if_missing(engine, 'messages', 'media_url', 'media_url TEXT')
    _add_column_if_missing(engine, 'messages', 'message_type', "message_type VARCHAR(20) DEFAULT 'text'")
    _add_column_if_missing(engine, 'messages', 'client_id', 'client_id VARCHAR(80)')
    _add_column_if_missing(engine, 'messages', 'is_delivered', 'is_delivered BOOLEAN DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'delivered_at', 'delivered_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'is_seen', 'is_seen BOOLEAN DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'seen_at', 'seen_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'deleted_at', 'deleted_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'deleted_for_everyone', 'deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'created_at', 'created_at TIMESTAMP NULL')

    # تحديث 2026-06-05: أعمدة استكمال ربط الشات (رد / تعديل / تمرير / اختفاء)
    _add_column_if_missing(engine, 'messages', 'reply_to_id', 'reply_to_id INTEGER NULL')
    _add_column_if_missing(engine, 'messages', 'forwarded_from_id', 'forwarded_from_id INTEGER NULL')
    _add_column_if_missing(engine, 'messages', 'edited_at', 'edited_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'is_edited', 'is_edited BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'is_recalled', 'is_recalled BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'messages', 'expires_at', 'expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'messages', 'reactions_count', 'reactions_count INTEGER NOT NULL DEFAULT 0')

    _drop_not_null_if_possible(engine, 'messages', 'sender')
    _drop_not_null_if_possible(engine, 'messages', 'receiver')
    _drop_not_null_if_possible(engine, 'messages', 'message')

    columns = _column_names(engine, 'messages')
    select_columns = ['id', *[column for column in ['sender_id', 'receiver_id', 'sender', 'receiver', 'message', 'content', 'message_type', 'created_at'] if column in columns]]

    with engine.begin() as connection:
        user_lookup = _load_user_lookup(connection)
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM messages ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('sender_id') is None:
                sender_name = str(row.get('sender') or '').strip()
                mapped_sender_id = user_lookup.get(sender_name) or user_lookup.get(sender_name.lower())
                if mapped_sender_id is not None:
                    updates['sender_id'] = mapped_sender_id
            if row.get('receiver_id') is None:
                receiver_name = str(row.get('receiver') or '').strip()
                mapped_receiver_id = user_lookup.get(receiver_name) or user_lookup.get(receiver_name.lower())
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


def _migrate_live_room_sessions_table(engine: Engine) -> None:
    if not _table_exists(engine, 'live_room_sessions'):
        return

    _add_column_if_missing(engine, 'live_room_sessions', 'host_user_id', 'host_user_id INTEGER')
    _add_column_if_missing(engine, 'live_room_sessions', 'host_username', 'host_username VARCHAR(50)')
    _add_column_if_missing(engine, 'live_room_sessions', 'title', "title VARCHAR(255) NOT NULL DEFAULT 'Live Room'")
    _add_column_if_missing(engine, 'live_room_sessions', 'livekit_room', 'livekit_room VARCHAR(255)')
    _add_column_if_missing(engine, 'live_room_sessions', 'livekit_url', 'livekit_url VARCHAR(500)')
    _add_column_if_missing(engine, 'live_room_sessions', 'stream_status', "stream_status VARCHAR(50) NOT NULL DEFAULT 'setup_required'")
    _add_column_if_missing(engine, 'live_room_sessions', 'is_active', 'is_active BOOLEAN NOT NULL DEFAULT TRUE')
    _add_column_if_missing(engine, 'live_room_sessions', 'is_public', 'is_public BOOLEAN NOT NULL DEFAULT TRUE')
    _add_column_if_missing(engine, 'live_room_sessions', 'viewer_count', 'viewer_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'live_room_sessions', 'peak_viewer_count', 'peak_viewer_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'live_room_sessions', 'hearts_count', 'hearts_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'live_room_sessions', 'recording_status', "recording_status VARCHAR(50) NOT NULL DEFAULT 'idle'")
    _add_column_if_missing(engine, 'live_room_sessions', 'recording_url', 'recording_url VARCHAR(1000)')
    _add_column_if_missing(engine, 'live_room_sessions', 'extra_json', 'extra_json TEXT')
    _add_column_if_missing(engine, 'live_room_sessions', 'created_at', 'created_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'live_room_sessions', 'last_activity_at', 'last_activity_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'live_room_sessions', 'ended_at', 'ended_at TIMESTAMP NULL')

    columns = _column_names(engine, 'live_room_sessions')
    select_columns = ['id', *[column for column in ['host_username', 'title', 'stream_status', 'is_active', 'viewer_count', 'peak_viewer_count', 'hearts_count', 'recording_status', 'created_at', 'last_activity_at'] if column in columns]]

    with engine.begin() as connection:
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM live_room_sessions ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('title') in (None, ''):
                updates['title'] = f"بث مباشر مع {str(row.get('host_username') or 'host').strip() or 'host'}"
            if row.get('stream_status') in (None, ''):
                updates['stream_status'] = 'setup_required'
            if row.get('is_active') is None:
                updates['is_active'] = True
            if row.get('viewer_count') is None:
                updates['viewer_count'] = 0
            if row.get('peak_viewer_count') is None:
                updates['peak_viewer_count'] = 0
            if row.get('hearts_count') is None:
                updates['hearts_count'] = 0
            if row.get('recording_status') in (None, ''):
                updates['recording_status'] = 'idle'
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if row.get('last_activity_at') is None:
                updates['last_activity_at'] = row.get('created_at') or datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE live_room_sessions SET {assignments} WHERE id = :id'), updates)



def _migrate_reel_comments_table(engine: Engine) -> None:
    """v85.5 — إضافة أعمدة parent_id/username/is_hidden/updated_at لجدول reel_comments
    (في حالة ترقية قاعدة بيانات موجودة تحمل الإصدار القديم)."""
    if not _table_exists(engine, 'reel_comments'):
        return
    _add_column_if_missing(engine, 'reel_comments', 'parent_id', 'parent_id INTEGER NULL')
    _add_column_if_missing(engine, 'reel_comments', 'username', 'username TEXT NULL')
    _add_column_if_missing(engine, 'reel_comments', 'is_hidden', 'is_hidden BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'reel_comments', 'updated_at', 'updated_at TIMESTAMP NULL')


def _migrate_reels_table(engine: Engine) -> None:
    if not _table_exists(engine, 'reels'):
        return

    _add_column_if_missing(engine, 'reels', 'thumbnail_url', 'thumbnail_url VARCHAR(1000)')
    _add_column_if_missing(engine, 'reels', 'caption', 'caption TEXT')
    _add_column_if_missing(engine, 'reels', 'category', "category VARCHAR(100) NOT NULL DEFAULT 'general'")
    _add_column_if_missing(engine, 'reels', 'duration', 'duration INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'reels', 'likes_count', 'likes_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'reels', 'comments_count', 'comments_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'reels', 'shares_count', 'shares_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'reels', 'views_count', 'views_count INTEGER NOT NULL DEFAULT 0')
    _add_column_if_missing(engine, 'reels', 'is_deleted', 'is_deleted BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'reels', 'created_at', 'created_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'reels', 'updated_at', 'updated_at TIMESTAMP NULL')

    with engine.begin() as connection:
        connection.execute(text("UPDATE reels SET category = COALESCE(NULLIF(category, ''), 'general')"))
        connection.execute(text('UPDATE reels SET duration = COALESCE(duration, 0)'))
        connection.execute(text('UPDATE reels SET likes_count = COALESCE(likes_count, 0)'))
        connection.execute(text('UPDATE reels SET comments_count = COALESCE(comments_count, 0)'))
        connection.execute(text('UPDATE reels SET shares_count = COALESCE(shares_count, 0)'))
        connection.execute(text('UPDATE reels SET views_count = COALESCE(views_count, 0)'))
        connection.execute(text('UPDATE reels SET is_deleted = COALESCE(is_deleted, FALSE)'))
        connection.execute(text('UPDATE reels SET created_at = COALESCE(created_at, NOW())'))
        connection.execute(text('UPDATE reels SET updated_at = COALESCE(updated_at, created_at, NOW())'))


def _migrate_notifications_table(engine: Engine) -> None:
    if not _table_exists(engine, 'notifications'):
        return

    _add_column_if_missing(engine, 'notifications', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'notifications', 'type', "type VARCHAR(50) DEFAULT 'system'")
    _add_column_if_missing(engine, 'notifications', 'title', "title VARCHAR(255) NOT NULL DEFAULT 'إشعار جديد'")
    _add_column_if_missing(engine, 'notifications', 'body', "body VARCHAR(500) NOT NULL DEFAULT ''")
    _add_column_if_missing(engine, 'notifications', 'data', 'data JSON')
    _add_column_if_missing(engine, 'notifications', 'is_read', 'is_read BOOLEAN NOT NULL DEFAULT FALSE')
    _add_column_if_missing(engine, 'notifications', 'created_at', 'created_at TIMESTAMP NULL')

    columns = _column_names(engine, 'notifications')
    select_columns = [
        'id',
        *[
            column
            for column in ['user_id', 'type', 'title', 'body', 'message', 'data', 'is_read', 'created_at']
            if column in columns
        ],
    ]

    with engine.begin() as connection:
        rows = connection.execute(text(f"SELECT {', '.join(select_columns)} FROM notifications ORDER BY id ASC")).mappings().all()
        for row in rows:
            updates: dict[str, object] = {}
            if row.get('type') in (None, ''):
                updates['type'] = 'system'
            if row.get('title') in (None, ''):
                updates['title'] = 'إشعار جديد'
            if row.get('body') in (None, ''):
                updates['body'] = row.get('message') or ''
            if row.get('data') is None:
                updates['data'] = '{}'
            if row.get('is_read') is None:
                updates['is_read'] = False
            if row.get('created_at') is None:
                updates['created_at'] = datetime.utcnow()
            if updates:
                assignments = ', '.join(f'{key} = :{key}' for key in updates)
                updates['id'] = row['id']
                connection.execute(text(f'UPDATE notifications SET {assignments} WHERE id = :id'), updates)


def _migrate_audit_logs_table(engine: Engine) -> None:
    if not _table_exists(engine, 'audit_logs'):
        return

    _add_column_if_missing(engine, 'audit_logs', 'actor_user_id', 'actor_user_id INTEGER')
    _add_column_if_missing(engine, 'audit_logs', 'action', 'action VARCHAR(100)')
    _add_column_if_missing(engine, 'audit_logs', 'entity_type', 'entity_type VARCHAR(100)')
    _add_column_if_missing(engine, 'audit_logs', 'entity_id', 'entity_id VARCHAR(100)')
    _add_column_if_missing(engine, 'audit_logs', 'description', "description VARCHAR(500) NOT NULL DEFAULT ''")
    _add_column_if_missing(engine, 'audit_logs', 'meta', 'meta JSON')
    _add_column_if_missing(engine, 'audit_logs', 'created_at', 'created_at TIMESTAMP NULL')


def _migrate_user_sessions_table(engine: Engine) -> None:
    if not _table_exists(engine, 'user_sessions'):
        return

    _add_column_if_missing(engine, 'user_sessions', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'user_sessions', 'session_key', 'session_key VARCHAR(128)')
    _add_column_if_missing(engine, 'user_sessions', 'refresh_token_hash', 'refresh_token_hash VARCHAR(255)')
    _add_column_if_missing(engine, 'user_sessions', 'device_id_hash', 'device_id_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'user_sessions', 'ip_hash', 'ip_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'user_sessions', 'user_agent_hash', 'user_agent_hash VARCHAR(128)')
    _add_column_if_missing(engine, 'user_sessions', 'expires_at', 'expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'user_sessions', 'created_at', 'created_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'user_sessions', 'last_seen_at', 'last_seen_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'user_sessions', 'revoked_at', 'revoked_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'user_sessions', 'remember_me', 'remember_me BOOLEAN NOT NULL DEFAULT TRUE')
    _add_column_if_missing(engine, 'user_sessions', 'login_method', "login_method VARCHAR(40) NOT NULL DEFAULT 'password'")


def _migrate_login_challenges_table(engine: Engine) -> None:
    if not _table_exists(engine, 'login_challenges'):
        return

    _add_column_if_missing(engine, 'login_challenges', 'user_id', 'user_id INTEGER')
    _add_column_if_missing(engine, 'login_challenges', 'challenge_id', 'challenge_id VARCHAR(128)')
    _add_column_if_missing(engine, 'login_challenges', 'code_hash', 'code_hash VARCHAR(255)')
    _add_column_if_missing(engine, 'login_challenges', 'challenge_type', 'challenge_type VARCHAR(64)')
    _add_column_if_missing(engine, 'login_challenges', 'meta_json', 'meta_json TEXT')
    _add_column_if_missing(engine, 'login_challenges', 'expires_at', 'expires_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'login_challenges', 'consumed_at', 'consumed_at TIMESTAMP NULL')
    _add_column_if_missing(engine, 'login_challenges', 'created_at', 'created_at TIMESTAMP NULL')


def _preferred_username(connection, preferred_username: str, email: str, user_id: int | None = None) -> str:
    base_username = (preferred_username or '').strip().lower() or ((email or '').split('@')[0].strip().lower() if email else 'user') or 'user'
    existing = connection.execute(
        text('SELECT id, username FROM users WHERE lower(username) = :username LIMIT 1'),
        {'username': base_username.lower()},
    ).mappings().first()
    if existing is None or (user_id is not None and int(existing['id']) == int(user_id)):
        return base_username

    suffix = 1
    while True:
        candidate = f'{base_username}_{suffix}'
        existing = connection.execute(
            text('SELECT id FROM users WHERE lower(username) = :username LIMIT 1'),
            {'username': candidate.lower()},
        ).mappings().first()
        if existing is None or (user_id is not None and int(existing['id']) == int(user_id)):
            return candidate
        suffix += 1



def _revoke_user_tokens(connection, user_id: int) -> None:
    connection.execute(
        text(
            'UPDATE users SET '
            'refresh_token_hash = NULL, refresh_token_expires_at = NULL, refresh_token_device_hash = NULL, '
            'refresh_token_ip_hash = NULL, refresh_token_user_agent_hash = NULL, '
            'refresh_token_session_id = NULL, refresh_token_rotated_at = NULL '
            'WHERE id = :user_id'
        ),
        {'user_id': int(user_id)},
    )
    connection.execute(
        text(
            'UPDATE user_sessions SET revoked_at = :now, last_seen_at = :now '
            'WHERE user_id = :user_id AND revoked_at IS NULL'
        ),
        {'user_id': int(user_id), 'now': datetime.utcnow()},
    )


def _upsert_seed_account(connection, account: dict[str, str], *, role: str) -> None:
    email = (account.get('email') or '').strip().lower()
    password = account.get('password') or ''
    desired_username = (account.get('username') or email.split('@')[0]).strip().lower()
    if not email or not password:
        return

    existing = connection.execute(
        text(
            'SELECT id, username, email, hashed_password, role, is_active, email_verified, password_changed_at '
            'FROM users WHERE lower(email) = :email OR lower(username) = :username '
            'ORDER BY CASE WHEN lower(email) = :email THEN 0 ELSE 1 END, id ASC LIMIT 1'
        ),
        {'email': email, 'username': desired_username.lower()},
    ).mappings().first()

    if existing:
        user_id = int(existing['id'])
        resolved_username = _preferred_username(connection, desired_username, email, user_id)
        updates: dict[str, object] = {}
        security_sensitive_change = False

        if str(existing.get('username') or '').strip() != resolved_username:
            updates['username'] = resolved_username
        if str(existing.get('email') or '').strip().lower() != email:
            updates['email'] = email
            security_sensitive_change = True
        if not _password_matches(password, existing.get('hashed_password')):
            updates['hashed_password'] = hash_password(password)
            updates['password_changed_at'] = datetime.utcnow()
            security_sensitive_change = True
        if str(existing.get('role') or '').strip().lower() != role:
            updates['role'] = role
            security_sensitive_change = True
        if existing.get('is_active') is not True:
            updates['is_active'] = True
            security_sensitive_change = True
        if existing.get('email_verified') is not True:
            updates['email_verified'] = True
            security_sensitive_change = True

        updates['followers_count'] = 0
        updates['following_count'] = 0
        updates['two_factor_enabled'] = False
        updates['two_factor_method'] = 'email'
        updates['suspicious_login_count'] = 0
        updates['phone_verified'] = False
        updates['phone_verification_attempts'] = 0
        updates['email_verification_code'] = None
        updates['email_verification_expires_at'] = None
        updates['password_reset_code'] = None
        updates['password_reset_expires_at'] = None

        assignments = ', '.join(f'{key} = :{key}' for key in updates)
        if assignments:
            updates['id'] = user_id
            connection.execute(text(f'UPDATE users SET {assignments} WHERE id = :id'), updates)
        if security_sensitive_change:
            _revoke_user_tokens(connection, user_id)
        return

    username = _preferred_username(connection, desired_username, email)
    now = datetime.utcnow()
    connection.execute(
        text(
            'INSERT INTO users ('
            'username, email, hashed_password, role, is_active, email_verified, '
            'followers_count, following_count, two_factor_enabled, two_factor_method, '
            'suspicious_login_count, phone_verified, phone_verification_attempts, created_at, password_changed_at'
            ') VALUES ('
            ':username, :email, :hashed_password, :role, :is_active, :email_verified, '
            ':followers_count, :following_count, :two_factor_enabled, :two_factor_method, '
            ':suspicious_login_count, :phone_verified, :phone_verification_attempts, :created_at, :password_changed_at'
            ')'
        ),
        {
            'username': username,
            'email': email,
            'hashed_password': hash_password(password),
            'role': role,
            'is_active': True,
            'email_verified': True,
            'followers_count': 0,
            'following_count': 0,
            'two_factor_enabled': False,
            'two_factor_method': 'email',
            'suspicious_login_count': 0,
            'phone_verified': False,
            'phone_verification_attempts': 0,
            'created_at': now,
            'password_changed_at': now,
        },
    )



def _ensure_seed_accounts(engine: Engine) -> None:
    with engine.begin() as connection:
        _upsert_seed_account(connection, DEFAULT_SUBSCRIBER, role='user')
        _upsert_seed_account(connection, DEFAULT_PRIMARY_ADMIN, role='admin')


def initialize_database(engine: Engine, force: bool = False) -> None:
    import logging as _logging
    _log = _logging.getLogger(__name__)

    try:
        existing_tables = inspect(engine).get_table_names()
    except Exception as exc:
        _log.exception('Could not inspect database tables: %s', exc)
        return

    should_bootstrap = (
        force
        or settings.DB_BOOTSTRAP_ON_START
        or _schema_needs_normalization(engine, existing_tables)
    )

    # Even when we think the schema is OK, we still always ensure the
    # `notifications.user_id` column is present, because the live PostgreSQL
    # was observed to lack it and that single missing column was triggering
    # 500/CORS errors on the frontend. This is a cheap idempotent check.
    try:
        if 'notifications' in existing_tables:
            cols = _column_names(engine, 'notifications')
            if 'user_id' not in cols:
                _log.warning("notifications.user_id missing in live DB, fixing now.")
                should_bootstrap = True
        if not should_bootstrap and _legacy_compatibility_needs_bootstrap(engine):
            _log.warning('Legacy compatibility drift detected in posts/comments/messages, fixing now.')
            should_bootstrap = True
    except Exception as exc:
        _log.warning('Could not check notifications schema: %s', exc)

    if not should_bootstrap:
        try:
            _ensure_seed_accounts(engine)
        except Exception as exc:
            _log.warning('Could not ensure seed accounts: %s', exc)
        return

    # Each migration step is wrapped so that a single failure does not
    # abort the whole bootstrap process.
    def _safe(step, name: str) -> None:
        try:
            step(engine)
        except Exception as exc:
            _log.warning('Bootstrap step %s failed: %s', name, exc)

    _safe(_adopt_legacy_users_table, 'adopt_legacy_users_table')
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        _log.warning('Base.metadata.create_all initial pass failed: %s', exc)
    _safe(_migrate_users_table, 'migrate_users_table')
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        _log.warning('Base.metadata.create_all second pass failed: %s', exc)
    _safe(_migrate_posts_table, 'migrate_posts_table')
    _safe(_migrate_comments_table, 'migrate_comments_table')
    _safe(_migrate_messages_table, 'migrate_messages_table')
    _safe(_migrate_live_room_sessions_table, 'migrate_live_room_sessions_table')
    _safe(_migrate_reels_table, 'migrate_reels_table')
    _safe(_migrate_reel_comments_table, 'migrate_reel_comments_table')  # v85.5
    _safe(_migrate_notifications_table, 'migrate_notifications_table')
    _safe(_migrate_audit_logs_table, 'migrate_audit_logs_table')
    _safe(_migrate_user_sessions_table, 'migrate_user_sessions_table')
    _safe(_migrate_login_challenges_table, 'migrate_login_challenges_table')
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        _log.warning('Base.metadata.create_all final pass failed: %s', exc)
    try:
        _ensure_seed_accounts(engine)
    except Exception as exc:
        _log.warning('Could not ensure seed accounts: %s', exc)
    try:
        _set_alembic_revision(engine)
    except Exception as exc:
        _log.warning('Could not set alembic revision: %s', exc)
