from pathlib import Path
import textwrap

root = Path('/home/user/work/app')


def read(rel):
    return (root / rel).read_text(encoding='utf-8')


def write(rel, content):
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def replace_once(text, old, new, rel):
    if old not in text:
        raise SystemExit(f'Pattern not found in {rel}: {old[:120]!r}')
    return text.replace(old, new, 1)


# 1) New backend push helper
write('backend/push_utils.py', textwrap.dedent('''
    from __future__ import annotations

    import json
    import logging
    import os
    from functools import lru_cache

    logger = logging.getLogger(__name__)

    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
    except Exception:  # pragma: no cover
        firebase_admin = None
        credentials = None
        messaging = None


    def _normalize_tokens(tokens):
        seen = set()
        result = []
        for token in tokens or []:
            safe = str(token or '').strip()
            if safe and safe not in seen:
                seen.add(safe)
                result.append(safe)
        return result


    @lru_cache(maxsize=1)
    def _firebase_app():
        if firebase_admin is None:
            logger.warning('firebase_admin is not installed')
            return None

        try:
            return firebase_admin.get_app()
        except Exception:
            pass

        raw_json = (os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON') or '').strip()
        json_file = (os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH') or '').strip()

        cred = None
        if raw_json:
            try:
                cred = credentials.Certificate(json.loads(raw_json))
            except Exception as exc:
                logger.exception('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: %s', exc)
                return None
        elif json_file and os.path.exists(json_file):
            try:
                cred = credentials.Certificate(json_file)
            except Exception as exc:
                logger.exception('Invalid FIREBASE_SERVICE_ACCOUNT_PATH: %s', exc)
                return None
        else:
            logger.info('Firebase service account is not configured')
            return None

        try:
            return firebase_admin.initialize_app(cred)
        except Exception as exc:
            logger.exception('Failed to initialize Firebase app: %s', exc)
            return None


    def firebase_enabled() -> bool:
        return _firebase_app() is not None


    def store_user_device_token(cursor, username: str, token: str, platform: str = 'android', app_version: str = '') -> bool:
        safe_username = str(username or '').strip()
        safe_token = str(token or '').strip()
        safe_platform = str(platform or 'android').strip() or 'android'
        safe_app_version = str(app_version or '').strip()
        if not safe_username or not safe_token:
            return False

        cursor.execute('SELECT id FROM user_devices WHERE token=? LIMIT 1', (safe_token,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                'UPDATE user_devices SET username=?, platform=?, app_version=?, last_seen=CURRENT_TIMESTAMP WHERE token=?',
                (safe_username, safe_platform, safe_app_version, safe_token),
            )
        else:
            cursor.execute(
                'INSERT INTO user_devices (username, token, platform, app_version) VALUES (?, ?, ?, ?)',
                (safe_username, safe_token, safe_platform, safe_app_version),
            )
        return True


    def get_user_device_tokens(cursor, username: str):
        safe_username = str(username or '').strip()
        if not safe_username:
            return []

        tokens = []
        try:
            cursor.execute('SELECT token FROM user_devices WHERE username=? ORDER BY id DESC', (safe_username,))
            tokens.extend([row['token'] for row in cursor.fetchall() if row.get('token')])
        except Exception:
            logger.exception('Failed to fetch tokens from user_devices for %s', safe_username)

        try:
            cursor.execute('SELECT fcm_token FROM users WHERE name=? LIMIT 1', (safe_username,))
            row = cursor.fetchone()
            if row and row.get('fcm_token'):
                tokens.append(row['fcm_token'])
        except Exception:
            logger.exception('Failed to fetch fallback users.fcm_token for %s', safe_username)

        return _normalize_tokens(tokens)


    def send_push_tokens(tokens, title: str, body: str, data: dict | None = None) -> bool:
        app = _firebase_app()
        normalized = _normalize_tokens(tokens)
        if app is None or not normalized:
            return False

        payload = {str(k): str(v) for k, v in (data or {}).items() if v is not None}
        success = False

        for token in normalized:
            try:
                message = messaging.Message(
                    token=token,
                    notification=messaging.Notification(title=str(title or '').strip(), body=str(body or '').strip()),
                    data=payload,
                    android=messaging.AndroidConfig(priority='high'),
                    apns=messaging.APNSConfig(headers={'apns-priority': '10'}),
                )
                messaging.send(message, app=app)
                success = True
            except Exception:
                logger.exception('Failed to send push notification to token')
        return success


    def send_push_to_user(cursor, username: str, title: str, body: str, data: dict | None = None) -> bool:
        return send_push_tokens(get_user_device_tokens(cursor, username), title, body, data=data)


    def send_push_to_users(cursor, usernames, title: str, body: str, data: dict | None = None) -> bool:
        tokens = []
        for username in usernames or []:
            tokens.extend(get_user_device_tokens(cursor, username))
        return send_push_tokens(tokens, title, body, data=data)
''').strip() + '\n')

# 2) models.py add user_devices table
rel = 'backend/models.py'
text = read(rel)
old = '''    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''',
new = '''    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''',
# no-op placeholder to keep tuple syntax away
text = text.replace(
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    + ",\n    \"\"\"\n    CREATE TABLE IF NOT EXISTS user_devices (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        username TEXT NOT NULL,\n        token TEXT NOT NULL UNIQUE,\n        platform TEXT DEFAULT 'android',\n        app_version TEXT DEFAULT '',\n        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    )\n    \"\"\""
)
write(rel, text)

# 3) mobile_compat.py rewrite fully for compatibility + token storage + push
write('backend/routes/mobile_compat.py', textwrap.dedent('''
    from flask import Blueprint, jsonify, request

    from auth_utils import current_user
    from models import get_connection
    from push_utils import send_push_to_user, store_user_device_token

    mobile_compat_bp = Blueprint("mobile_compat", __name__)


    @mobile_compat_bp.route("/save_device_token", methods=["POST"])
    def save_device_token():
        user = current_user()
        if not user:
            return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

        data = request.get_json(silent=True) or {}
        token = (data.get("token") or "").strip()
        platform = (data.get("platform") or "android").strip() or "android"
        app_version = (data.get("app_version") or "").strip()
        if not token:
            return jsonify({"message": "رمز الجهاز غير صالح"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET fcm_token=? WHERE name=?", (token, user))
        store_user_device_token(cursor, user, token, platform=platform, app_version=app_version)
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "message": "تم حفظ رمز الجهاز"})


    @mobile_compat_bp.route("/track", methods=["POST"])
    def track_event():
        user = current_user() or "guest"
        data = request.get_json(silent=True) or {}
        event = (data.get("event") or "").strip()
        if not event:
            return jsonify({"ok": True, "message": "لا يوجد حدث للتسجيل"})

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO analytics ("user", event) VALUES (?, ?)', (user, event))
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "message": "تم تسجيل الحدث"})


    @mobile_compat_bp.route("/post", methods=["POST"])
    def legacy_add_post():
        user = current_user()
        if not user:
            return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

        data = request.get_json(silent=True) or {}
        content = (data.get("content") or "").strip()
        media = (data.get("media") or "").strip()
        if not content and not media:
            return jsonify({"message": "لا يمكن نشر محتوى فارغ"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO posts (username, content, media) VALUES (?, ?, ?)", (user, content, media))
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "message": "تم النشر"})


    @mobile_compat_bp.route("/messages", methods=["GET"])
    def legacy_messages():
        user = current_user()
        if not user:
            return jsonify([])

        receiver = (request.args.get("receiver") or "").strip()
        if not receiver:
            return jsonify([])

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT sender, receiver, message, created_at FROM messages
            WHERE (sender=? AND receiver=?)
               OR (sender=? AND receiver=?)
            ORDER BY id ASC
            """,
            (user, receiver, receiver, user),
        )
        rows = cursor.fetchall()
        conn.close()
        return jsonify([
            {
                "sender": row["sender"],
                "receiver": row["receiver"],
                "message": row["message"],
                "created_at": row["created_at"],
            }
            for row in rows
        ])


    @mobile_compat_bp.route("/like", methods=["POST"])
    def legacy_like():
        user = current_user()
        if not user:
            return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

        data = request.get_json(silent=True) or {}
        post_id = int(data.get("post_id") or 0)
        if not post_id:
            return jsonify({"message": "معرّف المنشور غير صالح"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"message": "المنشور غير موجود"}), 404

        cursor.execute("UPDATE posts SET likes = COALESCE(likes, 0) + 1 WHERE id=?", (post_id,))
        if row["username"] != user:
            cursor.execute(
                "INSERT INTO notifications (username, message) VALUES (?, ?)",
                (row["username"], f"❤️ {user} أعجب بمنشورك"),
            )
            send_push_to_user(
                cursor,
                row["username"],
                "إعجاب جديد",
                f"{user} أعجب بمنشورك",
                {"type": "like", "post_id": post_id, "screen": "notifications"},
            )
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "message": "تم الإعجاب"})


    @mobile_compat_bp.route("/comment", methods=["POST"])
    def legacy_comment():
        user = current_user()
        if not user:
            return jsonify({"message": "يجب تسجيل الدخول أولاً"}), 401

        data = request.get_json(silent=True) or {}
        post_id = int(data.get("post_id") or 0)
        comment = (data.get("comment") or "").strip()
        if not post_id or not comment:
            return jsonify({"message": "بيانات التعليق غير مكتملة"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM posts WHERE id=?", (post_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"message": "المنشور غير موجود"}), 404

        cursor.execute("INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)", (post_id, user, comment))
        if row["username"] != user:
            cursor.execute(
                "INSERT INTO notifications (username, message) VALUES (?, ?)",
                (row["username"], f"💬 {user} علّق على منشورك"),
            )
            send_push_to_user(
                cursor,
                row["username"],
                "تعليق جديد",
                f"{user} علّق على منشورك",
                {"type": "comment", "post_id": post_id, "screen": "notifications"},
            )
        conn.commit()
        conn.close()
        return jsonify({"ok": True, "message": "تم التعليق"})
''').strip() + '\n')

# 4) social.py targeted updates
rel = 'backend/routes/social.py'
text = read(rel)
text = replace_once(text, 'from models import get_connection\n', 'from models import get_connection\nfrom push_utils import send_push_to_user\n', rel)
text = replace_once(text,
'''        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (following, f"➕ {follower} بدأ بمتابعتك"),
        )
        action = "تمت المتابعة"
''',
'''        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (following, f"➕ {follower} بدأ بمتابعتك"),
        )
        send_push_to_user(
            cursor,
            following,
            "متابع جديد",
            f"{follower} بدأ بمتابعتك",
            {"type": "follow", "from_user": follower, "screen": "notifications"},
        )
        action = "تمت المتابعة"
''', rel)
text = replace_once(text,
'''    cursor.execute(
        "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
        (sender, receiver, message),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال الرسالة"})
''',
'''    cursor.execute(
        "INSERT INTO messages (sender, receiver, message) VALUES (?, ?, ?)",
        (sender, receiver, message),
    )
    cursor.execute(
        "INSERT INTO notifications (username, message) VALUES (?, ?)",
        (receiver, f"📩 رسالة جديدة من {sender}"),
    )
    send_push_to_user(
        cursor,
        receiver,
        "رسالة جديدة",
        f"{sender}: {message[:80]}",
        {"type": "message", "from_user": sender, "screen": "chat"},
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إرسال الرسالة"})
''', rel)
write(rel, text)

# 5) friends.py rewrite fully with push
write('backend/routes/friends.py', textwrap.dedent('''
    from flask import Blueprint, jsonify, request, session

    from auth_utils import current_user
    from models import get_connection
    from push_utils import send_push_to_user

    friends_bp = Blueprint("friends", __name__)


    def _logged_in_user():
        return current_user()


    @friends_bp.route("/send_friend_request", methods=["POST"])
    def send_friend_request():
        data = request.get_json(silent=True) or {}
        sender = (_logged_in_user() or data.get("sender") or "").strip()
        receiver = (data.get("receiver") or "").strip()

        if not sender or not receiver:
            return jsonify({"message": "بيانات الطلب غير مكتملة"}), 400

        if sender == receiver:
            return jsonify({"message": "لا يمكنك إرسال طلب صداقة لنفسك"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE name=?",
            (receiver,),
        )
        if not cursor.fetchone():
            conn.close()
            return jsonify({"message": "المستخدم غير موجود"}), 404

        cursor.execute(
            """
            SELECT id, status, sender, receiver FROM friend_requests
            WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)
            ORDER BY id DESC
            LIMIT 1
            """,
            (sender, receiver, receiver, sender),
        )
        existing = cursor.fetchone()

        if existing:
            if existing["status"] == "accepted":
                conn.close()
                return jsonify({"message": "أنتم أصدقاء بالفعل"})

            if existing["sender"] == sender and existing["receiver"] == receiver and existing["status"] == "pending":
                conn.close()
                return jsonify({"message": "تم إرسال الطلب مسبقاً"})

            if existing["sender"] == receiver and existing["receiver"] == sender and existing["status"] == "pending":
                conn.close()
                return jsonify({"message": "لديك طلب وارد من هذا المستخدم بالفعل"})

        cursor.execute(
            "INSERT INTO friend_requests (sender, receiver) VALUES (?, ?)",
            (sender, receiver),
        )
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (receiver, f"🤝 {sender} أرسل لك طلب صداقة"),
        )
        send_push_to_user(
            cursor,
            receiver,
            "طلب صداقة جديد",
            f"{sender} أرسل لك طلب صداقة",
            {"type": "friend_request", "from_user": sender, "screen": "notifications"},
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "تم إرسال طلب الصداقة"})


    @friends_bp.route("/handle_friend_request", methods=["POST"])
    def handle_friend_request():
        data = request.get_json(silent=True) or {}
        request_id = data.get("id")
        status = (data.get("status") or "").strip().lower()
        current_user_name = _logged_in_user()

        if not request_id or status not in {"accepted", "rejected"}:
            return jsonify({"message": "بيانات التحديث غير صحيحة"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, sender, receiver, status FROM friend_requests WHERE id=?",
            (request_id,),
        )
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({"message": "طلب الصداقة غير موجود"}), 404

        if current_user_name and row["receiver"] != current_user_name:
            conn.close()
            return jsonify({"message": "غير مصرح لك بتعديل هذا الطلب"}), 403

        cursor.execute(
            "UPDATE friend_requests SET status=? WHERE id=?",
            (status, request_id),
        )

        if status == "accepted":
            cursor.execute(
                "INSERT INTO notifications (username, message) VALUES (?, ?)",
                (row["sender"], f"✅ {row['receiver']} قبل طلب الصداقة"),
            )
            send_push_to_user(
                cursor,
                row["sender"],
                "تم قبول طلب الصداقة",
                f"{row['receiver']} قبل طلب الصداقة",
                {"type": "friend_request_accepted", "screen": "notifications"},
            )
        else:
            cursor.execute(
                "INSERT INTO notifications (username, message) VALUES (?, ?)",
                (row["sender"], f"❌ {row['receiver']} رفض طلب الصداقة"),
            )
            send_push_to_user(
                cursor,
                row["sender"],
                "تم رفض طلب الصداقة",
                f"{row['receiver']} رفض طلب الصداقة",
                {"type": "friend_request_rejected", "screen": "notifications"},
            )

        conn.commit()
        conn.close()

        return jsonify({"message": "تم التحديث"})


    @friends_bp.route("/friend_requests/<username>")
    def friend_requests(username):
        target_user = _logged_in_user() or username
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, sender FROM friend_requests
            WHERE receiver=? AND status='pending'
            ORDER BY id DESC
            """,
            (target_user,),
        )

        data = cursor.fetchall()
        conn.close()

        return jsonify([
            {
                "id": row["id"],
                "sender": row["sender"],
            }
            for row in data
        ])


    @friends_bp.route("/friends/<username>")
    def friends(username):
        target_user = username.strip()
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT sender, receiver FROM friend_requests
            WHERE status='accepted' AND (sender=? OR receiver=?)
            ORDER BY id DESC
            """,
            (target_user, target_user),
        )

        data = cursor.fetchall()
        conn.close()

        result = []
        for row in data:
            friend = row["sender"] if row["sender"] != target_user else row["receiver"]
            result.append(friend)

        return jsonify(result)
''').strip() + '\n')

# 6) live.py rewrite header + create_live part with follower notifications, keep rest from existing after create_live block
live_text = read('backend/routes/live.py')
# fix garbled text while editing full file with targeted replacements
live_text = live_text.replace('from models import get_connection, insert_and_get_id, recent_timestamp_condition\n', 'from models import get_connection, insert_and_get_id, recent_timestamp_condition\nfrom push_utils import send_push_to_users\n')
live_text = replace_once(live_text,
'''    room_id = insert_and_get_id(
        cursor,
        "INSERT INTO live_rooms (username, title) VALUES (?, ?)",
        (username, title),
    )
    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, username, "بدأ البث المباشر الآن"),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم بدء البث الحقيقي داخل المتصفح", "room_id": room_id})
''',
'''    room_id = insert_and_get_id(
        cursor,
        "INSERT INTO live_rooms (username, title) VALUES (?, ?)",
        (username, title),
    )
    cursor.execute(
        "INSERT INTO live_messages (room_id, username, message) VALUES (?, ?, ?)",
        (room_id, username, "بدأ البث المباشر الآن"),
    )
    cursor.execute(
        "SELECT follower FROM follows WHERE following=? ORDER BY id DESC",
        (username,),
    )
    followers = [row["follower"] for row in cursor.fetchall() if row["follower"] != username]
    for follower in followers:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (follower, f"🔴 {username} بدأ بثاً مباشراً بعنوان: {title}"),
        )
    send_push_to_users(
        cursor,
        followers,
        "بث مباشر الآن",
        f"{username} بدأ بثاً مباشراً: {title}",
        {"type": "live", "room_id": room_id, "screen": "live"},
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم بدء البث الحقيقي داخل المتصفح", "room_id": room_id})
''', 'backend/routes/live.py')
live_text = live_text.replace('تم تحديث حالة ا��مشاهد', 'تم تحديث حالة المشاهد')
write('backend/routes/live.py', live_text)

# 7) posts.py targeted import and push calls
rel = 'backend/routes/posts.py'
text = read(rel)
text = replace_once(text, 'from models import UPLOAD_FOLDER, get_connection, insert_and_get_id\n', 'from models import UPLOAD_FOLDER, get_connection, insert_and_get_id\nfrom push_utils import send_push_to_user\n', rel)
text = replace_once(text,
'''    if post_owner != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (post_owner, "❤️ تم الإعجاب بمنشورك"),
        )
    conn.commit()
''',
'''    if post_owner != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (post_owner, "❤️ تم الإعجاب بمنشورك"),
        )
        send_push_to_user(
            cursor,
            post_owner,
            "إعجاب جديد",
            f"{username} أعجب بمنشورك",
            {"type": "like", "post_id": post_id, "screen": "notifications"},
        )
    conn.commit()
''', rel)
text = replace_once(text,
'''    if owner_row["username"] != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (owner_row["username"], "💬 تم التعليق على منشورك"),
        )
    conn.commit()
''',
'''    if owner_row["username"] != username:
        cursor.execute(
            "INSERT INTO notifications (username, message) VALUES (?, ?)",
            (owner_row["username"], "💬 تم التعليق على منشورك"),
        )
        send_push_to_user(
            cursor,
            owner_row["username"],
            "تعليق جديد",
            f"{username} علّق على منشورك",
            {"type": "comment", "post_id": post_id, "screen": "notifications"},
        )
    conn.commit()
''', rel)
write(rel, text)

# 8) requirements/env/render
write('backend/requirements.txt', 'Flask==3.1.0\nFlask-Cors==5.0.0\nWerkzeug==3.1.3\ngunicorn==23.0.0\nPyJWT==2.10.1\npsycopg[binary]==3.2.6\nfirebase-admin==6.8.0\n')
write('backend/.env.example', textwrap.dedent('''
    SECRET_KEY=replace-with-a-long-random-secret
    SESSION_COOKIE_SECURE=1
    DATABASE_URL=postgresql://username:password@host:5432/database_name
    DB_PATH=/var/data/yamshat.db
    ALLOWED_ORIGINS=https://your-render-app.onrender.com,capacitor://localhost,ionic://localhost
    FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id"}
    FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json
''').strip() + '\n')
write('render.yaml', textwrap.dedent('''
    services:
      - type: web
        name: yamshat
        env: python
        rootDir: .
        buildCommand: pip install -r backend/requirements.txt
        startCommand: gunicorn --chdir backend app:app --workers 2 --threads 4 --timeout 120
        healthCheckPath: /health
        autoDeploy: true
        disk:
          name: yamshat-data
          mountPath: /var/data
          sizeGB: 1
        envVars:
          - key: PYTHON_VERSION
            value: 3.11.10
          - key: SECRET_KEY
            generateValue: true
          - key: SESSION_COOKIE_SECURE
            value: "1"
          - key: DATABASE_URL
            sync: false
          - key: DB_PATH
            value: /var/data/yamshat.db
          - key: ALLOWED_ORIGINS
            sync: false
          - key: FIREBASE_SERVICE_ACCOUNT_JSON
            sync: false
''').strip() + '\n')

# 9) app.py more production-friendly allowed origins parsing
rel = 'backend/app.py'
text = read(rel)
text = replace_once(text,
'''allowed_origins = {
    "null",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "https://yamshatl.onrender.com",
    "https://yamshatl-1.onrender.com",
    "capacitor://localhost",
    "ionic://localhost",
}
if render_external:
    allowed_origins.add(render_external)
''',
'''allowed_origins = {
    "null",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "https://yamshat.onrender.com",
    "https://yamshatl.onrender.com",
    "https://yamshatl-1.onrender.com",
    "capacitor://localhost",
    "ionic://localhost",
}
extra_allowed_origins = {
    origin.strip().rstrip('/')
    for origin in os.environ.get('ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
}
allowed_origins.update(extra_allowed_origins)
if render_external:
    allowed_origins.add(render_external)
''', rel)
write(rel, text)

# 10) Android build files
write('mobile/build.gradle.kts', textwrap.dedent('''
    plugins {
        id("com.android.application") version "8.5.2" apply false
        id("org.jetbrains.kotlin.android") version "1.9.24" apply false
        id("com.google.gms.google-services") version "4.4.2" apply false
    }
''').strip() + '\n')

write('mobile/app/build.gradle.kts', textwrap.dedent('''
    plugins {
        id("com.android.application")
        id("org.jetbrains.kotlin.android")
        id("com.google.gms.google-services")
    }

    val appBaseUrl = (project.findProperty("APP_BASE_URL") as String?) ?: "https://yamshat.onrender.com/api/"
    val socketUrl = (project.findProperty("APP_SOCKET_URL") as String?) ?: "https://yamshat.onrender.com"
    val agoraAppId = (project.findProperty("AGORA_APP_ID") as String?) ?: ""

    android {
        namespace = "com.socialapp"
        compileSdk = 34

        defaultConfig {
            applicationId = "com.socialapp"
            minSdk = 24
            targetSdk = 34
            versionCode = 3
            versionName = "2.0"

            testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
            vectorDrawables {
                useSupportLibrary = true
            }

            buildConfigField("String", "BASE_URL", "\"${appBaseUrl}\"")
            buildConfigField("String", "SOCKET_URL", "\"${socketUrl}\"")
            buildConfigField("String", "AGORA_APP_ID", "\"${agoraAppId}\"")
        }

        buildTypes {
            debug {
                isMinifyEnabled = false
                buildConfigField("boolean", "ENABLE_LOGS", "true")
            }
            release {
                isMinifyEnabled = true
                isShrinkResources = true
                buildConfigField("boolean", "ENABLE_LOGS", "false")
                proguardFiles(
                    getDefaultProguardFile("proguard-android-optimize.txt"),
                    "proguard-rules.pro"
                )
            }
        }

        compileOptions {
            sourceCompatibility = JavaVersion.VERSION_17
            targetCompatibility = JavaVersion.VERSION_17
        }

        kotlinOptions {
            jvmTarget = "17"
        }

        buildFeatures {
            viewBinding = true
            buildConfig = true
        }

        packaging {
            resources {
                excludes += "/META-INF/{AL2.0,LGPL2.1}"
            }
        }
    }

    dependencies {
        implementation("androidx.core:core-ktx:1.13.1")
        implementation("androidx.appcompat:appcompat:1.7.0")
        implementation("com.google.android.material:material:1.12.0")
        implementation("androidx.activity:activity-ktx:1.9.1")
        implementation("androidx.fragment:fragment-ktx:1.8.2")
        implementation("androidx.constraintlayout:constraintlayout:2.1.4")
        implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
        implementation("androidx.recyclerview:recyclerview:1.3.2")
        implementation("androidx.cardview:cardview:1.0.0")
        implementation("androidx.viewpager2:viewpager2:1.1.0")
        implementation("androidx.webkit:webkit:1.11.0")

        implementation(platform("com.google.firebase:firebase-bom:33.12.0"))
        implementation("com.google.firebase:firebase-analytics-ktx")
        implementation("com.google.firebase:firebase-messaging-ktx")

        implementation("com.squareup.retrofit2:retrofit:2.9.0")
        implementation("com.squareup.retrofit2:converter-gson:2.9.0")
        implementation("com.squareup.okhttp3:okhttp:4.12.0")
        implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
        implementation("com.github.bumptech.glide:glide:4.16.0")
    }
''').strip() + '\n')

write('mobile/app/src/main/AndroidManifest.xml', textwrap.dedent('''
    <?xml version="1.0" encoding="utf-8"?>
    <manifest xmlns:android="http://schemas.android.com/apk/res/android">

        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.CAMERA" />
        <uses-permission android:name="android.permission.RECORD_AUDIO" />
        <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

        <application
            android:name=".SocialApp"
            android:allowBackup="false"
            android:icon="@android:drawable/sym_def_app_icon"
            android:label="@string/app_name"
            android:supportsRtl="true"
            android:usesCleartextTraffic="false"
            android:theme="@style/Theme.App">

            <meta-data
                android:name="com.google.firebase.messaging.default_notification_channel_id"
                android:value="social_app_channel" />

            <service
                android:name=".services.MyFirebaseService"
                android:exported="false">
                <intent-filter>
                    <action android:name="com.google.firebase.MESSAGING_EVENT" />
                </intent-filter>
            </service>

            <activity android:name="com.socialapp.activities.LiveActivity" />
            <activity android:name="com.socialapp.activities.GroupsActivity" />
            <activity android:name="com.socialapp.activities.NotificationsActivity" />
            <activity android:name="com.socialapp.activities.ReelsActivity" />
            <activity android:name="com.socialapp.activities.ChatActivity" />
            <activity android:name="com.socialapp.activities.ProfileActivity" />
            <activity android:name="com.socialapp.activities.MainActivity" />
            <activity
                android:name="com.socialapp.activities.LoginActivity"
                android:exported="true">
                <intent-filter>
                    <action android:name="android.intent.action.MAIN" />
                    <category android:name="android.intent.category.LAUNCHER" />
                </intent-filter>
            </activity>
        </application>

    </manifest>
''').strip() + '\n')

# 11) Android source helpers
session_rel = 'mobile/app/src/main/java/com/socialapp/network/SessionManager.kt'
session_text = read(session_rel)
session_text = replace_once(session_text,
'''    fun saveUsername(username: String) {
        prefs.edit().putString("username", username).apply()
    }

    fun getUsername(): String = prefs.getString("username", "") ?: ""
''',
'''    fun saveUsername(username: String) {
        prefs.edit().putString("username", username).apply()
    }

    fun getUsername(): String = prefs.getString("username", "") ?: ""

    fun saveEmail(email: String?) {
        prefs.edit().putString("email", email ?: "").apply()
    }

    fun getEmail(): String = prefs.getString("email", "") ?: ""
''', session_rel)
write(session_rel, session_text)

write('mobile/app/src/main/java/com/socialapp/utils/FirebaseBridge.kt', textwrap.dedent('''
    package com.socialapp.utils

    import android.content.Context
    import android.util.Log
    import com.google.firebase.messaging.FirebaseMessaging
    import com.socialapp.BuildConfig
    import com.socialapp.models.ApiMessage
    import com.socialapp.network.ApiClient
    import com.socialapp.network.SessionManager
    import retrofit2.Call
    import retrofit2.Callback
    import retrofit2.Response

    object FirebaseBridge {
        private const val TAG = "FirebaseBridge"

        fun requestAndSyncToken(context: Context) {
            if (!SessionManager.hasToken()) return
            runCatching {
                FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                    if (!task.isSuccessful) {
                        Log.w(TAG, "FCM token request failed", task.exception)
                        return@addOnCompleteListener
                    }
                    val token = task.result?.trim().orEmpty()
                    if (token.isBlank()) return@addOnCompleteListener
                    syncProvidedToken(context, token)
                }
            }.onFailure {
                Log.w(TAG, "Firebase is not fully configured yet", it)
            }
        }

        fun syncProvidedToken(context: Context, token: String) {
            if (!SessionManager.hasToken() || token.isBlank()) return
            ApiClient.api.saveDeviceToken(
                mapOf(
                    "token" to token,
                    "platform" to "android",
                    "app_version" to BuildConfig.VERSION_NAME
                )
            ).enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) = Unit
                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    Log.w(TAG, "Failed to sync FCM token", t)
                }
            })
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/SocialApp.kt', textwrap.dedent('''
    package com.socialapp

    import android.app.Application
    import com.google.firebase.FirebaseApp
    import com.socialapp.network.SessionManager
    import com.socialapp.utils.AppAnalytics
    import com.socialapp.utils.FirebaseBridge
    import com.socialapp.utils.NotificationHelper

    class SocialApp : Application() {
        override fun onCreate() {
            super.onCreate()
            SessionManager.init(this)
            runCatching { FirebaseApp.initializeApp(this) }
            NotificationHelper.ensureChannels(this)
            AppAnalytics.init(this)
            if (SessionManager.hasToken()) {
                FirebaseBridge.requestAndSyncToken(this)
            }
            AppAnalytics.openApp()
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/services/MyFirebaseService.kt', textwrap.dedent('''
    package com.socialapp.services

    import com.google.firebase.messaging.FirebaseMessagingService
    import com.google.firebase.messaging.RemoteMessage
    import com.socialapp.utils.FirebaseBridge
    import com.socialapp.utils.NotificationHelper

    class MyFirebaseService : FirebaseMessagingService() {
        override fun onNewToken(token: String) {
            super.onNewToken(token)
            FirebaseBridge.syncProvidedToken(applicationContext, token)
        }

        override fun onMessageReceived(message: RemoteMessage) {
            super.onMessageReceived(message)
            val title = message.notification?.title ?: message.data["title"] ?: "Social App"
            val body = message.notification?.body ?: message.data["body"] ?: "لديك إشعار جديد"
            NotificationHelper.showNotification(applicationContext, title, body, message.data)
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/utils/NotificationHelper.kt', textwrap.dedent('''
    package com.socialapp.utils

    import android.app.NotificationChannel
    import android.app.NotificationManager
    import android.app.PendingIntent
    import android.content.Context
    import android.content.Intent
    import android.os.Build
    import androidx.core.app.NotificationCompat
    import androidx.core.app.NotificationManagerCompat
    import com.socialapp.R
    import com.socialapp.activities.ChatActivity
    import com.socialapp.activities.MainActivity
    import com.socialapp.activities.NotificationsActivity

    object NotificationHelper {
        const val CHANNEL_ID = "social_app_channel"

        fun ensureChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    context.getString(R.string.notifications_channel_name),
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = context.getString(R.string.notifications_channel_description)
                }
                manager.createNotificationChannel(channel)
            }
        }

        fun showNotification(context: Context, title: String, body: String, data: Map<String, String> = emptyMap()) {
            ensureChannels(context)
            val intent = when (data["screen"]) {
                "chat" -> Intent(context, ChatActivity::class.java).apply {
                    putExtra("receiver", data["from_user"] ?: "")
                }
                "notifications" -> Intent(context, NotificationsActivity::class.java)
                else -> Intent(context, MainActivity::class.java)
            }.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                System.currentTimeMillis().toInt(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            NotificationManagerCompat.from(context).notify(System.currentTimeMillis().toInt(), notification)
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/utils/AppAnalytics.kt', textwrap.dedent('''
    package com.socialapp.utils

    import android.content.Context
    import androidx.core.os.bundleOf
    import com.google.firebase.analytics.FirebaseAnalytics

    object AppAnalytics {
        private var analytics: FirebaseAnalytics? = null

        fun init(context: Context) {
            analytics = FirebaseAnalytics.getInstance(context)
        }

        fun openApp() {
            analytics?.logEvent(FirebaseAnalytics.Event.APP_OPEN, null)
        }

        fun trackScreen(name: String) {
            analytics?.logEvent(
                FirebaseAnalytics.Event.SCREEN_VIEW,
                bundleOf(FirebaseAnalytics.Param.SCREEN_NAME to name)
            )
        }

        fun trackLike(postId: String) {
            analytics?.logEvent(
                "like_post",
                bundleOf("post_id" to postId)
            )
        }

        fun trackLogin(method: String) {
            analytics?.logEvent(
                FirebaseAnalytics.Event.LOGIN,
                bundleOf(FirebaseAnalytics.Param.METHOD to method)
            )
        }
    }
''').strip() + '\n')

api_msg_rel = 'mobile/app/src/main/java/com/socialapp/models/ApiMessage.kt'
api_msg = '''package com.socialapp.models

data class ApiMessage(
    val ok: Boolean? = null,
    val message: String? = null,
    val url: String? = null,
    val token: String? = null,
    val user: String? = null,
    val email: String? = null,
    val room_id: String? = null,
    val host: String? = null,
    val error: String? = null
)
'''
write(api_msg_rel, api_msg)

write('mobile/app/src/main/java/com/socialapp/activities/LoginActivity.kt', textwrap.dedent('''
    package com.socialapp.activities

    import android.Manifest
    import android.content.Intent
    import android.content.pm.PackageManager
    import android.os.Build
    import android.os.Bundle
    import android.widget.Toast
    import androidx.activity.result.contract.ActivityResultContracts
    import androidx.appcompat.app.AppCompatActivity
    import androidx.core.content.ContextCompat
    import com.socialapp.databinding.ActivityLoginBinding
    import com.socialapp.models.ApiMessage
    import com.socialapp.network.ApiClient
    import com.socialapp.network.SessionManager
    import com.socialapp.utils.AppAnalytics
    import com.socialapp.utils.FirebaseBridge
    import retrofit2.Call
    import retrofit2.Callback
    import retrofit2.Response

    class LoginActivity : AppCompatActivity() {

        private lateinit var binding: ActivityLoginBinding
        private val notificationPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { }

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)

            binding = ActivityLoginBinding.inflate(layoutInflater)
            setContentView(binding.root)
            requestNotificationPermissionIfNeeded()

            if (SessionManager.hasToken()) {
                openMain()
                return
            }

            binding.loginBtn.setOnClickListener { doAuth(isRegister = false) }
            binding.registerBtn.setOnClickListener { doAuth(isRegister = true) }
        }

        private fun doAuth(isRegister: Boolean) {
            val username = binding.usernameInput.text.toString().trim()
            val password = binding.passwordInput.text.toString().trim()

            if (username.isBlank() || password.isBlank()) {
                Toast.makeText(this, "أدخل اسم المستخدم وكلمة المرور", Toast.LENGTH_SHORT).show()
                return
            }

            val request = mutableMapOf("username" to username, "password" to password).apply {
                if (username.contains("@")) put("email", username)
                else put("name", username)
            }
            val call = if (isRegister) ApiClient.api.register(request) else ApiClient.api.login(request)
            call.enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    val body = response.body()
                    val token = body?.token
                    if (!token.isNullOrBlank()) {
                        SessionManager.saveToken(token)
                        SessionManager.saveUsername(body?.user ?: username)
                        SessionManager.saveEmail(body?.email)
                        AppAnalytics.trackLogin("jwt_login")
                        FirebaseBridge.requestAndSyncToken(this@LoginActivity)
                        openMain()
                    } else {
                        Toast.makeText(this@LoginActivity, body?.error ?: body?.message ?: "فشل الدخول", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    Toast.makeText(this@LoginActivity, t.message ?: "Network error", Toast.LENGTH_SHORT).show()
                }
            })
        }

        private fun requestNotificationPermissionIfNeeded() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        private fun openMain() {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/activities/MainActivity.kt', textwrap.dedent('''
    package com.socialapp.activities

    import android.Manifest
    import android.content.Intent
    import android.content.pm.PackageManager
    import android.os.Build
    import android.os.Bundle
    import androidx.activity.result.contract.ActivityResultContracts
    import androidx.appcompat.app.AppCompatActivity
    import androidx.core.content.ContextCompat
    import com.socialapp.R
    import com.socialapp.databinding.ActivityMainBinding
    import com.socialapp.fragments.HomeFragment
    import com.socialapp.utils.AppAnalytics
    import com.socialapp.utils.FirebaseBridge

    class MainActivity : AppCompatActivity() {

        private lateinit var binding: ActivityMainBinding
        private val notificationPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { }

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)
            requestNotificationPermissionIfNeeded()
            FirebaseBridge.requestAndSyncToken(this)

            openHome()

            binding.bottomNav.setOnItemSelectedListener { item ->
                when (item.itemId) {
                    R.id.home -> openHome()
                    R.id.reels -> startActivity(Intent(this, ReelsActivity::class.java))
                    R.id.chat -> startActivity(Intent(this, ChatActivity::class.java))
                    R.id.notifications -> startActivity(Intent(this, NotificationsActivity::class.java))
                    R.id.live -> startActivity(Intent(this, LiveActivity::class.java))
                }
                true
            }
        }

        override fun onResume() {
            super.onResume()
            AppAnalytics.trackScreen("main")
        }

        private fun requestNotificationPermissionIfNeeded() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        private fun openHome() {
            supportFragmentManager.beginTransaction()
                .replace(R.id.container, HomeFragment())
                .commit()
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/java/com/socialapp/activities/LiveActivity.kt', textwrap.dedent('''
    package com.socialapp.activities

    import android.Manifest
    import android.content.pm.PackageManager
    import android.os.Build
    import android.os.Bundle
    import android.view.ViewGroup
    import android.webkit.PermissionRequest
    import android.webkit.WebChromeClient
    import android.webkit.WebSettings
    import android.webkit.WebView
    import android.webkit.WebViewClient
    import android.widget.Toast
    import androidx.activity.result.contract.ActivityResultContracts
    import androidx.appcompat.app.AppCompatActivity
    import androidx.core.content.ContextCompat
    import com.socialapp.BuildConfig
    import com.socialapp.databinding.ActivityLiveBinding
    import com.socialapp.models.ApiMessage
    import com.socialapp.network.ApiClient
    import com.socialapp.network.SessionManager
    import com.socialapp.utils.AppAnalytics
    import retrofit2.Call
    import retrofit2.Callback
    import retrofit2.Response

    class LiveActivity : AppCompatActivity() {

        private lateinit var binding: ActivityLiveBinding
        private lateinit var webView: WebView
        private val mediaPermissionsLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { }

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            binding = ActivityLiveBinding.inflate(layoutInflater)
            setContentView(binding.root)
            requestMediaPermissionsIfNeeded()
            setupWebView()

            binding.startLive.setOnClickListener { createLiveRoom() }
            binding.watchLive.setOnClickListener {
                val room = binding.roomInput.text.toString().trim()
                if (room.isNotBlank() && room.all(Char::isDigit)) {
                    openAuthenticatedPage("/live_room.html?id=$room")
                } else {
                    openAuthenticatedPage("/live.html")
                }
            }

            openAuthenticatedPage("/live.html")
        }

        override fun onResume() {
            super.onResume()
            AppAnalytics.trackScreen("live")
        }

        override fun onDestroy() {
            if (::webView.isInitialized) {
                webView.destroy()
            }
            super.onDestroy()
        }

        private fun setupWebView() {
            webView = WebView(this)
            binding.videoContainer.addView(
                webView,
                ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            )
            with(webView.settings) {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                allowContentAccess = true
                allowFileAccess = true
            }
            webView.webViewClient = WebViewClient()
            webView.webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    request.grant(request.resources)
                }
            }
        }

        private fun createLiveRoom() {
            val title = binding.roomInput.text.toString().trim().ifBlank { "Live Room" }
            ApiClient.api.createLive(
                mapOf("title" to title)
            ).enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    val roomId = response.body()?.room_id
                    if (!roomId.isNullOrBlank()) {
                        binding.roomInput.setText(roomId)
                        openAuthenticatedPage("/live_room.html?id=$roomId")
                    } else {
                        openAuthenticatedPage("/live.html")
                    }
                    Toast.makeText(
                        this@LiveActivity,
                        response.body()?.message ?: "تم تجهيز البث المباشر",
                        Toast.LENGTH_LONG
                    ).show()
                }

                override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                    Toast.makeText(this@LiveActivity, t.message ?: "Live failed", Toast.LENGTH_SHORT).show()
                }
            })
        }

        private fun openAuthenticatedPage(path: String) {
            val socketUrl = BuildConfig.SOCKET_URL.trimEnd('/')
            val targetUrl = if (path.startsWith("http")) path else "$socketUrl$path"
            val safeToken = jsEscape(SessionManager.getToken().orEmpty())
            val safeUser = jsEscape(SessionManager.getUsername())
            val safeEmail = jsEscape(SessionManager.getEmail())
            val safeApiBase = jsEscape(BuildConfig.BASE_URL.trimEnd('/'))
            val bootstrap = """
                <!doctype html>
                <html><head><meta charset=\"utf-8\"></head><body style=\"background:#000;color:#fff;font-family:sans-serif;display:grid;place-items:center;height:100vh;\">جاري تجهيز البث...</body>
                <script>
                  localStorage.setItem('apiBase', '$safeApiBase');
                  localStorage.setItem('yamshatAuth', JSON.stringify({token:'$safeToken', user:'$safeUser', email:'$safeEmail'}));
                  window.location.replace('$targetUrl');
                </script></html>
            """.trimIndent()
            webView.loadDataWithBaseURL(socketUrl, bootstrap, "text/html", "utf-8", null)
        }

        private fun jsEscape(value: String): String {
            return value
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "")
        }

        private fun requestMediaPermissionsIfNeeded() {
            val permissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions += Manifest.permission.POST_NOTIFICATIONS
            }
            val missing = permissions.filter {
                ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
            }
            if (missing.isNotEmpty()) {
                mediaPermissionsLauncher.launch(missing.toTypedArray())
            }
        }
    }
''').strip() + '\n')

write('mobile/app/src/main/res/values/strings.xml', textwrap.dedent('''
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
        <string name="app_name">SocialApp</string>
        <string name="notifications_channel_name">Social notifications</string>
        <string name="notifications_channel_description">Push notifications for messages, follows, live, and activity updates</string>
    </resources>
''').strip() + '\n')

print('Patch completed successfully.')
