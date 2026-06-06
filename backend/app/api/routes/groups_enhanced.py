"""
راوتر المجموعات المحسّن - Enhanced Groups Router
يوفر جميع المسارات المطلوبة من تطبيق Android
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import List, Optional

from app.core.dependencies import get_current_user
from app.core.group_store_enhanced import group_store, GroupRole
from app.models.user import User

router = APIRouter()


# ============ مسارات المجموعات الأساسية ============

@router.get('/groups')
def list_groups(current_user: User = Depends(get_current_user)):
    """جلب قائمة المجموعات"""
    return group_store.list_groups()


@router.post('/groups')
def create_group(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إنشاء مجموعة جديدة"""
    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    category = str(payload.get('category') or '').strip()
    image_url = str(payload.get('image_url') or '').strip()
    cover_image_url = str(payload.get('cover_image_url') or '').strip()
    members = payload.get('members') or []
    
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Group name is required')
    
    return group_store.create_group(
        current_user.username,
        name,
        description,
        members,
        category,
        image_url,
        cover_image_url
    )


@router.post('/create_group')
def create_group_legacy(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إنشاء مجموعة جديدة (مسار متوافق مع التطبيق القديم)"""
    return create_group(payload, current_user)


@router.get('/groups/{group_id}')
def get_group_details(group_id: str, current_user: User = Depends(get_current_user)):
    """جلب تفاصيل مجموعة"""
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.serialize_group(group)


@router.get('/group/{groupId}')
def get_group_info_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    """جلب تفاصيل مجموعة (مسار متوافق مع التطبيق)"""
    return get_group_details(str(groupId), current_user)


@router.put('/groups/{group_id}')
def update_group(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """تحديث بيانات المجموعة"""
    success = group_store.update_group(
        group_id,
        current_user.username,
        payload.get('name'),
        payload.get('description'),
        payload.get('image_url'),
        payload.get('cover_image_url'),
        payload.get('category')
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    
    group = group_store.get_group(group_id)
    return group_store.serialize_group(group)


@router.delete('/groups/{group_id}')
def delete_group(group_id: str, current_user: User = Depends(get_current_user)):
    """حذف مجموعة"""
    success = group_store.delete_group(group_id, current_user.username)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or group not found')
    
    return {"status": "success", "message": "Group deleted"}


# ============ مسارات الأعضاء ============

@router.post('/groups/{group_id}/join')
def join_group(group_id: str, current_user: User = Depends(get_current_user)):
    """الانضمام للمجموعة"""
    result = group_store.join_group(group_id, current_user.username)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return result


@router.post('/group/{groupId}/join')
def join_group_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    """الانضمام للمجموعة (مسار متوافق مع التطبيق)"""
    return join_group(str(groupId), current_user)


@router.post('/groups/{group_id}/leave')
def leave_group(group_id: str, current_user: User = Depends(get_current_user)):
    """مغادرة المجموعة"""
    success = group_store.leave_group(group_id, current_user.username)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot leave group or group not found')
    
    return {"status": "success", "message": "Left group"}


@router.post('/group/{groupId}/leave')
def leave_group_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    """مغادرة المجموعة (مسار متوافق مع التطبيق)"""
    return leave_group(str(groupId), current_user)


@router.get('/groups/{group_id}/members')
def get_group_members(group_id: str, current_user: User = Depends(get_current_user)):
    """جلب أعضاء المجموعة"""
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    
    return group_store.get_members(group_id)


@router.get('/group/{groupId}/members')
def get_group_members_legacy(groupId: int, current_user: User = Depends(get_current_user)):
    """جلب أعضاء المجموعة (مسار متوافق مع التطبيق)"""
    return get_group_members(str(groupId), current_user)


@router.post('/groups/{group_id}/members/{target_username}/role')
def update_member_role(
    group_id: str,
    target_username: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """تحديث دور العضو"""
    new_role = payload.get('role')
    if new_role not in [r.value for r in GroupRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')
    
    success = group_store.update_member_role(group_id, current_user.username, target_username, GroupRole(new_role))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    
    return {"status": "success", "message": f"Role updated to {new_role}"}


@router.post('/group/{groupId}/member/{username}/promote')
def promote_member_legacy(
    groupId: int,
    username: str,
    current_user: User = Depends(get_current_user)
):
    """ترقية عضو (مسار متوافق مع التطبيق)"""
    return update_member_role(str(groupId), username, {"role": "admin"}, current_user)


@router.post('/groups/{group_id}/members/{target_username}/remove')
def remove_group_member(
    group_id: str,
    target_username: str,
    current_user: User = Depends(get_current_user)
):
    """إزالة عضو من المجموعة"""
    success = group_store.moderate_user(group_id, current_user.username, target_username, "kick")
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    
    return {"status": "success", "message": f"User {target_username} removed"}


@router.post('/group/{groupId}/member/{username}/remove')
def remove_member_legacy(
    groupId: int,
    username: str,
    current_user: User = Depends(get_current_user)
):
    """إزالة عضو من المجموعة (مسار متوافق مع التطبيق)"""
    return remove_group_member(str(groupId), username, current_user)


# ============ مسارات الرسائل ============

@router.post('/groups/{group_id}/messages')
def send_message(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إرسال رسالة إلى المجموعة"""
    content = str(payload.get('content') or '').strip()
    message_type = str(payload.get('message_type') or 'text').strip()
    sender_avatar = str(payload.get('sender_avatar') or '').strip()
    sender_display_name = str(payload.get('sender_display_name') or '').strip()
    attachments = payload.get('attachments') or []
    reply_to = payload.get('reply_to')
    
    if not content and not attachments:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Message content or attachments required')
    
    result = group_store.send_message(
        group_id,
        current_user.username,
        content,
        message_type,
        sender_avatar,
        sender_display_name,
        attachments,
        reply_to
    )
    
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot send message to group')
    
    return {"status": "success", "message": result}


@router.post('/group/send_message')
def send_group_message_legacy(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إرسال رسالة إلى المجموعة (مسار متوافق مع التطبيق)"""
    group_id = payload.get('group_id') or payload.get('groupId')
    if not group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='group_id is required')
    
    return send_message(str(group_id), payload, current_user)


@router.get('/groups/{group_id}/messages')
def get_group_messages(
    group_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """جلب رسائل المجموعة"""
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    
    return group_store.get_messages(group_id, limit, offset)


@router.get('/group/{groupId}/messages')
def get_group_messages_legacy(
    groupId: int,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """جلب رسائل المجموعة (مسار متوافق مع التطبيق)"""
    return get_group_messages(str(groupId), limit, 0, current_user)


@router.delete('/groups/{group_id}/messages/{message_id}')
def delete_message(
    group_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """حذف رسالة من المجموعة"""
    success = group_store.delete_message(group_id, message_id, current_user.username)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot delete message')
    
    return {"status": "success", "message": "Message deleted"}


@router.post('/group/{groupId}/message/{messageId}/delete')
def delete_group_message_legacy(
    groupId: int,
    messageId: int,
    current_user: User = Depends(get_current_user)
):
    """حذف رسالة من المجموعة (مسار متوافق مع التطبيق)"""
    return delete_message(str(groupId), str(messageId), current_user)


@router.put('/groups/{group_id}/messages/{message_id}')
def edit_message(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """تعديل رسالة"""
    new_content = str(payload.get('content') or '').strip()
    
    if not new_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Message content required')
    
    success = group_store.edit_message(group_id, message_id, current_user.username, new_content)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot edit message')
    
    return {"status": "success", "message": "Message edited"}


# ============ مسارات التفاعلات ============

@router.post('/groups/{group_id}/messages/{message_id}/reactions')
def add_reaction(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إضافة تفاعل على رسالة"""
    emoji = str(payload.get('emoji') or '').strip()
    
    if not emoji:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Emoji is required')
    
    success = group_store.add_reaction(group_id, message_id, current_user.username, emoji)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot add reaction')
    
    return {"status": "success", "message": "Reaction added"}


@router.post('/group/{groupId}/message/{messageId}/reaction')
def add_group_message_reaction_legacy(
    groupId: int,
    messageId: int,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إضافة تفاعل على رسالة (مسار متوافق مع التطبيق)"""
    return add_reaction(str(groupId), str(messageId), payload, current_user)


@router.delete('/groups/{group_id}/messages/{message_id}/reactions')
def remove_reaction(
    group_id: str,
    message_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إزالة تفاعل من رسالة"""
    emoji = str(payload.get('emoji') or '').strip()
    
    if not emoji:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Emoji is required')
    
    success = group_store.remove_reaction(group_id, message_id, current_user.username, emoji)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot remove reaction')
    
    return {"status": "success", "message": "Reaction removed"}


# ============ مسارات حالة القراءة ============

@router.post('/groups/{group_id}/messages/{message_id}/seen')
def mark_message_seen(
    group_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """تحديد الرسالة كمقروءة"""
    success = group_store.mark_message_seen(group_id, message_id, current_user.username)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Cannot mark message as seen')
    
    return {"status": "success", "message": "Message marked as seen"}


@router.post('/group/{groupId}/message/{messageId}/seen')
def mark_group_message_seen_legacy(
    groupId: int,
    messageId: int,
    current_user: User = Depends(get_current_user)
):
    """تحديد الرسالة كمقروءة (مسار متوافق مع التطبيق)"""
    return mark_message_seen(str(groupId), str(messageId), current_user)


# ============ مسارات الدعوات والإدارة ============

@router.post('/groups/{group_id}/invite')
def invite_to_group(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """دعوة عضو للمجموعة"""
    invitee = payload.get('username')
    if not invitee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required')
    
    result = group_store.invite_user(group_id, current_user.username, invitee)
    if not result:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Failed to send invite')
    
    return result


@router.post('/groups/{group_id}/moderate')
def moderate_group_user(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """تطبيق إجراء تعديل على عضو"""
    target = payload.get('username')
    action = payload.get('action')  # mute, unmute, kick
    duration = payload.get('duration_mins')
    
    if not target or action not in ['mute', 'unmute', 'kick']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid moderation request')
    
    success = group_store.moderate_user(group_id, current_user.username, target, action, duration)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderation failed or permission denied')
    
    return {"status": "success", "message": f"User {target} {action}ed"}


@router.get('/groups/{group_id}/audit-logs')
def get_group_audit_logs(group_id: str, current_user: User = Depends(get_current_user)):
    """جلب سجلات التدقيق للمجموعة"""
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    
    # فقط الإداريون والمالكون يمكنهم رؤية سجلات التدقيق
    member = group.members.get(current_user.username)
    if not member or member.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    
    return group.audit_logs


# ============ مسارات الحالة ============

@router.post('/groups/{group_id}/typing')
def group_typing(
    group_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إرسال مؤشر الكتابة (للاستخدام مع WebSocket)"""
    is_typing = payload.get('is_typing', True)
    
    # هذا المسار يمكن توسيعه لاستخدام WebSocket أو Redis للبث الفعلي
    return {
        "status": "success",
        "user": current_user.username,
        "is_typing": is_typing
    }


@router.post('/group/{groupId}/typing')
def group_typing_legacy(
    groupId: int,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """إرسال مؤشر الكتابة (مسار متوافق مع التطبيق)"""
    return group_typing(str(groupId), payload, current_user)


# ============ مسارات الصحة ============

@router.get('/groups/health')
async def health_check():
    """فحص صحة خدمة المجموعات"""
    return {
        "status": "healthy",
        "service": "groups-service",
        "version": "2.0.0"
    }
