"""
نماذج الشات والمكالمات - Chat & Calls Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class Conversation(Base):
    """نموذج المحادثات"""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    is_group = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # العلاقات
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, name={self.name}, is_group={self.is_group})>"


class ConversationParticipant(Base):
    """نموذج مشاركي المحادثة"""
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, nullable=True)

    # العلاقات
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="conversations")

    def __repr__(self):
        return f"<ConversationParticipant(conversation_id={self.conversation_id}, user_id={self.user_id})>"


class Message(Base):
    """نموذج الرسائل"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True, nullable=False)
    sender_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    content = Column(Text, nullable=True)
    message_type = Column(String(50), default="text")  # text, image, video, audio, file
    status = Column(String(50), default="sent")  # sending, sent, delivered, seen
    reply_to = Column(Integer, ForeignKey("messages.id"), nullable=True)
    attachments = Column(JSON, default=[])
    reactions = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    # العلاقات
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages")
    reply = relationship("Message", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"<Message(id={self.id}, conversation_id={self.conversation_id}, sender_id={self.sender_id})>"


class MessageRead(Base):
    """نموذج قراءة الرسائل"""
    __tablename__ = "message_reads"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow, index=True)

    # العلاقات
    message = relationship("Message", backref="reads")
    user = relationship("User", backref="message_reads")

    def __repr__(self):
        return f"<MessageRead(message_id={self.message_id}, user_id={self.user_id})>"


class Call(Base):
    """نموذج المكالمات"""
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    initiator_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    call_type = Column(String(50), default="audio")  # audio, video
    status = Column(String(50), default="ringing")  # ringing, active, ended, rejected, missed
    duration = Column(Integer, default=0)  # بالثواني
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    # العلاقات
    initiator = relationship("User", foreign_keys=[initiator_id], backref="initiated_calls")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_calls")
    conversation = relationship("Conversation", backref="calls")

    def __repr__(self):
        return f"<Call(id={self.id}, initiator_id={self.initiator_id}, call_type={self.call_type})>"


class VoiceMessage(Base):
    """نموذج الرسائل الصوتية"""
    __tablename__ = "voice_messages"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), index=True, nullable=False)
    audio_url = Column(String(500), nullable=False)
    duration = Column(Integer, default=0)  # بالثواني
    waveform = Column(JSON, default=[])  # بيانات الموجة
    transcription = Column(Text, nullable=True)  # النص المستخرج
    created_at = Column(DateTime, default=datetime.utcnow)

    # العلاقات
    message = relationship("Message", backref="voice_data")

    def __repr__(self):
        return f"<VoiceMessage(id={self.id}, message_id={self.message_id})>"


class MessageAttachment(Base):
    """نموذج مرفقات الرسائل"""
    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), index=True, nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # image, video, file, etc.
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)  # بالبايتات
    created_at = Column(DateTime, default=datetime.utcnow)

    # العلاقات
    message = relationship("Message", backref="attachments_data")

    def __repr__(self):
        return f"<MessageAttachment(id={self.id}, message_id={self.message_id})>"
