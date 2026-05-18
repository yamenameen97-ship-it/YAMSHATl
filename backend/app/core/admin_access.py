from __future__ import annotations

import os
import time
import hashlib
import json
from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException

DEFAULT_PRIMARY_ADMIN_EMAIL = 'yamenameen97@gmail.com'
PLACEHOLDER_ADMIN_EMAILS = {
    '',
    'admin@example.com',
    'your-admin@example.com',
}

# Admin Session Tracking
_admin_sessions: Dict[str, Dict[str, Any]] = {}

# Rate Limiting for Admin Actions
_admin_rate_limits: Dict[str, List[float]] = {}

def normalize_email(value: str | None) -> str:
    return (value or '').strip().lower()

def primary_admin_email() -> str:
    configured_email = normalize_email(os.getenv('PRIMARY_ADMIN_EMAIL'))
    if configured_email in PLACEHOLDER_ADMIN_EMAILS:
        return DEFAULT_PRIMARY_ADMIN_EMAIL
    return configured_email

def is_primary_admin_email(email: str | None) -> bool:
    return normalize_email(email) == primary_admin_email()

def is_primary_admin_user(user) -> bool:
    if user is None:
        return False
    return is_primary_admin_email(getattr(user, 'email', None))

def effective_role(user) -> str:
    if is_primary_admin_user(user):
        return 'admin'
    role = str(getattr(user, 'role', 'user') or 'user').strip().lower()
    return 'user' if role == 'admin' else role

def permissions_for_user(user, role_permissions: dict[str, list[str]]) -> list[str]:
    role = effective_role(user)
    return role_permissions.get(role, role_permissions.get('user', []))

# --- New Enhanced Security Features ---

def get_device_fingerprint(request: Request) -> str:
    """Generate a unique fingerprint for the admin device."""
    user_agent = request.headers.get('user-agent', '')
    accept_lang = request.headers.get('accept-language', '')
    ip = request.client.host if request.client else 'unknown'
    
    fingerprint_raw = f"{user_agent}|{accept_lang}|{ip}"
    return hashlib.sha256(fingerprint_raw.encode()).hexdigest()

def track_admin_session(user_id: str, request: Request):
    """Track and validate admin sessions with device fingerprinting."""
    fingerprint = get_device_fingerprint(request)
    session_id = hashlib.md5(f"{user_id}|{time.time()}".encode()).hexdigest()
    
    _admin_sessions[session_id] = {
        'user_id': user_id,
        'fingerprint': fingerprint,
        'last_activity': time.time(),
        'ip': request.client.host if request.client else 'unknown',
        'user_agent': request.headers.get('user-agent', '')
    }
    return session_id

def validate_admin_session(session_id: str, request: Request) -> bool:
    """Validate that the session is still active and matches the device fingerprint."""
    if session_id not in _admin_sessions:
        return False
    
    session = _admin_sessions[session_id]
    current_fingerprint = get_device_fingerprint(request)
    
    # Check fingerprint (Device binding)
    if session['fingerprint'] != current_fingerprint:
        log_sensitive_action("SECURITY_ALERT", f"Fingerprint mismatch for session {session_id}", request)
        return False
    
    # Check session timeout (e.g., 2 hours)
    if time.time() - session['last_activity'] > 7200:
        del _admin_sessions[session_id]
        return False
    
    session['last_activity'] = time.time()
    return True

def check_admin_rate_limit(admin_id: str, limit: int = 100, window: int = 3600):
    """Rate limit sensitive admin operations (e.g., 100 actions per hour)."""
    now = time.time()
    if admin_id not in _admin_rate_limits:
        _admin_rate_limits[admin_id] = []
    
    # Clean old entries
    _admin_rate_limits[admin_id] = [t for t in _admin_rate_limits[admin_id] if now - t < window]
    
    if len(_admin_rate_limits[admin_id]) >= limit:
        raise HTTPException(status_code=429, detail="Too many admin operations. Please wait.")
    
    _admin_rate_limits[admin_id].append(now)

def log_sensitive_action(action_type: str, details: str, request: Request, user_id: Optional[str] = None):
    """Log sensitive admin operations for audit trails."""
    log_entry = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'action': action_type,
        'details': details,
        'user_id': user_id,
        'ip': request.client.host if request.client else 'unknown',
        'fingerprint': get_device_fingerprint(request),
        'path': str(request.url.path)
    }
    
    # In a real app, this would go to a database or a secure log file
    # For now, we'll append to a local audit log file
    try:
        with open('/home/ubuntu/yamshat/YAMSHATl-main/backend/logs/admin_audit.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception:
        # Ensure logs directory exists
        os.makedirs('/home/ubuntu/yamshat/YAMSHATl-main/backend/logs', exist_ok=True)
        with open('/home/ubuntu/yamshat/YAMSHATl-main/backend/logs/admin_audit.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

def get_active_admin_sessions() -> List[Dict[str, Any]]:
    """Return a list of currently active admin sessions for monitoring."""
    now = time.time()
    active = []
    for sid, data in _admin_sessions.items():
        if now - data['last_activity'] < 7200:
            active.append({'session_id': sid, **data})
    return active
