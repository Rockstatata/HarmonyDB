from django.contrib import admin
from django.utils.html import format_html

# Customize Django Admin Site
admin.site.site_header = "HarmonyDB Administration"
admin.site.site_title = "HarmonyDB Admin"
admin.site.index_title = "Welcome to HarmonyDB Administration"

# Custom admin styling
admin.site.enable_nav_sidebar = True

class HarmonyDBAdminSite(admin.AdminSite):
    site_header = "HarmonyDB Administration"
    site_title = "HarmonyDB Admin"
    index_title = "Welcome to HarmonyDB Administration"
    
    def index(self, request, extra_context=None):
        """
        Display the main admin index page with statistics.
        """
        from django.contrib.auth import get_user_model
        from songs.models import Song, Album, Playlist, ListeningHistory
        
        User = get_user_model()
        
        extra_context = extra_context or {}
        
        # Calculate statistics
        stats = {
            'total_users': User.objects.count(),
            'total_artists': User.objects.filter(role='artist').count(),
            'total_listeners': User.objects.filter(role='listener').count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'verified_users': User.objects.filter(email_verified=True).count(),
            
            'total_songs': Song.objects.count(),
            'approved_songs': Song.objects.filter(approved=True).count(),
            'pending_songs': Song.objects.filter(approved=False).count(),
            'total_plays': sum(Song.objects.values_list('play_count', flat=True)),
            
            'total_albums': Album.objects.count(),
            'total_playlists': Playlist.objects.count(),
            'public_playlists': Playlist.objects.filter(is_public=True).count(),
            
            'total_history_entries': ListeningHistory.objects.count(),
        }
        
        extra_context['stats'] = stats
        
        return super().index(request, extra_context)

# Register the custom admin site
admin_site = HarmonyDBAdminSite(name='harmonydb_admin')