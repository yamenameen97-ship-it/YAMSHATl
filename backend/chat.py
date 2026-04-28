
from flask import Blueprint, request, jsonify
from db import get_db

chat = Blueprint("chat", __name__)

@chat.route("/send_message", methods=["POST"])
def send():
    d = request.json
    conn = get_db(); cur = conn.cursor()

    cur.execute(
        "INSERT INTO messages(sender,receiver,message) VALUES(%s,%s,%s)",
        (d["sender"], d["receiver"], d["message"])
    )

    conn.commit(); conn.close()
    return {"ok":True}

@chat.route("/get_messages")
def get():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM messages ORDER BY id ASC")
    data = cur.fetchall()
    conn.close()
    return jsonify(data)
