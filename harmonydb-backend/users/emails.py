from django.conf import settings
from django.core.mail import send_mail

def send_email_verification(email_to: str, link: str):
    subject = "Verify your HarmonyDB email"
    body = f"Welcome to HarmonyDB!\n\nPlease verify your email by clicking the link:\n{link}\n\nIf you did not sign up, ignore this email."
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email_to], fail_silently=False)

def send_password_reset(email_to: str, link: str):
    subject = "Reset your HarmonyDB password"
    body = f"We received a password reset request.\nReset your password using the link:\n{link}\n\nIf you did not request this, ignore this email."
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email_to], fail_silently=False)
