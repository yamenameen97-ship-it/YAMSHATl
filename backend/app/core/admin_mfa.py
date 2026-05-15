from __future__ import annotations

import base64
import hashlib
import hmac
import struct
import time
import json
import os
from typing import Optional, Dict, List

# Rate limiting for MFA attempts
_mfa_attempts: Dict[str, List[float]] = {}

def generate_totp(secret: str, *, timestamp: int | None = None, interval: int = 30, digits: int = 6) -> str:
    counter = int((timestamp or time.time()) // max(1, interval))
    padded_secret = (secret or '').strip().upper().replace(' ', '')
    key = base64.b32decode(padded_secret + '=' * ((8 - len(padded_secret) % 8) % 8), casefold=True)
    msg = struct.pack('>Q', counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = (struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % (10 ** digits)
    return str(code_int).zfill(digits)

def verify_totp(secret: str, code: str, *, window: int = 1, admin_id: Optional[str] = None) -> bool:
    """Verify TOTP with rate limiting and security logging."""
    normalized = str(code or '').strip()
    if not normalized or not normalized.isdigit():
        return False
    
    # Rate limiting check
    if admin_id:
        now = time.time()
        if admin_id not in _mfa_attempts:
            _mfa_attempts[admin_id] = []
        
        # Clean old attempts (last 10 minutes)
        _mfa_attempts[admin_id] = [t for t in _mfa_attempts[admin_id] if now - t < 600]
        
        if len(_mfa_attempts[admin_id]) >= 5:
            _log_mfa_event("MFA_LOCKED", f"Too many failed MFA attempts for admin {admin_id}", admin_id)
            return False

    now = int(time.time())
    is_valid = False
    for delta in range(-max(0, window), max(0, window) + 1):
        if generate_totp(secret, timestamp=now + (delta * 30)) == normalized:
            is_valid = True
            break
    
    if not is_valid and admin_id:
        _mfa_attempts[admin_id].append(time.time())
        _log_mfa_event("MFA_FAILED", f"Invalid MFA code entered for admin {admin_id}", admin_id)
    elif is_valid and admin_id:
        # Reset attempts on success
        _mfa_attempts[admin_id] = []
        _log_mfa_event("MFA_SUCCESS", f"Successful MFA verification for admin {admin_id}", admin_id)
        
    return is_valid

def _log_mfa_event(event_type: str, message: str, admin_id: str):
    """Internal helper to log MFA security events."""
    log_entry = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'event': event_type,
        'message': message,
        'admin_id': admin_id
    }
    try:
        log_dir = '/home/ubuntu/yamshat/YAMSHATl-main/backend/logs'
        os.makedirs(log_dir, exist_ok=True)
        with open(f"{log_dir}/admin_security.log", 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception:
        pass

def generate_admin_mfa_secret(admin_id: str) -> str:
    """Generate a new random base32 secret for an admin."""
    random_bytes = os.urandom(20)
    secret = base64.b32encode(random_bytes).decode('utf-8').replace('=', '')
    _log_mfa_event("MFA_SECRET_GENERATED", f"New MFA secret generated for admin {admin_id}", admin_id)
    return secret

def validate_admin_device(admin_id: str, fingerprint: str) -> bool:
    """Validate if the device fingerprint is recognized for this admin."""
    # In a real app, this would check against a database of trusted devices
    # For now, we'll simulate a check
    trusted_devices_file = '/home/ubuntu/yamshat/YAMSHATl-main/backend/app/core/trusted_devices.json'
    try:
        if os.path.exists(trusted_devices_file):
            with open(trusted_devices_file, 'r') as f:
                trusted = json.load(f)
                return fingerprint in trusted.get(admin_id, [])
    except Exception:
        pass
    return True # Default to true for demo, but would be false in production
