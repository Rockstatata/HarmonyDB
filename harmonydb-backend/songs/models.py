from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="songs")
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    cover_image = models.ImageField(upload_to="covers/", null=True, blank=True)
    audio_file = models.FileField(upload_to="songs/")
    release_date = models.DateField(auto_now_add=True)
    duration = models.FloatField(default=0)  # seconds
    play_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.title} - {self.artist.username}"
