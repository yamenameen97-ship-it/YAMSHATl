from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import json
import os

app = FastAPI(title="Yamshat Post Service")

# ملف لتخزين البيانات بشكل دائم
DATA_FILE = "posts_db.json"

class Post(BaseModel):
    id: str
    content: str
    username: str
    media_urls: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    created_at: str

# تحميل البيانات عند التشغيل
def load_posts():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

def save_posts(posts_list):
    with open(DATA_FILE, "w") as f:
        json.dump(posts_list, f)

posts = load_posts()

@app.post('/')
async def create_post(data: dict = Body(...)):
    new_post = {
        "id": str(uuid.uuid4()),
        "content": data.get("content", data.get("text", "")),
        "username": data.get("username", "anonymous"),
        "media_urls": data.get("media_urls", []),
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # دعم الحقول الإضافية التي قد يرسلها الفرونت إند
    if "image_url" in data and data["image_url"] not in new_post["media_urls"]:
        new_post["media_urls"].append(data["image_url"])
    if "media" in data and data["media"] not in new_post["media_urls"]:
        new_post["media_urls"].append(data["media"])

    posts.insert(0, new_post)
    save_posts(posts)
    return {"msg": "created", "post": new_post, "success": True}

@app.get('/')
async def get_posts(limit: int = 20, page: int = 1):
    start = (page - 1) * limit
    end = start + limit
    return posts[start:end]

@app.post('/{post_id}/like')
async def like_post(post_id: str):
    for post in posts:
        if post["id"] == post_id:
            post["likes_count"] += 1
            save_posts(posts)
            return {"msg": "liked", "likes_count": post["likes_count"]}
    raise HTTPException(status_code=404, detail="Post not found")

@app.delete('/{post_id}')
async def delete_post(post_id: str):
    global posts
    initial_len = len(posts)
    posts = [p for p in posts if p["id"] != post_id]
    if len(posts) < initial_len:
        save_posts(posts)
        return {"msg": "deleted"}
    raise HTTPException(status_code=404, detail="Post not found")
