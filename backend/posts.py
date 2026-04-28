
from flask import Blueprint, request, jsonify
from db import get_db
from utils import clean

posts = Blueprint("posts", __name__)

@posts.route("/add_post", methods=["POST"])
def add_post():
    d = request.json
    conn = get_db(); cur = conn.cursor()

    cur.execute(
        "INSERT INTO posts(username,content,media) VALUES(%s,%s,%s)",
        (d["username"], clean(d["content"]), d.get("media"))
    )

    conn.commit(); conn.close()
    return {"ok":True}

@posts.route("/posts")
def get_posts():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM posts ORDER BY id DESC")
    data = cur.fetchall()
    conn.close()
    return jsonify(data)

@posts.route("/like/<int:id>", methods=["POST"])
def like(id):
    conn = get_db(); cur = conn.cursor()
    cur.execute("UPDATE posts SET likes = COALESCE(likes,0)+1 WHERE id=%s",(id,))
    conn.commit(); conn.close()
    return {"ok":True}

@posts.route("/add_comment", methods=["POST"])
def comment():
    d = request.json
    conn = get_db(); cur = conn.cursor()

    cur.execute(
        "INSERT INTO comments(post_id,username,comment) VALUES(%s,%s,%s)",
        (d["post_id"], d["username"], clean(d["comment"]))
    )

    conn.commit(); conn.close()
    return {"ok":True}
