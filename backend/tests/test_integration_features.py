from __future__ import annotations

from pathlib import Path

from app.api.routes import upload as upload_routes


def test_analytics_endpoint_accepts_event(client):
    response = client.post(
        '/api/analytics/events',
        json={
            'event_name': 'page_view',
            'category': 'navigation',
            'route': '/chat/tester',
            'properties': {'source': 'integration-test'},
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload['event']['event_name'] == 'page_view'
    assert payload['delivery']['accepted'] in {True, False}


def test_save_push_token_accepts_platform_metadata(client):
    response = client.post(
        '/api/users/fcm-token',
        json={
            'token': 'fcm_' + ('x' * 40),
            'platform': 'android',
            'app_version': '2.4.0',
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload['platform'] == 'android'
    assert payload['push_enabled'] is True


def test_resumable_upload_flow(client, tmp_path, monkeypatch):
    upload_root = tmp_path / 'uploads'
    resumable_root = upload_root / '.resumable'
    upload_root.mkdir(parents=True, exist_ok=True)
    resumable_root.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(upload_routes, 'UPLOAD_DIR', upload_root)
    monkeypatch.setattr(upload_routes, 'RESUMABLE_DIR', resumable_root)

    start = client.post(
        '/api/upload/resumable/start',
        json={
            'filename': 'demo.png',
            'content_type': 'image/png',
            'total_size': 68,
            'total_chunks': 2,
        },
    )
    assert start.status_code == 200
    session = start.json()
    session_id = session['session_id']

    png_bytes = (
        b'\x89PNG\r\n\x1a\n'
        b'\x00\x00\x00\rIHDR'
        b'\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00'
        b'\x90wS\xde'
        b'\x00\x00\x00\x0bIDATx\x9cc```\x00\x00\x00\x04\x00\x01'
        b'\x0b\xe7\x02\x9d'
        b'\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    first = client.put(f'/api/upload/resumable/{session_id}/chunk/0', content=png_bytes[:34])
    second = client.put(f'/api/upload/resumable/{session_id}/chunk/1', content=png_bytes[34:])
    assert first.status_code == 200
    assert second.status_code == 200

    status_response = client.get(f'/api/upload/resumable/{session_id}')
    assert status_response.status_code == 200
    assert status_response.json()['progress'] == 100

    complete = client.post(f'/api/upload/resumable/{session_id}/complete')
    assert complete.status_code == 200
    payload = complete.json()['upload']
    assert payload['progress'] == 100
    assert payload['resume_supported'] is True
    final_path = Path(payload['local_path'])
    assert final_path.exists()
    assert final_path.read_bytes() == png_bytes
