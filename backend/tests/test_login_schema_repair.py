from __future__ import annotations

from datetime import datetime

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.db.bootstrap import initialize_database
from app.services.auth_service import authenticate_user


REPAIRED_AUTH_COLUMNS = {
    'refresh_token_device_hash',
    'refresh_token_ip_hash',
    'refresh_token_user_agent_hash',
    'refresh_token_session_id',
    'refresh_token_rotated_at',
    'last_admin_ip_hash',
    'last_admin_user_agent_hash',
}

REPAIRED_SESSION_COLUMNS = {
    'device_id_hash',
    'ip_hash',
    'user_agent_hash',
    'device_label',
    'remember_me',
    'login_method',
}


def test_initialize_database_repairs_legacy_auth_schema_and_preserves_seed_logins(tmp_path):
    db_file = tmp_path / 'legacy-login.db'
    engine = create_engine(f'sqlite:///{db_file}', connect_args={'check_same_thread': False})

    with engine.begin() as connection:
        connection.execute(
            text(
                '''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT TRUE,
                    email_verified BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP NULL
                )
                '''
            )
        )
        connection.execute(
            text(
                '''
                INSERT INTO users (id, username, email, hashed_password, role, is_active, email_verified, created_at)
                VALUES
                    (1, 'yamenameen97', 'yamenameen97@gmail.com', :admin_hash, 'admin', 1, 1, :created_at),
                    (2, 'yasryameen21', 'yasryameen21@gmail.com', :demo_hash, 'user', 1, 1, :created_at)
                '''
            ),
            {
                'admin_hash': hash_password('yamen1234'),
                'demo_hash': hash_password('12345678'),
                'created_at': datetime.utcnow(),
            },
        )
        connection.execute(
            text(
                '''
                CREATE TABLE user_sessions (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    session_key VARCHAR(96) NOT NULL,
                    refresh_token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    last_seen_at TIMESTAMP NULL,
                    revoked_at TIMESTAMP NULL,
                    created_at TIMESTAMP NULL
                )
                '''
            )
        )

    initialize_database(engine, force=True)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    assert {'users', 'user_sessions', 'audit_logs', 'login_challenges'}.issubset(tables)
    user_columns = {column['name'] for column in inspector.get_columns('users')}
    assert REPAIRED_AUTH_COLUMNS.issubset(user_columns)
    session_columns = {column['name'] for column in inspector.get_columns('user_sessions')}
    assert REPAIRED_SESSION_COLUMNS.issubset(session_columns)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        admin = authenticate_user(session, 'yamenameen97@gmail.com', 'yamen1234')
        demo = authenticate_user(session, 'yasryameen21@gmail.com', '12345678')
        assert admin.email == 'yamenameen97@gmail.com'
        assert admin.role == 'admin'
        assert demo.email == 'yasryameen21@gmail.com'
        assert demo.role == 'user'
    finally:
        session.close()
        engine.dispose()
