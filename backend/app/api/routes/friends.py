"""نظام طلبات الصداقة الكامل.

يوفر:
- إرسال طلب صداقة / إلغاء الطلب
- قبول أو رفض الطلبات الواردة
- قائمة الأصدقاء المقبولين
- قائمة الطلبات المرسلة والواردة
- اقتراحات (أشخاص قد تعرفهم) بناءً على الأصدقاء المشتركين
- البحث عن مستخدمين بالاسم لإرسال طلبات لهم
- إزالة صديق

ملاحظة: يبقى نظام `Follow` القديم كما هو دون مساس به، فقط أُضيف نظام صداقة ثنائي.
"""
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.friendship import (
    FRIENDSHIP_STATUS_ACCEPTED,
    FRIENDSHIP_STATUS_DECLINED,
    FRIENDSHIP_STATUS_PENDING,
    Friendship,
)
from app.models.user import User
from app.models.user_block import UserBlock

try:
    from app.services.notification_service import create_and_send_notification
except Exception:  # pragma: no cover - بيئة بدون خدمة الإشعارات
    async def create_and_send_notification(**_kwargs):  # type: ignore[override]
        return None

router = APIRouter()


# ----------------------------- أدوات مساعدة -----------------------------

def _user_card(user: User, *, extra: Optional[dict] = None) -> dict:
    """تمثيل بيانات مستخدم في بطاقة الأصدقاء (مختصرة وآمنة)."""
    payload = {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar,
        'name': getattr(user, 'name', None) or user.username,
        'role': getattr(user, 'role', None),
        'followers_count': int(user.followers_count or 0),
        'following_count': int(user.following_count or 0),
    }
    if extra:
        payload.update(extra)
    return payload


def _find_friendship(db: Session, user_a_id: int, user_b_id: int) -> Optional[Friendship]:
    """يبحث عن علاقة صداقة بين مستخدمَين بصرف النظر عن اتجاه الطلب."""
    return (
        db.query(Friendship)
        .filter(
            or_(
                and_(Friendship.requester_id == user_a_id, Friendship.addressee_id == user_b_id),
                and_(Friendship.requester_id == user_b_id, Friendship.addressee_id == user_a_id),
            )
        )
        .first()
    )


def _friendship_state(friendship: Optional[Friendship], current_user_id: int) -> dict:
    """يحوّل الصداقة إلى حالة للواجهة الأمامية."""
    if friendship is None:
        return {'status': 'none', 'friendship_id': None, 'direction': None}
    direction = 'outgoing' if friendship.requester_id == current_user_id else 'incoming'
    return {
        'status': friendship.status,
        'friendship_id': friendship.id,
        'direction': direction,
    }


def _is_blocked(db: Session, user_a_id: int, user_b_id: int) -> bool:
    """يفحص الحظر بين مستخدمَين بأي اتجاه."""
    row = (
        db.query(UserBlock)
        .filter(
            or_(
                and_(UserBlock.blocker_id == user_a_id, UserBlock.blocked_id == user_b_id),
                and_(UserBlock.blocker_id == user_b_id, UserBlock.blocked_id == user_a_id),
            )
        )
        .first()
    )
    return row is not None


def _friend_ids(db: Session, user_id: int) -> set[int]:
    """مجموعة معرّفات أصدقاء المستخدم (الصداقات المقبولة)."""
    rows = (
        db.query(Friendship)
        .filter(
            Friendship.status == FRIENDSHIP_STATUS_ACCEPTED,
            or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
        )
        .all()
    )
    ids: set[int] = set()
    for row in rows:
        ids.add(row.addressee_id if row.requester_id == user_id else row.requester_id)
    return ids


def _mutual_count(db: Session, viewer_id: int, other_id: int) -> int:
    """عدد الأصدقاء المشتركين بين المستخدم الحالي ومستخدم آخر."""
    viewer_friends = _friend_ids(db, viewer_id)
    other_friends = _friend_ids(db, other_id)
    return len(viewer_friends & other_friends)


def _pending_addressee_id(db: Session, user_id: int) -> set[int]:
    rows = db.query(Friendship.addressee_id).filter(
        Friendship.requester_id == user_id,
        Friendship.status == FRIENDSHIP_STATUS_PENDING,
    ).all()
    return {r[0] for r in rows}


def _pending_requester_id(db: Session, user_id: int) -> set[int]:
    rows = db.query(Friendship.requester_id).filter(
        Friendship.addressee_id == user_id,
        Friendship.status == FRIENDSHIP_STATUS_PENDING,
    ).all()
    return {r[0] for r in rows}


# ----------------------------- نقاط النهاية -----------------------------

@router.get('')
def list_friends(
    limit: int = Query(default=50, ge=1, le=200),
    page: int = Query(default=1, ge=1),
    q: Optional[str] = Query(default=None, description='بحث داخل قائمة الأصدقاء بالاسم'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة أصدقاء المستخدم الحالي (الصداقات المقبولة)."""
    friend_ids = _friend_ids(db, current_user.id)
    if not friend_ids:
        return {'items': [], 'total': 0, 'page': page, 'limit': limit}

    query = db.query(User).filter(User.id.in_(friend_ids), User.is_active.is_(True))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(User.username.ilike(like))

    total = query.count()
    offset = (page - 1) * limit
    rows = query.order_by(User.username.asc()).offset(offset).limit(limit).all()

    items = []
    for user in rows:
        friendship = _find_friendship(db, current_user.id, user.id)
        items.append(_user_card(user, extra={
            'friendship': _friendship_state(friendship, current_user.id),
            'mutual_friends': _mutual_count(db, current_user.id, user.id),
        }))
    return {'items': items, 'total': total, 'page': page, 'limit': limit}


@router.get('/requests/received')
def list_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة طلبات الصداقة الواردة الحالية."""
    rows = (
        db.query(Friendship, User)
        .join(User, User.id == Friendship.requester_id)
        .filter(
            Friendship.addressee_id == current_user.id,
            Friendship.status == FRIENDSHIP_STATUS_PENDING,
            User.is_active.is_(True),
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )
    items = []
    for friendship, user in rows:
        items.append(_user_card(user, extra={
            'friendship': {
                'status': friendship.status,
                'friendship_id': friendship.id,
                'direction': 'incoming',
                'created_at': friendship.created_at.isoformat() if friendship.created_at else None,
            },
            'mutual_friends': _mutual_count(db, current_user.id, user.id),
        }))
    return {'items': items, 'total': len(items)}


@router.get('/requests/sent')
def list_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قائمة طلبات الصداقة المرسلة من المستخدم الحالي ولم يُرَدّ عليها بعد."""
    rows = (
        db.query(Friendship, User)
        .join(User, User.id == Friendship.addressee_id)
        .filter(
            Friendship.requester_id == current_user.id,
            Friendship.status == FRIENDSHIP_STATUS_PENDING,
            User.is_active.is_(True),
        )
        .order_by(Friendship.created_at.desc())
        .all()
    )
    items = []
    for friendship, user in rows:
        items.append(_user_card(user, extra={
            'friendship': {
                'status': friendship.status,
                'friendship_id': friendship.id,
                'direction': 'outgoing',
                'created_at': friendship.created_at.isoformat() if friendship.created_at else None,
            },
            'mutual_friends': _mutual_count(db, current_user.id, user.id),
        }))
    return {'items': items, 'total': len(items)}


@router.get('/suggestions')
def list_suggestions(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """أشخاص قد تعرفهم - يستثني الأصدقاء الحاليين، الطلبات المعلّقة، المحظورين، والحساب نفسه."""
    friend_ids = _friend_ids(db, current_user.id)
    sent_ids = _pending_addressee_id(db, current_user.id)
    received_ids = _pending_requester_id(db, current_user.id)
    blocked_ids = set()
    for row in db.query(UserBlock).filter(
        or_(UserBlock.blocker_id == current_user.id, UserBlock.blocked_id == current_user.id)
    ).all():
        blocked_ids.add(row.blocked_id)
        blocked_ids.add(row.blocker_id)

    exclude_ids = friend_ids | sent_ids | received_ids | blocked_ids | {current_user.id}

    candidates = (
        db.query(User)
        .filter(User.is_active.is_(True), User.id.notin_(exclude_ids) if exclude_ids else True)
        .order_by(User.created_at.desc())
        .limit(limit * 3)
        .all()
    )

    scored = []
    for user in candidates:
        mutual = _mutual_count(db, current_user.id, user.id)
        scored.append((mutual, user))
    scored.sort(key=lambda item: (item[0], item[1].id), reverse=True)

    items = []
    for mutual, user in scored[:limit]:
        friendship = _find_friendship(db, current_user.id, user.id)
        reason = f'{mutual} صديق مشترك' if mutual else 'مقترح جديد'
        items.append(_user_card(user, extra={
            'friendship': _friendship_state(friendship, current_user.id),
            'mutual_friends': mutual,
            'reason': reason,
        }))
    return {'items': items, 'total': len(items)}


@router.get('/search')
def search_users(
    q: str = Query(..., min_length=1, max_length=80),
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """بحث عن مستخدمين بالاسم لاستخدامه في رأس الصفحة (إضافة كأصدقاء)."""
    like = f"%{q.strip()}%"
    rows = (
        db.query(User)
        .filter(User.is_active.is_(True), User.id != current_user.id, User.username.ilike(like))
        .order_by(User.followers_count.desc(), User.username.asc())
        .limit(limit)
        .all()
    )

    items = []
    for user in rows:
        friendship = _find_friendship(db, current_user.id, user.id)
        items.append(_user_card(user, extra={
            'friendship': _friendship_state(friendship, current_user.id),
            'mutual_friends': _mutual_count(db, current_user.id, user.id),
        }))
    return {'items': items, 'total': len(items)}


@router.post('/request')
async def send_friend_request(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إرسال طلب صداقة بالـ username أو user_id."""
    target_username = str(payload.get('username') or '').strip()
    target_id = payload.get('user_id')

    if target_id:
        try:
            target_id = int(target_id)
        except (TypeError, ValueError):
            target_id = None

    if not target_username and not target_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='يجب تحديد المستخدم')

    query = db.query(User).filter(User.is_active.is_(True))
    target = query.filter(User.id == target_id).first() if target_id else query.filter(User.username == target_username).first()

    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='المستخدم غير موجود')
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='لا يمكنك إرسال طلب لنفسك')
    if _is_blocked(db, current_user.id, target.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='لا يمكن إرسال طلب لهذا المستخدم')

    existing = _find_friendship(db, current_user.id, target.id)
    if existing:
        if existing.status == FRIENDSHIP_STATUS_ACCEPTED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='أنتما صديقان بالفعل')
        if existing.status == FRIENDSHIP_STATUS_PENDING:
            if existing.requester_id == current_user.id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='الطلب مُرسَل بالفعل')
            # الطرف الآخر سبق وأرسل الطلب → نقبله مباشرة
            existing.status = FRIENDSHIP_STATUS_ACCEPTED
            db.commit()
            db.refresh(existing)
            return {
                'message': 'تم قبول الطلب الموجود مسبقاً',
                'friendship': {
                    'id': existing.id,
                    'status': existing.status,
                    'direction': 'incoming',
                },
                'target_user': _user_card(target),
            }
        # كانت declined → نُعيد التفعيل كطلب جديد
        existing.requester_id = current_user.id
        existing.addressee_id = target.id
        existing.status = FRIENDSHIP_STATUS_PENDING
        db.commit()
        db.refresh(existing)
        friendship = existing
    else:
        friendship = Friendship(
            requester_id=current_user.id,
            addressee_id=target.id,
            status=FRIENDSHIP_STATUS_PENDING,
        )
        db.add(friendship)
        db.commit()
        db.refresh(friendship)

    try:
        await create_and_send_notification(
            db=db,
            user_id=target.id,
            notification_type='FRIEND_REQUEST',
            data={'from_user_id': current_user.id, 'username': current_user.username, 'friendship_id': friendship.id},
        )
    except Exception:
        pass

    return {
        'message': 'تم إرسال الطلب',
        'friendship': {
            'id': friendship.id,
            'status': friendship.status,
            'direction': 'outgoing',
        },
        'target_user': _user_card(target),
    }


@router.post('/{friendship_id}/accept')
async def accept_friend_request(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قبول طلب صداقة وارد."""
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if friendship is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='الطلب غير موجود')
    if friendship.addressee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='لا تملك صلاحية قبول هذا الطلب')
    if friendship.status != FRIENDSHIP_STATUS_PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='الطلب ليس في حالة الانتظار')

    friendship.status = FRIENDSHIP_STATUS_ACCEPTED
    db.commit()
    db.refresh(friendship)

    requester = db.query(User).filter(User.id == friendship.requester_id).first()
    try:
        if requester:
            await create_and_send_notification(
                db=db,
                user_id=requester.id,
                notification_type='FRIEND_ACCEPTED',
                data={'from_user_id': current_user.id, 'username': current_user.username, 'friendship_id': friendship.id},
            )
    except Exception:
        pass

    return {
        'message': 'تم قبول الصداقة',
        'friendship': {
            'id': friendship.id,
            'status': friendship.status,
        },
        'friend': _user_card(requester) if requester else None,
    }


@router.delete('/{friendship_id}')
def decline_or_remove_friendship(
    friendship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """يستخدم لرفض طلب وارد، إلغاء طلب مرسل، أو إزالة صديق حالي.

    يحذف السجل من قاعدة البيانات بحيث يستطيع الطرفان إعادة المحاولة لاحقاً.
    """
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if friendship is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='العلاقة غير موجودة')
    if current_user.id not in {friendship.requester_id, friendship.addressee_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='لا تملك صلاحية هذه العملية')

    previous_status = friendship.status
    db.delete(friendship)
    db.commit()

    return {
        'message': 'تمت العملية',
        'previous_status': previous_status,
        'friendship_id': friendship_id,
    }


@router.post('/dismiss')
def dismiss_suggestion(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إزالة مستخدم من قائمة الاقتراحات (إخفاء محلي - يُخزَّن كصداقة declined لإلغاء الاقتراح مستقبلاً)."""
    target_username = str(payload.get('username') or '').strip()
    target_id = payload.get('user_id')

    if target_id:
        try:
            target_id = int(target_id)
        except (TypeError, ValueError):
            target_id = None

    if not target_username and not target_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='يجب تحديد المستخدم')

    query = db.query(User).filter(User.is_active.is_(True))
    target = query.filter(User.id == target_id).first() if target_id else query.filter(User.username == target_username).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='المستخدم غير موجود')

    existing = _find_friendship(db, current_user.id, target.id)
    if existing is None:
        marker = Friendship(
            requester_id=current_user.id,
            addressee_id=target.id,
            status=FRIENDSHIP_STATUS_DECLINED,
        )
        db.add(marker)
        db.commit()
    return {'message': 'تمت الإزالة من الاقتراحات', 'user_id': target.id}


@router.get('/relationship/{username}')
def relationship_with(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """فحص حالة الصداقة الحالية مع مستخدم معيّن."""
    target = db.query(User).filter(User.is_active.is_(True), User.username == username).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='المستخدم غير موجود')
    if target.id == current_user.id:
        return {'self': True, 'friendship': _friendship_state(None, current_user.id)}
    friendship = _find_friendship(db, current_user.id, target.id)
    return {
        'self': False,
        'target_user': _user_card(target),
        'friendship': _friendship_state(friendship, current_user.id),
        'mutual_friends': _mutual_count(db, current_user.id, target.id),
    }


@router.get('/stats')
def friends_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إحصائيات سريعة للأصدقاء (الإجمالي، الطلبات الواردة، المرسلة)."""
    friends_total = len(_friend_ids(db, current_user.id))
    received_count = db.query(func.count(Friendship.id)).filter(
        Friendship.addressee_id == current_user.id,
        Friendship.status == FRIENDSHIP_STATUS_PENDING,
    ).scalar() or 0
    sent_count = db.query(func.count(Friendship.id)).filter(
        Friendship.requester_id == current_user.id,
        Friendship.status == FRIENDSHIP_STATUS_PENDING,
    ).scalar() or 0
    return {
        'friends': friends_total,
        'requests_received': int(received_count),
        'requests_sent': int(sent_count),
    }
