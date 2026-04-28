
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(cors_allowed_origins="*")

def init_socket(app):
    socketio.init_app(app)

@socketio.on("join_live")
def join_live(data):
    join_room(data.get("room_id"))

@socketio.on("send_comment")
def send_comment(data):
    emit(
        "new_comment",
        {
            "user": data.get("user"),
            "text": data.get("text")
        },
        room=data.get("room_id")
    )

@socketio.on("send_heart")
def send_heart(data):
    emit("new_heart", {}, room=data.get("room_id"))

@socketio.on("send_gift")
def send_gift(data):
    emit(
        "new_gift",
        {
            "user": data.get("user"),
            "gift": data.get("gift")
        },
        room=data.get("room_id")
    )
