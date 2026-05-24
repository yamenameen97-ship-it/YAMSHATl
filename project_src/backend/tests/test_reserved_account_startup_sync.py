from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.db.base import Base
from app.db.bootstrap import initialize_database
from app.models.user import User
from app.models.user_session import UserSession
from app.services.auth_service import authenticate_user


def test_initialize_database_always_syncs_reserved_accounts_and_revokes_stale_reserved_sessions(tmp_path):
    db_file = tmp_path / 'reserved-startup-sync.db'
    engine = create_engine(f'sqlite:///{db_file}', connect_args={'check_same_thread': False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        admin = User(
            username='legacy-admin',
            email=settings.PRIMARY_ADMIN_EMAIL,
            hashed_password=hash_password('old-admin-password'),
            role='user',
            is_active=False,
            email_verified=False,
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)

        stale_session = UserSession(
            user_id=admin.id,
            session_key='legacy-session-key',
            refresh_token_hash=hash_password('legacy-refresh-token'),
            expires_at=datetime.utcnow() + timedelta(days=7),
            remember_me=True,
        )
        session.add(stale_session)
        session.commit()

        initialize_database(engine, force=False)

        session.expire_all()
        repaired_admin = session.query(User).filter(User.email == settings.PRIMARY_ADMIN_EMAIL).first()
        demo_user = session.query(User).filter(User.email == settings.DEMO_ACCOUNT_EMAIL).first()
        repaired_stale_session = session.query(UserSession).filter(UserSession.session_key == 'legacy-session-key').first()

        assert repaired_admin is not None
        assert repaired_admin.role == 'admin'
        assert repaired_admin.is_active is True
        assert repaired_admin.email_verified is True
        assert repaired_admin.refresh_token_hash is None
        assert repaired_admin.refresh_token_session_id is None

        assert demo_user is not None
        assert demo_user.is_active is True
        assert demo_user.email_verified is True
        assert repaired_stale_session is not None
        assert repaired_stale_session.revoked_at is not None

        authenticated_admin = authenticate_user(session, settings.PRIMARY_ADMIN_EMAIL, settings.PRIMARY_ADMIN_PASSWORD)
        authenticated_demo = authenticate_user(session, settings.DEMO_ACCOUNT_EMAIL, settings.DEMO_ACCOUNT_PASSWORD)
        assert authenticated_admin.id == repaired_admin.id
        assert authenticated_demo.email == settings.DEMO_ACCOUNT_EMAIL

        stale_access_payload = {
            'user_id': repaired_admin.id,
            'sid': 'legacy-session-key',
            'iat': int((datetime.now(timezone.utc) - timedelta(minutes=5)).timestamp()),
        }
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token_payload=stale_access_payload, db=session)
        assert exc_info.value.status_code == 401
    finally:
        session.close()
        engine.dispose()


def test_get_current_user_rejects_legacy_access_tokens_without_session_id(db_session):
    user = User(
        username='token-user',
        email='token-user@example.com',
        hashed_password=hash_password('secret123'),
        role='user',
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(
            token_payload={
                'user_id': user.id,
                'iat': int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
            },
            db=db_session,
        )
    assert exc_info.value.status_code == 401
    assert 'please login again' in exc_info.value.detail.lower()
