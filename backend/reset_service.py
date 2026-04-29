from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import smtplib
import urllib.parse
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr

from config import Config


_DIGITS = "0123456789"


def generate_reset_code() -> str:
    length = max(int(Config.RESET_CODE_LENGTH or 6), 4)
    return "".join(secrets.choice(_DIGITS) for _ in range(length))


def hash_reset_code(code: str) -> str:
    return hashlib.sha256(str(code or "").encode("utf-8")).hexdigest()


def verify_reset_code(code: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_reset_code(code), str(expected_hash or ""))


def send_reset_code(target: str, channel: str, code: str) -> None:
    if channel == "email":
        _send_email_code(target, code)
        return
    if channel == "whatsapp":
        _send_whatsapp_code(target, code)
        return
    raise RuntimeError("Unsupported reset channel")


def _send_email_code(target: str, code: str) -> None:
    if not Config.SMTP_HOST or not Config.SMTP_FROM_EMAIL:
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "رمز إعادة تعيين كلمة المرور"
    message["From"] = formataddr((Config.SMTP_FROM_NAME, Config.SMTP_FROM_EMAIL))
    message["To"] = target
    message.set_content(
        "\n".join(
            [
                "مرحباً،",
                "",
                f"رمز إعادة تعيين كلمة المرور الخاص بك هو: {code}",
                f"صلاحية الرمز: {Config.RESET_CODE_EXPIRE_MINUTES} دقائق.",
                "إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.",
            ]
        )
    )

    if Config.SMTP_USE_SSL:
        server = smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT, timeout=20)
    else:
        server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=20)

    with server:
        if not Config.SMTP_USE_SSL and Config.SMTP_USE_TLS:
            server.starttls()
        if Config.SMTP_USER:
            server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
        server.send_message(message)


def _send_whatsapp_code(target: str, code: str) -> None:
    if not Config.TWILIO_ACCOUNT_SID or not Config.TWILIO_AUTH_TOKEN or not Config.TWILIO_WHATSAPP_FROM:
        raise RuntimeError("Twilio WhatsApp is not configured")

    from_value = _ensure_whatsapp_prefix(Config.TWILIO_WHATSAPP_FROM)
    to_value = _ensure_whatsapp_prefix(target)

    payload = {
        "From": from_value,
        "To": to_value,
    }

    if Config.TWILIO_WHATSAPP_CONTENT_SID:
        payload["ContentSid"] = Config.TWILIO_WHATSAPP_CONTENT_SID
        payload["ContentVariables"] = json.dumps(
            {
                "1": code,
                "2": str(Config.RESET_CODE_EXPIRE_MINUTES),
            },
            ensure_ascii=False,
        )
    else:
        payload["Body"] = (
            f"رمز إعادة تعيين كلمة المرور في Yamshat هو: {code}. "
            f"صلاحيته {Config.RESET_CODE_EXPIRE_MINUTES} دقائق."
        )

    data = urllib.parse.urlencode(payload).encode("utf-8")
    auth = base64.b64encode(f"{Config.TWILIO_ACCOUNT_SID}:{Config.TWILIO_AUTH_TOKEN}".encode("utf-8")).decode("ascii")
    request = urllib.request.Request(
        url=f"https://api.twilio.com/2010-04-01/Accounts/{Config.TWILIO_ACCOUNT_SID}/Messages.json",
        data=data,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status >= 300:
            raise RuntimeError("Twilio request failed")


def _ensure_whatsapp_prefix(value: str) -> str:
    cleaned = str(value or "").strip()
    if cleaned.startswith("whatsapp:"):
        return cleaned
    return f"whatsapp:{cleaned}"
