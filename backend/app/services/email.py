import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

APP_NAME = os.getenv('PROJECT_NAME', 'YAMSHAT')

SMTP_SERVER = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME') or os.getenv('EMAIL_ADDRESS')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('EMAIL_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or os.getenv('EMAIL_ADDRESS') or SMTP_USERNAME
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'

BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
BREVO_API_KEY = (os.getenv('BREVO_API_KEY') or '').strip()
BREVO_SENDER_EMAIL = (
    os.getenv('BREVO_SENDER_EMAIL')
    or os.getenv('SMTP_FROM')
    or os.getenv('EMAIL_ADDRESS')
    or ''
).strip()
BREVO_SENDER_NAME = (os.getenv('BREVO_SENDER_NAME') or APP_NAME).strip() or APP_NAME
BREVO_REPLY_TO = (os.getenv('BREVO_REPLY_TO') or BREVO_SENDER_EMAIL).strip()


def brevo_configured() -> bool:
    return bool(BREVO_API_KEY and BREVO_SENDER_EMAIL)


def smtp_credentials_configured() -> bool:
    return bool(SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM)


def smtp_configured() -> bool:
    return brevo_configured() or smtp_credentials_configured()


def delivery_provider() -> str | None:
    if brevo_configured():
        return 'brevo'
    if smtp_credentials_configured():
        return 'smtp'
    return None


def send_email_via_brevo(to_email: str, subject: str, body: str, html_body: str | None = None):
    payload = {
        'sender': {
            'name': BREVO_SENDER_NAME,
            'email': BREVO_SENDER_EMAIL,
        },
        'to': [
            {
                'email': to_email,
            }
        ],
        'subject': subject,
        'tags': ['yamshat', 'transactional'],
    }

    if BREVO_REPLY_TO:
        payload['replyTo'] = {
            'name': BREVO_SENDER_NAME,
            'email': BREVO_REPLY_TO,
        }

    if html_body:
        payload['htmlContent'] = html_body
    if body:
        payload['textContent'] = body

    if 'htmlContent' not in payload and 'textContent' not in payload:
        raise RuntimeError('Email body is empty')

    response = httpx.post(
        BREVO_API_URL,
        headers={
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': BREVO_API_KEY,
        },
        json=payload,
        timeout=20,
    )
    response.raise_for_status()


def send_email_via_smtp(to_email: str, subject: str, body: str, html_body: str | None = None):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    if html_body:
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20)
    try:
        if SMTP_USE_TLS:
            server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except Exception:
            pass


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None):
    if brevo_configured():
        send_email_via_brevo(to_email, subject, body, html_body)
        return

    if smtp_credentials_configured():
        send_email_via_smtp(to_email, subject, body, html_body)
        return

    raise RuntimeError(
        'Email delivery is not configured. Set BREVO_API_KEY + BREVO_SENDER_EMAIL or SMTP_USERNAME/SMTP_PASSWORD/SMTP_FROM.'
    )


def send_verification_email(to_email: str, code: str):
    subject = f'{APP_NAME} email verification code'
    body = (
        f'Welcome to {APP_NAME}.\n\n'
        f'Your email verification code is: {code}\n'
        'This code will expire soon. If you did not create this account, please ignore this email.'
    )
    html_body = (
        f'<h2>Welcome to {APP_NAME}</h2>'
        f'<p>Your email verification code is:</p>'
        f'<p style="font-size:28px;font-weight:700;letter-spacing:4px;">{code}</p>'
        '<p>This code will expire soon. If you did not create this account, please ignore this email.</p>'
    )
    send_email(to_email, subject, body, html_body)


def send_password_reset_email(to_email: str, code: str):
    subject = f'{APP_NAME} password reset code'
    body = (
        f'You requested a password reset for {APP_NAME}.\n\n'
        f'Your reset code is: {code}\n'
        'This code will expire soon. If this request was not made by you, please ignore this email.'
    )
    html_body = (
        f'<h2>{APP_NAME} password reset</h2>'
        f'<p>Your reset code is:</p>'
        f'<p style="font-size:28px;font-weight:700;letter-spacing:4px;">{code}</p>'
        '<p>This code will expire soon. If this request was not made by you, please ignore this email.</p>'
    )
    send_email(to_email, subject, body, html_body)
