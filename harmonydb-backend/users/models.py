from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        LISTENER = "listener", "Music Listener"
        ARTIST   = "artist", "Artist"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LISTENER)
    email_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to="profile_pictures/", null=True, blank=True)
    bio = models.TextField(blank=True)
    
    # Artist-specific fields (only used when role is artist)
    stage_name = models.CharField(max_length=255, blank=True)
    
    # Listener-specific fields
    birth_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def display_name(self):
        if self.role == self.Role.ARTIST and self.stage_name:
            return self.stage_name
        return self.username
