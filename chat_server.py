from __future__ import annotations

import base64
import os
import sqlite3
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from typing import Any

import jwt
from flask import Flask, jsonify, redirect, request, send_from_directory, session, url_for
from flask_socketio import SocketIO, disconnect, emit, join_room, leave_room
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "chat_app.db"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.getenv("SECRET_KEY", "yamshat-secret")
JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "1440"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "15"))

ALLOWED_UPLOAD_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp", "mp4", "webm", "mov", "mp3", "wav", "ogg", "m4a", "aac", "pdf", "txt"
}
ALLOWED_MIME_PREFIXES = ("image/", "audio/", "video/")

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    manage_session=True,
    async_mode=os.getenv("SOCKETIO_ASYNC_MODE", "threading"),
)

_db_lock = threading.Lock()
_rate_state: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_connected_users: dict[str, set[str]] = defaultdict(set)
_sid_to_user: dict[str, str] = {}
_sid_rooms: dict[str, set[str]] = defaultdict(set)
_user_presence: dict[str, dict[str, Any]] = defaultdict(dict)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return utc_now().replace(microsecond=0).isoformat()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def run_db(query: str, params: tuple[Any, ...] = (), fetchone: bool = False, fetchall: bool = False, commit: bool = False):
    with _db_lock:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(query, params)
        data = None
        if fetchone:
            data = cur.fetchone()
        elif fetchall:
            data = cur.fetchall()
        if commit:
            conn.commit()
        lastrowid = cur.lastrowid
        conn.close()
    return data if (fetchone or fetchall) else lastrowid


def init_db() -> None:
    schema = """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT DEFAULT '',
        role TEXT DEFAULT 'user',
        last_seen TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        sender TEXT NOT NULL,
        receiver TEXT,
        message TEXT DEFAULT '',
        type TEXT DEFAULT 'text',
        media_url TEXT,
        status TEXT DEFAULT 'sent',
        delivered_at TEXT,
        seen_at TEXT,
        edited_at TEXT,
        deleted INTEGER DEFAULT 0,
        client_id TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        sender TEXT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """
    with _db_lock:
        conn = get_db()
        conn.executescript(schema)
        conn.commit()
        conn.close()

    seed_default_users()


def seed_default_users() -> None:
    defaults = [
        ("admin", "1234", "admin@example.com", "admin"),
        ("user1", "1234", "user1@example.com", "user"),
        ("user2", "1234", "user2@example.com", "user"),
        ("demo", "1234", "demo@example.com", "user"),
    ]
    for username, password, email, role in defaults:
        existing = run_db("SELECT id FROM users WHERE username = ?", (username,), fetchone=True)
        if existing:
            continue
        run_db(
            "INSERT INTO users(username, password_hash, email, role, created_at) VALUES(?,?,?,?,?)",
            (username, generate_password_hash(password), email, role, now_iso()),
            commit=True,
        )


def get_user_by_username(username: str | None):
    if not username:
        return None
    row = run_db("SELECT * FROM users WHERE username = ?", (username,), fetchone=True)
    return dict(row) if row else None


def serialize_user(user: dict[str, Any] | None) -> dict[str, Any] | None:
    if not user:
        return None
    return {
        "username": user.get("username"),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
        "last_seen": user.get("last_seen"),
    }


def authenticate_credentials(username: str, password: str):
    user = get_user_by_username(username)
    if not user:
        return None
    if not check_password_hash(user["password_hash"], password):
        return None
    return user


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": utc_now() + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
        "iat": utc_now(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def extract_bearer_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return None


def resolve_request_user() -> str | None:
    session_user = session.get("user")
    if session_user:
        return session_user
    token = extract_bearer_token()
    return decode_access_token(token)


def socket_user_from_auth(auth: Any = None) -> str | None:
    session_user = session.get("user")
    if session_user:
        return session_user
    token = extract_bearer_token()
    if not token and isinstance(auth, dict):
        token = auth.get("token")
    return decode_access_token(token)


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        username = resolve_request_user()
        if not username:
            return jsonify({"error": "unauthorized"}), 401
        request.current_user = username
        return fn(*args, **kwargs)

    return wrapper


def enforce_rate_limit(subject: str, action: str, limit: int, window_seconds: int) -> bool:
    key = (subject, action)
    bucket = _rate_state[key]
    now = time.time()
    while bucket and bucket[0] <= now - window_seconds:
        bucket.popleft()
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_UPLOAD_EXTENSIONS


def conversation_room(sender: str, receiver: str | None = None, room: str | None = None) -> str:
    if room:
        return f"room:{room.strip()}"
    if not receiver:
        return f"user:{sender}"
    left, right = sorted([sender.strip().lower(), receiver.strip().lower()])
    return f"dm:{left}:{right}"


def format_message(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    item = dict(row)
    return {
        "id": item.get("id"),
        "sender": item.get("sender"),
        "receiver": item.get("receiver"),
        "message": item.get("message", ""),
        "content": item.get("message", ""),
        "type": item.get("type", "text"),
        "media_url": item.get("media_url"),
        "deleted": bool(item.get("deleted")),
        "status": item.get("status", "sent"),
        "created_at": item.get("created_at"),
        "edited_at": item.get("edited_at"),
        "delivered_at": item.get("delivered_at"),
        "seen_at": item.get("seen_at"),
        "displayMessage": "تم حذف هذه الرسالة" if item.get("deleted") else item.get("message", ""),
    }


def format_notification(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    item = dict(row)
    return {
        "id": item.get("id"),
        "from_user": item.get("sender", ""),
        "sender": item.get("sender", ""),
        "type": item.get("type"),
        "message": item.get("message"),
        "seen": 1 if item.get("is_read") else 0,
        "read": bool(item.get("is_read")),
        "link": item.get("link"),
        "created_at": item.get("created_at"),
    }


def user_online(username: str | None) -> bool:
    return bool(username and _connected_users.get(username))


def update_user_last_seen(username: str) -> None:
    run_db("UPDATE users SET last_seen = ? WHERE username = ?", (now_iso(), username), commit=True)


def send_notification(to_user: str, from_user: str, notif_type: str, message: str, link: str | None = None) -> dict[str, Any]:
    notif_id = run_db(
        "INSERT INTO notifications(user, sender, type, message, link, created_at) VALUES(?,?,?,?,?,?)",
        (to_user, from_user, notif_type, message, link, now_iso()),
        commit=True,
    )
    notif = run_db("SELECT * FROM notifications WHERE id = ?", (notif_id,), fetchone=True)
    payload = format_notification(notif)
    socketio.emit("new_notification", payload, room=to_user)
    socketio.emit("notification", payload, room=to_user)
    return payload


def mark_delivered_for_user(username: str, sender: str | None = None) -> None:
    filters = ["receiver = ?", "status = 'sent'", "deleted = 0"]
    params: list[Any] = [username]
    if sender:
        filters.append("sender = ?")
        params.append(sender)
    rows = run_db(
        f"SELECT * FROM messages WHERE {' AND '.join(filters)} ORDER BY id ASC",
        tuple(params),
        fetchall=True,
    )
    if not rows:
        return
    delivered_at = now_iso()
    msg_ids = [row["id"] for row in rows]
    with _db_lock:
        conn = get_db()
        conn.execute(
            f"UPDATE messages SET status = 'delivered', delivered_at = ? WHERE id IN ({','.join(['?'] * len(msg_ids))})",
            (delivered_at, *msg_ids),
        )
        conn.commit()
        conn.close()
    for row in rows:
        socketio.emit(
            "messages_delivered",
            {
                "message_id": row["id"],
                "sender": row["sender"],
                "receiver": row["receiver"],
                "status": "delivered",
                "delivered_at": delivered_at,
            },
            room=row["sender"],
        )


def mark_seen_messages(receiver: str, sender: str | None = None) -> int:
    filters = ["receiver = ?", "deleted = 0", "status != 'seen'"]
    params: list[Any] = [receiver]
    if sender:
        filters.append("sender = ?")
        params.append(sender)
    rows = run_db(
        f"SELECT * FROM messages WHERE {' AND '.join(filters)} ORDER BY id ASC",
        tuple(params),
        fetchall=True,
    )
    if not rows:
        return 0
    seen_at = now_iso()
    msg_ids = [row["id"] for row in rows]
    with _db_lock:
        conn = get_db()
        conn.execute(
            f"UPDATE messages SET status = 'seen', seen_at = ?, delivered_at = COALESCE(delivered_at, ?) WHERE id IN ({','.join(['?'] * len(msg_ids))})",
            (seen_at, seen_at, *msg_ids),
        )
        conn.commit()
        conn.close()
    for row in rows:
        socketio.emit(
            "messages_seen",
            {
                "message_id": row["id"],
                "sender": row["sender"],
                "receiver": row["receiver"],
                "status": "seen",
                "seen_at": seen_at,
            },
            room=row["sender"],
        )
    return len(rows)


def validate_message_content(message: str, media_url: str | None) -> tuple[bool, str | None]:
    if not message and not media_url:
        return False, "لا يمكن إرسال رسالة فارغة"
    if len(message) > 4000:
        return False, "الرسالة طويلة جداً"
    return True, None


def create_message_record(sender: str, receiver: str | None, room: str | None, message: str, msg_type: str, media_url: str | None, client_id: str | None) -> dict[str, Any]:
    valid, error = validate_message_content(message, media_url)
    if not valid:
        raise ValueError(error)

    if not enforce_rate_limit(sender, "send_message", 12, 10):
        raise PermissionError("تم تجاوز الحد المسموح لإرسال الرسائل، حاول بعد قليل")

    status = "delivered" if receiver and user_online(receiver) else "sent"
    timestamp = now_iso()
    room_name = conversation_room(sender, receiver, room)
    message_id = run_db(
        """
        INSERT INTO messages(room, sender, receiver, message, type, media_url, status, delivered_at, client_id, created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)
        """,
        (
            room_name,
            sender,
            receiver,
            message,
            msg_type or "text",
            media_url,
            status,
            timestamp if status == "delivered" else None,
            client_id,
            timestamp,
        ),
        commit=True,
    )
    row = run_db("SELECT * FROM messages WHERE id = ?", (message_id,), fetchone=True)
    payload = format_message(row)
    payload["room"] = room_name
    socketio.emit("receive_message", payload, room=room_name)
    socketio.emit("new_private_message", payload, room=room_name)

    if receiver and receiver != sender:
        send_notification(
            to_user=receiver,
            from_user=sender,
            notif_type="message",
            message=f"رسالة جديدة من {sender}",
            link=f"/chat.html?peer={sender}",
        )
    return payload


@app.route("/")
def root_page():
    return redirect(url_for("chat_page") if session.get("user") else url_for("login_page"))


@app.route("/chat.html")
def chat_page():
    return send_from_directory(BASE_DIR, "chat.html")


@app.route("/login.html")
def login_page():
    return send_from_directory(BASE_DIR, "login.html")


@app.route("/chat.js")
def chat_js():
    return send_from_directory(BASE_DIR, "chat.js")


@app.route("/chat.css")
def chat_css():
    return send_from_directory(BASE_DIR, "chat.css")


@app.route("/uploads/<path:filename>")
def uploaded_file(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/send_message", methods=["POST"])
@auth_required
def send_message_route():
    data = request.get_json(silent=True) or {}
    try:
        payload = create_message_record(
            sender=request.current_user,
            receiver=(data.get("receiver") or "").strip() or None,
            room=(data.get("room") or "").strip() or None,
            message=(data.get("message") or "").strip(),
            msg_type=(data.get("type") or "text").strip(),
            media_url=data.get("media_url"),
            client_id=data.get("client_id"),
        )
        return jsonify(payload)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), 429
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/get_messages")
@auth_required
def get_messages_route():
    current_user = request.current_user
    receiver = (request.args.get("receiver") or "").strip()
    room = (request.args.get("room") or "").strip()
    if not receiver and not room:
        return jsonify([])

    room_name = conversation_room(current_user, receiver or None, room or None)
    rows = run_db(
        "SELECT * FROM messages WHERE room = ? ORDER BY id ASC LIMIT 300",
        (room_name,),
        fetchall=True,
    )
    if receiver:
        mark_delivered_for_user(current_user, sender=receiver)
    return jsonify([format_message(row) for row in rows])


@app.route("/delete_message", methods=["POST"])
@auth_required
def delete_message_route():
    data = request.get_json(silent=True) or {}
    message_id = data.get("message_id")
    row = run_db("SELECT * FROM messages WHERE id = ?", (message_id,), fetchone=True)
    if not row:
        return jsonify({"error": "الرسالة غير موجودة"}), 404
    if row["sender"] != request.current_user:
        return jsonify({"error": "غير مسموح"}), 403

    run_db(
        "UPDATE messages SET deleted = 1, status = 'deleted', message = '', edited_at = ? WHERE id = ?",
        (now_iso(), message_id),
        commit=True,
    )
    payload = {
        "message_id": message_id,
        "room": row["room"],
        "sender": request.current_user,
    }
    socketio.emit("message_deleted", payload, room=row["room"])
    return jsonify({"ok": True, "status": "deleted"})


@app.route("/edit_message", methods=["POST"])
@auth_required
def edit_message_route():
    data = request.get_json(silent=True) or {}
    message_id = data.get("message_id")
    new_message = (data.get("message") or data.get("new_message") or "").strip()
    if not new_message:
        return jsonify({"error": "اكتب الرسالة الجديدة"}), 400

    row = run_db("SELECT * FROM messages WHERE id = ?", (message_id,), fetchone=True)
    if not row:
        return jsonify({"error": "الرسالة غير موجودة"}), 404
    if row["sender"] != request.current_user:
        return jsonify({"error": "غير مسموح"}), 403
    if row["deleted"]:
        return jsonify({"error": "لا يمكن تعديل رسالة محذوفة"}), 400

    run_db(
        "UPDATE messages SET message = ?, edited_at = ? WHERE id = ?",
        (new_message, now_iso(), message_id),
        commit=True,
    )
    updated = run_db("SELECT * FROM messages WHERE id = ?", (message_id,), fetchone=True)
    payload = format_message(updated)
    socketio.emit("message_edited", payload, room=row["room"])
    return jsonify(payload)


@app.route("/message_seen", methods=["POST"])
@auth_required
def mark_seen_route():
    data = request.get_json(silent=True) or {}
    sender = (data.get("sender") or data.get("from_user") or "").strip() or None
    count = mark_seen_messages(request.current_user, sender=sender)
    return jsonify({"ok": True, "count": count})


@app.route("/typing", methods=["POST"])
@auth_required
def typing_route():
    current_user = request.current_user
    data = request.get_json(silent=True) or {}
    if not enforce_rate_limit(current_user, "typing", 25, 10):
        return jsonify({"error": "typing throttled"}), 429

    receiver = (data.get("receiver") or "").strip() or None
    room = (data.get("room") or "").strip() or None
    is_typing = bool(data.get("is_typing", True))
    target_room = conversation_room(current_user, receiver, room)
    socketio.emit(
        "typing_update",
        {"sender": current_user, "receiver": receiver, "room": target_room, "is_typing": is_typing},
        room=target_room,
        include_self=False,
    )
    socketio.emit(
        "user_typing",
        {"user": current_user, "room": target_room, "is_typing": is_typing},
        room=target_room,
        include_self=False,
    )
    return jsonify({"ok": True})


@app.route("/update_online", methods=["POST"])
@auth_required
def update_online_route():
    current_user = request.current_user
    data = request.get_json(silent=True) or {}
    online = bool(data.get("online", True))
    _user_presence[current_user] = {"is_online": online, "last_seen": now_iso()}
    if not online:
        update_user_last_seen(current_user)
    socketio.emit(
        "presence_update",
        {"user": current_user, "is_online": online, "last_seen": _user_presence[current_user]["last_seen"]},
    )
    return jsonify({"ok": True, "is_online": online})


@app.route("/presence/<username>")
@auth_required
def presence_route(username: str):
    user = get_user_by_username(username)
    last_seen = None
    if user and user.get("last_seen"):
        last_seen = user["last_seen"]
    cached = _user_presence.get(username) or {}
    return jsonify(
        {
            "ok": True,
            "user": username,
            "is_online": user_online(username) or bool(cached.get("is_online")),
            "last_seen": cached.get("last_seen") or last_seen,
        }
    )


@app.route("/notifications")
@auth_required
def notifications_route():
    rows = run_db(
        "SELECT * FROM notifications WHERE user = ? ORDER BY id DESC LIMIT 200",
        (request.current_user,),
        fetchall=True,
    )
    return jsonify([format_notification(row) for row in rows])


@app.route("/notifications/read/<int:notif_id>", methods=["POST"])
@auth_required
def mark_notification_read_route(notif_id: int):
    row = run_db("SELECT * FROM notifications WHERE id = ?", (notif_id,), fetchone=True)
    if not row or row["user"] != request.current_user:
        return jsonify({"error": "غير موجود"}), 404
    run_db("UPDATE notifications SET is_read = 1 WHERE id = ?", (notif_id,), commit=True)
    return jsonify({"status": "ok"})


@app.route("/upload", methods=["POST"])
@auth_required
def upload_route():
    current_user = request.current_user
    if not enforce_rate_limit(current_user, "upload", 8, 60):
        return jsonify({"error": "عدد الرفع كبير جداً، حاول لاحقاً"}), 429

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "لا يوجد ملف"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "صيغة الملف غير مدعومة"}), 400
    safe_name = secure_filename(file.filename)
    ext = safe_name.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    destination = UPLOAD_DIR / unique_name
    file.save(destination)
    return jsonify({"ok": True, "file_url": f"/uploads/{unique_name}", "url": f"/uploads/{unique_name}"})


@app.route("/send_voice", methods=["POST"])
@auth_required
def send_voice_route():
    current_user = request.current_user
    if not enforce_rate_limit(current_user, "voice", 8, 60):
        return jsonify({"error": "عدد الرسائل الصوتية كبير جداً"}), 429

    file = request.files.get("file")
    if file and file.filename:
        ext = secure_filename(file.filename).rsplit('.', 1)[-1].lower() if '.' in file.filename else 'webm'
        unique_name = f"voice_{uuid.uuid4().hex}.{ext}"
        destination = UPLOAD_DIR / unique_name
        file.save(destination)
        return jsonify({"ok": True, "file_url": f"/uploads/{unique_name}", "url": f"/uploads/{unique_name}"})

    data = request.get_json(silent=True) or {}
    audio_base64 = data.get("audio")
    if not audio_base64:
        return jsonify({"error": "لا يوجد صوت"}), 400
    raw = audio_base64.split(",", 1)[-1]
    unique_name = f"voice_{uuid.uuid4().hex}.wav"
    destination = UPLOAD_DIR / unique_name
    with open(destination, "wb") as handle:
        handle.write(base64.b64decode(raw))
    return jsonify({"ok": True, "file_url": f"/uploads/{unique_name}", "url": f"/uploads/{unique_name}"})


@socketio.on("connect")
def handle_connect(auth=None):
    username = socket_user_from_auth(auth)
    if not username:
        return False

    _sid_to_user[request.sid] = username
    _connected_users[username].add(request.sid)
    _user_presence[username] = {"is_online": True, "last_seen": now_iso()}
    join_room(username)
    _sid_rooms[request.sid].add(username)
    mark_delivered_for_user(username)
    emit("user_connected", {"username": username}, room=username)
    socketio.emit(
        "presence_update",
        {"user": username, "is_online": True, "last_seen": _user_presence[username]["last_seen"]},
    )


@socketio.on("join_room")
def handle_join_room(data):
    username = _sid_to_user.get(request.sid)
    if not username:
        disconnect()
        return
    room = (data or {}).get("room")
    receiver = (data or {}).get("receiver")
    room_name = conversation_room(username, receiver, room)
    join_room(room_name)
    _sid_rooms[request.sid].add(room_name)
    if receiver:
        mark_delivered_for_user(username, sender=receiver)
    emit("status", {"msg": f"{username} دخل الغرفة", "room": room_name}, room=room_name)


@socketio.on("join_chat")
def handle_join_chat(data):
    username = _sid_to_user.get(request.sid)
    if not username:
        disconnect()
        return
    peer = ((data or {}).get("peer") or "").strip() or None
    room = ((data or {}).get("room") or "").strip() or None
    room_name = conversation_room(username, peer, room)
    join_room(room_name)
    _sid_rooms[request.sid].add(room_name)
    if peer:
        mark_delivered_for_user(username, sender=peer)
    emit("status", {"msg": f"{username} انضم للمحادثة", "room": room_name}, room=room_name)


@socketio.on("leave_room")
def handle_leave_room(data):
    room = ((data or {}).get("room") or "").strip()
    if room:
        room_name = room if room.startswith(("dm:", "room:", "user:")) else f"room:{room}"
        leave_room(room_name)
        _sid_rooms[request.sid].discard(room_name)


@socketio.on("send_message")
def handle_socket_message(data):
    username = _sid_to_user.get(request.sid)
    if not username:
        disconnect()
        return
    try:
        create_message_record(
            sender=username,
            receiver=((data or {}).get("receiver") or "").strip() or None,
            room=((data or {}).get("room") or "").strip() or None,
            message=((data or {}).get("message") or "").strip(),
            msg_type=((data or {}).get("type") or "text").strip(),
            media_url=(data or {}).get("media_url"),
            client_id=(data or {}).get("client_id"),
        )
    except PermissionError as exc:
        emit("error_message", {"error": str(exc)})
    except ValueError as exc:
        emit("error_message", {"error": str(exc)})


@socketio.on("typing")
@socketio.on("chat_typing")
def handle_socket_typing(data):
    username = _sid_to_user.get(request.sid)
    if not username:
        disconnect()
        return
    receiver = ((data or {}).get("receiver") or "").strip() or None
    room = ((data or {}).get("room") or "").strip() or None
    is_typing = bool((data or {}).get("is_typing", True))
    room_name = conversation_room(username, receiver, room)
    emit(
        "typing_update",
        {"sender": username, "receiver": receiver, "room": room_name, "is_typing": is_typing},
        room=room_name,
        include_self=False,
    )
    emit(
        "user_typing",
        {"user": username, "room": room_name, "is_typing": is_typing},
        room=room_name,
        include_self=False,
    )


@socketio.on("chat_presence")
def handle_socket_presence(data):
    username = _sid_to_user.get(request.sid)
    if not username:
        disconnect()
        return
    online = bool((data or {}).get("online", True))
    _user_presence[username] = {"is_online": online, "last_seen": now_iso()}
    if not online:
        update_user_last_seen(username)
    emit(
        "presence_update",
        {"user": username, "is_online": online, "last_seen": _user_presence[username]["last_seen"]},
    )


@socketio.on("disconnect")
def handle_disconnect():
    username = _sid_to_user.pop(request.sid, None)
    if not username:
        return
    if username in _connected_users:
        _connected_users[username].discard(request.sid)
        if not _connected_users[username]:
            _connected_users.pop(username, None)
            update_user_last_seen(username)
            _user_presence[username] = {"is_online": False, "last_seen": now_iso()}
            socketio.emit(
                "presence_update",
                {"user": username, "is_online": False, "last_seen": _user_presence[username]["last_seen"]},
                    )
    _sid_rooms.pop(request.sid, None)


from auth import auth  # noqa: E402

app.register_blueprint(auth)
init_db()


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
