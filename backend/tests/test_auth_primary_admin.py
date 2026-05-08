from sqlalchemy import text

from app.core.security import hash_password
from app.db.bootstrap import _migrate_users_table
from app.models.user import User
from app.services.auth_service import authenticate_user, register_user


def test_register_primary_admin_is_auto_verified(db_session):
    user = register_user(
        db_session,
        username='primary-admin',
        email='yamenameen97@gmail.com',
        password='yamen1234',
    )

    assert user.role == 'admin'
    assert user.email_verified is True
    assert user.email_verification_code is None
    assert user.email_verification_expires_at is None


def test_authenticate_primary_admin_repairs_unverified_legacy_account(db_session):
    user = User(
        username='primary-admin',
        email='yamenameen97@gmail.com',
        hashed_password=hash_password('yamen1234'),
        email_verified=False,
        email_verification_code='legacy-code-hash',
        is_active=True,
        role='user',
    )
    db_session.add(user)
    db_session.commit()

    authenticated = authenticate_user(db_session, identifier='yamenameen97@gmail.com', password='yamen1234')
    db_session.refresh(user)

    assert authenticated.id == user.id
    assert user.role == 'admin'
    assert user.email_verified is True
    assert user.email_verification_code is None
    assert user.email_verification_expires_at is None


def test_bootstrap_repairs_primary_admin_verification_flags(db_session):
    user = User(
        username='primary-admin',
        email='yamenameen97@gmail.com',
        hashed_password=hash_password('yamen1234'),
        email_verified=False,
        email_verification_code='stale-code',
        is_active=True,
        role='user',
    )
    db_session.add(user)
    db_session.commit()

    engine = db_session.get_bind()
    with engine.begin() as connection:
        connection.execute(
            text('UPDATE users SET email_verification_expires_at = CURRENT_TIMESTAMP WHERE email = :email'),
            {'email': 'yamenameen97@gmail.com'},
        )

    _migrate_users_table(engine)
    db_session.refresh(user)

    assert user.role == 'admin'
    assert user.email_verified is True
    assert user.email_verification_code is None
    assert user.email_verification_expires_at is None
