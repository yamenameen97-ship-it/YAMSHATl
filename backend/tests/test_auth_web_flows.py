from __future__ import annotations

import app.main as main_module
from fastapi.testclient import TestClient

from app.core.dependencies import get_db
from app.main import fastapi_app


class _ClientContext:
    def __init__(self, db_session, monkeypatch):
        self.db_session = db_session
        self.monkeypatch = monkeypatch
        self.client = None

    def __enter__(self):
        def override_get_db():
            try:
                yield self.db_session
            finally:
                pass

        fastapi_app.dependency_overrides[get_db] = override_get_db
        self.monkeypatch.setattr(main_module, 'initialize_database', lambda _engine: None)

        import app.api.routes.auth as auth_module

        self.monkeypatch.setattr(auth_module.settings, 'DEBUG', True, raising=False)
        self.monkeypatch.setattr(auth_module.settings, 'CAPTCHA_ENABLED', True, raising=False)

        self.client = TestClient(fastapi_app)
        self.client.headers.update({'X-Requested-With': 'XMLHttpRequest'})
        return self.client

    def __exit__(self, exc_type, exc, tb):
        if self.client is not None:
            self.client.close()
        fastapi_app.dependency_overrides.clear()
        return False


def _captcha_answer(challenge: dict) -> str:
    left, operator, right = str(challenge['question']).split()
    left_num = int(left)
    right_num = int(right)
    return str(left_num + right_num if operator == '+' else left_num - right_num)


def test_auth_frontend_flows_are_available(db_session, monkeypatch):
    email = 'web-flow@example.com'
    password = 'Secret123'

    with _ClientContext(db_session, monkeypatch) as client:
        captcha_response = client.get('/api/auth/captcha')
        assert captcha_response.status_code == 200
        captcha = captcha_response.json()
        assert captcha['captcha_id']
        assert captcha['question']

        register_response = client.post(
            '/api/auth/register',
            json={
                'username': 'webflowuser',
                'email': email,
                'password': password,
                'captcha_id': captcha['captcha_id'],
                'captcha_answer': _captcha_answer(captcha),
            },
        )
        assert register_response.status_code == 201
        register_data = register_response.json()
        assert register_data['email'] == email
        assert register_data['email_verification_required'] is True
        assert register_data['dev_verification_code']

        resend_response = client.post('/api/auth/resend-verification', json={'email': email})
        assert resend_response.status_code == 200
        resend_data = resend_response.json()
        assert resend_data['email'] == email
        assert resend_data['dev_verification_code']

        verify_response = client.post(
            '/api/auth/verify-email',
            json={
                'email': email,
                'code': resend_data['dev_verification_code'],
                'remember_me': True,
            },
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data['email'] == email
        assert verify_data['access_token']
        assert verify_data['session_id']

        login_captcha_response = client.get('/api/auth/captcha')
        assert login_captcha_response.status_code == 200
        login_captcha = login_captcha_response.json()

        login_response = client.post(
            '/api/auth/login',
            json={
                'identifier': email,
                'password': password,
                'remember_me': True,
                'captcha_id': login_captcha['captcha_id'],
                'captcha_answer': _captcha_answer(login_captcha),
            },
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert login_data['email'] == email
        assert login_data['access_token']
        assert login_data['session_id']

        forgot_response = client.post('/api/auth/forgot-password', json={'email': email})
        assert forgot_response.status_code == 200
        forgot_data = forgot_response.json()
        assert forgot_data['email'] == email
        assert forgot_data['dev_reset_code']

        verify_reset_response = client.post(
            '/api/auth/verify-reset-code',
            json={'email': email, 'code': forgot_data['dev_reset_code']},
        )
        assert verify_reset_response.status_code == 200

        new_password = 'Secret456'
        reset_response = client.post(
            '/api/auth/reset-password',
            json={
                'email': email,
                'code': forgot_data['dev_reset_code'],
                'new_password': new_password,
            },
        )
        assert reset_response.status_code == 200
        assert 'successfully' in reset_response.json()['message'].lower()

        final_login_captcha_response = client.get('/api/auth/captcha')
        assert final_login_captcha_response.status_code == 200
        final_login_captcha = final_login_captcha_response.json()

        final_login_response = client.post(
            '/api/auth/login',
            json={
                'identifier': email,
                'password': new_password,
                'remember_me': True,
                'captcha_id': final_login_captcha['captcha_id'],
                'captcha_answer': _captcha_answer(final_login_captcha),
            },
        )
        assert final_login_response.status_code == 200
        assert final_login_response.json()['email'] == email
