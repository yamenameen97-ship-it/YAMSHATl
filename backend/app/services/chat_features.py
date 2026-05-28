from sqlalchemy.orm import Session
from app.models.message import Message

def recall_message(db: Session, message_id: int, user_id: int) -> dict:
    # Placeholder for message recall logic
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == user_id).first()
    if message:
        message.content = "This message has been recalled."
        message.is_recalled = True
        db.commit()
        db.refresh(message)
        return {"message_id": message_id, "status": "recalled"}
    return {"message_id": message_id, "status": "not_found"}

def add_reaction(db: Session, message_id: int, user_id: int, reaction: str) -> dict:
    # Placeholder for advanced reactions logic
    # In a real app, this would involve storing reactions in the database
    return {"message_id": message_id, "user_id": user_id, "reaction": reaction, "status": "added"}

def apply_retention_policy(db: Session, chat_id: int, policy: str, user_id: int) -> dict:
    # Placeholder for retention policies logic
    # This would involve setting expiration dates for messages in a chat
    return {"chat_id": chat_id, "policy": policy, "status": "applied"}


MESSAGE_STATUS_FLOW = ["pending", "sent", "delivered", "read", "failed"]

def validate_message_status(status: str) -> bool:
    return status in MESSAGE_STATUS_FLOW
