from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


def can_send_email() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD and settings.SMTP_FROM)


def send_verification_email(to_email: str, verify_link: str) -> bool:
    if not can_send_email():
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Verify your Avagama.ai account'
    msg['From'] = settings.SMTP_FROM
    msg['To'] = to_email
    msg.set_content(
        f"Welcome to Avagama.ai!\n\nPlease verify your email by clicking the link below:\n{verify_link}\n\n"
        f"If you did not create this account, you can ignore this message."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
    return True
