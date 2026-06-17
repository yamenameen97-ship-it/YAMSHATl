"""
Voice Rooms API - الغرف الصوتية الجماعية
"""
from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.core.dependencies import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.engagement import (
    VoiceRoom, VoiceRoomMember, VoiceRoomMessage,
)

router = APIRouter(tags=["voice-rooms"])


class CreateRoomRequest(BaseModel):
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    background_id: Optional[int] = None
    category: str = "general"
    language: str = "ar"
    seats_count: int = 8
    is_private: bool = False
    password: Optional[str] = None


class JoinSeatRequest(BaseModel):
    seat_index: int


class SendMessageRequest(BaseModel):
    content: str


@router.post("/rooms")
def create_room(req: CreateRoomRequest,
                db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    if req.seats_count < 2 or req.seats_count > 15:
        raise HTTPException(400, "seats_count must be 2..15")
    room = VoiceRoom(
        owner_id=user.id,
        title=req.title,
        description=req.description,
        cover_image=req.cover_image,
        background_id=req.background_id,
        category=req.category,
        language=req.language,
        seats_count=req.seats_count,
        is_private=req.is_private,
        agora_channel=f"vr_{uuid.uuid4().hex[:16]}",
    )
    if req.password:
        from passlib.hash import bcrypt
        room.password_hash = bcrypt.hash(req.password)
    db.add(room)
    db.commit()
    db.refresh(room)
    # المالك يأخذ مقعد 0 تلقائيًا
    db.add(VoiceRoomMember(
        room_id=room.id, user_id=user.id, role="owner", seat_index=0,
    ))
    db.commit()
    return {"id": room.id, "agora_channel": room.agora_channel,
            "title": room.title, "seats_count": room.seats_count}


@router.get("/rooms")
def list_rooms(category: Optional[str] = Query(None),
               db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    stmt = select(VoiceRoom).where(VoiceRoom.is_active.is_(True))
    if category:
        stmt = stmt.where(VoiceRoom.category == category)
    rooms = db.execute(stmt.order_by(VoiceRoom.current_listeners.desc()).limit(100)).scalars().all()
    return {
        "rooms": [
            {
                "id": r.id, "title": r.title, "description": r.description,
                "cover_image": r.cover_image, "category": r.category,
                "language": r.language, "seats_count": r.seats_count,
                "current_listeners": r.current_listeners,
                "is_private": r.is_private,
                "owner_id": r.owner_id,
                "started_at": r.started_at.isoformat(),
            } for r in rooms
        ]
    }


@router.get("/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db),
             user: User = Depends(get_current_user)):
    room = db.get(VoiceRoom, room_id)
    if not room or not room.is_active:
        raise HTTPException(404, "room_not_found")
    members = db.execute(
        select(VoiceRoomMember, User).join(User, User.id == VoiceRoomMember.user_id)
        .where(and_(VoiceRoomMember.room_id == room_id,
                    VoiceRoomMember.left_at.is_(None)))
    ).all()
    seats = [None] * room.seats_count
    listeners = []
    for m, u in members:
        info = {
            "user_id": u.id, "username": u.username, "avatar": u.avatar,
            "role": m.role, "is_muted": m.is_muted, "is_locked": m.is_locked,
        }
        if m.seat_index is not None and 0 <= m.seat_index < room.seats_count:
            seats[m.seat_index] = info
        else:
            listeners.append(info)
    return {
        "id": room.id, "title": room.title, "description": room.description,
        "cover_image": room.cover_image, "category": room.category,
        "language": room.language,
        "agora_channel": room.agora_channel,
        "seats_count": room.seats_count,
        "seats": seats,
        "listeners_preview": listeners[:30],
        "current_listeners": room.current_listeners,
        "total_gifts_value": room.total_gifts_value,
        "owner_id": room.owner_id,
    }


@router.post("/rooms/{room_id}/join")
def join_room(room_id: int, password: Optional[str] = None,
              db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    room = db.get(VoiceRoom, room_id)
    if not room or not room.is_active:
        raise HTTPException(404, "room_not_found")
    if room.is_private and room.password_hash:
        from passlib.hash import bcrypt
        if not password or not bcrypt.verify(password, room.password_hash):
            raise HTTPException(403, "invalid_password")

    existing = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.user_id == user.id,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if not existing:
        db.add(VoiceRoomMember(room_id=room_id, user_id=user.id, role="listener"))
        room.current_listeners += 1
        room.total_visits += 1
    db.commit()
    return {"ok": True, "agora_channel": room.agora_channel}


@router.post("/rooms/{room_id}/leave")
def leave_room(room_id: int, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    m = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.user_id == user.id,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if m:
        m.left_at = datetime.utcnow()
        room = db.get(VoiceRoom, room_id)
        if room:
            room.current_listeners = max(0, room.current_listeners - 1)
        db.commit()
    return {"ok": True}


@router.post("/rooms/{room_id}/seats/take")
def take_seat(room_id: int, req: JoinSeatRequest,
              db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    room = db.get(VoiceRoom, room_id)
    if not room:
        raise HTTPException(404, "room_not_found")
    if req.seat_index < 0 or req.seat_index >= room.seats_count:
        raise HTTPException(400, "invalid_seat")
    # هل المقعد مأخوذ؟
    taken = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.seat_index == req.seat_index,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if taken:
        raise HTTPException(400, "seat_taken")
    m = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.user_id == user.id,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if not m:
        raise HTTPException(403, "must_join_first")
    m.seat_index = req.seat_index
    m.role = "speaker" if m.role == "listener" else m.role
    db.commit()
    return {"ok": True, "seat_index": req.seat_index, "role": m.role}


@router.post("/rooms/{room_id}/seats/leave")
def leave_seat(room_id: int, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    m = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.user_id == user.id,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if m:
        m.seat_index = None
        if m.role == "speaker":
            m.role = "listener"
        db.commit()
    return {"ok": True}


@router.post("/rooms/{room_id}/mute")
def toggle_mute(room_id: int, target_user_id: int, mute: bool = True,
                db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    room = db.get(VoiceRoom, room_id)
    if not room:
        raise HTTPException(404, "room_not_found")
    # المالك يستطيع كتم الآخرين؛ غير ذلك المستخدم يكتم نفسه فقط
    if target_user_id != user.id and room.owner_id != user.id:
        # أو أدمن
        admin_check = db.execute(select(VoiceRoomMember).where(and_(
            VoiceRoomMember.room_id == room_id,
            VoiceRoomMember.user_id == user.id,
            VoiceRoomMember.role.in_(["owner", "admin"]),
        ))).scalar_one_or_none()
        if not admin_check:
            raise HTTPException(403, "forbidden")
    m = db.execute(select(VoiceRoomMember).where(and_(
        VoiceRoomMember.room_id == room_id,
        VoiceRoomMember.user_id == target_user_id,
        VoiceRoomMember.left_at.is_(None),
    ))).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "member_not_found")
    m.is_muted = mute
    db.commit()
    return {"ok": True, "muted": mute}


@router.post("/rooms/{room_id}/close")
def close_room(room_id: int, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    room = db.get(VoiceRoom, room_id)
    if not room:
        raise HTTPException(404, "room_not_found")
    if room.owner_id != user.id:
        raise HTTPException(403, "only_owner_can_close")
    room.is_active = False
    room.ended_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/rooms/{room_id}/messages")
def send_message(room_id: int, req: SendMessageRequest,
                 db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    if not req.content.strip():
        raise HTTPException(400, "empty_content")
    msg = VoiceRoomMessage(room_id=room_id, user_id=user.id,
                           content=req.content[:500])
    db.add(msg)
    db.commit()
    return {"ok": True, "id": msg.id}


@router.get("/rooms/{room_id}/messages")
def get_messages(room_id: int, limit: int = Query(50, le=200),
                 db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    rows = db.execute(
        select(VoiceRoomMessage, User).join(User, User.id == VoiceRoomMessage.user_id)
        .where(VoiceRoomMessage.room_id == room_id)
        .order_by(VoiceRoomMessage.created_at.desc()).limit(limit)
    ).all()
    msgs = [
        {
            "id": m.id, "user_id": u.id, "username": u.username,
            "avatar": u.avatar, "content": m.content,
            "type": m.msg_type, "created_at": m.created_at.isoformat(),
        } for m, u in rows
    ]
    msgs.reverse()
    return {"messages": msgs}
