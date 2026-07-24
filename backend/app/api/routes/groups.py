"""
Yamshat Groups Router — v59.2 GROUPS_OVERHAUL
=============================================
راوتر المجموعات الكامل: يحقّق عقد الواجهة (frontend/src/api/groups.js)
بالكامل دون نقاط 404 معلّقة.

كل مسار:
  - يستعمل group_store من group_store_enhanced (مصدر حقيقة وحيد).
  - يبث الحدث المناسب عبر group_ws_manager (real-time).
  - يعيد رمز HTTP صحيح + رسالة عربية واضحة.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.group_store_enhanced import group_store, GroupRole
from app.core.group_ws_manager import group_ws_manager
from app.core.security import ACCESS_TOKEN_TYPE, TokenError, decode_token
from app.models.user import User

logger = logging.getLogger("yamshat.groups")

router = APIRouter()
# راوتر منفصل لـ WebSocket — يُركّب على /api مباشرة في main.py
# لأن مسار العميل هو: ws(s)://host/api/ws/groups/{group_id}/{user_id}
ws_router = APIRouter()


# ============================================================
# 🔧 أدوات مساعدة
# ============================================================
async def _broadcast(group_id: str, event_type: str, data: dict, exclude_user: Optional[str] = None) -> None:
    """يبث حدث WebSocket إلى أعضاء المجموعة (إن وُجدوا)."""
    try:
        await group_ws_manager.broadcast(
            str(group_id),
            {"type": event_type, "group_id": str(group_id), "data": data},
            exclude_user=exclude_user,
        )
    except Exception as exc:  # pragma: no cover - never break HTTP path on WS issues
        logger.warning(f"[groups] WS broadcast failed ({event_type}): {exc}")


def _require_member(group_id: str, username: str):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(username)
    if not member or member.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not a member')
    return group, member


# ============================================================
# 🏠 المسارات الأساسية للمجموعات
# ============================================================
@router.get('')
def list_groups(current_user: User = Depends(get_current_user)):
    return group_store.list_groups()


@router.get('/search')
def search_groups(
    query: str = Query("", description="نص البحث"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """البحث في المجموعات حسب الاسم/الوصف/التصنيف."""
    return group_store.search_groups(query, limit)


@router.post('')
async def create_group(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    category = str(payload.get('category') or '').strip()
    image_url = str(payload.get('image_url') or '').strip()
    cover_image_url = str(payload.get('cover_image_url') or '').strip()
    members = payload.get('members') or []
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Group name is required')
    group = group_store.create_group(
        current_user.username, name, description, members,
        category, image_url, cover_image_url,
    )
    await _broadcast(group["id"], "group_created", group)
    return group


@router.post('/create_group')
async def create_group_legacy(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    return await create_group(payload, current_user)


@router.get('/{group_id}')
def get_group_details(group_id: str, current_user: User = Depends(get_current_user)):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.serialize_group(group)


@router.get('/group/{groupId}')
def get_group_info_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    return get_group_details(str(groupId), current_user)


@router.put('/{group_id}')
async def update_group(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    success = group_store.update_group(
        group_id, current_user.username,
        name=payload.get('name'),
        description=payload.get('description'),
        image_url=payload.get('image_url'),
        cover_image_url=payload.get('cover_image_url'),
        category=payload.get('category'),
        privacy=payload.get('privacy'),
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    group = group_store.get_group(group_id)
    serialized = group_store.serialize_group(group)
    await _broadcast(group_id, "group_updated", serialized)
    return serialized


@router.delete('/{group_id}')
async def delete_group(group_id: str, current_user: User = Depends(get_current_user)):
    success = group_store.delete_group(group_id, current_user.username)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    await _broadcast(group_id, "group_deleted", {"id": group_id})
    return {"status": "success", "message": "Group deleted"}


# ============================================================
# 👥 الأعضاء
# ============================================================
@router.post('/{group_id}/join')
async def join_group(group_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # v88.53: منع الانضمام للمجموعات إذا كان المستخدم محظوراً (groups_join_ban)
    from app.services.restriction_service import is_user_restricted
    if is_user_restricted(db, current_user.id, 'groups_join_ban'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='حسابك محظور من الانضمام إلى أي مجموعة من قبل الإدارة. راجع الإشعارات لإرسال طلب مراجعة.',
        )
    result = group_store.join_group(group_id, current_user.username)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found or banned')
    if result.get("joined"):
        await _broadcast(group_id, "member_joined", {"username": current_user.username})
    return result


@router.post('/group/{groupId}/join')
async def join_group_legacy(groupId: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await join_group(str(groupId), current_user, db)


@router.post('/{group_id}/leave')
async def leave_group(group_id: str, current_user: User = Depends(get_current_user)):
    success = group_store.leave_group(group_id, current_user.username)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot leave group or group not found')
    await _broadcast(group_id, "member_left", {"username": current_user.username})
    return {"status": "success", "message": "Left group"}


@router.post('/group/{groupId}/leave')
async def leave_group_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    return await leave_group(str(groupId), current_user)


@router.get('/{group_id}/members')
def get_group_members(group_id: str, current_user: User = Depends(get_current_user)):
    if not group_store.get_group(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.get_members(group_id)


@router.get('/group/{groupId}/members')
def get_group_members_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    return get_group_members(str(groupId), current_user)


@router.post('/{group_id}/members')
async def add_group_member(
    group_id: str,
    username: str = Query(..., description="اسم المستخدم المراد إضافته"),
    role: str = Query("member"),
    current_user: User = Depends(get_current_user),
):
    """إضافة عضو إلى المجموعة (يستدعى عبر params من الواجهة)."""
    try:
        role_enum = GroupRole(role)
    except ValueError:
        role_enum = GroupRole.MEMBER
    ok = group_store.add_member(group_id, current_user.username, username, role_enum)
    if not ok:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    await _broadcast(group_id, "member_added", {"username": username, "role": role_enum.value})
    return {"status": "success", "username": username, "role": role_enum.value}


@router.post('/{group_id}/members/{target_username}/role')
async def update_member_role(
    group_id: str,
    target_username: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    new_role = payload.get('role')
    if new_role not in [r.value for r in GroupRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')
    success = group_store.update_member_role(group_id, current_user.username, target_username, GroupRole(new_role))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    await _broadcast(group_id, "member_role_updated", {"username": target_username, "role": new_role})
    return {"status": "success", "message": f"Role updated to {new_role}"}


@router.post('/group/{groupId}/member/{username}/promote')
async def promote_member_legacy(groupId: int, username: str, current_user: User = Depends(get_current_user)):
    return await update_member_role(str(groupId), username, {"role": "admin"}, current_user)


@router.post('/{group_id}/members/{target_username}/remove')
async def remove_group_member(group_id: str, target_username: str, current_user: User = Depends(get_current_user)):
    success = group_store.moderate_user(group_id, current_user.username, target_username, "kick")
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    await _broadcast(group_id, "member_removed", {"username": target_username})
    return {"status": "success", "message": f"User {target_username} removed"}


@router.post('/group/{groupId}/member/{username}/remove')
async def remove_member_legacy(groupId: int, username: str, current_user: User = Depends(get_current_user)):
    return await remove_group_member(str(groupId), username, current_user)


@router.post('/{group_id}/members/{target_username}/mute')
async def mute_member(
    group_id: str,
    target_username: str,
    is_muted: bool = Query(True),
    duration_mins: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """كتم/إلغاء كتم عضو."""
    success = group_store.set_mute(group_id, current_user.username, target_username, bool(is_muted), duration_mins)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    await _broadcast(group_id, "member_muted" if is_muted else "member_unmuted",
                     {"username": target_username, "is_muted": bool(is_muted)})
    return {"status": "success", "username": target_username, "is_muted": bool(is_muted)}


@router.post('/{group_id}/members/{target_username}/ban')
async def ban_member(
    group_id: str,
    target_username: str,
    is_banned: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    """حظر/إلغاء حظر عضو."""
    success = group_store.set_ban(group_id, current_user.username, target_username, bool(is_banned))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    await _broadcast(group_id, "member_banned" if is_banned else "member_unbanned",
                     {"username": target_username, "is_banned": bool(is_banned)})
    return {"status": "success", "username": target_username, "is_banned": bool(is_banned)}


@router.post('/{group_id}/transfer-ownership')
async def transfer_ownership(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """نقل ملكية المجموعة إلى عضو آخر."""
    new_owner = (payload.get('new_owner') or payload.get('username') or '').strip()
    if not new_owner:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='new_owner is required')
    success = group_store.transfer_ownership(group_id, current_user.username, new_owner)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    await _broadcast(group_id, "ownership_transferred", {"new_owner": new_owner, "from": current_user.username})
    return {"status": "success", "new_owner": new_owner}


# ============================================================
# 📩 الدعوات وطلبات الانضمام
# ============================================================
@router.post('/{group_id}/invite')
async def invite_to_group(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    invitee = payload.get('username')
    if not invitee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required')
    result = group_store.invite_user(group_id, current_user.username, invitee)
    if not result:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Failed to send invite')
    await _broadcast(group_id, "invitation_sent", result)
    return result


@router.post('/{group_id}/invitations')
async def send_invitation(
    group_id: str,
    username: str = Query(..., description="اسم المستخدم المدعوّ"),
    current_user: User = Depends(get_current_user),
):
    """إرسال دعوة (استدعاء عبر params من الواجهة)."""
    return await invite_to_group(group_id, {"username": username}, current_user)


@router.post('/{group_id}/invitations/{invitation_id}/accept')
async def accept_invitation(
    group_id: str,
    invitation_id: str,
    username: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """قبول دعوة (المستخدم الحالي هو المدعوّ)."""
    user = username or current_user.username
    result = group_store.accept_invitation(group_id, invitation_id, user)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invitation not found or invalid')
    await _broadcast(group_id, "invitation_accepted", {"invitation_id": invitation_id, "username": user})
    return result


@router.post('/{group_id}/join-requests')
async def create_join_request(
    group_id: str,
    message: str = Query("", description="رسالة اختيارية"),
    current_user: User = Depends(get_current_user),
):
    """إنشاء طلب انضمام (للمجموعات الخاصة)."""
    result = group_store.create_join_request(group_id, current_user.username, message)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    await _broadcast(group_id, "join_request_created", result)
    return result


@router.post('/{group_id}/join-requests/{request_id}/approve')
async def approve_join_request(
    group_id: str,
    request_id: str,
    current_user: User = Depends(get_current_user),
):
    success = group_store.decide_join_request(group_id, request_id, current_user.username, approve=True)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or request not found')
    await _broadcast(group_id, "join_request_approved", {"request_id": request_id})
    return {"status": "success", "request_id": request_id, "approved": True}


@router.post('/{group_id}/join-requests/{request_id}/reject')
async def reject_join_request(
    group_id: str,
    request_id: str,
    current_user: User = Depends(get_current_user),
):
    success = group_store.decide_join_request(group_id, request_id, current_user.username, approve=False)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or request not found')
    await _broadcast(group_id, "join_request_rejected", {"request_id": request_id})
    return {"status": "success", "request_id": request_id, "approved": False}


# ============================================================
# 💬 الرسائل
# ============================================================
@router.post('/{group_id}/messages')
async def send_message(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    content = str(payload.get('content') or '').strip()
    message_type = str(payload.get('message_type') or 'text').strip()
    sender_avatar = str(payload.get('sender_avatar') or '').strip()
    sender_display_name = str(payload.get('sender_display_name') or '').strip()
    attachments = payload.get('attachments') or []
    reply_to = payload.get('reply_to')
    if not content and not attachments:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Message content or attachments required')
    result = group_store.send_message(
        group_id, current_user.username, content, message_type,
        sender_avatar, sender_display_name, attachments, reply_to,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot send message to group')
    await _broadcast(group_id, "new_message", result, exclude_user=current_user.username)
    return {"status": "success", "message": result}


@router.post('/group/send_message')
async def send_group_message_legacy(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    group_id = payload.get('group_id') or payload.get('groupId')
    if not group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='group_id is required')
    return await send_message(str(group_id), payload, current_user)


@router.get('/{group_id}/messages')
def get_group_messages(
    group_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    if not group_store.get_group(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.get_messages(group_id, limit, offset)


@router.get('/group/{groupId}/messages')
def get_group_messages_legacy(
    groupId: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    return get_group_messages(str(groupId), limit, 0, current_user)


@router.delete('/{group_id}/messages/{message_id}')
async def delete_message(group_id: str, message_id: str, current_user: User = Depends(get_current_user)):
    success = group_store.delete_message(group_id, message_id, current_user.username)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot delete message')
    await _broadcast(group_id, "message_deleted", {"message_id": message_id})
    return {"status": "success", "message": "Message deleted"}


@router.post('/group/{groupId}/message/{messageId}/delete')
async def delete_group_message_legacy(groupId: int, messageId: int, current_user: User = Depends(get_current_user)):
    return await delete_message(str(groupId), str(messageId), current_user)


@router.put('/{group_id}/messages/{message_id}')
async def edit_message(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    new_content = str(payload.get('content') or '').strip()
    if not new_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Message content required')
    success = group_store.edit_message(group_id, message_id, current_user.username, new_content)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot edit message')
    await _broadcast(group_id, "message_edited", {"message_id": message_id, "content": new_content})
    return {"status": "success", "message": "Message edited"}


@router.post('/{group_id}/messages/{message_id}/reactions')
async def add_reaction(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    emoji = str(payload.get('emoji') or '').strip()
    if not emoji:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Emoji is required')
    success = group_store.add_reaction(group_id, message_id, current_user.username, emoji)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot add reaction')
    await _broadcast(group_id, "reaction_added",
                     {"message_id": message_id, "emoji": emoji, "username": current_user.username})
    return {"status": "success", "message": "Reaction added"}


@router.post('/group/{groupId}/message/{messageId}/reaction')
async def add_group_message_reaction_legacy(
    groupId: int, messageId: int, payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    return await add_reaction(str(groupId), str(messageId), payload, current_user)


@router.delete('/{group_id}/messages/{message_id}/reactions')
async def remove_reaction(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    emoji = str(payload.get('emoji') or '').strip()
    if not emoji:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Emoji is required')
    success = group_store.remove_reaction(group_id, message_id, current_user.username, emoji)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot remove reaction')
    await _broadcast(group_id, "reaction_removed",
                     {"message_id": message_id, "emoji": emoji, "username": current_user.username})
    return {"status": "success", "message": "Reaction removed"}


@router.post('/{group_id}/messages/{message_id}/seen')
async def mark_message_seen(group_id: str, message_id: str, current_user: User = Depends(get_current_user)):
    success = group_store.mark_message_seen(group_id, message_id, current_user.username)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot mark message as seen')
    await _broadcast(group_id, "message_seen",
                     {"message_id": message_id, "username": current_user.username})
    return {"status": "success", "message": "Message marked as seen"}


@router.post('/group/{groupId}/message/{messageId}/seen')
async def mark_group_message_seen_legacy(
    groupId: int, messageId: int, current_user: User = Depends(get_current_user)
):
    return await mark_message_seen(str(groupId), str(messageId), current_user)


@router.post('/{group_id}/messages/{message_id}/pin')
async def pin_group_message(
    group_id: str,
    message_id: str,
    is_pinned: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    """تثبيت/إلغاء تثبيت رسالة."""
    success = group_store.pin_message(group_id, message_id, current_user.username, bool(is_pinned))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or message not found')
    await _broadcast(group_id, "message_pinned" if is_pinned else "message_unpinned",
                     {"message_id": message_id, "is_pinned": bool(is_pinned)})
    return {"status": "success", "message_id": message_id, "is_pinned": bool(is_pinned)}


@router.post('/{group_id}/messages/{message_id}/forward')
async def forward_group_message(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """تحويل رسالة إلى مجموعات أخرى."""
    targets = payload.get('targets') or []
    if not isinstance(targets, list) or not targets:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='targets list required')
    result = group_store.forward_message(group_id, message_id, current_user.username, [str(t) for t in targets])
    if result.get("status") != "success":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.get("reason", "forward_failed"))
    for t in result.get("targets", []):
        await _broadcast(t, "message_forwarded",
                         {"from_group": group_id, "message_id": message_id, "by": current_user.username})
    return result


@router.post('/{group_id}/messages/{message_id}/report')
async def report_group_message(
    group_id: str,
    message_id: str,
    payload: dict = Body(default={}),
    current_user: User = Depends(get_current_user),
):
    """الإبلاغ عن رسالة."""
    reason = str((payload or {}).get('reason') or '').strip()
    success = group_store.report_message(group_id, message_id, current_user.username, reason)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Message not found')
    return {"status": "success", "message_id": message_id}


# ============================================================
# 📝 المنشورات (Posts داخل المجموعة)
# ============================================================
@router.get('/{group_id}/posts')
def list_group_posts(
    group_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
):
    if not group_store.get_group(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.list_posts(group_id, limit, offset)


@router.post('/{group_id}/posts')
async def create_group_post(
    group_id: str,
    content: str = Query("", description="نص المنشور"),
    media_urls: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_user),
):
    post = group_store.create_post(group_id, current_user.username, content, media_urls)
    if not post:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot create post')
    await _broadcast(group_id, "post_created", post)
    return post


@router.delete('/{group_id}/posts/{post_id}')
async def delete_group_post(group_id: str, post_id: str, current_user: User = Depends(get_current_user)):
    success = group_store.delete_post(group_id, post_id, current_user.username)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot delete post')
    await _broadcast(group_id, "post_deleted", {"post_id": post_id})
    return {"status": "success", "post_id": post_id}


@router.post('/{group_id}/posts/{post_id}/pin')
async def pin_group_post(
    group_id: str,
    post_id: str,
    is_pinned: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    success = group_store.pin_post(group_id, post_id, current_user.username, bool(is_pinned))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or post not found')
    await _broadcast(group_id, "post_pinned" if is_pinned else "post_unpinned",
                     {"post_id": post_id, "is_pinned": bool(is_pinned)})
    return {"status": "success", "post_id": post_id, "is_pinned": bool(is_pinned)}


# ============================================================
# 📜 القواعد / الأحداث / الاستطلاعات / الإعلانات
# ============================================================
@router.post('/{group_id}/rules')
async def create_group_rule(
    group_id: str,
    title: str = Query(..., description="عنوان القاعدة"),
    description: str = Query(""),
    order: int = Query(0),
    current_user: User = Depends(get_current_user),
):
    rule = group_store.create_rule(group_id, current_user.username, title, description, order)
    if not rule:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or invalid input')
    await _broadcast(group_id, "rule_created", rule)
    return rule


@router.post('/{group_id}/events')
async def create_group_event(
    group_id: str,
    title: str = Query(..., description="عنوان الحدث"),
    description: str = Query(""),
    starts_at: str = Query(""),
    ends_at: Optional[str] = Query(None),
    location: str = Query(""),
    current_user: User = Depends(get_current_user),
):
    event = group_store.create_event(group_id, current_user.username, title, description, starts_at, ends_at, location)
    if not event:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot create event')
    await _broadcast(group_id, "event_created", event)
    return event


@router.post('/{group_id}/polls')
async def create_group_poll(
    group_id: str,
    payload: dict | None = Body(default=None),
    question: Optional[str] = Query(None, description="سؤال الاستطلاع"),
    options: Optional[List[str]] = Query(None, description="الخيارات (متعدد)"),
    multi_choice: Optional[bool] = Query(None),
    closes_at: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    payload = payload or {}
    resolved_question = str(payload.get('question') or question or '').strip()

    payload_options = payload.get('options')
    resolved_options: List[str] = []
    if isinstance(payload_options, list):
      resolved_options = [str(item).strip() for item in payload_options if str(item).strip()]
    elif isinstance(options, list):
      resolved_options = [str(item).strip() for item in options if str(item).strip()]

    resolved_multi_choice = bool(
        payload.get('multi_choice')
        if payload.get('multi_choice') is not None
        else payload.get('multi')
        if payload.get('multi') is not None
        else multi_choice
        if multi_choice is not None
        else False
    )
    resolved_closes_at = payload.get('closes_at') or closes_at

    poll = group_store.create_poll(
        group_id,
        current_user.username,
        resolved_question,
        resolved_options,
        resolved_multi_choice,
        resolved_closes_at,
    )
    if not poll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid poll input')
    await _broadcast(group_id, "poll_created", poll)
    return poll


@router.post('/{group_id}/polls/{poll_id}/vote')
async def vote_in_poll(
    group_id: str,
    poll_id: str,
    option: str = Query(..., description="الخيار المُصوَّت عليه"),
    current_user: User = Depends(get_current_user),
):
    poll = group_store.vote_in_poll(group_id, poll_id, current_user.username, option)
    if not poll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid vote (closed/option/poll)')
    await _broadcast(group_id, "poll_voted", {"poll_id": poll_id, "option": option, "voter": current_user.username})
    return poll


@router.post('/{group_id}/announcements')
async def create_group_announcement(
    group_id: str,
    title: str = Query(..., description="عنوان الإعلان"),
    body: str = Query(""),
    is_pinned: bool = Query(True),
    current_user: User = Depends(get_current_user),
):
    ann = group_store.create_announcement(group_id, current_user.username, title, body, is_pinned)
    if not ann:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or invalid input')
    await _broadcast(group_id, "announcement_created", ann)
    return ann


# ============================================================
# ⚙️ الإعدادات
# ============================================================
@router.get('/{group_id}/settings')
def get_group_settings(group_id: str, current_user: User = Depends(get_current_user)):
    settings = group_store.get_settings(group_id)
    if settings is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return settings


@router.put('/{group_id}/settings')
async def update_group_settings(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    settings = group_store.update_settings(group_id, current_user.username, payload or {})
    if settings is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    await _broadcast(group_id, "settings_updated", settings)
    return settings


# ============================================================
# 📊 الإحصائيات
# ============================================================
@router.get('/{group_id}/analytics')
def get_group_analytics(group_id: str, current_user: User = Depends(get_current_user)):
    """إحصائيات المجموعة (متاحة للأعضاء الموثوقين)."""
    group, member = _require_member(group_id, current_user.username)
    # الإحصائيات الكاملة للإدارة، والملخّصة للأعضاء
    full = group_store.get_analytics(group_id) or {}
    if member.role in (GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR):
        return full
    # إخفاء الحقول الحساسة عن الأعضاء العاديين
    public_keys = {"group_id", "members_count", "messages_total", "posts_total",
                   "polls_total", "events_total", "rules_total", "announcements_total"}
    return {k: v for k, v in full.items() if k in public_keys}


# ============================================================
# 🛠️ مسارات الإدارة العامة
# ============================================================
@router.post('/{group_id}/moderate')
async def moderate_group_user(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    target = payload.get('username')
    action = payload.get('action')  # mute, unmute, kick, ban, unban
    duration = payload.get('duration_mins')
    if not target or action not in ('mute', 'unmute', 'kick', 'ban', 'unban'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid moderation request')
    success = group_store.moderate_user(group_id, current_user.username, target, action, duration)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderation failed or permission denied')
    await _broadcast(group_id, f"member_{action}", {"username": target, "by": current_user.username})
    return {"status": "success", "message": f"User {target} {action}ed"}


@router.get('/{group_id}/audit-logs')
def get_group_audit_logs(group_id: str, current_user: User = Depends(get_current_user)):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(current_user.username)
    if not member or member.role not in (GroupRole.OWNER, GroupRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    return group.audit_logs


@router.post('/{group_id}/typing')
async def group_typing(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    is_typing = bool(payload.get('is_typing', True))
    await _broadcast(
        group_id, "typing",
        {"username": current_user.username, "is_typing": is_typing},
        exclude_user=current_user.username,
    )
    return {"status": "success", "user": current_user.username, "is_typing": is_typing}


@router.post('/group/{groupId}/typing')
async def group_typing_legacy(
    groupId: int, payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    return await group_typing(str(groupId), payload, current_user)


# ============================================================
# 🔌 WebSocket: /ws/groups/{group_id}/{user_id}
# ============================================================
# ============================================================
# 🆕 v59.5 — Endpoints مفقودة كانت تستدعيها الواجهة بشكل صامت
# (mentions / media gallery / pinned / notifications / discover /
#  trending / GET lists for events|polls|announcements|rules / audit alias)
# ============================================================

# ---- Pinned messages (GET) ----
@router.get('/{group_id}/pinned')
def list_group_pinned(group_id: str, current_user: User = Depends(get_current_user)):
    _require_member(group_id, current_user.username)
    return group_store.list_pinned_messages(group_id)


# ---- Mentions (@username) ----
@router.get('/{group_id}/mentions')
def list_group_mentions(
    group_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_mentions(group_id, current_user.username, limit=limit)


@router.post('/{group_id}/mentions/{mention_id}/read')
def mark_group_mention_read(
    group_id: str, mention_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    ok = group_store.mark_mention_read(group_id, mention_id, current_user.username)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Mention not found')
    return {"status": "success"}


# ---- Media gallery ----
@router.get('/{group_id}/media')
def list_group_media(
    group_id: str,
    limit: int = Query(200, ge=1, le=500),
    kind: Optional[str] = Query(None, regex='^(image|video|audio|file)$'),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_media(group_id, limit=limit, kind=kind)


# ---- Audit log alias (frontend calls /audit, backend already exposes /audit-logs) ----
@router.get('/{group_id}/audit')
def get_group_audit_alias(
    group_id: str,
    limit: int = Query(200, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(current_user.username)
    if not member or member.role not in (GroupRole.OWNER, GroupRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    logs = list(group.audit_logs or [])
    logs.reverse()
    return logs[:limit]


# ---- Per-group notification preferences ----
@router.get('/{group_id}/notifications/settings')
def get_group_notif_settings(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.get_notification_prefs(group_id, current_user.username)


@router.put('/{group_id}/notifications/settings')
def update_group_notif_settings(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    updated = group_store.update_notification_prefs(group_id, current_user.username, payload or {})
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return updated


# ---- Discover & Trending ----
@router.get('/discover')
def discover_group_list(
    category: Optional[str] = Query(None),
    limit: int = Query(60, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    return group_store.discover_groups(
        username=current_user.username, category=category, limit=limit,
    )


@router.get('/trending')
def trending_group_list(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    return group_store.trending_groups(limit=limit)


# ---- GET lists for events / polls / announcements / rules ----
@router.get('/{group_id}/events')
def list_group_events_ep(
    group_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_events(group_id, limit=limit)


@router.get('/{group_id}/polls')
def list_group_polls_ep(
    group_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_polls(group_id, limit=limit)


@router.get('/{group_id}/announcements')
def list_group_announcements_ep(
    group_id: str,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_announcements(group_id, limit=limit)


@router.get('/{group_id}/rules')
def list_group_rules_ep(
    group_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_member(group_id, current_user.username)
    return group_store.list_rules(group_id)


# ============================================================
def _authenticate_ws(ws: WebSocket, user_id: int, db: Session) -> User:
    token = ws.query_params.get('token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token is required')
    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    token_user_id = payload.get('user_id')
    if token_user_id is None or int(token_user_id) != int(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Token mismatch')
    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


@ws_router.websocket('/ws/groups/{group_id}/{user_id}')
async def groups_websocket(
    websocket: WebSocket,
    group_id: str,
    user_id: int,
    db: Session = Depends(get_db),
):
    """نقطة WebSocket لكل مجموعة: بث الرسائل والتفاعلات والكتابة في الزمن الحقيقي."""
    try:
        user = _authenticate_ws(websocket, user_id, db)
    except HTTPException as exc:
        await websocket.close(code=4401 if exc.status_code in (401, 403) else 4404)
        return

    group = group_store.get_group(group_id)
    if not group:
        await websocket.close(code=4404)
        return
    if user.username not in group.members:
        await websocket.close(code=4403)
        return

    await group_ws_manager.connect(group_id, user.username, websocket)
    # حدث presence
    await group_ws_manager.broadcast(
        group_id,
        {"type": "presence", "group_id": group_id, "data": {"username": user.username, "online": True}},
        exclude_user=user.username,
    )
    try:
        while True:
            data = await websocket.receive_text()
            # دعم heartbeat بسيط: ping/pong
            if data == "ping":
                try:
                    await websocket.send_text("pong")
                except Exception:
                    break
                continue
            # يمكن للعميل إرسال أحداث "typing" بسرعة دون استدعاء HTTP
            try:
                import json as _json
                msg = _json.loads(data)
                if isinstance(msg, dict) and msg.get("type") == "typing":
                    await group_ws_manager.broadcast(
                        group_id,
                        {"type": "typing", "group_id": group_id,
                         "data": {"username": user.username, "is_typing": bool(msg.get("is_typing", True))}},
                        exclude_user=user.username,
                    )
            except Exception:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        await group_ws_manager.disconnect(group_id, user.username, websocket)
        await group_ws_manager.broadcast(
            group_id,
            {"type": "presence", "group_id": group_id, "data": {"username": user.username, "online": False}},
            exclude_user=user.username,
        )


# ============================================================
# ❤️ Health
# ============================================================
@router.get('/health')
async def health_check():
    return {
        "status": "healthy",
        "service": "groups-service",
        "version": "59.2",
        "ws": group_ws_manager.stats(),
    }
