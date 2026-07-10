"""مسارات الستوري — v85.4 (تحديث v84.0).

كل عملية تُحفظ الآن مباشرة في قاعدة البيانات السحابية (Postgres).
- لا اعتماد على story_store.json (filesystem محلي غير ثابت على Render).
- المشاهدات والردود والتفاعلات والاستطلاعات و highlights كلها في جداول ORM.

v85.4 (تدقيق نظام الستوري — 5 نواقص جوهرية):
- ✅ POST /stories/purge_expired — كان موثّقاً لكنه غير مُطبَّق (endpoint 404).
- ✅ GET /stories/user/{user_id} — deep-link لقصص مستخدم محدد (كان مفقوداً).
- ✅ إشعار story:reaction — كان مفقوداً بينما story:reply/mention/new موجودة.
- ✅ إشعار story:poll_vote — عند تصويت أحدهم على استطلاعك.
- (النقص #4 و #5 خارج هذا الملف: schedule + frontend avatars)

v84.0:
- 403 عند محاولة مشاهدة/تفاعل مع قصة من محظور (UserBlock).
- avatar_url وuser_avatar في الردود.

توافق خلفي كامل مع الواجهة الحالية (نفس أسماء الحقول في الرد).
"""
from typing import Optional

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.routes.upload import save_upload
from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services import story_db_service as story_svc

# v85.4 — استيراد مهمة تنظيف الخلفية (backup path لـ admin trigger)
try:
    from app.services.background_tasks import purge_expired_stories_once as _purge_stories_task  # type: ignore
except Exception:  # pragma: no cover
    _purge_stories_task = None

# Hook اختياري لإشعارات الـ WebSocket / الإشعارات الداخلية
try:
    from app.core import notifications as _notifications_module  # type: ignore
except Exception:  # pragma: no cover
    _notifications_module = None

# v87.0 — نظام الإشعارات الذكي الموحّد (يحفظ في DB + WebSocket + Push)
try:
    from app.services.notification_service import create_and_send_notification as _persist_notif
except Exception:  # pragma: no cover
    async def _persist_notif(*_args, **_kwargs):  # type: ignore[override]
        return None

router = APIRouter()


_STORY_EVENT_TO_TYPE = {
    'story:mention': 'STORY_MENTION',
    'story:new': None,  # إشعار عام للمتابعين — لا يوجد مستلم محدد (broadcast)
    'story:reaction': 'STORY_LIKE',
    'story:reply': 'STORY_REPLY',
    'story:poll_vote': 'STORY_POLL_VOTE',
}


def _emit_notification(event: str, payload: dict) -> None:
    """v87.0: يحفظ الإشعار في DB + يبثّه WebSocket + Push تلقائياً.

    يحدّد مستلم الإشعار من payload — يدعم:
      * owner_id      — لمالك القصة (reaction/reply/poll_vote)
      * mentioned_username — لمن تم ذكره (mention)
    """
    # محاولة broadcast داخلي إذا كان الموديول موجوداً (اختياري)
    if _notifications_module is not None:
        try:
            send = (
                getattr(_notifications_module, 'broadcast_event', None)
                or getattr(_notifications_module, 'emit', None)
                or getattr(_notifications_module, 'send_notification', None)
            )
            if callable(send):
                send(event, payload)
        except Exception:
            pass

    # v87.0 — حفظ الإشعار في DB وبثّه لحظياً
    notif_type = _STORY_EVENT_TO_TYPE.get(event)
    if not notif_type:
        return  # story:new = broadcast فقط — لا إشعار مخصص لمستلم محدد

    try:
        # تحديد مستلم الإشعار
        recipient_id = None
        if notif_type == 'STORY_MENTION':
            # نحتاج جلب user_id من mentioned_username — لكن ليس لدينا db هنا.
            # لذلك نتخطّى STORY_MENTION هنا — ويتم معالجته في موقع الاستدعاء (يدوياً أدناه)
            return
        recipient_id = payload.get('owner_id')
        if not recipient_id:
            return

        # في event loop الحالي — نحتاج db session جديدة (لأن هذه دالة متزامنة)
        from app.db.session import SessionLocal
        import asyncio

        async def _run():
            db_local = SessionLocal()
            try:
                await _persist_notif(
                    db=db_local,
                    user_id=int(recipient_id),
                    notification_type=notif_type,
                    data={
                        **payload,
                        'from_user_id': payload.get('from_user_id'),
                        'username': payload.get('from_username'),
                    },
                )
            finally:
                db_local.close()

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(_run())
                return
        except RuntimeError:
            pass
        asyncio.run(_run())
    except Exception:
        return


def _parse_story_id(story_id: str) -> int:
    try:
        return int(str(story_id).strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='invalid story id',
        ) from exc


# ============================== قائمة القصص ==============================
@router.get('/stories')
def get_stories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """قصص الأصدقاء فقط (مسار مسطّح للتوافق الخلفي)."""
    return story_svc.list_stories(db, viewer_user_id=current_user.id)


@router.get('/stories/grouped')
def get_stories_grouped(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """قصص مجمّعة حسب المستخدم — للشريط الدائري."""
    return story_svc.list_grouped_stories(
        db,
        viewer_user_id=current_user.id,
        viewer_username=current_user.username,
    )


@router.get('/stories/highlights')
def get_highlights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return story_svc.get_highlights(db, current_user.id)


@router.get('/stories/archive')
def get_archive(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return story_svc.get_archive(db, current_user.id)


@router.get('/stories/analytics/summary')
def get_story_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return story_svc.analytics_summary(db, current_user.id)


# ============================== قصة واحدة ==============================
@router.get('/stories/{story_id}')
def get_single_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """جلب قصة واحدة — جديد في v83.9 (كان مفقوداً)."""
    sid = _parse_story_id(story_id)
    try:
        return story_svc.get_story(db, sid, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


# ============================== نشر قصة ==============================
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
    db: Session = Depends(get_db),
):
    upload_result = save_upload(file)
    media_url = upload_result.get('file_url') or upload_result.get('url')
    if not media_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Story media upload failed',
        )

    resolved_privacy = 'close_friends' if is_close_friends else (privacy or 'friends')
    if resolved_privacy == 'public':
        resolved_privacy = 'friends'

    story = story_svc.add_story(
        db,
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
    result = story_svc.serialize_story(db, story, viewer_user_id=current_user.id)

    # v87.0 — إشعارات mentions داخل الستوري (مع حفظ في DB)
    try:
        from sqlalchemy import func as _sqlfunc
        from app.services.notification_service import notify as _notify
        seen_mention_ids: set[int] = set()
        for mention in result.get('mentions', []) or []:
            mention_clean = str(mention or '').strip().lstrip('@').lower()
            if not mention_clean:
                continue
            mentioned_user = (
                db.query(User)
                .filter(_sqlfunc.lower(User.username) == mention_clean)
                .first()
            )
            if mentioned_user is None:
                continue
            if int(mentioned_user.id) == int(current_user.id):
                continue
            if int(mentioned_user.id) in seen_mention_ids:
                continue
            seen_mention_ids.add(int(mentioned_user.id))
            _notify(
                db,
                user_id=int(mentioned_user.id),
                notification_type='STORY_MENTION',
                data={
                    'story_id': result['id'],
                    'from_user_id': int(current_user.id),
                    'username': current_user.username,
                    'owner_id': int(current_user.id),
                    'actor_avatar': getattr(current_user, 'avatar', None) or getattr(current_user, 'avatar_url', None),
                },
            )
    except Exception:
        pass

    # broadcast عام (لا يلزم إشعار في DB — يصل للمتابعين عبر fanout خارجي)
    _emit_notification('story:new', {
        'story_id': result['id'],
        'owner_id': current_user.id,
        'owner_username': current_user.username,
        'privacy': result.get('privacy'),
    })
    return result


# ============================== تفاعلات ==============================
@router.post('/stories/{story_id}/view')
def view_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        return story_svc.mark_seen(db, sid, current_user.id, current_user.username)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:  # v84.0 — محظور
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/react')
def react_story(
    story_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        emoji = str(payload.get('emoji') or '🔥')
        result = story_svc.add_reaction(
            db, sid, emoji, current_user.id, current_user.username,
        )
        # ✅ v85.4 FIX #3: إشعار مالك القصة عند التفاعل
        # سابقاً: story:reply و story:mention و story:new تُرسل إشعارات،
        # أما التفاعل (react) فلا يُرسل شيئاً → صاحب القصة يفقد كل تفاعلاته!
        owner_id = int(result.get('user_id') or 0)
        if owner_id and owner_id != current_user.id:
            _emit_notification('story:reaction', {
                'story_id': str(sid),
                'owner_id': owner_id,
                'from_user_id': current_user.id,
                'from_username': current_user.username,
                'emoji': emoji,
            })
        return result
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:  # v84.0 — محظور
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/reply')
def reply_story(
    story_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        result = story_svc.add_reply(
            db, sid, current_user.id, current_user.username,
            str(payload.get('text') or ''),
        )
        _emit_notification('story:reply', {
            'story_id': str(sid),
            'from_username': current_user.username,
            'from_user_id': current_user.id,
        })
        return result
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:  # v84.0 — محظور
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post('/stories/{story_id}/poll/vote')
def vote_story_poll(
    story_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        option_idx = int(payload.get('option_index') or 0)
        result = story_svc.vote_poll(
            db, sid, option_idx, current_user.id, current_user.username,
        )
        # ✅ v85.4 FIX #3 (bonus): إشعار بتصويت الاستطلاع أيضاً
        owner_id = int(result.get('user_id') or 0)
        if owner_id and owner_id != current_user.id:
            _emit_notification('story:poll_vote', {
                'story_id': str(sid),
                'owner_id': owner_id,
                'from_user_id': current_user.id,
                'from_username': current_user.username,
                'option_index': option_idx,
            })
        return result
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:  # v84.0 — محظور
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ============================== v85.4 — قصص مستخدم محدد ==============================
@router.get('/stories/user/{user_id}')
def get_user_stories(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """جلب قصص مستخدم محدد (deep-link من ملفه التعريفي).

    ✅ v85.4 FIX #5: كان هذا الـ endpoint مفقوداً — لا يمكن فتح قصص
    شخص من صفحته الشخصية إلا بتحميل كل الشريط ثم البحث.
    - يحترم الخصوصية (friends/close_friends/private) والحظر المتبادل.
    - يرجع نفس بنية عنصر group لسهولة الاستخدام مع StoryViewerEnhanced.
    """
    try:
        target_id = int(str(user_id).strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='invalid user id',
        ) from exc
    try:
        return story_svc.list_user_stories(
            db,
            target_user_id=target_id,
            viewer_user_id=current_user.id,
            viewer_username=current_user.username,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


# ============================== حذف / Highlights ==============================
@router.delete('/stories/{story_id}')
def delete_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        return story_svc.delete_story(db, sid, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/highlight')
def highlight_story(
    story_id: str,
    payload: Optional[dict] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    title = ''
    if isinstance(payload, dict):
        title = str(payload.get('title') or '').strip()
    try:
        return story_svc.toggle_highlight(db, sid, current_user.id, title=title)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.post('/stories/{story_id}/highlight/title')
def rename_highlight(
    story_id: str,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        return story_svc.set_highlight_title(
            db, sid, current_user.id, str(payload.get('title') or ''),
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.get('/stories/{story_id}/viewers')
def get_story_viewers(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sid = _parse_story_id(story_id)
    try:
        return story_svc.get_viewers(db, sid, current_user.id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


# ============================== v85.4 — Admin: تنظيف يدوي ==============================
@router.post('/stories/purge_expired')
def purge_expired_stories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """تشغيل يدوي لتنظيف القصص المنتهية (admin فقط).

    ✅ v85.4 FIX #2: كان هذا الـ endpoint موثقاً في docstring لكنه
    غير مُطبَّق أبداً (404 Not Found). أضفناه الآن مع فحص صلاحيات صارم.

    يستدعي story_db_service.purge_expired مباشرة (وليس task background)،
    ويعيد عدد القصص المحذوفة فوراً.
    """
    role = str(getattr(current_user, 'role', '') or '').lower()
    if role not in ('admin', 'superadmin', 'moderator'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin privileges required',
        )
    try:
        deleted = story_svc.purge_expired(db)
        return {'ok': True, 'deleted': int(deleted or 0)}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Purge failed: {exc}',
        ) from exc
