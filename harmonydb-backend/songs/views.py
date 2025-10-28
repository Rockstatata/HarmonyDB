from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from rest_framework import generics, permissions, parsers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Song, Album, Genre, Playlist, PlaylistSong, Favorite, ListeningHistory, Comment, AIPrompt, AIInteraction
from .serializers import (
    SongSerializer, AlbumSerializer, GenreSerializer, PlaylistSerializer, 
    PlaylistSongSerializer, FavoriteSerializer, ListeningHistorySerializer, 
    CommentSerializer, AIPromptSerializer, AIInteractionSerializer
)
from users.permissions import IsArtistOrReadOnly, IsOwnerOrReadOnly, IsArtist
import os

# ==================== SONG VIEWS ====================
class SongListCreateView(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsArtistOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        queryset = Song.objects.filter(approved=True).order_by("-upload_date")
        
        # Filter by artist if specified
        artist_id = self.request.query_params.get('artist')
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        
        # Filter by album if specified
        album_id = self.request.query_params.get('album')
        if album_id:
            queryset = queryset.filter(album_id=album_id)
            
        # Filter by genre if specified
        genre_id = self.request.query_params.get('genre')
        if genre_id:
            queryset = queryset.filter(genre_id=genre_id)
            
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(artist__username__icontains=search) |
                Q(artist__stage_name__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        # Ensure only artists can create songs and only their own songs
        if self.request.user.role != 'artist':
            raise permissions.PermissionDenied("Only artists can upload songs.")
        serializer.save(artist=self.request.user)

class SongDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [IsOwnerOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # For modifications, only allow artists to modify their own songs
            return Song.objects.filter(artist=self.request.user)
        return Song.objects.filter(approved=True)

class SongStreamView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        song = get_object_or_404(Song, pk=pk)
        
        # Record listening history if user is authenticated
        if request.user.is_authenticated:
            ListeningHistory.objects.create(user=request.user, song=song)
        
        file_path = song.audio_file.path
        file_size = os.path.getsize(file_path)
        range_header = request.headers.get("Range", "").strip()
        range_match = None
        if range_header.startswith("bytes="):
            range_match = range_header.replace("bytes=", "").split("-")

        with open(file_path, "rb") as f:
            if range_match:
                start = int(range_match[0])
                end = int(range_match[1]) if range_match[1] else file_size - 1
                f.seek(start)
                data = f.read(end - start + 1)
                resp = HttpResponse(data, status=206, content_type="audio/mpeg")
                resp["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            else:
                resp = FileResponse(f, content_type="audio/mpeg")
                resp["Content-Length"] = file_size
        
        song.play_count += 1
        song.save(update_fields=["play_count"])
        return resp

# ==================== ALBUM VIEWS ====================
class AlbumListCreateView(generics.ListCreateAPIView):
    serializer_class = AlbumSerializer
    permission_classes = [IsArtistOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        queryset = Album.objects.all().order_by("-created_at")
        
        # Filter by artist if specified
        artist_id = self.request.query_params.get('artist')
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
            
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(artist__username__icontains=search) |
                Q(artist__stage_name__icontains=search)
            )
        
        return queryset

    def perform_create(self, serializer):
        # Ensure only artists can create albums
        if self.request.user.role != 'artist':
            raise permissions.PermissionDenied("Only artists can create albums.")
        serializer.save(artist=self.request.user)

class AlbumDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AlbumSerializer
    permission_classes = [IsOwnerOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # For modifications, only allow artists to modify their own albums
            return Album.objects.filter(artist=self.request.user)
        return Album.objects.all()

class AlbumAddSongView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id, artist=request.user)
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response({'error': 'song_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        song = get_object_or_404(Song, id=song_id, artist=request.user)
        
        # Add song to album
        song.album = album
        song.save()
        
        return Response(SongSerializer(song).data, status=status.HTTP_200_OK)

class AlbumRemoveSongView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, album_id, song_id):
        album = get_object_or_404(Album, id=album_id, artist=request.user)
        song = get_object_or_404(Song, id=song_id, artist=request.user, album=album)
        
        # Remove song from album
        song.album = None
        song.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# ==================== GENRE VIEWS ====================
class GenreListCreateView(generics.ListCreateAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class GenreDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# ==================== PLAYLIST VIEWS ====================
class PlaylistListCreateView(generics.ListCreateAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        queryset = Playlist.objects.filter(
            Q(is_public=True) | Q(user=self.request.user)
        ).order_by("-created_at")
        
        # Filter by user if specified
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [IsOwnerOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        return Playlist.objects.filter(
            Q(is_public=True) | Q(user=self.request.user)
        )

class PlaylistAddSongView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, playlist_id):
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response({'error': 'song_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        song = get_object_or_404(Song, id=song_id, approved=True)
        
        # Both artists and listeners can add any approved song to their playlists
        playlist_song, created = PlaylistSong.objects.get_or_create(
            playlist=playlist,
            song=song,
            defaults={'order': playlist.playlist_songs.count()}
        )
        
        if not created:
            return Response({'error': 'Song already in playlist'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(PlaylistSongSerializer(playlist_song).data, status=status.HTTP_201_CREATED)

class PlaylistRemoveSongView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, playlist_id, song_id):
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        playlist_song = get_object_or_404(PlaylistSong, playlist=playlist, song_id=song_id)
        playlist_song.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ==================== FAVORITE VIEWS ====================
class FavoriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FavoriteDetailView(generics.DestroyAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

class ToggleFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        item_type = request.data.get('item_type')
        item_id = request.data.get('item_id')
        
        if not item_type or not item_id:
            return Response(
                {'error': 'item_type and item_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate item exists
        if item_type == 'song':
            get_object_or_404(Song, id=item_id, approved=True)
        elif item_type == 'album':
            get_object_or_404(Album, id=item_id)
        elif item_type == 'playlist':
            get_object_or_404(Playlist, id=item_id)
        else:
            return Response(
                {'error': 'Invalid item_type. Must be song, album, or playlist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle favorite
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            item_type=item_type,
            item_id=item_id
        )
        
        if not created:
            favorite.delete()
            return Response({'favorited': False, 'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
        else:
            return Response({
                'favorited': True, 
                'message': 'Added to favorites',
                'favorite': FavoriteSerializer(favorite).data
            }, status=status.HTTP_201_CREATED)

# ==================== LISTENING HISTORY VIEWS ====================
class ListeningHistoryListView(generics.ListAPIView):
    serializer_class = ListeningHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListeningHistory.objects.filter(user=self.request.user).order_by("-listened_at")

class AddToHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({'error': 'song_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        song = get_object_or_404(Song, id=song_id, approved=True)
        
        # Create or update listening history
        history_entry = ListeningHistory.objects.create(user=request.user, song=song)
        
        return Response(ListeningHistorySerializer(history_entry).data, status=status.HTTP_201_CREATED)

# ==================== COMMENT VIEWS ====================
class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        item_type = self.request.query_params.get('item_type')
        item_id = self.request.query_params.get('item_id')
        
        queryset = Comment.objects.all().order_by("-created_at")
        
        if item_type and item_id:
            queryset = queryset.filter(item_type=item_type, item_id=item_id)
        
        return queryset

class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsOwnerOrReadOnly]

# ==================== AI VIEWS ====================
class AIPromptListCreateView(generics.ListCreateAPIView):
    serializer_class = AIPromptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIPrompt.objects.filter(user=self.request.user).order_by("-created_at")

class AIPromptDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AIPromptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIPrompt.objects.filter(user=self.request.user)
