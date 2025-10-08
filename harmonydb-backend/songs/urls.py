from django.urls import path
from .views import SongUploadView, SongListView, SongStreamView

urlpatterns = [
    path("upload/", SongUploadView.as_view(), name="song-upload"),
    path("all/", SongListView.as_view(), name="song-list"),
    path("stream/<int:pk>/", SongStreamView.as_view(), name="song-stream"),
]
