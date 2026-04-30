from __future__ import annotations

from typing import Any

try:
    from .audit_log import get_logs, log_action
except ImportError:  # pragma: no cover
    from audit_log import get_logs, log_action

try:
    from backend.db import db_cursor
except ImportError:  # pragma: no cover
    db_cursor = None


def _fetch_count(cur, table_name: str, where_clause: str = "", params: tuple = ()) -> int:
    query = f"SELECT COUNT(*) AS total FROM {table_name}"
    if where_clause:
        query += f" WHERE {where_clause}"
    cur.execute(query, params)
    row = cur.fetchone() or {}
    return int(row.get("total") or 0)


def get_stats() -> dict[str, Any]:
    if db_cursor is None:
        return {"users": 0, "messages": 0, "reports": 0, "logs": len(get_logs(1000))}

    with db_cursor() as (_conn, cur):
        return {
            "users": _fetch_count(cur, "users"),
            "messages": _fetch_count(cur, "messages"),
            "reports": _fetch_count(cur, "reports"),
            "logs": _fetch_count(cur, "audit_logs") if _table_exists(cur, "audit_logs") else len(get_logs(1000)),
        }


def get_reports(limit: int = 50) -> list[dict[str, Any]]:
    if db_cursor is None:
        return []

    limit = max(1, min(int(limit or 50), 200))
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT id, reporter, target_type, target_value, reason, status, created_at
            FROM reports
            ORDER BY id DESC
            LIMIT %s
            """,
            (limit,),
        )
        return cur.fetchall() or []


def ban_user(username: str, actor: str, reason: str = "") -> dict[str, Any]:
    username = str(username or "").strip()
    if not username:
        raise ValueError("username is required")

    result = {"username": username, "banned": True, "reason": str(reason or "").strip()}
    if db_cursor is not None:
        with db_cursor(commit=True) as (_conn, cur):
            if _column_exists(cur, "users", "is_banned"):
                cur.execute("UPDATE users SET is_banned=TRUE WHERE name=%s OR email=%s", (username, username))
            else:
                cur.execute("UPDATE users SET role='banned' WHERE name=%s OR email=%s", (username, username))
    log_action(actor, "ban_user", username, {"reason": result["reason"]})
    return result


def delete_message(message_id: int, actor: str) -> dict[str, Any]:
    if not message_id:
        raise ValueError("message_id is required")

    result = {"message_id": int(message_id), "deleted": True}
    if db_cursor is not None:
        with db_cursor(commit=True) as (_conn, cur):
            cur.execute(
                "UPDATE messages SET deleted=TRUE, message='' WHERE id=%s",
                (int(message_id),),
            )
    log_action(actor, "delete_message", str(message_id))
    return result


def list_logs(limit: int = 100) -> list[dict[str, Any]]:
    return get_logs(limit)


def _table_exists(cur, table_name: str) -> bool:
    cur.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema='public' AND table_name=%s
        ) AS exists
        """,
        (table_name,),
    )
    row = cur.fetchone() or {}
    return bool(row.get("exists"))


def _column_exists(cur, table_name: str, column_name: str) -> bool:
    cur.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=%s AND column_name=%s
        ) AS exists
        """,
        (table_name, column_name),
    )
    row = cur.fetchone() or {}
    return bool(row.get("exists"))
