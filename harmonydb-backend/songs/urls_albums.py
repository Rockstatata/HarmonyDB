from django.urls import path
from .views import AlbumListCreateView, AlbumDetailView, AlbumAddSongView, AlbumRemoveSongView

urlpatterns = [
    path("", AlbumListCreateView.as_view(), name="album-list-create"),
    path("<int:pk>/", AlbumDetailView.as_view(), name="album-detail"),
    path("<int:album_id>/add-song/", AlbumAddSongView.as_view(), name="album-add-song"),
    path("<int:album_id>/remove-song/<int:song_id>/", AlbumRemoveSongView.as_view(), name="album-remove-song"),
]