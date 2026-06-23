#!/usr/bin/env python3
"""
v59.4 — سكربت ترحيل لرسائل الدردشة من ملف JSON القديم
        (chat_messages_db.json الخاص بـ chat-service المحذوف)
        إلى قاعدة بيانات backend monolith الموحَّدة (PostgreSQL / Message model).

الاستخدام:
    DATABASE_URL=postgresql+psycopg2://user:pass@host/db \\
    python scripts/migrate_chat_json_to_db.py /path/to/chat_messages_db.json

الميزات:
- ترحيل آمن idempotent (يستخدم client_id فريد مأخوذ من id JSON القديم).
- يحترم deleted_for_everyone و is_edited و edited_at.
- يخطّي الرسائل التي لا يمكن ربط sender/receiver لها بمستخدم نشط.
- يُسجِّل ملخصاً نهائياً + ملف تقرير JSON بجوار المصدر.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# اعتماد بيئة الـ backend
HERE = Path(__file__).resolve().parent
BACKEND_DIR = HERE.parent / 'backend'
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from app.db.session import SessionLocal  # type: ignore
    from app.models.message import Message  # type: ignore
    from app.models.user import User  # type: ignore
    from app.services.encryption_service import encrypt_message  # type: ignore
except Exception as exc:  # pragma: no cover
    print(f"❌ لا يمكن استيراد بيئة الـ backend: {exc}", file=sys.stderr)
    print("    تأكد من ضبط DATABASE_URL و PYTHONPATH=backend", file=sys.stderr)
    sys.exit(2)


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)
    except Exception:
        return None


def _resolve_user(db, ident: Optional[str]) -> Optional[User]:
    """يحاول مطابقة معرّف المستخدم القديم: قد يكون id رقمي أو username."""
    if not ident:
        return None
    s = str(ident).strip()
    if not s:
        return None
    if s.isdigit():
        user = db.query(User).filter(User.id == int(s)).first()
        if user:
            return user
    return db.query(User).filter(User.username == s).first()


def migrate(json_path: Path) -> Dict:
    if not json_path.exists():
        raise FileNotFoundError(json_path)

    with json_path.open('r', encoding='utf-8') as fh:
        data = json.load(fh)

    messages_by_conv: Dict[str, List[Dict]] = data.get('messages') or {}
    stats = {
        'conversations_seen': 0,
        'messages_seen': 0,
        'migrated': 0,
        'skipped_no_sender': 0,
        'skipped_no_receiver': 0,
        'skipped_duplicate': 0,
        'errors': 0,
        'errors_samples': [],
    }

    db = SessionLocal()
    try:
        for conv_id, msgs in messages_by_conv.items():
            stats['conversations_seen'] += 1
            for raw in msgs:
                stats['messages_seen'] += 1

                old_id = str(raw.get('id') or '').strip()
                sender_ident = raw.get('sender_id')
                receiver_ident = raw.get('receiver_id')
                content = str(raw.get('content') or '')
                created_at = _parse_iso(raw.get('timestamp')) or datetime.utcnow()

                sender = _resolve_user(db, sender_ident)
                if sender is None:
                    stats['skipped_no_sender'] += 1
                    continue
                receiver = _resolve_user(db, receiver_ident)
                if receiver is None:
                    stats['skipped_no_receiver'] += 1
                    continue

                # client_id idempotent: يربط الرسالة القديمة بصف واحد فقط
                client_id = f'legacy:{old_id}' if old_id else f'legacy:{conv_id}:{stats["messages_seen"]}'
                exists = db.query(Message.id).filter(
                    Message.sender_id == sender.id,
                    Message.client_id == client_id,
                ).first()
                if exists is not None:
                    stats['skipped_duplicate'] += 1
                    continue

                try:
                    msg = Message(
                        sender_id=sender.id,
                        receiver_id=receiver.id,
                        sender=sender.username,
                        receiver=receiver.username,
                        client_id=client_id,
                        message=content,
                        content=encrypt_message(content) if content else '',
                        message_type='text',
                        created_at=created_at,
                        is_edited=bool(raw.get('is_edited')),
                        edited_at=_parse_iso(raw.get('edited_at')),
                        deleted_for_everyone=bool(raw.get('deleted_for_everyone')),
                        deleted_at=created_at if raw.get('deleted_for_everyone') else None,
                    )
                    db.add(msg)
                    db.flush()
                    stats['migrated'] += 1
                except Exception as exc:  # pragma: no cover
                    db.rollback()
                    stats['errors'] += 1
                    if len(stats['errors_samples']) < 5:
                        stats['errors_samples'].append(repr(exc))

        db.commit()
    finally:
        db.close()

    return stats


def main() -> int:
    if len(sys.argv) < 2:
        print("الاستخدام: python scripts/migrate_chat_json_to_db.py <path/to/chat_messages_db.json>")
        return 1

    src = Path(sys.argv[1]).expanduser().resolve()
    print(f"📦 ترحيل {src} → قاعدة البيانات الموحَّدة …")
    stats = migrate(src)

    report_path = src.with_suffix('.migration-report.json')
    report_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')

    print("\n— التقرير —")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print(f"\n✅ التقرير الكامل في: {report_path}")
    return 0 if stats['errors'] == 0 else 3


if __name__ == '__main__':
    raise SystemExit(main())
