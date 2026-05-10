import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import httpx
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

from app.celery_app import celery_app

logger = logging.getLogger(__name__)

APP_NAME = os.getenv('PROJECT_NAME', 'YAMSHAT')

SMTP_SERVER = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME') or os.getenv('EMAIL_ADDRESS')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('EMAIL_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or os.getenv('EMAIL_ADDRESS') or SMTP_USERNAME
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'

RESEND_API_URL = 'https://api.resend.com/emails'
RESEND_API_KEY = (os.getenv('RESEND_API_KEY') or '').strip()
RESEND_FROM = (
    os.getenv('RESEND_FROM')
    or os.getenv('SMTP_FROM')
    or os.getenv('EMAIL_ADDRESS')
    or ''
).strip()
RESEND_REPLY_TO = (os.getenv('RESEND_REPLY_TO') or RESEND_FROM).strip()

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


def resend_configured() -> bool:
    return bool(RESEND_API_KEY and RESEND_FROM)


def brevo_configured() -> bool:
    return bool(BREVO_API_KEY and BREVO_SENDER_EMAIL)


def smtp_credentials_configured() -> bool:
    return bool(SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM)


def smtp_configured() -> bool:
    return smtp_credentials_configured()


def delivery_provider() -> str | None:
    if resend_configured():
        return 'resend'
    if brevo_configured():
        return 'brevo'
    if smtp_credentials_configured():
        return 'smtp'
    return None


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2), retry=retry_if_exception_type(httpx.RequestError))
def send_email_via_resend(to_email: str, subject: str, body: str, html_body: str | None = None):
    payload = {
        'from': RESEND_FROM,
        'to': [to_email],
        'subject': subject,
    }
    if html_body:
        payload['html'] = html_body
    if body:
        payload['text'] = body
    if RESEND_REPLY_TO:
        payload['reply_to'] = RESEND_REPLY_TO
    if 'html' not in payload and 'text' not in payload:
        raise RuntimeError('Email body is empty')

    response = httpx.post(
        RESEND_API_URL,
        headers={
            'Authorization': f'Bearer {RESEND_API_KEY}',
            'Content-Type': 'application/json',
        },
        json=payload,
        timeout=20,
    )
    response.raise_for_status()


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2), retry=retry_if_exception_type(httpx.RequestError))
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


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2), retry=retry_if_exception_type(smtplib.SMTPException))
def send_email_via_smtp(to_email: str, subject: str, body: str, html_body: str | None = None):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    if html_body:
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    use_ssl = SMTP_PORT == 465
    server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) if use_ssl else smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20)
    try:
        if SMTP_USE_TLS and not use_ssl:
            server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except Exception:
            pass


@celery_app.task(bind=True, retry_backoff=True, max_retries=5)
def send_email_task(self, to_email: str, subject: str, body: str, html_body: str | None = None):
    providers = []
    if resend_configured():
        providers.append('resend')
    if brevo_configured():
        providers.append('brevo')
    if smtp_credentials_configured():
        providers.append('smtp')

    if not providers:
        logger.error('No email delivery providers configured.')
        raise RuntimeError('No email delivery providers configured.')

    for provider in providers:
        try:
            if provider == 'resend':
                send_email_via_resend(to_email, subject, body, html_body)
            elif provider == 'brevo':
                send_email_via_brevo(to_email, subject, body, html_body)
            elif provider == 'smtp':
                send_email_via_smtp(to_email, subject, body, html_body)
            logger.info(f'Email sent successfully via {provider} to {to_email}')
            # Placeholder for email analytics
            log_email_analytics(to_email, subject, provider, 'success')
            return
        except Exception as e:
            logger.warning(f'Failed to send email via {provider} to {to_email}: {e}')
            log_email_analytics(to_email, subject, provider, 'failure', str(e))
            # If it's the last provider, re-raise the exception for Celery to handle retries
            if provider == providers[-1]:
                raise self.retry(exc=e)

def log_email_analytics(to_email: str, subject: str, provider: str, status: str, error_message: str | None = None):
    # This is a placeholder function for logging email analytics.
    # In a real application, this would involve storing data in a database,
    # sending it to an analytics service, or logging it in a structured format.
    logger.info(f'Email Analytics: to={to_email}, subject={subject}, provider={provider}, status={status}, error={error_message}')


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None):
    send_email_task.delay(to_email, subject, body, html_body)


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


def send_security_code_email(to_email: str, code: str, *, reason: str = 'login verification'):
    subject = f'{APP_NAME} security verification code'
    body = (
        f'We detected a {reason} step for your {APP_NAME} account.\n\n'
        f'Your security code is: {code}\n'
        'This code will expire soon. If this was not you, please change your password and review your sessions.'
    )
    html_body = (
        f'<h2>{APP_NAME} security verification</h2>'
        f'<p>We detected a <strong>{reason}</strong> step for your account.</p>'
        f'<p style="font-size:28px;font-weight:700;letter-spacing:4px;">{code}</p>'
        '<p>This code will expire soon. If this was not you, please change your password and review your sessions.</p>'
    )
    send_email(to_email, subject, body, html_body)
