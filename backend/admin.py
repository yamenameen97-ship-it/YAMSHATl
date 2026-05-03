from __future__ import annotations

from pathlib import Path

from flask import Blueprint, jsonify, request

from admin_utils import apply_moderation, get_active_moderation, log_audit, moderation_flags
from config import Config
from db import db_cursor
from media_store import delete_media_file
from utils import current_user, normalize_text, require_admin

admin_bp = Blueprint("admin", __name__)


ACTIVE_VIEWER_WINDOW = "90 seconds"
ONLINE_WINDOW = "5 minutes"
UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)


def _count(cur, table_name: str, where_clause: str = "", params: tuple = ()) -> int:
    query = f"SELECT COUNT(*) AS total FROM {table_name}"
    if where_clause:
        query += f" WHERE {where_clause}"
    cur.execute(query, params)
    row = cur.fetchone() or {}
    return int(row.get("total") or 0)


def _growth(current: int, previous: int) -> float:
    if previous <= 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def _timeline_map(rows, label_key: str = "label", value_key: str = "value") -> list[dict]:
    return [{"label": row.get(label_key), "value": int(row.get(value_key) or 0)} for row in rows or []]


@admin_bp.get("/admin_overview")
@require_admin
def admin_overview():
    with db_cursor() as (_conn, cur):
        stats = {
            "users": _count(cur, "users"),
            "online_users": _count(cur, "users", f"COALESCE(is_online,FALSE)=TRUE AND last_seen > NOW() - INTERVAL '{ONLINE_WINDOW}'"),
            "posts": _count(cur, "posts"),
            "comments": _count(cur, "comments"),
            "messages": _count(cur, "messages", "deleted=FALSE"),
            "reels": _count(cur, "reels"),
            "live_rooms": _count(cur, "live_rooms", "status='live'"),
            "reports": _count(cur, "reports", "status='open'"),
            "followers": _count(cur, "followers"),
            "gifts": _count(cur, "gifts"),
            "stories": _count(cur, "stories"),
        }

        cur.execute(
            f"SELECT COUNT(*) AS total FROM messages WHERE deleted=FALSE AND created_at > NOW() - INTERVAL '1 minute'"
        )
        messages_per_minute = int((cur.fetchone() or {}).get("total") or 0)

        cur.execute(
            """
            SELECT action, COUNT(*) AS total
            FROM moderation_actions
            WHERE is_active=TRUE
              AND (expires_at IS NULL OR expires_at > NOW())
              AND action = ANY(%s)
            GROUP BY action
            """,
            (["ban", "mute", "restrict"],),
        )
        moderation_summary = {"ban": 0, "mute": 0, "restrict": 0}
        for row in cur.fetchall() or []:
            moderation_summary[row.get("action") or ""] = int(row.get("total") or 0)

        cur.execute(
            "SELECT name, email, role, created_at, last_seen, COALESCE(is_online,FALSE) AS is_online FROM users ORDER BY id DESC LIMIT 8"
        )
        recent_users = cur.fetchall()

        cur.execute(
            f"""
            SELECT
                lr.id,
                lr.username,
                lr.title,
                lr.status,
                lr.created_at,
                lr.ended_at,
                COALESCE((
                    SELECT COUNT(*)
                    FROM live_viewers lv
                    WHERE lv.room_id = lr.id
                      AND lv.is_host = FALSE
                      AND lv.active = TRUE
                      AND lv.last_seen > NOW() - INTERVAL '{ACTIVE_VIEWER_WINDOW}'
                ), 0) AS viewer_count,
                COALESCE((
                    SELECT COUNT(*)
                    FROM live_comments lc
                    WHERE lc.room_id = lr.id
                      AND lc.created_at > NOW() - INTERVAL '30 minutes'
                ), 0) AS comments_count,
                COALESCE((
                    SELECT COUNT(*)
                    FROM live_gifts lg
                    WHERE lg.room_id = lr.id
                      AND lg.created_at > NOW() - INTERVAL '24 hours'
                ), 0) AS gifts_count
            FROM live_rooms lr
            ORDER BY lr.id DESC
            LIMIT 12
            """
        )
        live_rooms = cur.fetchall()

        cur.execute(
            "SELECT id, reporter, target_type, target_value, reason, status, created_at FROM reports WHERE status='open' ORDER BY id DESC LIMIT 20"
        )
        reports = cur.fetchall()

        activity_day = {
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '1 day'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '1 day'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '1 day'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '1 day' AND deleted=FALSE"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '1 day'"),
            "reels": _count(cur, "reels", "created_at > NOW() - INTERVAL '1 day'"),
            "stories": _count(cur, "stories", "created_at > NOW() - INTERVAL '1 day'"),
        }
        activity_month = {
            "users": _count(cur, "users", "created_at > NOW() - INTERVAL '30 days'"),
            "posts": _count(cur, "posts", "created_at > NOW() - INTERVAL '30 days'"),
            "comments": _count(cur, "comments", "created_at > NOW() - INTERVAL '30 days'"),
            "messages": _count(cur, "messages", "created_at > NOW() - INTERVAL '30 days' AND deleted=FALSE"),
            "reports": _count(cur, "reports", "created_at > NOW() - INTERVAL '30 days'"),
            "reels": _count(cur, "reels", "created_at > NOW() - INTERVAL '30 days'"),
            "stories": _count(cur, "stories", "created_at > NOW() - INTERVAL '30 days'"),
        }

        cur.execute(
            "SELECT username, COUNT(*) AS total FROM comments GROUP BY username ORDER BY total DESC LIMIT 5"
        )
        top_commenters = cur.fetchall()
        cur.execute(
            "SELECT username, COUNT(*) AS total FROM posts GROUP BY username ORDER BY total DESC LIMIT 5"
        )
        top_posters = cur.fetchall()
        cur.execute(
            "SELECT sender AS username, COUNT(*) AS total FROM messages WHERE deleted=FALSE GROUP BY sender ORDER BY total DESC LIMIT 5"
        )
        top_messengers = cur.fetchall()

        cur.execute(
            """
            SELECT to_char(created_at, 'HH24:MI') AS label, COUNT(*) AS value
            FROM messages
            WHERE deleted=FALSE
              AND created_at > NOW() - INTERVAL '60 minutes'
            GROUP BY 1
            ORDER BY MIN(created_at)
            """
        )
        message_timeline = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT to_char(date_trunc('day', created_at), 'MM-DD') AS label, COUNT(*) AS value
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY 1
            ORDER BY MIN(created_at)
            """
        )
        registration_timeline = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT target_type AS label, COUNT(*) AS value
            FROM reports
            WHERE status='open'
            GROUP BY target_type
            ORDER BY COUNT(*) DESC
            """
        )
        report_breakdown = _timeline_map(cur.fetchall())

        cur.execute(
            "SELECT id, actor, action, target_type, target_value, details, severity, created_at FROM audit_logs ORDER BY id DESC LIMIT 12"
        )
        recent_audits = cur.fetchall()

    return jsonify(
        {
            "stats": stats,
            "realtime": {
                "online_users": stats["online_users"],
                "messages_per_minute": messages_per_minute,
                "live_rooms": stats["live_rooms"],
                "open_reports": stats["reports"],
                "active_bans": moderation_summary["ban"],
                "active_mutes": moderation_summary["mute"],
                "active_restrictions": moderation_summary["restrict"],
            },
            "recent_users": recent_users,
            "live_rooms": live_rooms,
            "activity": {"day": activity_day, "month": activity_month},
            "reports": reports,
            "charts": {
                "messages_last_hour": message_timeline,
                "registrations_last_week": registration_timeline,
                "report_breakdown": report_breakdown,
            },
            "leaderboards": {
                "commenters": top_commenters,
                "posters": top_posters,
                "messengers": top_messengers,
            },
            "moderation": moderation_summary,
            "audit_logs": recent_audits,
            "system": {
                "security": "enabled",
                "jwt": True,
                "rate_limit": True,
                "tracking_window_day": "آخر 24 ساعة",
                "tracking_window_month": "آخر 30 يوم",
                "live_updates": True,
            },
        }
    )


@admin_bp.get("/admin_analytics")
@require_admin
def admin_analytics():
    with db_cursor() as (_conn, cur):
        current_users = _count(cur, "users", "created_at > NOW() - INTERVAL '7 days'")
        previous_users = _count(
            cur,
            "users",
            "created_at <= NOW() - INTERVAL '7 days' AND created_at > NOW() - INTERVAL '14 days'",
        )
        current_messages = _count(cur, "messages", "deleted=FALSE AND created_at > NOW() - INTERVAL '24 hours'")
        previous_messages = _count(
            cur,
            "messages",
            "deleted=FALSE AND created_at <= NOW() - INTERVAL '24 hours' AND created_at > NOW() - INTERVAL '48 hours'",
        )
        current_reports = _count(cur, "reports", "created_at > NOW() - INTERVAL '24 hours'")
        previous_reports = _count(
            cur,
            "reports",
            "created_at <= NOW() - INTERVAL '24 hours' AND created_at > NOW() - INTERVAL '48 hours'",
        )

        cur.execute(
            """
            SELECT to_char(date_trunc('hour', created_at), 'DD HH24:00') AS label, COUNT(*) AS value
            FROM messages
            WHERE deleted=FALSE AND created_at > NOW() - INTERVAL '24 hours'
            GROUP BY 1
            ORDER BY MIN(created_at)
            """
        )
        hourly_messages = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT to_char(date_trunc('day', created_at), 'MM-DD') AS label, COUNT(*) AS value
            FROM users
            WHERE created_at > NOW() - INTERVAL '14 days'
            GROUP BY 1
            ORDER BY MIN(created_at)
            """
        )
        user_growth = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT sender AS label, COUNT(*) AS value
            FROM messages
            WHERE deleted=FALSE AND created_at > NOW() - INTERVAL '24 hours'
            GROUP BY sender
            ORDER BY COUNT(*) DESC
            LIMIT 8
            """
        )
        top_senders = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT action AS label, COUNT(*) AS value
            FROM audit_logs
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY action
            ORDER BY COUNT(*) DESC
            LIMIT 10
            """
        )
        audit_activity = _timeline_map(cur.fetchall())

        cur.execute(
            """
            SELECT actor AS username, COUNT(*) AS total
            FROM audit_logs
            WHERE created_at > NOW() - INTERVAL '24 hours'
              AND actor <> 'system'
            GROUP BY actor
            ORDER BY COUNT(*) DESC
            LIMIT 8
            """
        )
        top_actors = cur.fetchall()

    return jsonify(
        {
            "growth": {
                "users": {"current": current_users, "previous": previous_users, "delta": _growth(current_users, previous_users)},
                "messages": {"current": current_messages, "previous": previous_messages, "delta": _growth(current_messages, previous_messages)},
                "reports": {"current": current_reports, "previous": previous_reports, "delta": _growth(current_reports, previous_reports)},
            },
            "charts": {
                "hourly_messages": hourly_messages,
                "user_growth": user_growth,
                "top_senders": top_senders,
                "audit_activity": audit_activity,
            },
            "leaderboards": {"actors": top_actors},
        }
    )


@admin_bp.get("/admin_users")
@require_admin
def admin_users():
    with db_cursor() as (_conn, cur):
        cur.execute(
            f"""
            SELECT
                u.name,
                u.email,
                COALESCE(u.role, 'user') AS role,
                u.created_at,
                u.last_seen,
                COALESCE(u.is_online, FALSE) AS is_online,
                (SELECT COUNT(*) FROM posts p WHERE p.username=u.name) AS posts_count,
                (SELECT COUNT(*) FROM reels r WHERE r.username=u.name) AS reels_count,
                (SELECT COUNT(*) FROM messages m WHERE m.sender=u.name AND COALESCE(m.deleted,FALSE)=FALSE) AS messages_count,
                (SELECT COUNT(*) FROM reports rp WHERE rp.target_type='user' AND rp.target_value=u.name AND rp.status='open') AS reports_count
            FROM users u
            ORDER BY u.id DESC
            LIMIT 300
            """
        )
        rows = cur.fetchall() or []
        for row in rows:
            state = get_active_moderation(cur, row.get("name"))
            row["moderation"] = moderation_flags(state)
            row["moderation_details"] = state
    return jsonify(rows)


@admin_bp.post("/admin_moderate_user")
@require_admin
def admin_moderate_user():
    data = request.get_json(silent=True) or {}
    username = normalize_text(data.get("username"), 80)
    action = normalize_text(data.get("action"), 40).lower()
    reason = normalize_text(data.get("reason"), 1000)
    duration_minutes = int(data.get("duration_minutes") or 0)

    if not username or not action:
        return jsonify({"message": "بيانات الإجراء غير مكتملة"}), 400

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM users WHERE name=%s LIMIT 1", (username,))
        if not cur.fetchone():
            return jsonify({"message": "المستخدم غير موجود"}), 404
        apply_moderation(
            cur,
            actor=current_user() or "admin",
            username=username,
            action=action,
            reason=reason,
            duration_minutes=duration_minutes,
            metadata={"source": "admin_panel"},
        )
        state = get_active_moderation(cur, username)

    return jsonify({"ok": True, "message": "تم تحديث حالة المستخدم", "moderation": moderation_flags(state), "details": state})


@admin_bp.get("/admin_reports")
@require_admin
def admin_reports():
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, reporter, target_type, target_value, reason, status, created_at
            FROM reports
            ORDER BY id DESC
            LIMIT 200
            """
        )
        rows = cur.fetchall() or []

        for row in rows:
            row["preview"] = ""
            target_type = str(row.get("target_type") or "").lower()
            target_value = str(row.get("target_value") or "")
            if target_type == "message" and target_value.isdigit():
                cur.execute(
                    "SELECT sender, receiver, message, type, created_at FROM messages WHERE id=%s LIMIT 1",
                    (int(target_value),),
                )
                message_row = cur.fetchone() or {}
                row["preview"] = message_row.get("message") or ""
                row["context"] = message_row
            elif target_type == "user":
                cur.execute(
                    "SELECT name, email, role, last_seen, COALESCE(is_online,FALSE) AS is_online FROM users WHERE name=%s LIMIT 1",
                    (target_value,),
                )
                user_row = cur.fetchone() or {}
                row["context"] = user_row
                row["preview"] = user_row.get("email") or ""
            else:
                row["context"] = {}
    return jsonify(rows)


@admin_bp.get("/admin_audit_logs")
@require_admin
def admin_audit_logs():
    limit = min(max(int(request.args.get("limit") or 100), 1), 500)
    query_text = normalize_text(request.args.get("q"), 120).lower()
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, actor, action, target_type, target_value, details, severity, metadata, ip_address, created_at
            FROM audit_logs
            ORDER BY id DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall() or []
    if query_text:
        rows = [
            row
            for row in rows
            if query_text in str(row.get("actor") or "").lower()
            or query_text in str(row.get("action") or "").lower()
            or query_text in str(row.get("target_value") or "").lower()
            or query_text in str(row.get("details") or "").lower()
        ]
    return jsonify(rows)


@admin_bp.get("/admin_live_panel")
@require_admin
def admin_live_panel():
    with db_cursor() as (_conn, cur):
        cur.execute(
            f"""
            SELECT
                lr.id,
                lr.username,
                lr.title,
                lr.status,
                lr.created_at,
                lr.ended_at,
                COALESCE((
                    SELECT COUNT(*)
                    FROM live_viewers lv
                    WHERE lv.room_id = lr.id
                      AND lv.active = TRUE
                      AND lv.is_host = FALSE
                      AND lv.last_seen > NOW() - INTERVAL '{ACTIVE_VIEWER_WINDOW}'
                ), 0) AS viewer_count,
                COALESCE((SELECT COUNT(*) FROM live_comments lc WHERE lc.room_id = lr.id), 0) AS comments_count,
                COALESCE((SELECT COUNT(*) FROM live_likes ll WHERE ll.room_id = lr.id), 0) AS likes_count,
                COALESCE((SELECT COUNT(*) FROM live_gifts lg WHERE lg.room_id = lr.id), 0) AS gifts_count
            FROM live_rooms lr
            ORDER BY lr.id DESC
            LIMIT 100
            """
        )
        rooms = cur.fetchall() or []
        summary = {
            "live_rooms": len([room for room in rooms if room.get("status") == "live"]),
            "active_viewers": sum(int(room.get("viewer_count") or 0) for room in rooms),
            "comments": sum(int(room.get("comments_count") or 0) for room in rooms),
            "gifts": sum(int(room.get("gifts_count") or 0) for room in rooms),
        }
    return jsonify({"summary": summary, "rooms": rooms})


@admin_bp.post("/admin_resolve_report/<int:report_id>")
@require_admin
def admin_resolve_report(report_id: int):
    data = request.get_json(silent=True) or {}
    status = normalize_text(data.get("status") or "resolved", 20).lower()
    if status not in {"resolved", "dismissed", "open"}:
        status = "resolved"

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, target_type, target_value FROM reports WHERE id=%s", (report_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "البلاغ غير موجود"}), 404
        cur.execute("UPDATE reports SET status=%s WHERE id=%s", (status, report_id))
        log_audit(
            cur,
            action="report_status_updated",
            actor=current_user() or "admin",
            target_type=row.get("target_type") or "report",
            target_value=row.get("target_value") or str(report_id),
            details=f"تم تحديث البلاغ #{report_id} إلى {status}",
            severity="info",
        )
    return jsonify({"ok": True, "message": "تم تحديث حالة البلاغ"})


@admin_bp.post("/admin_remove_message/<int:message_id>")
@require_admin
def admin_remove_message(message_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, sender, receiver FROM messages WHERE id=%s LIMIT 1", (message_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "الرسالة غير موجودة"}), 404
        cur.execute(
            "UPDATE messages SET deleted=TRUE, message='', media_url=NULL, status='deleted' WHERE id=%s",
            (message_id,),
        )
        cur.execute(
            "UPDATE reports SET status='resolved' WHERE target_type='message' AND target_value=%s AND status='open'",
            (str(message_id),),
        )
        log_audit(
            cur,
            action="admin_remove_message",
            actor=current_user() or "admin",
            target_type="message",
            target_value=str(message_id),
            details=f"تم حذف رسالة بين {row.get('sender')} و {row.get('receiver')}",
            severity="warning",
        )
    return jsonify({"ok": True, "message": "تم حذف الرسالة من لوحة الإدارة"})


@admin_bp.post("/admin_remove_post/<int:post_id>")
@require_admin
def admin_remove_post(post_id: int):
    media = ""
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, media, username FROM posts WHERE id=%s", (post_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "المنشور غير موجود"}), 404
        media = row.get("media") or ""
        cur.execute("DELETE FROM posts WHERE id=%s", (post_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='post' AND target_value=%s AND status='open'", (str(post_id),))
        log_audit(
            cur,
            action="admin_remove_post",
            actor=current_user() or "admin",
            target_type="post",
            target_value=str(post_id),
            details=f"تم حذف منشور المستخدم {row.get('username')}",
            severity="warning",
        )
    delete_media_file(media, UPLOAD_DIR)
    return jsonify({"ok": True, "message": "تم حذف المنشور من لوحة الإدارة"})


@admin_bp.post("/admin_remove_reel/<int:reel_id>")
@require_admin
def admin_remove_reel(reel_id: int):
    video = ""
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, video, username FROM reels WHERE id=%s", (reel_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "الريل غير موجود"}), 404
        video = row.get("video") or ""
        cur.execute("DELETE FROM reels WHERE id=%s", (reel_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='reel' AND target_value=%s AND status='open'", (str(reel_id),))
        log_audit(
            cur,
            action="admin_remove_reel",
            actor=current_user() or "admin",
            target_type="reel",
            target_value=str(reel_id),
            details=f"تم حذف ريل للمستخدم {row.get('username')}",
            severity="warning",
        )
    delete_media_file(video, UPLOAD_DIR)
    return jsonify({"ok": True, "message": "تم حذف الريل من لوحة الإدارة"})


@admin_bp.post("/admin_dismiss_report/<int:report_id>")
@require_admin
def admin_dismiss_report(report_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, target_type, target_value FROM reports WHERE id=%s", (report_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "البلاغ غير موجود"}), 404
        cur.execute("UPDATE reports SET status='dismissed' WHERE id=%s", (report_id,))
        log_audit(
            cur,
            action="admin_dismiss_report",
            actor=current_user() or "admin",
            target_type=row.get("target_type") or "report",
            target_value=row.get("target_value") or str(report_id),
            details=f"تم تجاهل البلاغ #{report_id}",
            severity="info",
        )
    return jsonify({"ok": True, "message": "تم إغلاق البلاغ"})


@admin_bp.post("/admin_end_live/<int:room_id>")
@require_admin
def admin_end_live(room_id: int):
    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id, title, username FROM live_rooms WHERE id=%s LIMIT 1", (room_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "غرفة البث غير موجودة"}), 404
        cur.execute("UPDATE live_rooms SET status='ended', ended_at=NOW() WHERE id=%s", (room_id,))
        cur.execute("UPDATE live_viewers SET active=FALSE, last_seen=NOW() WHERE room_id=%s", (room_id,))
        cur.execute("UPDATE reports SET status='resolved' WHERE target_type='live' AND target_value=%s AND status='open'", (str(room_id),))
        log_audit(
            cur,
            action="admin_end_live",
            actor=current_user() or "admin",
            target_type="live_room",
            target_value=str(room_id),
            details=f"تم إنهاء غرفة {row.get('title') or room_id} الخاصة بالمستخدم {row.get('username')}",
            severity="warning",
        )
    return jsonify({"ok": True, "message": "تم إنهاء البث من لوحة الإدارة"})
