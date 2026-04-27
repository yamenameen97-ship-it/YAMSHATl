from flask import Blueprint, jsonify, request, session

from auth_utils import current_user
from models import get_connection, insert_and_get_id

groups_bp = Blueprint("groups", __name__)


def _logged_in_user():
    return current_user()


@groups_bp.route("/create_group", methods=["POST"])
def create_group():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    owner = (_logged_in_user() or data.get("owner") or "").strip()

    if not name or not owner:
        return jsonify({"message": "بيانات المجموعة غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    group_id = insert_and_get_id(
        cursor,
        "INSERT INTO groups (name, owner) VALUES (?, ?)",
        (name, owner),
    )
    cursor.execute(
        "INSERT INTO group_members (group_id, username) VALUES (?, ?)",
        (group_id, owner),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم إنشاء المجموعة", "group_id": group_id})


@groups_bp.route("/join_group", methods=["POST"])
def join_group():
    data = request.get_json(silent=True) or {}
    group_id = data.get("group_id")
    username = (_logged_in_user() or data.get("username") or "").strip()

    if not group_id or not username:
        return jsonify({"message": "بيانات الانضمام غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM groups WHERE id=?", (group_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"message": "المجموعة غير موجودة"}), 404

    cursor.execute(
        "SELECT id FROM group_members WHERE group_id=? AND username=?",
        (group_id, username),
    )
    exists = cursor.fetchone()

    if exists:
        conn.close()
        return jsonify({"message": "أنت عضو بالفعل"})

    cursor.execute(
        "INSERT INTO group_members (group_id, username) VALUES (?, ?)",
        (group_id, username),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم الانضمام للمجموعة"})


@groups_bp.route("/group_post", methods=["POST"])
def group_post():
    data = request.get_json(silent=True) or {}
    group_id = data.get("group_id")
    username = (_logged_in_user() or data.get("username") or "").strip()
    content = (data.get("content") or "").strip()

    if not group_id or not username or not content:
        return jsonify({"message": "بيانات المنشور غير مكتملة"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM group_members WHERE group_id=? AND username=?",
        (group_id, username),
    )
    is_member = cursor.fetchone()

    if not is_member:
        conn.close()
        return jsonify({"message": "يجب الانضمام للمجموعة أولاً"}), 403

    cursor.execute(
        "INSERT INTO group_posts (group_id, username, content) VALUES (?, ?, ?)",
        (group_id, username, content),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "تم نشر المنشور"})


@groups_bp.route("/group_posts/<int:group_id>")
def group_posts(group_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT username, content FROM group_posts
        WHERE group_id=?
        ORDER BY id DESC
        """,
        (group_id,),
    )

    data = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "username": row["username"],
            "content": row["content"],
        }
        for row in data
    ])


@groups_bp.route("/groups")
def list_groups():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT g.id, g.name, g.owner, COUNT(gm.id) AS members_count
        FROM groups g
        LEFT JOIN group_members gm ON gm.group_id = g.id
        GROUP BY g.id, g.name, g.owner
        ORDER BY g.id DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "name": row["name"],
            "owner": row["owner"],
            "members_count": row["members_count"],
        }
        for row in rows
    ])


@groups_bp.route("/group_members/<int:group_id>")
def group_members(group_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username FROM group_members WHERE group_id=? ORDER BY id ASC",
        (group_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    return jsonify([row["username"] for row in rows])
