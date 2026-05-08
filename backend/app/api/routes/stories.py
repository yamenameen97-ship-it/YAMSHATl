from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile, status

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user
from app.core.story_store import story_store
from app.models.user import User

router = APIRouter()


@router.get('/stories')
def get_stories(current_user: User = Depends(get_current_user)):
    return story_store.list_stories(viewer_username=current_user.username, viewer_user_id=current_user.id)


@router.get('/stories/highlights')
def get_highlights(current_user: User = Depends(get_current_user)):
    return story_store.get_highlights(current_user.id)


@router.get('/stories/archive')
def get_archive(current_user: User = Depends(get_current_user)):
    return story_store.get_archive(current_user.id)


@router.get('/stories/analytics/summary')
def get_story_analytics(current_user: User = Depends(get_current_user)):
    return story_store.analytics_summary(current_user.id)


@router.post('/add_story', status_code=status.HTTP_201_CREATED)
def add_story(
    file: UploadFile = File(...),
    caption: str = Form(default=''),
    privacy: str = Form(default='public'),
    music: str = Form(default=''),
    stickers: str = Form(default=''),
    mentions: str = Form(default=''),
    poll_question: str = Form(default=''),
    poll_options: str = Form(default=''),
    countdown_at: str = Form(default=''),
    filter_name: str = Form(default=''),
    drawing_data: str = Form(default=''),
    auto_delete_hours: int = Form(default=24),
    current_user: User = Depends(get_current_user),
):
    upload_result = save_upload(file)
    media_url = upload_result.get('file_url') or upload_result.get('url')
    if not media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Story media upload failed')
    return story_store.add_story(
        user_id=current_user.id,
        username=current_user.username,
        media_url=media_url,
        metadata={
            'caption': caption,
            'privacy': privacy,
            'music': music,
            'stickers': stickers,
            'mentions': mentions,
            'poll_question': poll_question,
            'poll_options': poll_options,
            'countdown_at': countdown_at,
            'filter_name': filter_name,
            'drawing_data': drawing_data,
            'auto_delete_hours': auto_delete_hours,
        },
    )


@router.post('/stories/{story_id}/view')
def view_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        return story_store.mark_seen(story_id, current_user.username)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/stories/{story_id}/react')
def react_story(story_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        return story_store.add_reaction(story_id, str(payload.get('emoji') or '🔥'), current_user.username)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/stories/{story_id}/reply')
def reply_story(story_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        return story_store.add_reply(story_id, current_user.username, str(payload.get('text') or ''))
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post('/stories/{story_id}/highlight')
def highlight_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        return story_store.toggle_highlight(story_id, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
