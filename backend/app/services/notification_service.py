"""نظام إشعارات ذكي موحّد — v87.0.

يُنشئ هذا الملف الإشعار في قاعدة البيانات ثم يبثّه لحظياً عبر
WebSocket (socket_manager + socket_server) ويرسل Push Notification
عبر FCM إذا كان الجهاز غير متصل. كل شيء يمر عبر
`create_and_send_notification` — نقطة دخول واحدة.

يدعم جميع أنواع التفاعلات الاجتماعية:
- POST_LIKE          — شخص أعجب بمنشورك
- POST_COMMENT       — شخص علّق على منشورك
- POST_MENTION       — شخص ذكرك في منشور
- POST_SHARE         — شخص شارك منشوراً معك
- COMMENT_LIKE       — شخص أعجب بتعليقك
- COMMENT_REPLY      — شخص رد على تعليقك
- COMMENT_MENTION    — شخص ذكرك في تعليق
- REEL_LIKE          — شخص أعجب بالريلز الخاص بك
- REEL_COMMENT       — شخص علّق على الريلز الخاص بك
- REEL_MENTION       — شخص ذكرك في تعليق ريلز
- STORY_LIKE         — شخص أعجب بالستوري تبعك (تفاعل/emoji)
- STORY_REPLY        — شخص رد على ستوريك
- STORY_MENTION      — شخص ذكرك في ستوري
- STORY_POLL_VOTE    — شخص صوّت على استطلاع ستوريك
- FOLLOW             — متابع جديد
- FRIEND_REQUEST     — طلب صداقة
- FRIEND_ACCEPTED    — قُبِل طلب صداقتك
"""
from urllib.parse import quote

from sqlalchemy.orm import Session

from app.core.socket_manager import manager
from app.core.socket_server import emit_user_event, is_user_online
from app.models.notification import Notification
from app.models.user import User
from app.services.push_service import send_push_notification


# ================================================================
# قوالب النصوص (title + body) لكل نوع إشعار
# ----------------------------------------------------------------
# ملاحظات:
#  • جميع القوالب تُدرج اسم الفاعل ديناميكياً (data['username'] أو
#    data['from_username']) لتلبية طلب المستخدم: "يذكر اسمه".
#  • عند غياب الاسم نستخدم fallback آمن "شخص ما" حتى لا يظهر النص فارغاً.
# ================================================================

def _actor_name(data: dict) -> str:
    """استخراج اسم الفاعل بشكل موحّد من data."""
    for key in ('username', 'from_username', 'actor_username', 'actor_name', 'name'):
        value = data.get(key) if data else None
        if value:
            return str(value).strip()
    return 'شخص ما'


def _notification_copy(notification_type: str, data: dict) -> tuple[str, str]:
    """يعيد (title, body) بحسب نوع الإشعار — مع ذكر اسم الفاعل صراحة."""
    data = data or {}
    name = _actor_name(data)
    ntype = (notification_type or '').upper()

    # --- منشورات (Posts) ---
    if ntype in ('POST_LIKE', 'LIKE', 'NEW_LIKE'):
        return 'إعجاب جديد ❤️', f'{name} أعجب بمنشورك'
    if ntype in ('POST_COMMENT', 'COMMENT', 'NEW_COMMENT'):
        preview = str(data.get('preview') or data.get('content') or '').strip()
        if preview:
            preview = preview[:60] + ('…' if len(preview) > 60 else '')
            return 'تعليق جديد 💬', f'{name} علّق على منشورك: {preview}'
        return 'تعليق جديد 💬', f'{name} علّق على منشورك'
    if ntype in ('POST_MENTION', 'MENTION'):
        return 'تم ذكرك ✨', f'{name} ذكرك في منشور'
    if ntype in ('POST_SHARE', 'SHARE'):
        return 'مشاركة جديدة 🔁', f'{name} شارك منشوراً معك'

    # --- تعليقات (Comments) ---
    if ntype in ('COMMENT_LIKE',):
        return 'إعجاب بتعليقك ❤️', f'{name} أعجب بتعليقك'
    if ntype in ('COMMENT_REPLY',):
        preview = str(data.get('preview') or data.get('content') or '').strip()
        if preview:
            preview = preview[:60] + ('…' if len(preview) > 60 else '')
            return 'رد جديد 💬', f'{name} رد على تعليقك: {preview}'
        return 'رد جديد 💬', f'{name} رد على تعليقك'
    if ntype in ('COMMENT_MENTION',):
        return 'تم ذكرك ✨', f'{name} ذكرك في تعليق'

    # --- ريلز (Reels) ---
    if ntype in ('REEL_LIKE',):
        return 'إعجاب على الريلز 🎬', f'{name} أعجب بالريلز الخاص بك'
    if ntype in ('REEL_COMMENT',):
        preview = str(data.get('preview') or data.get('content') or '').strip()
        if preview:
            preview = preview[:60] + ('…' if len(preview) > 60 else '')
            return 'تعليق على الريلز 💬', f'{name} علّق على الريلز الخاص بك: {preview}'
        return 'تعليق على الريلز 💬', f'{name} علّق على الريلز الخاص بك'
    if ntype in ('REEL_MENTION',):
        return 'تم ذكرك في ريلز ✨', f'{name} ذكرك في تعليق ريلز'

    # --- ستوري (Stories) ---
    if ntype in ('STORY_LIKE', 'STORY_REACTION'):
        emoji = str(data.get('emoji') or '❤️').strip() or '❤️'
        return f'تفاعل على ستوريك {emoji}', f'{name} أعجب بالستوري تبعك'
    if ntype in ('STORY_REPLY',):
        preview = str(data.get('preview') or data.get('text') or '').strip()
        if preview:
            preview = preview[:60] + ('…' if len(preview) > 60 else '')
            return 'رد على ستوريك 💬', f'{name} رد على ستوريك: {preview}'
        return 'رد على ستوريك 💬', f'{name} رد على ستوريك'
    if ntype in ('STORY_MENTION',):
        return 'تم ذكرك في ستوري ✨', f'{name} ذكرك في ستوري'
    if ntype in ('STORY_POLL_VOTE',):
        return 'تصويت على استطلاعك 📊', f'{name} صوّت على استطلاع ستوريك'

    # --- علاقات (Follow / Friends) ---
    if ntype == 'FOLLOW':
        return 'متابع جديد 🔥', f'{name} قام بمتابعتك'
    if ntype == 'FRIEND_REQUEST':
        return 'طلب صداقة 🤝', f'{name} أرسل إليك طلب صداقة'
    if ntype == 'FRIEND_ACCEPTED':
        return 'تم قبول الصداقة ✅', f'{name} قبل طلب صداقتك'

    # --- افتراضي ---
    return 'إشعار جديد', data.get('body') or data.get('message') or 'لديك إشعار جديد'


def _notification_route(notification_type: str, data: dict) -> tuple[str, str]:
    """يعيد (screen, path) للتنقل داخل التطبيق عند النقر على الإشعار."""
    data = data or {}
    ntype = (notification_type or '').upper()

    # منشورات
    if ntype in ('POST_LIKE', 'LIKE', 'NEW_LIKE',
                 'POST_COMMENT', 'COMMENT', 'NEW_COMMENT',
                 'POST_MENTION', 'MENTION', 'POST_SHARE', 'SHARE'):
        post_id = data.get('post_id') or data.get('related_post_id')
        if post_id:
            return 'post', f'/post/{post_id}'
        return 'notifications', '/notifications'

    # تعليقات
    if ntype in ('COMMENT_LIKE', 'COMMENT_REPLY', 'COMMENT_MENTION'):
        post_id = data.get('post_id') or data.get('related_post_id')
        comment_id = data.get('comment_id')
        if post_id:
            suffix = f'#comment-{comment_id}' if comment_id else ''
            return 'post', f'/post/{post_id}{suffix}'
        return 'notifications', '/notifications'

    # ريلز
    if ntype in ('REEL_LIKE', 'REEL_COMMENT', 'REEL_MENTION'):
        reel_id = data.get('reel_id')
        if reel_id:
            return 'reel', f'/reels/{reel_id}'
        return 'reels', '/reels'

    # ستوري
    if ntype in ('STORY_LIKE', 'STORY_REACTION', 'STORY_REPLY',
                 'STORY_MENTION', 'STORY_POLL_VOTE'):
        story_id = data.get('story_id')
        if story_id:
            return 'story', f'/stories/{story_id}'
        return 'stories', '/stories'

    # علاقات
    if ntype in ('FOLLOW', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED'):
        username = str(data.get('username') or data.get('from_username') or '').strip()
        if username:
            return 'profile', f'/profile/{quote(username)}'
        if ntype == 'FRIEND_REQUEST':
            return 'friends', '/friends/requests'
        return 'profile', '/profile'

    screen = str(data.get('screen') or 'notifications').strip() or 'notifications'
    path = str(data.get('path') or '/notifications').strip() or '/notifications'
    if not path.startswith('/'):
        path = f'/{path}'
    return screen, path


async def increment_unread_counter(user_id: int):
    """زيادة عداد الإشعارات غير المقروءة في Redis (placeholder)."""
    # Placeholder for Redis increment logic
    pass


async def create_and_send_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    data: dict,
) -> Notification | None:
    """إنشاء إشعار + بثّه لحظياً + Push إن لزم.

    يحمي نفسه من:
      • user_id غير صالح (< 1).
      • إرسال إشعار للمستخدم نفسه (self-notification) — يُتجاهل.
      • فشل WebSocket أو Push (يُلتقط ولا يفشل الطلب).
    """
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    if user_id < 1:
        return None

    data = dict(data or {})

    # منع إرسال إشعار للمستخدم نفسه على أفعاله
    actor_id = data.get('from_user_id') or data.get('actor_id')
    try:
        if actor_id is not None and int(actor_id) == user_id:
            return None
    except (TypeError, ValueError):
        pass

    # إذا لم يُمرّر username لكن لدينا actor_id — نحاول جلبه
    if not data.get('username') and not data.get('from_username') and actor_id:
        try:
            actor_user = db.query(User).filter(User.id == int(actor_id)).first()
            if actor_user:
                data.setdefault('username', actor_user.username)
                data.setdefault('actor_avatar', getattr(actor_user, 'avatar', None) or getattr(actor_user, 'avatar_url', None))
        except Exception:
            pass

    title, body = _notification_copy(notification_type, data)
    screen, path = _notification_route(notification_type, data)

    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        body=body,
        data={
            **data,
            'screen': screen,
            'path': path,
        },
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    live_item = {
        'id': notification.id,
        'notification_type': notification.type,
        'type': notification.type,
        'title': notification.title,
        'message': notification.body,
        'text': notification.body,
        'body': notification.body,
        'is_read': notification.is_read,
        'seen': notification.is_read,
        'created_at': notification.created_at.isoformat(),
        'payload': notification.data,
        'data': notification.data,
        'screen': screen,
        'path': path,
    }
    realtime_payload = {
        'type': 'notification',
        'data': live_item,
    }
    try:
        await manager.send_to_user(user_id, realtime_payload)
    except Exception:
        pass
    try:
        await emit_user_event(user_id, 'new_notification', live_item)
    except Exception:
        pass
    try:
        await increment_unread_counter(user_id)
    except Exception:
        pass

    # Push Notification فقط إذا كان المستخدم غير متصل
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user and getattr(user, 'fcm_token', None):
            online = False
            try:
                online = bool(manager.is_online(user_id) or is_user_online(user_id=user_id))
            except Exception:
                online = False
            if not online:
                send_push_notification(
                    token=user.fcm_token,
                    title=title,
                    body=body,
                    data={
                        'type': notification_type,
                        'notification_id': notification.id,
                        'title': title,
                        'body': body,
                        'screen': screen,
                        'path': path,
                        **data,
                    },
                )
    except Exception:
        pass

    return notification


# ================================================================
# Helper متزامن (sync) — للاستخدام من خدمات غير async مثل post_service
# ----------------------------------------------------------------
# يحاول ضخّ الـ coroutine داخل event loop حالي إن وُجد، وإلا يشغّله
# في loop جديد. مصمَّم ألّا يكسر الطلب مهما فشل.
# ================================================================

def notify(
    db: Session,
    user_id: int,
    notification_type: str,
    data: dict | None = None,
) -> None:
    """واجهة متزامنة آمنة لإرسال إشعار من داخل خدمات sync."""
    import asyncio
    try:
        coro = create_and_send_notification(
            db=db,
            user_id=user_id,
            notification_type=notification_type,
            data=data or {},
        )
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(coro)
                return
        except RuntimeError:
            pass
        asyncio.run(coro)
    except Exception:
        # لا نُفشل الطلب إن سقطت الإشعارات
        return
