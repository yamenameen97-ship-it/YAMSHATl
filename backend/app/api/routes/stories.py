"""مسارات الستوري — نظام محسّن v59.10.

التغييرات في v59.10:
- إضافة `/stories/{story_id}/viewers` لقائمة من شاهد قصتي (للمالك فقط).
- إضافة `/stories/{story_id}/poll/vote` للتصويت على استطلاع داخل القصة.
- إضافة `/stories/{story_id}/highlight/title` لتسمية قصة مميزة.
- بث WebSocket عند نشر قصة جديدة لتنبيه الأصدقاء فوراً.
- إشعار المستخدمين المذكورين في القصة (mentions).
- تمرير viewer_user_id لـ mark_seen حتى لا يُحسب المالك مشاهداً لقصته.
- المسار `add_story` يستخدم الآن نفس story_store.add_story (تم تحديثه).
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

# Hook اختياري لإشعارات الـ WebSocket / الإشعارات الداخلية
try:
    from app.core import notifications as _notifications_module  # type: ignore
except Exception:  # pragma: no cover
    _notifications_module = None

router = APIRouter()


# ============================== أدوات مساعدة ==============================
def _load_friend_ids(db: Session, user_id: int) -> list[int]:
    """يحمّل أصدقاء المستخدم المقبولين فقط (علاقة ثنائية)."""
    if Friendship is None:
        return []
    try:
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
    except Exception:
        return []
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


def _emit_notification(event: str, payload: dict) -> None:
    """يحاول استخدام موديول الإشعارات إن وُجد — صامت عند الفشل."""
    if _notifications_module is None:
        return
    try:
        # محاولة استدعاء أحد الأشكال الشائعة للأكواد الحالية
        send = getattr(_notifications_module, 'broadcast_event', None) \
            or getattr(_notifications_module, 'emit', None) \
            or getattr(_notifications_module, 'send_notification', None)
        if callable(send):
            send(event, payload)
    except Exception:
        return


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
    """قصص مجمّعة حسب المستخدم — لاستخدامها في الشريط الدائري."""
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
    privacy: str = Form(default='friends'),
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

    # ربط hooks للإشعارات (يُعاد تركيبها في كل طلب — رخيص جداً)
    story_store.set_mention_hook(lambda payload: _emit_notification('story:mention', payload))
    story_store.set_new_story_hook(lambda payload: _emit_notification('story:new', payload))

    result = story_store.add_story(
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
    return result


@router.post('/stories/{story_id}/view')
def view_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        return story_store.mark_seen(story_id, current_user.username, viewer_user_id=current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/stories/{story_id}/react')
def react_story(story_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        return story_store.add_reaction(
            story_id,
            str(payload.get('emoji') or '🔥'),
            current_user.username,
            viewer_user_id=current_user.id,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/stories/{story_id}/reply')
def reply_story(story_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    try:
        result = story_store.add_reply(story_id, current_user.username, str(payload.get('text') or ''))
        # إشعار صاحب القصة بالرد (إن أمكن)
        _emit_notification('story:reply', {
            'story_id': story_id,
            'from_username': current_user.username,
            'from_user_id': current_user.id,
        })
        return result
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post('/stories/{story_id}/poll/vote')
def vote_story_poll(story_id: str, payload: dict = Body(...), current_user: User = Depends(get_current_user)):
    """تصويت على استطلاع داخل قصة."""
    try:
        return story_store.vote_poll(
            story_id,
            int(payload.get('option_index') or 0),
            current_user.username,
        )
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
def highlight_story(
    story_id: str,
    payload: Optional[dict] = Body(default=None),
    current_user: User = Depends(get_current_user),
):
    """تبديل حالة highlight (مع عنوان اختياري)."""
    title = ''
    if isinstance(payload, dict):
        title = str(payload.get('title') or '').strip()
    try:
        return story_store.toggle_highlight(story_id, current_user.id, title=title)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/highlight/title')
def rename_highlight(
    story_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
):
    """تسمية highlight (يحوّل القصة إلى highlight ضمنياً)."""
    try:
        return story_store.set_highlight_title(story_id, current_user.id, str(payload.get('title') or ''))
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get('/stories/{story_id}/viewers')
def get_story_viewers(story_id: str, current_user: User = Depends(get_current_user)):
    """قائمة من شاهد قصة معينة — للمالك فقط."""
    try:
        return story_store.get_viewers(story_id, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
