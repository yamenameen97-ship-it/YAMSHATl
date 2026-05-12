from __future__ import annotations

import re
from datetime import datetime

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.core.admin_access import is_primary_admin_email
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.base import Base

CURRENT_ALEMBIC_REVISION = '20260506_0003'
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
    },
    'posts': {'user_id', 'media_json', 'is_draft'},
    'comments': {'user_id', 'content'},
    'messages': {'sender_id', 'receiver_id', 'content'},
}
REQUIRED_TABLES = {
    'users',
    'user_sessions',
    'audit_logs',
    'login_challenges',
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

    columns = _column_names(engine, 'posts')
    select_columns = ['id', *[column for column in ['user_id', 'username', 'media', 'image_url', 'media_json', 'created_at', 'updated_at', 'published_at'] if column in columns]]

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
            if row.get('media_json') in (None, '') and row.get('image_url') not in (None, ''):
                updates['media_json'] = f'["{row.get("image_url")}"]'
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
    _add_column_if_missing(engine, 'comments', 'parent_id', 'parent_id INTEGER NULL')
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
            'suspicious_login_count, created_at, password_changed_at'
            ') VALUES ('
            ':username, :email, :hashed_password, :role, :is_active, :email_verified, '
            ':followers_count, :following_count, :two_factor_enabled, :two_factor_method, '
            ':suspicious_login_count, :created_at, :password_changed_at'
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
            'created_at': now,
            'password_changed_at': now,
        },
    )



def _ensure_seed_accounts(engine: Engine) -> None:
    with engine.begin() as connection:
        _upsert_seed_account(connection, DEFAULT_SUBSCRIBER, role='user')
        _upsert_seed_account(connection, DEFAULT_PRIMARY_ADMIN, role='admin')


def initialize_database(engine: Engine, force: bool = False) -> None:
    existing_tables = inspect(engine).get_table_names()
    should_bootstrap = force or settings.DB_BOOTSTRAP_ON_START or _schema_needs_normalization(engine, existing_tables)
    if not should_bootstrap:
        _ensure_seed_accounts(engine)
        return

    _adopt_legacy_users_table(engine)
    Base.metadata.create_all(bind=engine)
    _migrate_users_table(engine)
    Base.metadata.create_all(bind=engine)
    _migrate_posts_table(engine)
    _migrate_comments_table(engine)
    _migrate_messages_table(engine)
    Base.metadata.create_all(bind=engine)
    _ensure_seed_accounts(engine)
    _set_alembic_revision(engine)
