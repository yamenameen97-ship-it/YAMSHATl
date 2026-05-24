from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.core.group_store import GroupRole, group_store
from app.models.user import User

router = APIRouter()


@router.get('/groups')
def list_groups(current_user: User = Depends(get_current_user)):
    _ = current_user
    return group_store.list_groups()


@router.post('/groups', status_code=status.HTTP_201_CREATED)
def create_group(payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    members = payload.get('members') or []
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Group name is required')
    return group_store.create_group(
        current_user.username,
        name,
        description,
        members,
        is_private=bool(payload.get('is_private', False)),
        allow_member_invites=bool(payload.get('allow_member_invites', True)),
        requires_join_approval=payload.get('requires_join_approval'),
    )


@router.get('/groups/{group_id}')
def get_group_details(group_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return group_store.serialize_group(group)


@router.post('/groups/{group_id}/join')
def join_group(group_id: str, current_user: User = Depends(get_current_user)):
    result = group_store.join_group(group_id, current_user.username)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return result


@router.post('/groups/{group_id}/join-request')
def request_join_group(group_id: str, payload: dict = Body(default={}), current_user: User = Depends(get_current_user)):
    result = group_store.request_join(group_id, current_user.username, str(payload.get('note') or '').strip())
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return result


@router.get('/groups/{group_id}/join-requests')
def get_group_join_requests(group_id: str, current_user: User = Depends(get_current_user)):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(current_user.username)
    if not member or member.role not in {GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    return group_store.list_join_requests(group_id)


@router.post('/groups/{group_id}/join-requests/{request_id}')
def review_join_request(group_id: str, request_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    approve = bool(payload.get('approve', False))
    result = group_store.review_join_request(group_id, current_user.username, request_id, approve)
    if result is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unable to review request')
    return result


@router.patch('/groups/{group_id}/members/{target_username}/role')
def update_member_role(group_id: str, target_username: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    new_role = payload.get('role')
    if new_role not in [role.value for role in GroupRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid role')
    success = group_store.update_member_role(group_id, current_user.username, target_username, GroupRole(new_role))
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied or user not found')
    return {'status': 'success', 'message': f'Role updated to {new_role}'}


@router.patch('/groups/{group_id}/members/{target_username}/permissions')
def update_member_permissions(group_id: str, target_username: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    permissions = payload.get('permissions') or []
    if not isinstance(permissions, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Permissions must be a list')
    success = group_store.update_member_permissions(group_id, current_user.username, target_username, permissions)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission update failed')
    return {'status': 'success', 'username': target_username, 'permissions': permissions}


@router.post('/groups/{group_id}/invite')
def invite_to_group(group_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    invitee = str(payload.get('username') or '').strip()
    if not invitee:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username is required')
    result = group_store.invite_user(group_id, current_user.username, invitee)
    if not result:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Failed to send invite')
    return result


@router.get('/groups/{group_id}/invites')
def get_group_invites(group_id: str, current_user: User = Depends(get_current_user)):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(current_user.username)
    if not member or member.role not in {GroupRole.OWNER, GroupRole.ADMIN, GroupRole.MODERATOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    return group_store.list_invites(group_id)


@router.get('/groups/{group_id}/audit-logs')
def get_group_audit_logs(group_id: str, current_user: User = Depends(get_current_user)):
    group = group_store.get_group(group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    member = group.members.get(current_user.username)
    if not member or member.role not in {GroupRole.OWNER, GroupRole.ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Permission denied')
    return group.audit_logs


@router.post('/groups/{group_id}/moderate')
def moderate_group_user(group_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    target = str(payload.get('username') or '').strip()
    action = str(payload.get('action') or '').strip()
    duration = payload.get('duration_mins')
    if not target or action not in {'mute', 'unmute', 'kick', 'ban'}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid moderation request')
    success = group_store.moderate_user(group_id, current_user.username, target, action, duration)
    if not success:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Moderation failed or permission denied')
    return {'status': 'success', 'message': f'User {target} {action}ed'}


@router.get('/groups/{group_id}/pinned-messages')
def get_pinned_messages(group_id: str, current_user: User = Depends(get_current_user)):
    _ = current_user
    result = group_store.list_pinned_messages(group_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return result


@router.post('/groups/{group_id}/pinned-messages')
def pin_group_message(group_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    text = str(payload.get('text') or '').strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Message text is required')
    result = group_store.pin_message(group_id, current_user.username, text)
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Pinning message failed')
    return result
