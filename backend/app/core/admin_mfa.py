from __future__ import annotations

import base64
import hashlib
import hmac
import struct
import time


def generate_totp(secret: str, *, timestamp: int | None = None, interval: int = 30, digits: int = 6) -> str:
    counter = int((timestamp or time.time()) // max(1, interval))
    padded_secret = (secret or '').strip().upper().replace(' ', '')
    key = base64.b32decode(padded_secret + '=' * ((8 - len(padded_secret) % 8) % 8), casefold=True)
    msg = struct.pack('>Q', counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = (struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7fffffff) % (10 ** digits)
    return str(code_int).zfill(digits)


def verify_totp(secret: str, code: str, *, window: int = 1) -> bool:
    normalized = str(code or '').strip()
    if not normalized or not normalized.isdigit():
        return False
    now = int(time.time())
    for delta in range(-max(0, window), max(0, window) + 1):
        if generate_totp(secret, timestamp=now + (delta * 30)) == normalized:
            return True
    return False
