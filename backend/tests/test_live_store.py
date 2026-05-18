from app.core.live_store import LiveStore


def test_create_room_respects_custom_runtime_identifiers_and_metadata():
    store = LiveStore()

    room = store.create_room(
        host_user_id=7,
        username='streamer',
        title='جلسة مباشرة',
        room_id='room-abc123',
        livekit_room='yamshat-streamer-1',
        livekit_url='wss://demo.livekit.cloud',
        stream_status='ready',
        viewer_count=3,
        peak_viewer_count=5,
        hearts_count=11,
        recording_status='idle',
        created_at='2026-05-18T00:00:00',
        last_activity_at='2026-05-18T00:05:00',
    )

    assert room.id == 'room-abc123'
    assert store.get_room('room-abc123') is room
    assert room.livekit_room == 'yamshat-streamer-1'
    assert room.livekit_url == 'wss://demo.livekit.cloud'
    assert room.stream_status == 'ready'
    assert room.viewer_count == 3
    assert room.peak_viewer_count == 5
    assert room.hearts_count == 11
    assert room.co_hosts == ['streamer']


def test_room_operations_work_with_database_backed_room_id():
    store = LiveStore()
    store.create_room(
        host_user_id=9,
        username='host',
        title='غرفة تجريبية',
        room_id='db-room-42',
    )

    comment = store.add_comment('db-room-42', 'viewer1', 'hello world')
    gift_result = store.send_gift('db-room-42', 'viewer1', 'وردة', 25)
    heart_result = store.add_heart('db-room-42')

    assert comment is not None
    assert comment.room_id == 'db-room-42'
    assert gift_result is not None
    assert gift_result['gift'].room_id == 'db-room-42'
    assert heart_result is not None
    assert heart_result['id'] == 'db-room-42'
    assert heart_result['hearts_count'] == 1
