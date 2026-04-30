from __future__ import annotations

from flask import Blueprint, jsonify, request

from admin_utils import enforce_moderation, log_audit
from config import Config
from db import db_cursor
from extensions import limiter
from utils import current_user, json_error, normalize_text, require_auth

live_api_bp = Blueprint("live_api", __name__)


@live_api_bp.post("/send_gift")
@require_auth
@limiter.limit("60/hour")
def send_gift():
    sender = current_user() or ""
    data = request.get_json(silent=True) or {}
    receiver = normalize_text(data.get("receiver"), 80)
    gift = normalize_text(data.get("gift"), 80, escape_html=True)
    value = int(data.get("value") or 0)

    if not receiver or not gift:
        return json_error("بيانات الهدية غير مكتملة", 400)
    if receiver == sender:
        return json_error("لا يمكنك إرسال هدية لنفسك", 400)
    if value < 0:
        return json_error("قيمة الهدية غير صالحة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        moderation_error = enforce_moderation(cur, sender, "live")
        if moderation_error:
            return json_error(moderation_error, 403)
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (receiver,))
        if not cur.fetchone():
            return json_error("المستلم غير موجود", 404)

        cur.execute(
            "INSERT INTO coins(username,balance,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT (username) DO NOTHING",
            (sender, Config.DEFAULT_COIN_BALANCE),
        )
        cur.execute(
            "INSERT INTO coins(username,balance,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT (username) DO NOTHING",
            (receiver, Config.DEFAULT_COIN_BALANCE),
        )
        cur.execute("SELECT balance FROM coins WHERE username=%s", (sender,))
        sender_row = cur.fetchone() or {"balance": 0}
        balance = int(sender_row.get("balance") or 0)
        if balance < value:
            return json_error("رصيد العملات غير كافٍ", 400)

        cur.execute("UPDATE coins SET balance=balance-%s, updated_at=NOW() WHERE username=%s", (value, sender))
        cur.execute("UPDATE coins SET balance=balance+%s, updated_at=NOW() WHERE username=%s", (value, receiver))
        cur.execute(
            "INSERT INTO gifts(sender,receiver,gift,value) VALUES(%s,%s,%s,%s)",
            (sender, receiver, gift, value),
        )
        note = f"🎁 {sender} أرسل لك {gift}"
        cur.execute(
            "INSERT INTO notifications(username,text,message,seen,is_read) VALUES(%s,%s,%s,FALSE,FALSE)",
            (receiver, note, note),
        )
        cur.execute("SELECT balance FROM coins WHERE username=%s", (sender,))
        remaining = int((cur.fetchone() or {}).get("balance") or 0)
        log_audit(cur, action="gift_sent", actor=sender, target_type="user", target_value=receiver, details=f"{gift}:{value}")

    return jsonify({"ok": True, "message": "تم إرسال الهدية", "balance": remaining})


@live_api_bp.get("/coins/<username>")
def get_coin_balance(username: str):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "INSERT INTO coins(username,balance,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT (username) DO NOTHING",
            (username, Config.DEFAULT_COIN_BALANCE),
        )
        cur.execute("SELECT balance FROM coins WHERE username=%s", (username,))
        row = cur.fetchone() or {"balance": 0}
    return jsonify({"username": username, "balance": int(row.get("balance") or 0)})
