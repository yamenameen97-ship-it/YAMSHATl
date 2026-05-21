from __future__ import annotations

from typing import Any
from fastapi import HTTPException, status

import bleach
from app.services.ai_service import moderate_comment, detect_spam, translate_and_moderate

TEXT_FIELDS = {
    'bio',
    'comment',
    'comments',
    'content',
    'message',
    'posts',
    'chat',
    'caption',
    'captions',
    'title',
    'username',
    'display_name',
}


def sanitize_text(value: Any, *, max_length: int = 5000) -> str:
    cleaned = bleach.clean(str(value or ''), tags=[], attributes={}, strip=True)
    cleaned = ' '.join(cleaned.split())
    return cleaned[: max(1, max_length)]


def sanitize_user_content(payload: Any, *, field_name: str | None = None, max_length: int = 5000) -> Any:
    if isinstance(payload, str):
        length = 600 if field_name in {'bio', 'comment', 'caption'} else max_length
        # Toxicity AI, Spam Detection, and Multilingual Moderation Hooks
        if field_name in TEXT_FIELDS and (field_name == 'comment' or field_name == 'content'):
            if not moderate_comment(payload):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment failed AI moderation during sanitization.')
            if detect_spam(payload):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment detected as spam during sanitization.')
            # Example for multilingual moderation: translate to English before further processing
            # payload = translate_and_moderate(payload, target_language='en')
        return sanitize_text(payload, max_length=length)
    if isinstance(payload, list):
        return [sanitize_user_content(item, field_name=field_name, max_length=max_length) for item in payload]
    if isinstance(payload, dict):
        sanitized: dict[str, Any] = {}
        for key, value in payload.items():
            key_name = str(key)
            key_length = 600 if key_name in {'bio', 'comment', 'caption'} else max_length
            if isinstance(value, str) and (key_name in TEXT_FIELDS or key_name.endswith('_text') or key_name.endswith('_content')):
                # Apply AI moderation to relevant text fields within dictionaries
                if key_name in {'comment', 'content'}:
                    if not moderate_comment(value):
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment failed AI moderation during sanitization.')
                    if detect_spam(value):
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Comment detected as spam during sanitization.')
                    # payload = translate_and_moderate(value, target_language='en')
                sanitized[key_name] = sanitize_text(value, max_length=key_length)
            else:
                sanitized[key_name] = sanitize_user_content(value, field_name=key_name, max_length=max_length)
        return sanitized
    return payload
