from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'id', 'username', 'email', 'role', 'display_name', 
        'email_verified', 'profile_picture_preview', 'created_at', 
        'is_active', 'is_staff', 'songs_count', 'albums_count'
    )
    list_filter = (
        'role', 'email_verified', 'is_active', 'is_staff', 
        'is_superuser', 'created_at', 'updated_at'
    )
    search_fields = ('username', 'email', 'stage_name', 'first_name', 'last_name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login', 'date_joined')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'username', 'email', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'role', 'display_name', 'stage_name', 'bio', 'birth_date')
        }),
        ('Profile', {
            'fields': ('profile_picture', 'email_verified')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Basic Information', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
        ('Personal Info', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'stage_name', 'bio'),
        }),
    )

    def profile_picture_preview(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;" />',
                obj.profile_picture.url
            )
        return "No Picture"
    profile_picture_preview.short_description = "Profile Picture"

    def songs_count(self, obj):
        if obj.role == 'artist':
            count = obj.songs.count()
            if count > 0:
                url = reverse('admin:songs_song_changelist') + f'?artist__id__exact={obj.id}'
                return format_html('<a href="{}">{} songs</a>', url, count)
            return f"{count} songs"
        return "-"
    songs_count.short_description = "Songs"

    def albums_count(self, obj):
        if obj.role == 'artist':
            count = obj.albums.count()
            if count > 0:
                url = reverse('admin:songs_album_changelist') + f'?artist__id__exact={obj.id}'
                return format_html('<a href="{}">{} albums</a>', url, count)
            return f"{count} albums"
        return "-"
    albums_count.short_description = "Albums"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related().prefetch_related('songs', 'albums')

    actions = ['mark_verified', 'mark_unverified', 'deactivate_users', 'activate_users']

    def mark_verified(self, request, queryset):
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'{updated} users marked as verified.')
    mark_verified.short_description = "Mark selected users as verified"

    def mark_unverified(self, request, queryset):
        updated = queryset.update(email_verified=False)
        self.message_user(request, f'{updated} users marked as unverified.')
    mark_unverified.short_description = "Mark selected users as unverified"

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users deactivated.')
    deactivate_users.short_description = "Deactivate selected users"

    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users activated.')
    activate_users.short_description = "Activate selected users"
