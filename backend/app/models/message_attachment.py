"""نموذج مرفقات الرسائل (صور/فيديو/صوت/ملفات متعددة لكل رسالة)."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)

from app.db.base import Base


class MessageAttachment(Base):
    __tablename__ = 'message_attachments'
    __table_args__ = (
        Index('ix_message_attachments_message_id', 'message_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(
        Integer,
        ForeignKey('messages.id', ondelete='CASCADE'),
        nullable=False,
    )

    url = Column(Text, nullable=False)
    cdn_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)

    # image | video | audio | voice | file | gif | sticker
    kind = Column(String(20), nullable=False, default='file')
    mime_type = Column(String(128), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(BigInteger, nullable=True)

    # أبعاد الوسائط البصرية
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

    # مدة الصوت/الفيديو بالثواني
    duration_seconds = Column(Float, nullable=True)

    # JSON-encoded waveform peaks for voice notes
    waveform = Column(Text, nullable=True)

    # ترتيب المرفق داخل الرسالة (لرسائل الـ album)
    position = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
