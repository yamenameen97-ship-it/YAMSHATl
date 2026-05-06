from __future__ import annotations

from datetime import datetime, timedelta

from app.api.routes import chat as chat_routes
from app.core.socket_server import sio
from app.models.message import Message
from app.models.user import User


async def _async_noop(*args, **kwargs):
    return None


def _create_peer(db_session, username='peer') -> User:
    peer = User(
        username=username,
        email=f'{username}@example.com',
        hashed_password='pbkdf2:sha256:260000$test$hash',
        email_verified=True,
        is_active=True,
        role='user',
    )
    db_session.add(peer)
    db_session.commit()
    db_session.refresh(peer)
    return peer


def test_get_messages_returns_cursor_paging(client, db_session, current_user):
    peer = _create_peer(db_session, 'peer_cursor')
    base_time = datetime.utcnow() - timedelta(minutes=10)
    for index in range(5):
        db_session.add(
            Message(
                sender_id=current_user.id if index % 2 == 0 else peer.id,
                receiver_id=peer.id if index % 2 == 0 else current_user.id,
                client_id=f'c-{index}',
                content=f'message-{index}',
                created_at=base_time + timedelta(minutes=index),
            )
        )
    db_session.commit()

    response = client.get('/api/messages', params={'receiver': peer.username, 'limit': 2})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload['items']) == 2
    assert payload['paging']['has_more'] is True
    assert payload['paging']['next_before_id'] == payload['items'][0]['id']

    older = client.get(
        '/api/messages',
        params={'receiver': peer.username, 'limit': 2, 'before_id': payload['paging']['next_before_id']},
    )
    assert older.status_code == 200
    older_payload = older.json()
    assert len(older_payload['items']) >= 1
    assert all(item['id'] < payload['paging']['next_before_id'] for item in older_payload['items'])


def test_send_message_deduplicates_same_client_id(client, db_session, monkeypatch):
    peer = _create_peer(db_session, 'peer_dedupe')
    monkeypatch.setattr(sio, 'emit', _async_noop)
    monkeypatch.setattr(chat_routes, 'allow_socket_message', lambda _key: True)

    payload = {
        'receiver': peer.username,
        'message': 'hello world',
        'client_id': 'same-client-id',
        'type': 'text',
    }
    first = client.post('/api/send_message', json=payload)
    second = client.post('/api/send_message', json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()['id'] == second.json()['id']
    assert db_session.query(Message).filter(Message.client_id == 'same-client-id').count() == 1


def test_mark_messages_seen_updates_seen_and_delivery_state(client, db_session, current_user, monkeypatch):
    peer = _create_peer(db_session, 'peer_seen')
    monkeypatch.setattr(sio, 'emit', _async_noop)

    pending = Message(
        sender_id=peer.id,
        receiver_id=current_user.id,
        client_id='pending-seen',
        content='need receipt',
        is_delivered=False,
        is_seen=False,
    )
    db_session.add(pending)
    db_session.commit()
    db_session.refresh(pending)

    response = client.post('/api/message_seen', json={'sender': peer.username})
    assert response.status_code == 200
    payload = response.json()
    assert pending.id in payload['message_ids']

    db_session.refresh(pending)
    assert pending.is_delivered is True
    assert pending.delivered_at is not None
    assert pending.is_seen is True
    assert pending.seen_at is not None
