from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.security_extra import security_headers
from app.models.user import User


def test_csrf_cookie_requires_matching_header():
    app = FastAPI()
    app.middleware('http')(security_headers)

    @app.post('/api/echo')
    def echo():
        return {'ok': True}

    client = TestClient(app)
    client.cookies.set('yamshat_csrf_token', 'secure-token')

    blocked = client.post('/api/echo', headers={'X-Requested-With': 'XMLHttpRequest'})
    assert blocked.status_code == 403
    assert blocked.json()['detail'] == 'CSRF token mismatch'

    allowed = client.post('/api/echo', headers={
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': 'secure-token',
    })
    assert allowed.status_code == 200


def test_moderator_cannot_promote_user_to_admin(client, db_session, current_user):
    current_user.role = 'moderator'
    current_user.email = 'moderator@example.com'
    db_session.add(current_user)
    db_session.commit()

    target = User(
        username='member',
        email='member@example.com',
        hashed_password='hash',
        email_verified=True,
        is_active=True,
        role='user',
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)

    response = client.patch(f'/api/admin/users/{target.id}', json={'role': 'admin'})
    assert response.status_code == 403
    assert response.json()['detail'] == 'Moderators cannot assign privileged roles'


def test_primary_admin_account_is_protected_from_moderator(client, db_session, current_user):
    current_user.role = 'moderator'
    current_user.email = 'moderator@example.com'
    db_session.add(current_user)
    db_session.commit()

    protected_user = User(
        username='primary-admin',
        email='yamenameen97@gmail.com',
        hashed_password='hash',
        email_verified=True,
        is_active=True,
        role='admin',
    )
    db_session.add(protected_user)
    db_session.commit()
    db_session.refresh(protected_user)

    response = client.post(f'/api/admin/users/{protected_user.id}/ban')
    assert response.status_code == 403
    assert response.json()['detail'] == 'Primary admin account is protected'
