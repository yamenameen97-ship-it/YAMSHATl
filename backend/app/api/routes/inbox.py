from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.inbox_service import get_conversations, archive_chat, pin_chat, mute_chat, smart_rank_inbox

router = APIRouter()


@router.post("/{chat_id}/archive")
def archive(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return archive_chat(db, chat_id, current_user.id)


@router.post("/{chat_id}/pin")
def pin(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return pin_chat(db, chat_id, current_user.id)


@router.post("/{chat_id}/mute")
def mute(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return mute_chat(db, chat_id, current_user.id)


@router.get("/")
def inbox(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = get_conversations(db, current_user.id)
    ranked_conversations = smart_rank_inbox(conversations, current_user)
    return ranked_conversations
