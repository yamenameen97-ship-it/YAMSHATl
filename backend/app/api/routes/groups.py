from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.core.group_store import group_store
from app.models.user import User

router = APIRouter()


@router.get('/groups')
def list_groups(current_user: User = Depends(get_current_user)):
    _ = current_user
    return group_store.list_groups()


@router.post('/groups', status_code=status.HTTP_201_CREATED)
def create_group(payload: dict, current_user: User = Depends(get_current_user)):
    name = str(payload.get('name') or '').strip()
    description = str(payload.get('description') or '').strip()
    members = payload.get('members') or []
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Group name is required')
    if not isinstance(members, list):
        members = []
    members = [str(member).strip() for member in members if str(member).strip()]
    return group_store.create_group(current_user.username, name, description, members)


@router.post('/groups/{group_id}/join')
def join_group(group_id: str, current_user: User = Depends(get_current_user)):
    result = group_store.join_group(group_id, current_user.username)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Group not found')
    return result
