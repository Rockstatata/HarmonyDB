from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="albums")
    cover_image = models.ImageField(upload_to="album_covers/", null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.artist.username}"

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="songs")
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True, related_name="songs")
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    cover_image = models.ImageField(upload_to="song_covers/", null=True, blank=True)
    audio_file = models.FileField(upload_to="songs/")
    release_date = models.DateField(auto_now_add=True)
    duration = models.FloatField(default=0)  # seconds
    play_count = models.PositiveIntegerField(default=0)
    upload_date = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.artist.username}"

class Playlist(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="playlists")
    cover_image = models.ImageField(upload_to="playlist_covers/", null=True, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"

class PlaylistSong(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="playlist_songs")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="in_playlists")
    added_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('playlist', 'song')
        ordering = ['order', 'added_at']

class Favorite(models.Model):
    ITEM_CHOICES = [
        ('song', 'Song'),
        ('album', 'Album'),
        ('playlist', 'Playlist'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    item_type = models.CharField(max_length=20, choices=ITEM_CHOICES)
    item_id = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item_type', 'item_id')

class ListeningHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listening_history")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="listening_history")
    listened_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    ITEM_CHOICES = [
        ('song', 'Song'),
        ('album', 'Album'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    item_type = models.CharField(max_length=20, choices=ITEM_CHOICES)
    item_id = models.PositiveIntegerField()
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class AIPrompt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_prompts")
    prompt_text = models.TextField()
    response_text = models.TextField(blank=True)
    generated_sql = models.TextField(blank=True)
    executed_result = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AIInteraction(models.Model):
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_interactions")
    prompt = models.ForeignKey(AIPrompt, on_delete=models.CASCADE, related_name="interactions")
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
