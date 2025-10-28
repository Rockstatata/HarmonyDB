from django.urls import path
from .views import (
    # Song views
    SongListCreateView, SongDetailView, SongStreamView,
    # Album views
    AlbumListCreateView, AlbumDetailView,
    # Genre views
    GenreListCreateView, GenreDetailView, GenreAnalyticsView,
    # Playlist views
    PlaylistListCreateView, PlaylistDetailView, PlaylistAddSongView, PlaylistRemoveSongView,
    # Favorite views
    FavoriteListCreateView, FavoriteDetailView, ToggleFavoriteView,
    # Listening history views
    ListeningHistoryListView, AddToHistoryView,
    # Comment views
    CommentListCreateView, CommentDetailView,
    # AI views
    AIPromptListCreateView, AIPromptDetailView,
    # Advanced search
    AnalyticsAdvancedSearchView, AdvancedSearchView
)

urlpatterns = [
    # Song URLs - Enhanced with comprehensive SQL demonstrations
    path("", SongListCreateView.as_view(), name="song-list-create"),
    path("<int:pk>/", SongDetailView.as_view(), name="song-detail"),
    path("stream/<int:pk>/", SongStreamView.as_view(), name="song-stream"),
    
    # Album URLs - Enhanced with complex aggregations and JOINs
    path("albums/", AlbumListCreateView.as_view(), name="album-list-create"),
    path("albums/<int:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    
    # Genre URLs - Comprehensive SQL concept demonstrations
    path("genres/", GenreListCreateView.as_view(), name="genre-list-create"),
    path("genres/<int:pk>/", GenreDetailView.as_view(), name="genre-detail"),
    path("genres/analytics/", GenreAnalyticsView.as_view(), name="genre-analytics"),
    
    # Playlist URLs - Many-to-many relationship demonstrations
    path("playlists/", PlaylistListCreateView.as_view(), name="playlist-list-create"),
    path("playlists/<int:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path("playlists/<int:playlist_id>/add-song/", PlaylistAddSongView.as_view(), name="playlist-add-song"),
    path("playlists/<int:playlist_id>/remove-song/<int:song_id>/", PlaylistRemoveSongView.as_view(), name="playlist-remove-song"),
    
    # Favorite URLs - Enhanced with comprehensive analytics
    path("favorites/", FavoriteListCreateView.as_view(), name="favorite-list-create"),
    path("favorites/<int:pk>/", FavoriteDetailView.as_view(), name="favorite-detail"),
    path("favorites/toggle/", ToggleFavoriteView.as_view(), name="favorite-toggle"),
    
    # Listening history URLs - Advanced temporal analytics
    path("history/", ListeningHistoryListView.as_view(), name="listening-history"),
    path("history/add/", AddToHistoryView.as_view(), name="add-to-history"),
    
    # Comment URLs
    path("comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    
    # AI URLs
    path("ai-prompts/", AIPromptListCreateView.as_view(), name="ai-prompt-list-create"),
    path("ai-prompts/<int:pk>/", AIPromptDetailView.as_view(), name="ai-prompt-detail"),
    
    # Advanced search - Comprehensive search SQL demonstrations
    # Public GET search (AnalyticsAdvancedSearchView) and analytics POST search (AdvancedSearchView)
    path("search/advanced/", AnalyticsAdvancedSearchView.as_view(), name="advanced-search"),
]
