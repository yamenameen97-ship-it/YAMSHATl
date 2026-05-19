import unittest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.security_extra import security_headers


class SecurityHeadersTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.middleware('http')(security_headers)

        @app.get('/health')
        def health():
            return {'status': 'ok'}

        @app.post('/api/echo')
        def echo():
            return {'ok': True}

        self.client = TestClient(app)

    def test_security_headers_added(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get('x-frame-options'), 'DENY')
        self.assertEqual(response.headers.get('x-content-type-options'), 'nosniff')
        self.assertIn('default-src', response.headers.get('content-security-policy', ''))

    def test_blocks_cross_origin_post(self):
        response = self.client.post('/api/echo', headers={'Origin': 'https://evil.example'})
        self.assertEqual(response.status_code, 403)

    def test_allows_render_origin_regex_post(self):
        response = self.client.post('/api/echo', headers={'Origin': 'https://yamshatl-11.onrender.com'})
        self.assertEqual(response.status_code, 200)

    def test_allows_xhr_post_without_origin(self):
        response = self.client.post('/api/echo', headers={'X-Requested-With': 'XMLHttpRequest'})
        self.assertEqual(response.status_code, 200)


if __name__ == '__main__':
    unittest.main()
