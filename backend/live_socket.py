from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(cors_allowed_origins='*')

def init_socket(app):
    socketio.init_app(app)

@socketio.on('join_live')
def join_live(data):
    room = data.get('room_id')
    if room:
        join_room(room)

@socketio.on('send_comment')
def send_comment(data):
    room = data.get('room_id')
    emit('new_comment', {
        'user': data.get('user', 'guest'),
        'text': data.get('text', '')
    }, room=room)

@socketio.on('send_heart')
def send_heart(data):
    room = data.get('room_id')
    emit('new_heart', {}, room=room)

@socketio.on('send_gift')
def send_gift(data):
    room = data.get('room_id')
    emit('new_gift', {
        'user': data.get('user', 'guest'),
        'gift': data.get('gift', '🎁')
    }, room=room)
