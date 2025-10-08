from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        LISTENER = "listener", "Music Listener"
        ARTIST   = "artist", "Artist"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LISTENER)
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"
