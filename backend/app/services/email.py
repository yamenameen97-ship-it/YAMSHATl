import os
import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME') or os.getenv('EMAIL_ADDRESS')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('EMAIL_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or os.getenv('EMAIL_ADDRESS') or SMTP_USERNAME
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'


def send_email(to_email: str, subject: str, body: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD or not SMTP_FROM:
        raise RuntimeError('SMTP settings are incomplete. Set SMTP_USERNAME/SMTP_PASSWORD/SMTP_FROM or EMAIL_ADDRESS/EMAIL_PASSWORD.')

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email

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
