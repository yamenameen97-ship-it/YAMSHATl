"""
خدمة نظام الهدايا والعملات المحسّنة
"""
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import and_, func, desc
from sqlalchemy.orm import Session

from app.models.gift import Gift, UserCoins, GiftTransaction, LiveStreamRecording
from app.models.user import User


# ============ إدارة الهدايا ============

def get_all_gifts(db: Session, active_only: bool = True) -> List[Dict[str, Any]]:
    """الحصول على قائمة الهدايا المتاحة"""
    query = db.query(Gift)
    if active_only:
        query = query.filter(Gift.is_active.is_(True))
    
    gifts = query.all()
    return [
        {
            "id": gift.id,
            "name": gift.name,
            "emoji": gift.emoji,
            "description": gift.description,
            "price": gift.price,
            "image_url": gift.image_url,
            "is_active": gift.is_active,
        }
        for gift in gifts
    ]


def create_gift(
    db: Session, 
    name: str, 
    emoji: str, 
    price: int, 
    description: str = None, 
    image_url: str = None
) -> Dict[str, Any]:
    """إنشاء هدية جديدة"""
    gift = Gift(
        name=name,
        emoji=emoji,
        price=price,
        description=description,
        image_url=image_url,
        is_active=True,
    )
    db.add(gift)
    db.commit()
    db.refresh(gift)
    
    return {
        "id": gift.id,
        "name": gift.name,
        "emoji": gift.emoji,
        "price": gift.price,
    }


# ============ إدارة العملات ============

def get_or_create_user_coins(db: Session, user_id: int) -> UserCoins:
    """الحصول على أو إنشاء رصيد العملات للمستخدم"""
    coins = db.query(UserCoins).filter(UserCoins.user_id == user_id).first()
    
    if not coins:
        coins = UserCoins(user_id=user_id)
        db.add(coins)
        db.commit()
        db.refresh(coins)
    
    return coins


def get_user_coins_balance(db: Session, user_id: int) -> Dict[str, Any]:
    """الحصول على رصيد العملات للمستخدم"""
    coins = get_or_create_user_coins(db, user_id)
    
    return {
        "user_id": user_id,
        "balance": coins.balance,
        "total_earned": coins.total_earned,
        "total_spent": coins.total_spent,
    }


def add_coins(db: Session, user_id: int, amount: int, reason: str = "manual") -> Dict[str, Any]:
    """إضافة عملات للمستخدم"""
    if amount <= 0:
        raise ValueError("يجب أن يكون المبلغ أكبر من صفر")
    
    coins = get_or_create_user_coins(db, user_id)
    coins.balance += amount
    coins.total_earned += amount
    db.commit()
    db.refresh(coins)
    
    return {
        "user_id": user_id,
        "balance": coins.balance,
        "added": amount,
        "reason": reason,
    }


def deduct_coins(db: Session, user_id: int, amount: int, reason: str = "manual") -> Dict[str, Any]:
    """خصم عملات من المستخدم"""
    if amount <= 0:
        raise ValueError("يجب أن يكون المبلغ أكبر من صفر")
    
    coins = get_or_create_user_coins(db, user_id)
    
    if coins.balance < amount:
        raise ValueError("رصيد غير كافي")
    
    coins.balance -= amount
    coins.total_spent += amount
    db.commit()
    db.refresh(coins)
    
    return {
        "user_id": user_id,
        "balance": coins.balance,
        "deducted": amount,
        "reason": reason,
    }


# ============ إرسال الهدايا ============

def send_gift(
    db: Session,
    sender_id: int,
    receiver_id: int,
    gift_id: int,
    amount: int = 1,
    live_room_id: str = None,
    message: str = None,
) -> Dict[str, Any]:
    """إرسال هدية من مستخدم إلى آخر"""
    
    # التحقق من وجود الهدية
    gift = db.query(Gift).filter(Gift.id == gift_id).first()
    if not gift or not gift.is_active:
        raise ValueError("الهدية غير موجودة أو غير متاحة")
    
    # التحقق من وجود المستقبل
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise ValueError("المستقبل غير موجود")
    
    # حساب التكلفة الإجمالية
    total_cost = gift.price * amount
    
    # خصم العملات من المرسل
    try:
        deduct_coins(db, sender_id, total_cost, "gift_send")
    except ValueError as e:
        raise ValueError(f"فشل الدفع: {str(e)}")
    
    # إضافة 80% من الأرباح للمستقبل
    receiver_earnings = int(total_cost * 0.8)
    add_coins(db, receiver_id, receiver_earnings, "gift_receive")
    
    # تسجيل المعاملة
    transaction = GiftTransaction(
        sender_id=sender_id,
        receiver_id=receiver_id,
        gift_id=gift_id,
        live_room_id=live_room_id,
        amount=amount,
        total_coins=total_cost,
        message=message,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return {
        "transaction_id": transaction.id,
        "gift": {
            "id": gift.id,
            "name": gift.name,
            "emoji": gift.emoji,
            "price": gift.price,
        },
        "amount": amount,
        "total_cost": total_cost,
        "receiver_earnings": receiver_earnings,
        "sender_balance": get_user_coins_balance(db, sender_id)["balance"],
        "receiver_balance": get_user_coins_balance(db, receiver_id)["balance"],
    }


def get_gift_transactions(
    db: Session,
    user_id: int = None,
    sender_id: int = None,
    receiver_id: int = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على معاملات الهدايا"""
    query = db.query(GiftTransaction)
    
    if sender_id:
        query = query.filter(GiftTransaction.sender_id == sender_id)
    if receiver_id:
        query = query.filter(GiftTransaction.receiver_id == receiver_id)
    if user_id:
        query = query.filter(
            (GiftTransaction.sender_id == user_id) | (GiftTransaction.receiver_id == user_id)
        )
    
    transactions = query.order_by(desc(GiftTransaction.created_at)).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "sender_id": t.sender_id,
            "receiver_id": t.receiver_id,
            "gift_id": t.gift_id,
            "amount": t.amount,
            "total_coins": t.total_coins,
            "message": t.message,
            "created_at": t.created_at,
        }
        for t in transactions
    ]


def get_top_gifters(
    db: Session,
    live_room_id: str = None,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """الحصول على أكثر المرسلين للهدايا"""
    query = db.query(
        GiftTransaction.sender_id,
        func.sum(GiftTransaction.total_coins).label('total_spent'),
        func.count(GiftTransaction.id).label('gift_count'),
    ).group_by(GiftTransaction.sender_id)
    
    if live_room_id:
        query = query.filter(GiftTransaction.live_room_id == live_room_id)
    
    results = query.order_by(desc('total_spent')).limit(limit).all()
    
    return [
        {
            "user_id": r[0],
            "total_spent": r[1],
            "gift_count": r[2],
        }
        for r in results
    ]


# ============ تسجيل البث المباشر ============

def create_recording(
    db: Session,
    host_id: int,
    room_id: str,
    title: str,
    video_url: str,
    duration: int,
    description: str = None,
    thumbnail_url: str = None,
) -> Dict[str, Any]:
    """إنشاء تسجيل بث مباشر جديد"""
    recording = LiveStreamRecording(
        host_id=host_id,
        room_id=room_id,
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        duration=duration,
        is_public=True,
    )
    db.add(recording)
    db.commit()
    db.refresh(recording)
    
    return {
        "id": recording.id,
        "room_id": recording.room_id,
        "title": recording.title,
        "video_url": recording.video_url,
        "duration": recording.duration,
    }


def get_recordings(
    db: Session,
    host_id: int = None,
    public_only: bool = True,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """الحصول على التسجيلات"""
    query = db.query(LiveStreamRecording)
    
    if host_id:
        query = query.filter(LiveStreamRecording.host_id == host_id)
    if public_only:
        query = query.filter(LiveStreamRecording.is_public.is_(True))
    
    recordings = query.order_by(desc(LiveStreamRecording.created_at)).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "host_id": r.host_id,
            "title": r.title,
            "description": r.description,
            "video_url": r.video_url,
            "thumbnail_url": r.thumbnail_url,
            "duration": r.duration,
            "view_count": r.view_count,
            "like_count": r.like_count,
            "created_at": r.created_at,
        }
        for r in recordings
    ]


def increment_recording_views(db: Session, recording_id: int) -> Dict[str, Any]:
    """زيادة عدد مشاهدات التسجيل"""
    recording = db.query(LiveStreamRecording).filter(LiveStreamRecording.id == recording_id).first()
    if not recording:
        raise ValueError("التسجيل غير موجود")
    
    recording.view_count += 1
    db.commit()
    db.refresh(recording)
    
    return {
        "id": recording.id,
        "view_count": recording.view_count,
    }


def like_recording(db: Session, recording_id: int) -> Dict[str, Any]:
    """الإعجاب بالتسجيل"""
    recording = db.query(LiveStreamRecording).filter(LiveStreamRecording.id == recording_id).first()
    if not recording:
        raise ValueError("التسجيل غير موجود")
    
    recording.like_count += 1
    db.commit()
    db.refresh(recording)
    
    return {
        "id": recording.id,
        "like_count": recording.like_count,
    }
