"""
خدمة إدارة البث المباشر والمشرفين والاعتدال
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import and_, func, desc
from sqlalchemy.orm import Session

from app.models.live_moderation import (
    LiveRoomModerator,
    LiveRoomMutedUser,
    LiveRoomKickedUser,
    LiveRoomBannedUser,
    LiveRoomComment,
)
from app.models.user import User


# ============ إدارة المشرفين ============

def add_moderator(
    db: Session,
    room_id: str,
    user_id: int,
    host_id: int,
    permissions: Dict[str, bool] = None,
) -> Dict[str, Any]:
    """إضافة مشرف إلى غرفة البث"""
    
    # التحقق من وجود المشرف بالفعل
    existing = db.query(LiveRoomModerator).filter(
        and_(
            LiveRoomModerator.room_id == room_id,
            LiveRoomModerator.user_id == user_id,
        )
    ).first()
    
    if existing:
        return {
            "status": "already_moderator",
            "moderator_id": existing.id,
        }
    
    # إنشاء مشرف جديد
    moderator = LiveRoomModerator(
        room_id=room_id,
        user_id=user_id,
        host_id=host_id,
        can_mute=permissions.get("can_mute", True) if permissions else True,
        can_kick=permissions.get("can_kick", True) if permissions else True,
        can_ban=permissions.get("can_ban", False) if permissions else False,
        can_delete_comments=permissions.get("can_delete_comments", True) if permissions else True,
        can_pin_comments=permissions.get("can_pin_comments", True) if permissions else True,
    )
    db.add(moderator)
    db.commit()
    db.refresh(moderator)
    
    return {
        "status": "added",
        "moderator_id": moderator.id,
        "user_id": user_id,
        "permissions": {
            "can_mute": moderator.can_mute,
            "can_kick": moderator.can_kick,
            "can_ban": moderator.can_ban,
            "can_delete_comments": moderator.can_delete_comments,
            "can_pin_comments": moderator.can_pin_comments,
        },
    }


def remove_moderator(db: Session, room_id: str, user_id: int) -> Dict[str, Any]:
    """إزالة مشرف من غرفة البث"""
    moderator = db.query(LiveRoomModerator).filter(
        and_(
            LiveRoomModerator.room_id == room_id,
            LiveRoomModerator.user_id == user_id,
        )
    ).first()
    
    if not moderator:
        raise ValueError("المشرف غير موجود")
    
    db.delete(moderator)
    db.commit()
    
    return {
        "status": "removed",
        "user_id": user_id,
    }


def get_moderators(db: Session, room_id: str) -> List[Dict[str, Any]]:
    """الحصول على قائمة المشرفين"""
    moderators = db.query(LiveRoomModerator).filter(
        LiveRoomModerator.room_id == room_id
    ).all()
    
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "permissions": {
                "can_mute": m.can_mute,
                "can_kick": m.can_kick,
                "can_ban": m.can_ban,
                "can_delete_comments": m.can_delete_comments,
                "can_pin_comments": m.can_pin_comments,
            },
            "created_at": m.created_at,
        }
        for m in moderators
    ]


# ============ كتم المستخدمين ============

def mute_user(
    db: Session,
    room_id: str,
    user_id: int,
    moderator_id: int,
    reason: str = None,
    duration_minutes: int = None,
) -> Dict[str, Any]:
    """كتم مستخدم في غرفة البث"""
    
    # التحقق من عدم كتم المستخدم بالفعل
    existing = db.query(LiveRoomMutedUser).filter(
        and_(
            LiveRoomMutedUser.room_id == room_id,
            LiveRoomMutedUser.user_id == user_id,
            LiveRoomMutedUser.unmuted_at.is_(None),
        )
    ).first()
    
    if existing:
        return {
            "status": "already_muted",
            "muted_user_id": existing.id,
        }
    
    # إنشاء تسجيل الكتم
    muted = LiveRoomMutedUser(
        room_id=room_id,
        user_id=user_id,
        moderator_id=moderator_id,
        reason=reason,
        duration_minutes=duration_minutes,
    )
    db.add(muted)
    db.commit()
    db.refresh(muted)
    
    return {
        "status": "muted",
        "muted_user_id": muted.id,
        "user_id": user_id,
        "duration_minutes": duration_minutes,
        "reason": reason,
    }


def unmute_user(db: Session, room_id: str, user_id: int) -> Dict[str, Any]:
    """إلغاء كتم مستخدم"""
    muted = db.query(LiveRoomMutedUser).filter(
        and_(
            LiveRoomMutedUser.room_id == room_id,
            LiveRoomMutedUser.user_id == user_id,
            LiveRoomMutedUser.unmuted_at.is_(None),
        )
    ).first()
    
    if not muted:
        raise ValueError("المستخدم غير مكتوم")
    
    muted.unmuted_at = datetime.utcnow()
    db.commit()
    db.refresh(muted)
    
    return {
        "status": "unmuted",
        "user_id": user_id,
    }


def get_muted_users(db: Session, room_id: str) -> List[Dict[str, Any]]:
    """الحصول على قائمة المستخدمين المكتومين"""
    muted_users = db.query(LiveRoomMutedUser).filter(
        and_(
            LiveRoomMutedUser.room_id == room_id,
            LiveRoomMutedUser.unmuted_at.is_(None),
        )
    ).all()
    
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "reason": m.reason,
            "duration_minutes": m.duration_minutes,
            "muted_at": m.muted_at,
        }
        for m in muted_users
    ]


# ============ طرد المستخدمين ============

def kick_user(
    db: Session,
    room_id: str,
    user_id: int,
    moderator_id: int,
    reason: str = None,
) -> Dict[str, Any]:
    """طرد مستخدم من غرفة البث"""
    
    kicked = LiveRoomKickedUser(
        room_id=room_id,
        user_id=user_id,
        moderator_id=moderator_id,
        reason=reason,
    )
    db.add(kicked)
    db.commit()
    db.refresh(kicked)
    
    return {
        "status": "kicked",
        "kicked_user_id": kicked.id,
        "user_id": user_id,
        "reason": reason,
    }


def get_kicked_users(db: Session, room_id: str) -> List[Dict[str, Any]]:
    """الحصول على قائمة المستخدمين المطرودين"""
    kicked_users = db.query(LiveRoomKickedUser).filter(
        LiveRoomKickedUser.room_id == room_id
    ).order_by(desc(LiveRoomKickedUser.kicked_at)).all()
    
    return [
        {
            "id": k.id,
            "user_id": k.user_id,
            "reason": k.reason,
            "kicked_at": k.kicked_at,
        }
        for k in kicked_users
    ]


# ============ حظر المستخدمين ============

def ban_user(
    db: Session,
    room_id: str,
    user_id: int,
    host_id: int,
    reason: str = None,
    duration_days: int = None,
) -> Dict[str, Any]:
    """حظر مستخدم من غرفة البث"""
    
    # التحقق من عدم حظر المستخدم بالفعل
    existing = db.query(LiveRoomBannedUser).filter(
        and_(
            LiveRoomBannedUser.room_id == room_id,
            LiveRoomBannedUser.user_id == user_id,
            LiveRoomBannedUser.unbanned_at.is_(None),
        )
    ).first()
    
    if existing:
        return {
            "status": "already_banned",
            "banned_user_id": existing.id,
        }
    
    # إنشاء تسجيل الحظر
    banned = LiveRoomBannedUser(
        room_id=room_id,
        user_id=user_id,
        host_id=host_id,
        reason=reason,
        duration_days=duration_days,
    )
    db.add(banned)
    db.commit()
    db.refresh(banned)
    
    return {
        "status": "banned",
        "banned_user_id": banned.id,
        "user_id": user_id,
        "duration_days": duration_days,
        "reason": reason,
    }


def unban_user(db: Session, room_id: str, user_id: int) -> Dict[str, Any]:
    """إلغاء حظر مستخدم"""
    banned = db.query(LiveRoomBannedUser).filter(
        and_(
            LiveRoomBannedUser.room_id == room_id,
            LiveRoomBannedUser.user_id == user_id,
            LiveRoomBannedUser.unbanned_at.is_(None),
        )
    ).first()
    
    if not banned:
        raise ValueError("المستخدم غير محظور")
    
    banned.unbanned_at = datetime.utcnow()
    db.commit()
    db.refresh(banned)
    
    return {
        "status": "unbanned",
        "user_id": user_id,
    }


def get_banned_users(db: Session, room_id: str) -> List[Dict[str, Any]]:
    """الحصول على قائمة المستخدمين المحظورين"""
    banned_users = db.query(LiveRoomBannedUser).filter(
        and_(
            LiveRoomBannedUser.room_id == room_id,
            LiveRoomBannedUser.unbanned_at.is_(None),
        )
    ).all()
    
    return [
        {
            "id": b.id,
            "user_id": b.user_id,
            "reason": b.reason,
            "duration_days": b.duration_days,
            "banned_at": b.banned_at,
        }
        for b in banned_users
    ]


# ============ إدارة التعليقات ============

def add_comment(
    db: Session,
    room_id: str,
    user_id: int,
    content: str,
) -> Dict[str, Any]:
    """إضافة تعليق في البث المباشر"""
    
    comment = LiveRoomComment(
        room_id=room_id,
        user_id=user_id,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {
        "id": comment.id,
        "room_id": room_id,
        "user_id": user_id,
        "content": content,
        "created_at": comment.created_at,
    }


def pin_comment(db: Session, comment_id: int) -> Dict[str, Any]:
    """تثبيت تعليق"""
    comment = db.query(LiveRoomComment).filter(LiveRoomComment.id == comment_id).first()
    
    if not comment:
        raise ValueError("التعليق غير موجود")
    
    comment.is_pinned = True
    db.commit()
    db.refresh(comment)
    
    return {
        "status": "pinned",
        "comment_id": comment_id,
    }


def delete_comment(db: Session, comment_id: int) -> Dict[str, Any]:
    """حذف تعليق"""
    comment = db.query(LiveRoomComment).filter(LiveRoomComment.id == comment_id).first()
    
    if not comment:
        raise ValueError("التعليق غير موجود")
    
    comment.is_deleted = True
    db.commit()
    db.refresh(comment)
    
    return {
        "status": "deleted",
        "comment_id": comment_id,
    }


def get_comments(db: Session, room_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """الحصول على التعليقات"""
    comments = db.query(LiveRoomComment).filter(
        and_(
            LiveRoomComment.room_id == room_id,
            LiveRoomComment.is_deleted.is_(False),
        )
    ).order_by(desc(LiveRoomComment.created_at)).limit(limit).all()
    
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "content": c.content,
            "is_pinned": c.is_pinned,
            "created_at": c.created_at,
        }
        for c in comments
    ]


def get_pinned_comments(db: Session, room_id: str) -> List[Dict[str, Any]]:
    """الحصول على التعليقات المثبتة"""
    comments = db.query(LiveRoomComment).filter(
        and_(
            LiveRoomComment.room_id == room_id,
            LiveRoomComment.is_pinned.is_(True),
            LiveRoomComment.is_deleted.is_(False),
        )
    ).order_by(desc(LiveRoomComment.created_at)).all()
    
    return [
        {
            "id": c.id,
