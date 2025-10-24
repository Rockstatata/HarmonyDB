from django.urls import path
from .views import (
    # Song views
    SongListCreateView, SongDetailView, SongStreamView,
    # Album views
    AlbumListCreateView, AlbumDetailView,
    # Genre views
    GenreListCreateView, GenreDetailView,
    # Playlist views
    PlaylistListCreateView, PlaylistDetailView, PlaylistAddSongView, PlaylistRemoveSongView,
    # Favorite views
    FavoriteListCreateView, FavoriteDetailView,
    # Listening history views
    ListeningHistoryListView,
    # Comment views
    CommentListCreateView, CommentDetailView,
    # AI views
    AIPromptListCreateView, AIPromptDetailView
)

urlpatterns = [
    # Song URLs
    path("", SongListCreateView.as_view(), name="song-list-create"),
    path("<int:pk>/", SongDetailView.as_view(), name="song-detail"),
    path("stream/<int:pk>/", SongStreamView.as_view(), name="song-stream"),
    
    # Album URLs - these need separate URL includes
    # path("albums/", AlbumListCreateView.as_view(), name="album-list-create"),
    # path("albums/<int:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    
    # Genre URLs
    path("genres/", GenreListCreateView.as_view(), name="genre-list-create"),
    path("genres/<int:pk>/", GenreDetailView.as_view(), name="genre-detail"),
    
    # Playlist URLs - these need separate URL includes
    # path("playlists/", PlaylistListCreateView.as_view(), name="playlist-list-create"),
    # path("playlists/<int:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    # path("playlists/<int:playlist_id>/add-song/", PlaylistAddSongView.as_view(), name="playlist-add-song"),
    # path("playlists/<int:playlist_id>/remove-song/<int:song_id>/", PlaylistRemoveSongView.as_view(), name="playlist-remove-song"),
    
    # Favorite URLs
    path("favorites/", FavoriteListCreateView.as_view(), name="favorite-list-create"),
    path("favorites/<int:pk>/", FavoriteDetailView.as_view(), name="favorite-detail"),
    
    # Listening history URLs
    path("history/", ListeningHistoryListView.as_view(), name="listening-history"),
    
    # Comment URLs
    path("comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    
    # AI URLs
    path("ai-prompts/", AIPromptListCreateView.as_view(), name="ai-prompt-list-create"),
    path("ai-prompts/<int:pk>/", AIPromptDetailView.as_view(), name="ai-prompt-detail"),
]
