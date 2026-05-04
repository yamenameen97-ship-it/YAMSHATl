from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user
from app.core.story_store import story_store
from app.models.user import User

router = APIRouter()


@router.get('/stories')
def get_stories(current_user: User = Depends(get_current_user)):
    _ = current_user
    return story_store.list_stories()


@router.post('/add_story', status_code=status.HTTP_201_CREATED)
def add_story(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    upload_result = save_upload(file)
    media_url = upload_result.get('file_url') or upload_result.get('url')
    if not media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Story media upload failed')
    return story_store.add_story(
        user_id=current_user.id,
        username=current_user.username,
        media_url=media_url,
    )
