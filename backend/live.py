
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO(cors_allowed_origins="*")

def init_socket(app):
    socketio.init_app(app)

@socketio.on("join_live")
def join(data):
    join_room(data["room"])

@socketio.on("comment")
def comment(data):
    emit("comment", data, room=data["room"])

@socketio.on("heart")
def heart(data):
    emit("heart", data, room=data["room"])

@socketio.on("gift")
def gift(data):
    emit("gift", data, room=data["room"])
