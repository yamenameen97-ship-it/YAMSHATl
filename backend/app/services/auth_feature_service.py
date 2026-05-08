from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.email import delivery_provider, send_security_code_email, smtp_configured
from app.core.security import hash_password, verify_password
from app.models.login_challenge import LoginChallenge
from app.models.user import User
from app.services.auth_service import get_user_by_email, register_user


CHALLENGE_EXP_MINUTES = 10


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _generate_code(length: int = 6) -> str:
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))


def challenge_delivery_metadata() -> dict:
    return {
        'smtp_configured': smtp_configured(),
        'provider': delivery_provider(),
        'sent': False,
        'code_expires_in_minutes': CHALLENGE_EXP_MINUTES,
    }


def _send_code(user: User, code: str, challenge_type: str) -> dict:
    delivery = challenge_delivery_metadata()
    if delivery['smtp_configured']:
        try:
            send_security_code_email(user.email, code, reason=challenge_type.replace('_', ' '))
            delivery['sent'] = True
        except Exception as exc:
            delivery['error'] = str(exc)
            delivery['provider'] = delivery_provider()
    return delivery


def prune_login_challenges(db: Session, user: User | None = None) -> None:
    query = db.query(LoginChallenge).filter(
        (LoginChallenge.expires_at < utcnow_naive()) | (LoginChallenge.consumed_at.isnot(None))
    )
    if user is not None:
        query = query.filter(LoginChallenge.user_id == user.id)
    query.delete(synchronize_session=False)
    db.commit()


def issue_login_challenge(db: Session, user: User, *, challenge_type: str, meta: dict | None = None) -> dict:
    prune_login_challenges(db, user)
    code = _generate_code(6)
    challenge_id = secrets.token_urlsafe(24)
    record = LoginChallenge(
        user_id=user.id,
        challenge_id=challenge_id,
        code_hash=hash_password(code),
        challenge_type=challenge_type,
        meta_json=None if not meta else __import__('json').dumps(meta, ensure_ascii=False),
        expires_at=utcnow_naive() + timedelta(minutes=CHALLENGE_EXP_MINUTES),
    )
    db.add(record)
    db.commit()
    delivery = _send_code(user, code, challenge_type)
    payload = {
        'challenge_id': challenge_id,
        'challenge_type': challenge_type,
        'requires_2fa': True,
        'message': 'Additional verification is required',
        'delivery': delivery,
        'email': user.email,
    }
    return payload, code


def verify_login_challenge(db: Session, user: User, challenge_id: str, code: str, *, expected_type: str | None = None) -> LoginChallenge:
    prune_login_challenges(db, user)
    record = db.query(LoginChallenge).filter(
        LoginChallenge.user_id == user.id,
        LoginChallenge.challenge_id == str(challenge_id).strip(),
        LoginChallenge.consumed_at.is_(None),
    ).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Challenge not found')
    if expected_type and record.challenge_type != expected_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid challenge type')
    if record.expires_at < utcnow_naive():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Challenge expired')
    if not verify_password(str(code or '').strip(), record.code_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid verification code')
    record.consumed_at = utcnow_naive()
    db.commit()
    return record


def is_suspicious_login(user: User, binding: dict) -> tuple[bool, dict]:
    indicators = []
    if user.last_login_ip_hash and user.last_login_ip_hash != binding.get('ip_hash'):
        indicators.append('new_ip')
    if user.last_login_user_agent_hash and user.last_login_user_agent_hash != binding.get('user_agent_hash'):
        indicators.append('new_user_agent')
    if user.last_device_id_hash and binding.get('device_id_hash') and user.last_device_id_hash != binding.get('device_id_hash'):
        indicators.append('new_device')
    return bool(indicators), {'indicators': indicators}


def mark_successful_login(user: User, binding: dict) -> None:
    user.last_login_ip_hash = binding.get('ip_hash') or None
    user.last_login_user_agent_hash = binding.get('user_agent_hash') or None
    user.last_device_id_hash = binding.get('device_id_hash') or None


def social_login_or_register(
    db: Session,
    *,
    provider: str,
    email: str,
    username_hint: str | None = None,
    avatar: str | None = None,
    social_subject: str | None = None,
) -> User:
    normalized_email = str(email or '').strip().lower()
    if not normalized_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email is required for social login')
    provider_name = str(provider or '').strip().lower()[:40] or 'social'
    user = get_user_by_email(db, normalized_email)
    if user is None:
        base_username = (username_hint or normalized_email.split('@')[0] or provider_name).strip()[:40] or provider_name
        user = register_user(db, username=base_username, email=normalized_email, password=secrets.token_urlsafe(24), avatar=avatar)
    user.email_verified = True
    user.avatar = avatar or user.avatar
    user.social_provider = provider_name
    user.social_subject = str(social_subject or f'{provider_name}:{normalized_email}').strip()[:255]
    db.commit()
    db.refresh(user)
    return user
