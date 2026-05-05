import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

APP_NAME = os.getenv('PROJECT_NAME', 'YAMSHAT')
SMTP_SERVER = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME') or os.getenv('EMAIL_ADDRESS')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('EMAIL_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or os.getenv('EMAIL_ADDRESS') or SMTP_USERNAME
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'


def smtp_configured() -> bool:
    return bool(SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM)


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None):
    if not smtp_configured():
        raise RuntimeError('SMTP settings are incomplete. Set SMTP_USERNAME/SMTP_PASSWORD/SMTP_FROM or EMAIL_ADDRESS/EMAIL_PASSWORD.')

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
