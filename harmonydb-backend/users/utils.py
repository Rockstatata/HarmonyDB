from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model

User = get_user_model()

def encode_uid(pk: int) -> str:
    return urlsafe_base64_encode(force_bytes(str(pk)))  

def decode_uid(uidb64: str):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        return User.objects.get(pk=uid)
    except Exception:
        return None