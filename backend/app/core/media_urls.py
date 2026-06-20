from __future__ import annotations

from urllib.parse import urlparse

from app.core.config import settings


def _base_origin() -> str:
    return (settings.CDN_BASE_URL or settings.BACKEND_ORIGIN or settings.RENDER_EXTERNAL_URL or '').strip().rstrip('/')


def normalize_media_url(candidate: str | None) -> str | None:
    raw = str(candidate or '').strip()
    if not raw:
        return None
    if raw.startswith(('blob:', 'data:')):
        return raw

    base_origin = _base_origin()

    if raw.startswith('api/uploads/'):
        raw = f"/{raw[4:]}"
    elif raw.startswith('/api/uploads/'):
        raw = raw[4:]

    if raw.startswith('/'):
        return f'{base_origin}{raw}' if base_origin else raw

    if raw.startswith('uploads/'):
        path = f'/{raw.lstrip("/")}'
        return f'{base_origin}{path}' if base_origin else path

    parsed = urlparse(raw)
    if parsed.scheme in {'http', 'https'}:
        path = parsed.path or ''
        if path.startswith('/api/uploads/'):
            path = path[4:]
        query = f'?{parsed.query}' if parsed.query else ''
        fragment = f'#{parsed.fragment}' if parsed.fragment else ''
        if '/uploads/' in path and base_origin:
            return f'{base_origin}{path}{query}{fragment}'
        return raw

    return raw


def normalize_media_list(values) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        values = [values]
    cleaned: list[str] = []
    for item in values if isinstance(values, list) else []:
        normalized = normalize_media_url(item)
        if normalized and normalized not in cleaned:
            cleaned.append(normalized)
    return cleaned
