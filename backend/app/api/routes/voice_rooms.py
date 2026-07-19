"""
Voice Rooms API - الغرف الصوتية الجماعية

v88.3.5 — الإصلاحات:
  1) استيراد bcrypt مرة واحدة على أعلى الملف بشكل آمن (with try/except)
     حتى لا يتسبب استيراد كسول متأخر داخل الدالة بأي 500 غامض.
  2) endpoint تشخيصي عام /rooms/_ping بدون مصادقة — يعطي 200 عند تحميل الراوتر
     بنجاح، ويسهّل تشخيص "هل الراوتر أصلاً موجود؟" مقابل "هل توكن المستخدم صحيح؟".
  3) endpoint واحد يقبل كلا المسارين /rooms و /rooms/ صراحةً — بحيث لا يعتمد
     على redirect_slashes الذي يفقد الـAuth headers عبر cross-origin.
"""
from datetime import datetime
from typing import Optional
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.engagement import (
    VoiceRoom, VoiceRoomMember, VoiceRoomMessage,
)

_log = logging.getLogger(__name__)

# v88.3.5: استيراد آمن لـ bcrypt. إذا لم تكن passlib مثبتة (نشر ناقص)
# لا نُفشل الراوتر بأكمله — بل نُعطّل فقط ميزة كلمة المرور للغرف الخاصة
# ونسجّل تحذيراً واضحاً.
try:
    from passlib.hash import bcrypt as _bcrypt  # type: ignore
    _BCRYPT_OK = True
except Exception as _bcrypt_err:  # pragma: no cover
    _bcrypt = None  # type: ignore
    _BCRYPT_OK = False
    _log.warning("[voice_rooms] passlib/bcrypt unavailable: %s — private rooms disabled", _bcrypt_err)

router = APIRouter(tags=["voice-rooms"])


# ============================================================
# v88.3.5 — Health/diagnostics endpoint
# لا يتطلب مصادقة. الفرونت يستخدمه للتأكد من أن الراوتر محمّل قبل عرض
# رسالة "الخدمة غير متوفرة". أيضاً مفيد لطلبات الـUptime/monitoring.
# ============================================================
@router.get("/rooms/_ping", include_in_schema=False)
@router.get("/rooms/_ping/", include_in_schema=False)
def _ping():
    return {
        "ok": True,
        "service": "voice_rooms",
        "bcrypt_available": _BCRYPT_OK,
        "ts": datetime.utcnow().isoformat(),
    }


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
    # v88.13: ربط الغرفة بمجموعة (اختياري)
    group_id: Optional[str] = None


class JoinSeatRequest(BaseModel):
    seat_index: int


class SendMessageRequest(BaseModel):
    content: str


# v88.3.5: تسجيل الـPOST على كلا الشكلين /rooms و /rooms/ مباشرة (بدون redirect)
# لأن FastAPI مع redirect_slashes=False لن يحوّل تلقائياً، وبعض عملاء المتصفح
# (خصوصاً iOS/PWA) يضيفون slash تلقائياً.
@router.post("/rooms")
@router.post("/rooms/")
def create_room(req: CreateRoomRequest,
                db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    # v88.3.5: تحقق مبكّر واضح مع رسائل عربية
    if not req.title or not req.title.strip():
        raise HTTPException(400, "عنوان الغرفة مطلوب")
    if req.seats_count < 2 or req.seats_count > 15:
        raise HTTPException(400, "عدد المقاعد يجب أن يكون بين 2 و 15")
    if req.is_private and (not req.password or not req.password.strip()):
        raise HTTPException(400, "الغرفة الخاصة تتطلب كلمة مرور")

    # v88.13: تحقق من وجود المجموعة إذا تم تمرير group_id
    group_id_value = None
    if req.group_id:
        try:
            from app.models.group import Group, GroupMember  # type: ignore
            group = db.get(Group, req.group_id)
            if not group:
                raise HTTPException(404, "المجموعة غير موجودة")
            # تحقق أن المستخدم عضو في المجموعة (المالك أو عضو)
            is_owner = group.owner_id == user.id
            is_member = False
            try:
                member = db.execute(
                    select(GroupMember).where(and_(
                        GroupMember.group_id == req.group_id,
                        GroupMember.user_id == user.id,
                    ))
                ).scalar_one_or_none()
                is_member = member is not None
            except Exception:
                is_member = False
            if not (is_owner or is_member):
                raise HTTPException(403, "يجب أن تكون عضواً في المجموعة لإنشاء غرفة صوتية داخلها")
            group_id_value = req.group_id
        except HTTPException:
            raise
        except ImportError:
            _log.warning("[voice_rooms.create] Group model not importable — skipping group binding")
            group_id_value = None

    try:
        room = VoiceRoom(
            owner_id=user.id,
            group_id=group_id_value,
            title=req.title.strip(),
            description=(req.description or "").strip() or None,
            cover_image=req.cover_image,
            background_id=req.background_id,
            category=req.category or "general",
            language=req.language or "ar",
            seats_count=req.seats_count,
            is_private=bool(req.is_private),
            agora_channel=f"vr_{uuid.uuid4().hex[:16]}",
        )
        # v88.3.5: تشفير كلمة المرور باستخدام bcrypt المستورد أعلى الملف
        if req.is_private and req.password:
            if not _BCRYPT_OK:
                raise HTTPException(503, "خدمة الغرف الخاصة غير مهيّأة على السيرفر — استخدم غرفة عامة")
            room.password_hash = _bcrypt.hash(req.password.strip())

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
    except HTTPException:
        raise
    except Exception as exc:
        _log.exception("[voice_rooms.create] failed for user=%s: %s", user.id, exc)
        db.rollback()
        raise HTTPException(500, f"تعذر إنشاء الغرفة: {type(exc).__name__}")


@router.get("/rooms")
@router.get("/rooms/")
def list_rooms(category: Optional[str] = Query(None),
               group_id: Optional[str] = Query(None),
               db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    stmt = select(VoiceRoom).where(VoiceRoom.is_active.is_(True))
    if category:
        stmt = stmt.where(VoiceRoom.category == category)
    # v88.13: دعم فلترة الغرف بحسب المجموعة
    if group_id:
        stmt = stmt.where(VoiceRoom.group_id == group_id)
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
                "group_id": getattr(r, 'group_id', None),
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
        if not _BCRYPT_OK:
            raise HTTPException(503, "خدمة الغرف الخاصة غير مهيّأة على السيرفر")
        if not password or not _bcrypt.verify(password, room.password_hash):
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
