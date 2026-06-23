"""مسارات الستوري — نظام محسّن v59.1.

التغييرات الجوهرية:
- الستوريات لم تعد عامة. كل قصة مرئية فقط لأصدقاء صاحبها (أو الأصدقاء المقربين).
- يتم تحميل قائمة أصدقاء المستخدم الحالي وحقنها في story_store قبل الإرجاع.
- مسار /stories/grouped يعيد القصص مجمّعة حسب المستخدم لاستخدامها في الشريط الدائري.
"""
from typing import Optional

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user, get_db
from app.core.story_store import story_store
from app.models.user import User

try:
    from app.models.friendship import Friendship, FRIENDSHIP_STATUS_ACCEPTED
except Exception:  # pragma: no cover
    Friendship = None  # type: ignore[assignment]
    FRIENDSHIP_STATUS_ACCEPTED = 'accepted'

try:
    from app.models.close_friend import CloseFriend  # type: ignore
except Exception:  # pragma: no cover
    CloseFriend = None  # type: ignore[assignment]

router = APIRouter()


# ============================== أدوات مساعدة ==============================
def _load_friend_ids(db: Session, user_id: int) -> list[int]:
    """يحمّل أصدقاء المستخدم المقبولين فقط (علاقة ثنائية)."""
    if Friendship is None:
        return []
    rows = (
        db.query(Friendship)
        .filter(
            and_(
                Friendship.status == FRIENDSHIP_STATUS_ACCEPTED,
                or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
            )
        )
        .all()
    )
    ids: set[int] = set()
    for row in rows:
        other = row.addressee_id if row.requester_id == user_id else row.requester_id
        if other and other != user_id:
            ids.add(int(other))
    return list(ids)


def _load_close_friend_ids(db: Session, user_id: int) -> list[int]:
    """يحمّل قائمة الأصدقاء المقربين (Close Friends) إن وُجد الجدول."""
    if CloseFriend is None:
        return []
    try:
        rows = db.query(CloseFriend).filter(CloseFriend.owner_id == user_id).all()
        return [int(r.friend_id) for r in rows if getattr(r, 'friend_id', None)]
    except Exception:
        return []


# ============================== المسارات ==============================
@router.get('/stories')
def get_stories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """قصص الأصدقاء فقط (مسار مسطّح للتوافق الخلفي)."""
    friend_ids = _load_friend_ids(db, current_user.id)
    close_ids = _load_close_friend_ids(db, current_user.id)
    return story_store.list_stories(
        viewer_username=current_user.username,
        viewer_user_id=current_user.id,
        friend_ids=friend_ids,
        close_friend_ids=close_ids,
    )


@router.get('/stories/grouped')
def get_stories_grouped(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """قصص مجمّعة حسب المستخدم — لاستخدامها في الشريط الدائري تحت الهيدر."""
    friend_ids = _load_friend_ids(db, current_user.id)
    close_ids = _load_close_friend_ids(db, current_user.id)
    return story_store.list_grouped_stories(
        viewer_username=current_user.username,
        viewer_user_id=current_user.id,
        friend_ids=friend_ids,
        close_friend_ids=close_ids,
    )


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
    privacy: str = Form(default='friends'),  # افتراضي: الأصدقاء فقط
    music: str = Form(default=''),
    stickers: str = Form(default=''),
    mentions: str = Form(default=''),
    poll_question: str = Form(default=''),
    poll_options: str = Form(default=''),
    countdown_at: str = Form(default=''),
    filter_name: str = Form(default=''),
    filter: str = Form(default=''),
    drawing_data: str = Form(default=''),
    is_close_friends: bool = Form(default=False),
    auto_delete_hours: int = Form(default=24),
    current_user: User = Depends(get_current_user),
):
    upload_result = save_upload(file)
    media_url = upload_result.get('file_url') or upload_result.get('url')
    if not media_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Story media upload failed')

    # تطبيق السياسة: لا قصص عامة. أي محاولة لرفع public تحوَّل إلى friends.
    resolved_privacy = 'close_friends' if is_close_friends else (privacy or 'friends')
    if resolved_privacy == 'public':
        resolved_privacy = 'friends'

    return story_store.add_story(
        user_id=current_user.id,
        username=current_user.username,
        media_url=media_url,
        metadata={
            'caption': caption,
            'privacy': resolved_privacy,
            'music': music,
            'stickers': stickers,
            'mentions': mentions,
            'poll_question': poll_question,
            'poll_options': poll_options,
            'countdown_at': countdown_at,
            'filter_name': filter_name or filter,
            'drawing_data': drawing_data,
            'auto_delete_hours': auto_delete_hours,
            'is_close_friends': bool(is_close_friends),
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


@router.delete('/stories/{story_id}')
def delete_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        return story_store.delete_story(story_id, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/highlight')
def highlight_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        return story_store.toggle_highlight(story_id, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
