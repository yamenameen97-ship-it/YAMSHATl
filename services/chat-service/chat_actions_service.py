"""
خدمة إجراءات الشات والدردشة - Chat Actions Service
يوفر:
- تعديل الرسالة (Edit Message)
- حذف الرسالة لدي فقط (Delete For Me)
- حذف الرسالة لدى الجميع (Delete For Everyone)
- حذف محادثة كاملة لدي فقط
- حذف محادثة كاملة لدى الجميع
"""

from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Set
from datetime import datetime, timedelta
import json
import os
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Yamshat Chat Actions Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ تخزين الرسائل ============
DATA_FILE = "chat_messages_db.json"

# messages: {conversation_id: [ {id, sender_id, receiver_id, content, timestamp,
#                                is_edited, edited_at, deleted_for_everyone,
#                                deleted_for_users: [user_ids]} ]}
def _load() -> Dict:
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"messages": {}, "conv_deleted_for": {}}
    return {"messages": {}, "conv_deleted_for": {}}


def _save(state: Dict) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False)


_state = _load()


# ============ النماذج ============
class SendMessageReq(BaseModel):
    conversation_id: str
    sender_id: str
    receiver_id: Optional[str] = None
    content: str


class EditMessageReq(BaseModel):
    conversation_id: str
    message_id: str
    requester_id: str
    new_content: str


class DeleteMessageReq(BaseModel):
    conversation_id: str
    message_id: str
    requester_id: str
    scope: str  # "me" | "everyone"


class DeleteConversationReq(BaseModel):
    conversation_id: str
    requester_id: str
    scope: str  # "me" | "everyone"


# ============ نافذة الحذف للجميع (مثل واتساب) ============
DELETE_FOR_EVERYONE_WINDOW_MINUTES = 60 * 24  # 24 ساعة


def _can_delete_for_everyone(msg: Dict) -> bool:
    try:
        ts = datetime.fromisoformat(msg["timestamp"])
        return datetime.utcnow() - ts <= timedelta(minutes=DELETE_FOR_EVERYONE_WINDOW_MINUTES)
    except Exception:
        return True  # نتساهل إن فشل تحليل الوقت


def _visible_for(msg: Dict, user_id: str) -> bool:
    """هل الرسالة مرئية لمستخدم معيّن؟"""
    if msg.get("deleted_for_everyone"):
        return True  # تظهر لكن كـ "تم حذف هذه الرسالة"
    if user_id in (msg.get("deleted_for_users") or []):
        return False
    return True


def _render(msg: Dict) -> Dict:
    """إخراج آمن للرسالة (يخفي المحتوى إذا حُذفت للجميع)."""
    out = dict(msg)
    if out.get("deleted_for_everyone"):
        out["content"] = ""
        out["is_deleted"] = True
    return out


# ============ المسارات (Routes) ============
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "chat-actions-service"}


@app.post("/messages")
async def send_message(req: SendMessageReq):
    """إرسال رسالة جديدة."""
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": req.conversation_id,
        "sender_id": req.sender_id,
        "receiver_id": req.receiver_id,
        "content": req.content,
        "timestamp": datetime.utcnow().isoformat(),
        "is_edited": False,
        "edited_at": None,
        "deleted_for_everyone": False,
        "deleted_for_users": [],
    }
    _state["messages"].setdefault(req.conversation_id, []).append(msg)
    _save(_state)
    return {"success": True, "message": msg}


@app.get("/messages/{conversation_id}")
async def list_messages(conversation_id: str, user_id: str = Query(...)):
    """قائمة الرسائل المرئية لمستخدم بعينه."""
    # احترام حذف المحادثة "لدي"
    conv_deleted = _state.get("conv_deleted_for", {}).get(conversation_id, {})
    cutoff = conv_deleted.get(user_id)
    msgs = _state["messages"].get(conversation_id, [])

    visible = []
    for m in msgs:
        if cutoff and m["timestamp"] <= cutoff:
            continue
        if not _visible_for(m, user_id):
            continue
        visible.append(_render(m))
    return {"success": True, "count": len(visible), "messages": visible}


# ----------- تعديل الرسالة -----------
@app.put("/messages/edit")
@app.patch("/messages/edit")
async def edit_message(req: EditMessageReq):
    """تعديل الرسالة (يجب أن يكون المرسل هو المعدّل)."""
    msgs = _state["messages"].get(req.conversation_id, [])
    for m in msgs:
        if m["id"] == req.message_id:
            if m["sender_id"] != req.requester_id:
                raise HTTPException(status_code=403, detail="غير مسموح بتعديل رسالة شخص آخر")
            if m.get("deleted_for_everyone"):
                raise HTTPException(status_code=400, detail="لا يمكن تعديل رسالة محذوفة")
            m["content"] = req.new_content
            m["is_edited"] = True
            m["edited_at"] = datetime.utcnow().isoformat()
            _save(_state)
            return {"success": True, "message": _render(m)}
    raise HTTPException(status_code=404, detail="الرسالة غير موجودة")


# ----------- حذف الرسالة (لدي / للجميع) -----------
@app.post("/messages/delete")
async def delete_message(req: DeleteMessageReq):
    """حذف الرسالة:
    - scope = "me"       : إخفاؤها عن المستخدم نفسه فقط
    - scope = "everyone" : حذفها لدى الجميع (للمرسل فقط، خلال نافذة زمنية)
    """
    if req.scope not in {"me", "everyone"}:
        raise HTTPException(status_code=400, detail="scope يجب أن يكون me أو everyone")

    msgs = _state["messages"].get(req.conversation_id, [])
    for m in msgs:
        if m["id"] != req.message_id:
            continue

        if req.scope == "me":
            users = set(m.get("deleted_for_users") or [])
            users.add(req.requester_id)
            m["deleted_for_users"] = list(users)
            _save(_state)
            return {"success": True, "scope": "me", "message": "تم حذف الرسالة لديك فقط"}

        # scope == "everyone"
        if m["sender_id"] != req.requester_id:
            raise HTTPException(status_code=403, detail="فقط مرسل الرسالة يمكنه حذفها للجميع")
        if not _can_delete_for_everyone(m):
            raise HTTPException(status_code=400, detail="انتهت نافذة الحذف للجميع")
        m["deleted_for_everyone"] = True
        m["content"] = ""
        _save(_state)
        return {"success": True, "scope": "everyone", "message": "تم حذف الرسالة لدى الجميع"}

    raise HTTPException(status_code=404, detail="الرسالة غير موجودة")


# ----------- حذف المحادثة كاملة (لدي / للجميع) -----------
@app.post("/conversations/delete")
async def delete_conversation(req: DeleteConversationReq):
    """حذف المحادثة كاملة:
    - scope = "me"       : إخفاء كل الرسائل القديمة عن هذا المستخدم فقط
    - scope = "everyone" : حذف فعلي لكل الرسائل في المحادثة
    """
    if req.scope not in {"me", "everyone"}:
        raise HTTPException(status_code=400, detail="scope يجب أن يكون me أو everyone")

    if req.scope == "me":
        now = datetime.utcnow().isoformat()
        _state.setdefault("conv_deleted_for", {})
        _state["conv_deleted_for"].setdefault(req.conversation_id, {})
        _state["conv_deleted_for"][req.conversation_id][req.requester_id] = now
        _save(_state)
        return {"success": True, "scope": "me", "message": "تم حذف الدردشة لديك فقط"}

    # everyone: نتأكد أن المستخدم مشارك في المحادثة
    msgs = _state["messages"].get(req.conversation_id, [])
    if msgs:
        participants = {m.get("sender_id") for m in msgs} | {m.get("receiver_id") for m in msgs}
        if req.requester_id not in participants:
            raise HTTPException(status_code=403, detail="أنت لست مشاركاً في هذه المحادثة")

    _state["messages"].pop(req.conversation_id, None)
    if "conv_deleted_for" in _state:
        _state["conv_deleted_for"].pop(req.conversation_id, None)
    _save(_state)
    return {"success": True, "scope": "everyone", "message": "تم حذف الدردشة لدى الجميع"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
