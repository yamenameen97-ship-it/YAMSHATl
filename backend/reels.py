
from flask import Blueprint, request, jsonify
from db import get_db
import os
from werkzeug.utils import secure_filename

reels = Blueprint("reels", __name__)

UPLOAD_FOLDER="uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED={"mp4","mov","webm"}

def allowed(filename):
    return "." in filename and filename.rsplit(".",1)[1].lower() in ALLOWED

@reels.route("/add_reel", methods=["POST"])
def add():
    f=request.files["file"]

    if not allowed(f.filename):
        return {"msg":"invalid file"},400

    filename=secure_filename(f.filename)
    path=os.path.join(UPLOAD_FOLDER, filename)
    f.save(path)

    conn=get_db(); cur=conn.cursor()
    cur.execute(
        "INSERT INTO reels(username,video) VALUES(%s,%s)",
        (request.form["username"], path)
    )

    conn.commit(); conn.close()
    return {"ok":True}

@reels.route("/reels")
def get():
    conn=get_db(); cur=conn.cursor()
    cur.execute("SELECT * FROM reels ORDER BY id DESC")
    data=cur.fetchall()
    conn.close()
    return jsonify(data)
