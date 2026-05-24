"""
نظام الشات المحسّن - Enhanced Chat System
يوفر:
- رسائل محسّنة (Seen ✓✓, Delivered, Typing Animation)
- دعم الوسائط (صور، فيديو، ملفات، رسائل صوتية)
- استقرار Socket (إعادة اتصال تلقائي، منع فقد الرسائل)
- مكالمات صوت وفيديو
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Body, WebSocket, status
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from dataclasses import dataclass, asdict
import logging
import asyncio
import json

from app.core.dependencies import get_current_user, get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ تعريفات الأنواع ============

@dataclass
class MessageInfo:
    """معلومات الرسالة"""
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_avatar: str
    content: str
    message_type: str = "text"  # text, image, video, audio, file
    status: str = "sent"  # sending, sent, delivered, seen
    timestamp: str = None
    edited_at: Optional[str] = None
    is_edited: bool = False
    reply_to: Optional[str] = None
    attachments: List[Dict] = None
    reactions: Dict[str, List[str]] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()
        if self.attachments is None:
            self.attachments = []
        if self.reactions is None:
            self.reactions = {}


@dataclass
class TypingIndicator:
    """مؤشر الكتابة"""
    conversation_id: str
    user_id: str
    user_name: str
    is_typing: bool = True
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class SeenIndicator:
    """مؤشر الرسائل المقروءة"""
    conversation_id: str
    user_id: str
    user_name: str
    last_seen_message_id: str
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()


# ============ مدير الشات ============

class ChatConnectionManager:
    """مدير اتصالات الشات"""

    def __init__(self):
        # الاتصالات النشطة: {conversation_id: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # الرسائل المعلقة: {user_id: [messages]}
        self.pending_messages: Dict[str, List[Dict]] = {}
        # مؤشرات الكتابة: {conversation_id: {user_id: indicator}}
        self.typing_indicators: Dict[str, Dict[str, TypingIndicator]] = {}

    async def connect(self, conversation_id: str, user_id: str, websocket: WebSocket):
        """الاتصال بمحادثة"""
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = {}
        self.active_connections[conversation_id][user_id] = websocket
        logger.info(f"User {user_id} connected to conversation {conversation_id}")

    async def disconnect(self, conversation_id: str, user_id: str):
        """قطع الاتصال عن محادثة"""
        if conversation_id in self.active_connections:
            if user_id in self.active_connections[conversation_id]:
                del self.active_connections[conversation_id][user_id]
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        logger.info(f"User {user_id} disconnected from conversation {conversation_id}")

    async def broadcast(
        self,
        conversation_id: str,
        message: dict,
        exclude_user: Optional[str] = None
    ):
        """بث رسالة إلى جميع المتصلين"""
        if conversation_id in self.active_connections:
            disconnected_users = []
            for user_id, connection in self.active_connections[conversation_id].items():
                if exclude_user and user_id == exclude_user:
                    continue
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message: {str(e)}")
                    disconnected_users.append(user_id)
            
            # إزالة الاتصالات المقطوعة
            for user_id in disconnected_users:
                await self.disconnect(conversation_id, user_id)

    async def send_to_user(
        self,
        conversation_id: str,
        user_id: str,
        message: dict
    ):
        """إرسال رسالة إلى مستخدم محدد"""
        if conversation_id in self.active_connections:
            if user_id in self.active_connections[conversation_id]:
                try:
                    await self.active_connections[conversation_id][user_id].send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user: {str(e)}")
                    await self.disconnect(conversation_id, user_id)
                    # حفظ الرسالة للإرسال لاحقاً
                    if user_id not in self.pending_messages:
                        self.pending_messages[user_id] = []
                    self.pending_messages[user_id].append(message)

    async def broadcast_typing(
        self,
        conversation_id: str,
        user_id: str,
        user_name: str,
        is_typing: bool
    ):
        """بث مؤشر الكتابة"""
        if conversation_id not in self.typing_indicators:
            self.typing_indicators[conversation_id] = {}

        if is_typing:
            indicator = TypingIndicator(
                conversation_id=conversation_id,
                user_id=user_id,
                user_name=user_name,
                is_typing=True
            )
            self.typing_indicators[conversation_id][user_id] = indicator
        else:
            if user_id in self.typing_indicators.get(conversation_id, {}):
                del self.typing_indicators[conversation_id][user_id]

        await self.broadcast(conversation_id, {
            "type": "typing",
            "data": asdict(indicator) if is_typing else {
                "user_id": user_id,
                "is_typing": False
            }
        }, exclude_user=user_id)

    async def broadcast_seen(
        self,
        conversation_id: str,
        user_id: str,
        user_name: str,
        last_seen_message_id: str
    ):
        """بث مؤشر الرسائل المقروءة"""
        indicator = SeenIndicator(
            conversation_id=conversation_id,
            user_id=user_id,
            user_name=user_name,
            last_seen_message_id=last_seen_message_id
        )

        await self.broadcast(conversation_id, {
            "type": "seen",
            "data": asdict(indicator)
        }, exclude_user=user_id)


chat_manager = ChatConnectionManager()


# ============ المسارات (Routes) ============

# ============ الرسائل ============

@router.post('/conversations/{conversation_id}/messages')
async def send_message(
    conversation_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إرسال رسالة
    - دعم النصوص والوسائط
    - تتبع حالة الرسالة
    """
    try:
        from app.models.message import Message
        
        content = payload.get('content', '').strip()
        message_type = payload.get('type', 'text')
        reply_to = payload.get('reply_to')
        attachments = payload.get('attachments', [])

        if not content and not attachments:
            raise HTTPException(status_code=400, detail="محتوى الرسالة مطلوب")

        message = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=content,
            message_type=message_type,
            status="sent",
            reply_to=reply_to,
            attachments=attachments,
            created_at=datetime.utcnow()
        )
        db.add(message)
        db.commit()

        # بث الرسالة
        await chat_manager.broadcast(conversation_id, {
            "type": "message",
            "data": {
                "id": message.id,
                "conversation_id": conversation_id,
                "sender_id": current_user.id,
                "sender_name": current_user.full_name or current_user.username,
                "sender_avatar": current_user.avatar_url,
                "content": content,
                "message_type": message_type,
                "status": "sent",
                "timestamp": message.created_at.isoformat() if message.created_at else None,
                "attachments": attachments
            }
        })

        return {
            "success": True,
            "message_id": message.id,
            "status": "sent",
            "timestamp": message.created_at.isoformat() if message.created_at else None
        }
    except Exception as e:
        logger.error(f"Send message error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/conversations/{conversation_id}/messages')
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على الرسائل
    - مع دعم الترتيب والتصفية
    """
    try:
        from app.models.message import Message
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(
            desc(Message.created_at)
        ).offset(offset).limit(limit).all()

        messages_data = [
            {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender.full_name or msg.sender.username,
                "sender_avatar": msg.sender.avatar_url,
                "content": msg.content,
                "message_type": msg.message_type,
                "status": msg.status,
                "timestamp": msg.created_at.isoformat() if msg.created_at else None,
                "edited_at": msg.updated_at.isoformat() if msg.updated_at else None,
                "is_edited": msg.updated_at != msg.created_at if msg.updated_at and msg.created_at else False,
                "attachments": msg.attachments or [],
                "reactions": msg.reactions or {}
            }
            for msg in messages
        ]

        return {
            "success": True,
            "conversation_id": conversation_id,
            "messages": messages_data,
            "total": len(messages_data),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch('/conversations/{conversation_id}/messages/{message_id}')
async def edit_message(
    conversation_id: str,
    message_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    تعديل رسالة
    """
    try:
        from app.models.message import Message
        
        message = db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.conversation_id == conversation_id
            )
        ).first()

        if not message:
            raise HTTPException(status_code=404, detail="الرسالة غير موجودة")

        if message.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية لتعديل هذه الرسالة")

        new_content = payload.get('content', '').strip()
        if not new_content:
            raise HTTPException(status_code=400, detail="محتوى الرسالة مطلوب")

        message.content = new_content
        message.updated_at = datetime.utcnow()
        db.commit()

        # بث التحديث
        await chat_manager.broadcast(conversation_id, {
            "type": "message_edited",
            "data": {
                "message_id": message_id,
                "content": new_content,
                "edited_at": message.updated_at.isoformat() if message.updated_at else None
            }
        })

        return {
            "success": True,
            "message_id": message_id,
            "content": new_content,
            "edited_at": message.updated_at.isoformat() if message.updated_at else None
        }
    except Exception as e:
        logger.error(f"Edit message error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/conversations/{conversation_id}/messages/{message_id}')
async def delete_message(
    conversation_id: str,
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    حذف رسالة
    """
    try:
        from app.models.message import Message
        
        message = db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.conversation_id == conversation_id
            )
        ).first()

        if not message:
            raise HTTPException(status_code=404, detail="الرسالة غير موجودة")

        if message.sender_id != current_user.id:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذه الرسالة")

        db.delete(message)
        db.commit()

        # بث الحذف
        await chat_manager.broadcast(conversation_id, {
            "type": "message_deleted",
            "data": {
                "message_id": message_id
            }
        })

        return {
            "success": True,
            "message_id": message_id,
            "message": "تم حذف الرسالة"
        }
    except Exception as e:
        logger.error(f"Delete message error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ WebSocket للشات الفوري ============

@router.websocket('/ws/chat/{conversation_id}/{user_id}')
async def websocket_chat_endpoint(
    conversation_id: str,
    user_id: str,
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """
    نقطة نهاية WebSocket للشات الفوري
    - دعم الرسائل الفورية
    - مؤشرات الكتابة
    - مؤشرات الرسائل المقروءة
    """
    await chat_manager.connect(conversation_id, user_id, websocket)
    
    # إرسال الرسائل المعلقة
    if user_id in chat_manager.pending_messages:
        for pending_msg in chat_manager.pending_messages[user_id]:
            await websocket.send_json(pending_msg)
        chat_manager.pending_messages[user_id] = []
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "message":
                # رسالة جديدة
                await chat_manager.broadcast(conversation_id, {
                    "type": "message",
                    "data": data.get("data")
                })

            elif message_type == "typing":
                # مؤشر الكتابة
                is_typing = data.get("is_typing", True)
                await chat_manager.broadcast_typing(
                    conversation_id,
                    user_id,
                    data.get("user_name", "Unknown"),
                    is_typing
                )

            elif message_type == "seen":
                # مؤشر الرسائل المقروءة
                await chat_manager.broadcast_seen(
                    conversation_id,
                    user_id,
                    data.get("user_name", "Unknown"),
                    data.get("last_seen_message_id", "")
                )

            elif message_type == "reaction":
                # تفاعل على رسالة
                await chat_manager.broadcast(conversation_id, {
                    "type": "reaction",
                    "data": data.get("data")
                })

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await chat_manager.disconnect(conversation_id, user_id)


# ============ المكالمات ============

@router.post('/calls')
async def initiate_call(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    بدء مكالمة صوت أو فيديو
    """
    try:
        from app.models.call import Call
        
        call_type = payload.get('type', 'audio')  # audio, video
        recipient_id = payload.get('recipient_id')
        conversation_id = payload.get('conversation_id')

        if not recipient_id and not conversation_id:
            raise HTTPException(status_code=400, detail="يجب تحديد المستقبل أو المحادثة")

        call = Call(
            initiator_id=current_user.id,
            recipient_id=recipient_id,
            conversation_id=conversation_id,
            call_type=call_type,
            status="ringing",
            created_at=datetime.utcnow()
        )
        db.add(call)
        db.commit()

        # بث دعوة المكالمة
        if conversation_id:
            await chat_manager.broadcast(conversation_id, {
                "type": "call_initiated",
                "data": {
                    "call_id": call.id,
                    "call_type": call_type,
                    "initiator_id": current_user.id,
                    "initiator_name": current_user.full_name or current_user.username,
                    "timestamp": call.created_at.isoformat() if call.created_at else None
                }
            })

        return {
            "success": True,
            "call_id": call.id,
            "call_type": call_type,
            "status": "ringing"
        }
    except Exception as e:
        logger.error(f"Initiate call error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/calls/{call_id}/accept')
async def accept_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    قبول مكالمة
    """
    try:
        from app.models.call import Call
        
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")

        call.status = "active"
        call.started_at = datetime.utcnow()
        db.commit()

        # بث قبول المكالمة
        if call.conversation_id:
            await chat_manager.broadcast(call.conversation_id, {
                "type": "call_accepted",
                "data": {
                    "call_id": call_id,
                    "status": "active",
                    "started_at": call.started_at.isoformat() if call.started_at else None
                }
            })

        return {
            "success": True,
            "call_id": call_id,
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Accept call error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/calls/{call_id}/reject')
async def reject_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    رفض مكالمة
    """
    try:
        from app.models.call import Call
        
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")

        call.status = "rejected"
        call.ended_at = datetime.utcnow()
        db.commit()

        # بث رفض المكالمة
        if call.conversation_id:
            await chat_manager.broadcast(call.conversation_id, {
                "type": "call_rejected",
                "data": {
                    "call_id": call_id,
                    "status": "rejected"
                }
            })

        return {
            "success": True,
            "call_id": call_id,
            "status": "rejected"
        }
    except Exception as e:
        logger.error(f"Reject call error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/calls/{call_id}/end')
async def end_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    إنهاء مكالمة
    """
    try:
        from app.models.call import Call
        
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="المكالمة غير موجودة")

        call.status = "ended"
        call.ended_at = datetime.utcnow()
        
        # حساب مدة المكالمة
        if call.started_at:
            duration = (call.ended_at - call.started_at).total_seconds()
            call.duration = int(duration)
        
        db.commit()

        # بث إنهاء المكالمة
        if call.conversation_id:
            await chat_manager.broadcast(call.conversation_id, {
                "type": "call_ended",
                "data": {
                    "call_id": call_id,
                    "status": "ended",
                    "duration": call.duration,
                    "ended_at": call.ended_at.isoformat() if call.ended_at else None
                }
            })

        return {
            "success": True,
            "call_id": call_id,
            "status": "ended",
            "duration": call.duration
        }
    except Exception as e:
        logger.error(f"End call error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
