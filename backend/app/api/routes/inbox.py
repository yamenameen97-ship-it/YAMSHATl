from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.inbox_service import get_conversations

router = APIRouter()


@router.get('/')
def inbox(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_conversations(db, current_user.id)
