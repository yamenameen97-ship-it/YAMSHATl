from __future__ import annotations

from flask import Blueprint, jsonify, request

from db import db_cursor, ensure_group_owner_membership
from utils import current_user, json_error, normalize_text, require_auth

groups_bp = Blueprint("groups", __name__)


@groups_bp.post("/create_group")
@require_auth
def create_group():
    owner = current_user() or ""
    data = request.get_json(silent=True) or {}
    name = normalize_text(data.get("name"), 120)

    if not name:
        return json_error("اكتب اسم المجموعة أولاً", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT id FROM users WHERE name=%s LIMIT 1",
            (owner,),
        )
        if not cur.fetchone():
            return json_error("الحساب الحالي غير صالح، سجّل الدخول مرة أخرى", 401)

        cur.execute(
            "SELECT id FROM groups WHERE lower(name)=lower(%s) LIMIT 1",
            (name,),
        )
        exists = cur.fetchone()
        if exists:
            return json_error("اسم المجموعة مستخدم بالفعل", 409)

        cur.execute(
            """
            INSERT INTO groups(name, owner)
            VALUES(%s, %s)
            RETURNING id
            """,
            (name, owner),
        )
        row = cur.fetchone() or {}
        group_id = int(row.get("id") or 0)

        cur.execute(
            """
            INSERT INTO group_members(group_id, username)
            VALUES(%s, %s)
            ON CONFLICT (group_id, username) DO NOTHING
            """,
            (group_id, owner),
        )

    try:
        ensure_group_owner_membership()
    except Exception:
        pass
    return jsonify({"ok": True, "message": "تم إنشاء المجموعة", "group_id": group_id})


@groups_bp.post("/join_group")
@require_auth
def join_group():
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    group_id = int(data.get("group_id") or 0)

    if not group_id:
        return json_error("رقم المجموعة غير صالح", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute("SELECT id FROM groups WHERE id=%s LIMIT 1", (group_id,))
        if not cur.fetchone():
            return json_error("المجموعة غير موجودة", 404)

        cur.execute(
            "SELECT id FROM group_members WHERE group_id=%s AND username=%s LIMIT 1",
            (group_id, username),
        )
        if cur.fetchone():
            return jsonify({"ok": True, "message": "أنت عضو بالفعل"})

        cur.execute(
            "INSERT INTO group_members(group_id, username) VALUES(%s, %s)",
            (group_id, username),
        )

    return jsonify({"ok": True, "message": "تم الانضمام للمجموعة"})


@groups_bp.post("/group_post")
@require_auth
def group_post():
    username = current_user() or ""
    data = request.get_json(silent=True) or {}
    group_id = int(data.get("group_id") or 0)
    content = normalize_text(data.get("content"), 3000)

    if not group_id or not content:
        return json_error("بيانات المنشور غير مكتملة", 400)

    with db_cursor(commit=True) as (_conn, cur):
        cur.execute(
            "SELECT id FROM group_members WHERE group_id=%s AND username=%s LIMIT 1",
            (group_id, username),
        )
        if not cur.fetchone():
            return json_error("يجب الانضمام للمجموعة أولاً", 403)

        cur.execute(
            "INSERT INTO group_posts(group_id, username, content) VALUES(%s, %s, %s)",
            (group_id, username, content),
        )

    return jsonify({"ok": True, "message": "تم نشر المنشور"})


@groups_bp.get("/group_posts/<int:group_id>")
def group_posts(group_id: int):
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT username, content, created_at
            FROM group_posts
            WHERE group_id=%s
            ORDER BY id DESC
            """,
            (group_id,),
        )
        data = cur.fetchall()

    return jsonify(
        [
            {
                "username": row.get("username", ""),
                "content": row.get("content", ""),
                "created_at": row.get("created_at"),
            }
            for row in data
        ]
    )


@groups_bp.get("/groups")
def list_groups():
    try:
        ensure_group_owner_membership()
    except Exception:
        pass
    with db_cursor() as (_conn, cur):
        cur.execute(
            """
            SELECT g.id, g.name, g.owner, COUNT(gm.id) AS members_count
            FROM groups g
            LEFT JOIN group_members gm ON gm.group_id = g.id
            GROUP BY g.id, g.name, g.owner
            ORDER BY g.id DESC
            """
        )
        rows = cur.fetchall()

    return jsonify(
        [
            {
                "id": row.get("id"),
                "name": row.get("name", ""),
                "owner": row.get("owner", ""),
                "members_count": int(row.get("members_count") or 0),
            }
            for row in rows
        ]
    )


@groups_bp.get("/group_members/<int:group_id>")
def group_members(group_id: int):
    with db_cursor() as (_conn, cur):
        cur.execute(
            "SELECT username FROM group_members WHERE group_id=%s ORDER BY id ASC",
            (group_id,),
        )
        rows = cur.fetchall()

    return jsonify([row.get("username", "") for row in rows])
