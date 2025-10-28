from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db import models
from django.forms import Textarea
from .models import (
    Song, Album, Genre, Playlist, PlaylistSong, 
    Favorite, ListeningHistory, Comment, AIPrompt, AIInteraction
)

# Inline Classes
class PlaylistSongInline(admin.TabularInline):
    model = PlaylistSong
    extra = 1
    fields = ('song', 'order', 'added_at')
    readonly_fields = ('added_at',)
    ordering = ('order', 'added_at')

class SongInline(admin.TabularInline):
    model = Song
    extra = 0
    fields = ('title', 'genre', 'duration', 'play_count', 'approved')
    readonly_fields = ('play_count',)
    show_change_link = True

class AIInteractionInline(admin.StackedInline):
    model = AIInteraction
    extra = 0
    fields = ('message_type', 'message_text', 'timestamp')
    readonly_fields = ('timestamp',)

# Admin Classes
@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description', 'songs_count')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    def songs_count(self, obj):
        count = obj.song_set.count()
        if count > 0:
            url = reverse('admin:songs_song_changelist') + f'?genre__id__exact={obj.id}'
            return format_html('<a href="{}">{} songs</a>', url, count)
        return f"{count} songs"
    songs_count.short_description = "Songs"

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'artist_link', 'album_link', 'genre', 
        'duration_formatted', 'play_count', 'approved', 
        'cover_preview', 'upload_date'
    )
    list_filter = (
        'approved', 'genre', 'upload_date', 'release_date', 
        'artist__role', 'album__title'
    )
    search_fields = ('title', 'artist__username', 'artist__stage_name', 'album__title')
    ordering = ('-upload_date',)
    readonly_fields = ('id', 'play_count', 'upload_date', 'audio_url_display')
    filter_horizontal = ()
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'artist', 'album', 'genre')
        }),
        ('Media Files', {
            'fields': ('cover_image', 'audio_file', 'audio_url_display')
        }),
        ('Details', {
            'fields': ('duration', 'release_date', 'approved')
        }),
        ('Statistics', {
            'fields': ('play_count', 'upload_date'),
            'classes': ('collapse',)
        }),
    )

    def artist_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.artist.id])
        return format_html('<a href="{}">{}</a>', url, obj.artist.display_name)
    artist_link.short_description = "Artist"

    def album_link(self, obj):
        if obj.album:
            url = reverse('admin:songs_album_change', args=[obj.album.id])
            return format_html('<a href="{}">{}</a>', url, obj.album.title)
        return "Single"
    album_link.short_description = "Album"

    def duration_formatted(self, obj):
        if obj.duration:
            mins = int(obj.duration // 60)
            secs = int(obj.duration % 60)
            return f"{mins}:{secs:02d}"
        return "0:00"
    duration_formatted.short_description = "Duration"

    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />',
                obj.cover_image.url
            )
        return "No Cover"
    cover_preview.short_description = "Cover"

    def audio_url_display(self, obj):
        if obj.audio_file:
            return format_html(
                '<audio controls style="width: 300px;"><source src="{}" type="audio/mpeg"></audio>',
                obj.audio_file.url
            )
        return "No Audio"
    audio_url_display.short_description = "Audio Preview"

    actions = ['approve_songs', 'disapprove_songs', 'bulk_delete', 'export_song_data']
    
    def export_song_data(self, request, queryset):
        """Export selected songs as CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="songs_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Title', 'Artist', 'Album', 'Genre', 'Duration', 'Play Count', 'Approved', 'Upload Date'])
        
        for song in queryset:
            writer.writerow([
                song.title,
                song.artist.username if song.artist else 'Unknown',
                song.album.title if song.album else 'No Album',
                song.genre.name if song.genre else 'No Genre',
                song.duration,
                song.play_count,
                song.approved,
                song.upload_date.strftime('%Y-%m-%d') if song.upload_date else 'Unknown'
            ])
        
        self.message_user(request, f'Exported {queryset.count()} songs to CSV.')
        return response
    
    export_song_data.short_description = "Export selected songs as CSV"

    def approve_songs(self, request, queryset):
        updated = queryset.update(approved=True)
        self.message_user(request, f'{updated} songs approved.')
    approve_songs.short_description = "Approve selected songs"

    def disapprove_songs(self, request, queryset):
        updated = queryset.update(approved=False)
        self.message_user(request, f'{updated} songs disapproved.')
    disapprove_songs.short_description = "Disapprove selected songs"

    def reset_play_count(self, request, queryset):
        updated = queryset.update(play_count=0)
        self.message_user(request, f'Play count reset for {updated} songs.')
    reset_play_count.short_description = "Reset play count"

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'artist_link', 'songs_count', 
        'cover_preview', 'release_date', 'created_at'
    )
    list_filter = ('release_date', 'created_at', 'artist__role')
    search_fields = ('title', 'artist__username', 'artist__stage_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [SongInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'artist', 'release_date')
        }),
        ('Media', {
            'fields': ('cover_image',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def artist_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.artist.id])
        return format_html('<a href="{}">{}</a>', url, obj.artist.display_name)
    artist_link.short_description = "Artist"

    def songs_count(self, obj):
        count = obj.songs.count()
        if count > 0:
            url = reverse('admin:songs_song_changelist') + f'?album__id__exact={obj.id}'
            return format_html('<a href="{}">{} songs</a>', url, count)
        return f"{count} songs"
    songs_count.short_description = "Songs"

    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />',
                obj.cover_image.url
            )
        return "No Cover"
    cover_preview.short_description = "Cover"

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'user_link', 'songs_count', 'total_duration',
        'is_public', 'cover_preview', 'created_at'
    )
    list_filter = ('is_public', 'created_at', 'user__role')
    search_fields = ('name', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [PlaylistSongInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'user', 'is_public')
        }),
        ('Media', {
            'fields': ('cover_image',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.display_name)
    user_link.short_description = "User"

    def songs_count(self, obj):
        count = obj.playlist_songs.count()
        return f"{count} songs"
    songs_count.short_description = "Songs"

    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />',
                obj.cover_image.url
            )
        return "No Cover"
    cover_preview.short_description = "Cover"
    
    def total_duration(self, obj):
        """Calculate total duration of all songs in playlist"""
        total_seconds = sum(
            song.song.duration for song in obj.playlist_songs.all() 
            if song.song.duration
        )
        if total_seconds:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return "0:00"
    total_duration.short_description = "Duration"
    
    actions = ['make_public', 'make_private', 'export_playlist_data']
    
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} playlists marked as public.')
    make_public.short_description = "Make selected playlists public"
    
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} playlists marked as private.')
    make_private.short_description = "Make selected playlists private"
    
    def export_playlist_data(self, request, queryset):
        """Export selected playlists as CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="playlists_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Name', 'Owner', 'Is Public', 'Songs Count', 'Total Duration', 'Created At'])
        
        for playlist in queryset:
            writer.writerow([
                playlist.id,
                playlist.name,
                playlist.user.username,
                playlist.is_public,
                playlist.playlist_songs.count(),
                self.total_duration(playlist),
                playlist.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        self.message_user(request, f'Exported {queryset.count()} playlists to CSV.')
        return response
    
    export_playlist_data.short_description = "Export selected playlists as CSV"

@admin.register(PlaylistSong)
class PlaylistSongAdmin(admin.ModelAdmin):
    list_display = ('id', 'playlist_link', 'song_link', 'order', 'added_at')
    list_filter = ('added_at', 'playlist__is_public')
    search_fields = ('playlist__name', 'song__title')
    ordering = ('playlist', 'order', 'added_at')
    readonly_fields = ('id', 'added_at')

    def playlist_link(self, obj):
        url = reverse('admin:songs_playlist_change', args=[obj.playlist.id])
        return format_html('<a href="{}">{}</a>', url, obj.playlist.name)
    playlist_link.short_description = "Playlist"

    def song_link(self, obj):
        url = reverse('admin:songs_song_change', args=[obj.song.id])
        return format_html('<a href="{}">{}</a>', url, obj.song.title)
    song_link.short_description = "Song"

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'item_type', 'item_link', 'created_at')
    list_filter = ('item_type', 'created_at', 'user__role')
    search_fields = ('user__username', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.display_name)
    user_link.short_description = "User"

    def item_link(self, obj):
        if obj.item_type == 'song':
            try:
                song = Song.objects.get(id=obj.item_id)
                url = reverse('admin:songs_song_change', args=[obj.item_id])
                return format_html('<a href="{}">{}</a>', url, song.title)
            except Song.DoesNotExist:
                return "Deleted Song"
        elif obj.item_type == 'album':
            try:
                album = Album.objects.get(id=obj.item_id)
                url = reverse('admin:songs_album_change', args=[obj.item_id])
                return format_html('<a href="{}">{}</a>', url, album.title)
            except Album.DoesNotExist:
                return "Deleted Album"
        elif obj.item_type == 'playlist':
            try:
                playlist = Playlist.objects.get(id=obj.item_id)
                url = reverse('admin:songs_playlist_change', args=[obj.item_id])
                return format_html('<a href="{}">{}</a>', url, playlist.name)
            except Playlist.DoesNotExist:
                return "Deleted Playlist"
        return f"Unknown {obj.item_type}"
    item_link.short_description = "Item"

@admin.register(ListeningHistory)
class ListeningHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'song_link', 'listened_at')
    list_filter = ('listened_at', 'user__role')
    search_fields = ('user__username', 'song__title', 'song__artist__username')
    ordering = ('-listened_at',)
    readonly_fields = ('id', 'listened_at')

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.display_name)
    user_link.short_description = "User"

    def song_link(self, obj):
        url = reverse('admin:songs_song_change', args=[obj.song.id])
        return format_html('<a href="{}">{}</a>', url, obj.song.title)
    song_link.short_description = "Song"

    actions = ['clear_history']

    def clear_history(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} history entries deleted.')
    clear_history.short_description = "Clear selected history entries"

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'item_type', 'item_link', 'content_preview', 'created_at')
    list_filter = ('item_type', 'created_at', 'user__role')
    search_fields = ('user__username', 'content')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
    }

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.display_name)
    user_link.short_description = "User"

    def item_link(self, obj):
        if obj.item_type == 'song':
            try:
                song = Song.objects.get(id=obj.item_id)
                url = reverse('admin:songs_song_change', args=[obj.item_id])
                return format_html('<a href="{}">{}</a>', url, song.title)
            except Song.DoesNotExist:
                return "Deleted Song"
        elif obj.item_type == 'album':
            try:
                album = Album.objects.get(id=obj.item_id)
                url = reverse('admin:songs_album_change', args=[obj.item_id])
                return format_html('<a href="{}">{}</a>', url, album.title)
            except Album.DoesNotExist:
                return "Deleted Album"
        return f"Unknown {obj.item_type}"
    item_link.short_description = "Item"

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "Content"

@admin.register(AIPrompt)
class AIPromptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_link', 'prompt_preview', 'has_response', 'created_at')
    list_filter = ('created_at', 'user__role')
    search_fields = ('user__username', 'prompt_text', 'response_text')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
    inlines = [AIInteractionInline]
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 6, 'cols': 80})},
    }

    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'created_at')
        }),
        ('Prompt', {
            'fields': ('prompt_text',)
        }),
        ('AI Response', {
            'fields': ('response_text', 'generated_sql', 'executed_result'),
            'classes': ('collapse',)
        }),
    )

    def user_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.display_name)
    user_link.short_description = "User"

    def prompt_preview(self, obj):
        return obj.prompt_text[:50] + "..." if len(obj.prompt_text) > 50 else obj.prompt_text
    prompt_preview.short_description = "Prompt"

    def has_response(self, obj):
        return bool(obj.response_text)
    has_response.boolean = True
    has_response.short_description = "Has Response"

@admin.register(AIInteraction)
class AIInteractionAdmin(admin.ModelAdmin):
    list_display = ('id', 'prompt_link', 'message_type', 'message_preview', 'timestamp')
    list_filter = ('message_type', 'timestamp')
    search_fields = ('message_text', 'prompt__user__username')
    ordering = ('-timestamp',)
    readonly_fields = ('id', 'timestamp')

    def prompt_link(self, obj):
        url = reverse('admin:songs_aiprompt_change', args=[obj.prompt.id])
        return format_html('<a href="{}">Prompt #{}</a>', url, obj.prompt.id)
    prompt_link.short_description = "Prompt"

    def message_preview(self, obj):
        return obj.message_text[:50] + "..." if len(obj.message_text) > 50 else obj.message_text
    message_preview.short_description = "Message"
