
from flask import Blueprint, request, session
from db import get_db
from utils import hash_pw, create_token

auth = Blueprint("auth", __name__)

@auth.route("/register", methods=["POST"])
def register():
    d = request.json
    conn = get_db(); cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email=%s",(d["email"],))
    if cur.fetchone():
        return {"msg":"exists"},409

    cur.execute(
        "INSERT INTO users(name,email,password) VALUES(%s,%s,%s)",
        (d["name"], d["email"], hash_pw(d["password"]))
    )

    conn.commit(); conn.close()
    return {"ok":True}

@auth.route("/login", methods=["POST"])
def login():
    d = request.json
    conn = get_db(); cur = conn.cursor()

    cur.execute("SELECT name,email,password FROM users WHERE email=%s",(d["email"],))
    u = cur.fetchone()

    if not u or u["password"] != hash_pw(d["password"]):
        return {"msg":"invalid"},401

    session["user"] = u["name"]
    token = create_token(u["name"])

    return {"user":u["name"],"token":token}

@auth.route("/me")
def me():
    return {"user":session.get("user")}
