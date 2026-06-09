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
    edited_at: Optional[str] = None
    is_edited: bool = False

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
        "created_at": datetime.utcnow().isoformat(),
        "edited_at": None,
        "is_edited": False
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

# ========== تعديل المنشور (Edit Post) ==========
@app.put('/{post_id}')
@app.patch('/{post_id}')
async def edit_post(post_id: str, data: dict = Body(...)):
    """تعديل محتوى المنشور (يجب أن يكون المالك فقط)"""
    requester = data.get("username", data.get("requester"))
    for post in posts:
        if post["id"] == post_id:
            # التحقق من أن المعدّل هو صاحب المنشور
            if requester and post.get("username") and requester != post["username"]:
                raise HTTPException(status_code=403, detail="غير مسموح بتعديل منشور لمستخدم آخر")

            new_content = data.get("content", data.get("text"))
            if new_content is not None:
                post["content"] = new_content
            if "media_urls" in data:
                post["media_urls"] = data["media_urls"]
            post["edited_at"] = datetime.utcnow().isoformat()
            post["is_edited"] = True
            save_posts(posts)
            return {"msg": "edited", "post": post, "success": True}
    raise HTTPException(status_code=404, detail="Post not found")

@app.delete('/{post_id}')
async def delete_post(post_id: str, requester: Optional[str] = None):
    """حذف المنشور (يجب أن يكون المالك فقط)"""
    global posts
    target = next((p for p in posts if p["id"] == post_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Post not found")
    if requester and target.get("username") and requester != target["username"]:
        raise HTTPException(status_code=403, detail="غير مسموح بحذف منشور لمستخدم آخر")
    posts = [p for p in posts if p["id"] != post_id]
    save_posts(posts)
    return {"msg": "deleted", "success": True}
