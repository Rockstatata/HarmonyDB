from django.urls import path
from .views import (
    PlaylistListCreateView, PlaylistDetailView, 
    PlaylistAddSongView, PlaylistRemoveSongView
)

urlpatterns = [
    path("", PlaylistListCreateView.as_view(), name="playlist-list-create"),
    path("<int:pk>/", PlaylistDetailView.as_view(), name="playlist-detail"),
    path("<int:playlist_id>/add-song/", PlaylistAddSongView.as_view(), name="playlist-add-song"),
    path("<int:playlist_id>/remove-song/<int:song_id>/", PlaylistRemoveSongView.as_view(), name="playlist-remove-song"),
]