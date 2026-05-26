from fastapi.testclient import TestClient

from app.main import fastapi_app

ORIGIN = 'https://yamshati-1-ygl0.onrender.com'


def main():
    client = TestClient(fastapi_app)

    captcha = client.get('/api/auth/captcha', headers={'Origin': ORIGIN})
    print('CAPTCHA_STATUS', captcha.status_code)
    print('CAPTCHA_ACAO', captcha.headers.get('access-control-allow-origin'))
    print('CAPTCHA_JSON', captcha.json())

    data = captcha.json()
    login = client.post(
        '/api/auth/login',
        headers={
            'Origin': ORIGIN,
            'X-Requested-With': 'XMLHttpRequest',
        },
        json={
            'identifier': 'nobody@example.com',
            'password': 'wrongpass',
            'captcha_id': data.get('captcha_id'),
            'captcha_answer': '0',
        },
    )
    print('LOGIN_STATUS', login.status_code)
    print('LOGIN_ACAO', login.headers.get('access-control-allow-origin'))
    try:
        print('LOGIN_JSON', login.json())
    except Exception:
        print('LOGIN_TEXT', login.text)


if __name__ == '__main__':
    main()
