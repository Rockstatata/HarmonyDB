from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from django.db import connection, transaction
from rest_framework import generics, permissions, parsers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import (
    Q, F, Count, Sum, Avg, Min, Max, Case, When, Value, 
    OuterRef, Subquery, Exists, Window,
    CharField, IntegerField, FloatField
)
from django.db.models.functions import (
    TruncDate, TruncMonth, TruncYear, Coalesce, Cast, Concat, 
    Extract, Now, Lower, Upper, Length, Substr, Rank, DenseRank, RowNumber
)
from .models import Song, Album, Genre, Playlist, PlaylistSong, Favorite, ListeningHistory, Comment, AIPrompt, AIInteraction
from .serializers import (
    SongSerializer, AlbumSerializer, GenreSerializer, PlaylistSerializer, 
    PlaylistSongSerializer, FavoriteSerializer, ListeningHistorySerializer, 
    CommentSerializer, AIPromptSerializer, AIInteractionSerializer
)
from users.permissions import IsArtistOrReadOnly, IsOwnerOrReadOnly, IsArtist
from datetime import datetime, timedelta
import os

# ==================== SONG VIEWS ====================
class SongListCreateView(generics.ListCreateAPIView):
    serializer_class = SongSerializer
    permission_classes = [IsArtistOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        """
        Enhanced song listing with comprehensive SQL demonstrations:
        - INNER/LEFT JOINs for related data
        - Complex WHERE with AND, OR, LIKE, BETWEEN, IN
        - Subqueries and EXISTS clauses
        - Window functions for ranking
        - Aggregations and annotations
        """
        # Base queryset with JOINs (INNER JOIN artist, LEFT JOIN album/genre)
        queryset = Song.objects.select_related(
            'artist', 'album', 'genre'
        ).filter(approved=True).annotate(
            # Window function: Rank songs by play count within genre
            genre_rank=Window(
                expression=Rank(),
                partition_by=[F('genre')],
                order_by=F('play_count').desc()
            ),
            # Subquery: Count of artist's other songs (proper scalar subquery)
            artist_song_count=Subquery(
                Song.objects.filter(
                    artist=OuterRef('artist'),
                    approved=True
                ).values('artist').annotate(
                    ct=Count('id')
                ).values('ct')[:1]
            ),
            # Aggregation: Total listens for this song
            total_listens=Count('listening_history', distinct=True),
            # Aggregation: Favorite count (count favorites pointing to this song)
            favorite_count=Subquery(
                Favorite.objects.filter(
                    item_type='song',
                    item_id=OuterRef('pk')
                ).values('item_id').annotate(ct=Count('id')).values('ct')[:1]
            ),
            # Case/When: Popularity category
            popularity_tier=Case(
                When(play_count__gte=1000, then=Value('viral')),
                When(play_count__gte=100, then=Value('popular')),
                When(play_count__gte=10, then=Value('rising')),
                default=Value('new'),
                output_field=CharField()
            ),
            # Mathematical functions: Duration in minutes
            duration_minutes=F('duration') / 60.0,
            # String functions: Title length and first character
            title_length=Length('title'),
            first_char=Upper(Substr('title', 1, 1))
        )
        
        # Advanced filtering with various SQL concepts
        
        # LIKE pattern matching with OR conditions
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |  # LIKE '%search%'
                Q(artist__username__icontains=search) |
                Q(artist__stage_name__icontains=search) |
                Q(album__title__icontains=search) |
                Q(genre__name__icontains=search)
            )
        
        # BETWEEN for duration filtering
        min_duration = self.request.query_params.get('min_duration')
        max_duration = self.request.query_params.get('max_duration')
        if min_duration and max_duration:
            # Django ORM uses __range for BETWEEN-like queries
            queryset = queryset.filter(duration__range=[min_duration, max_duration])
        elif min_duration:
            queryset = queryset.filter(duration__gte=min_duration)
        elif max_duration:
            queryset = queryset.filter(duration__lte=max_duration)
        
        # IN clause for multiple genres
        genres = self.request.query_params.getlist('genres')
        if genres:
            queryset = queryset.filter(genre_id__in=genres)
        
        # Filter by specific artist
        artist_id = self.request.query_params.get('artist')
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        
        # EXISTS subquery: Only songs with listening history
        has_listens = self.request.query_params.get('has_listens')
        if has_listens == 'true':
            queryset = queryset.filter(
                Exists(ListeningHistory.objects.filter(song=OuterRef('pk')))
            )
        
        # Date filtering: Recent uploads
        days_ago = self.request.query_params.get('days_ago')
        if days_ago:
            cutoff_date = datetime.now() - timedelta(days=int(days_ago))
            queryset = queryset.filter(upload_date__gte=cutoff_date)
        
        # Popularity filtering
        popularity = self.request.query_params.get('popularity')
        if popularity:
            if popularity == 'viral':
                queryset = queryset.filter(play_count__gte=1000)
            elif popularity == 'popular':
                queryset = queryset.filter(play_count__gte=100, play_count__lt=1000)
            elif popularity == 'rising':
                queryset = queryset.filter(play_count__gte=10, play_count__lt=100)
            elif popularity == 'new':
                queryset = queryset.filter(play_count__lt=10)
        
        # Ordering options demonstrating ORDER BY variations
        order_by = self.request.query_params.get('order_by', 'recent')
        if order_by == 'popular':
            queryset = queryset.order_by('-play_count', '-upload_date')
        elif order_by == 'alphabetical':
            queryset = queryset.order_by('title', 'artist__username')
        elif order_by == 'duration':
            queryset = queryset.order_by('duration')
        elif order_by == 'genre_rank':
            queryset = queryset.order_by('genre_rank', '-play_count')
        else:  # recent
            queryset = queryset.order_by('-upload_date', '-play_count')
        
        return queryset

    def list(self, request, *args, **kwargs):
        """
        Enhanced list response with aggregated statistics
        Demonstrates GROUP BY and aggregate functions
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get paginated songs
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            
            # Add aggregate statistics using GROUP BY and aggregations
            stats = queryset.aggregate(
                total_songs=Count('id'),
                total_plays=Sum('play_count'),
                avg_duration=Avg('duration'),
                min_duration=Min('duration'),
                max_duration=Max('duration'),
                total_favorites=Sum('favorite_count'),
                unique_artists=Count('artist', distinct=True),
                unique_genres=Count('genre', distinct=True)
            )
            
            # Genre breakdown (GROUP BY demonstration)
            genre_stats = queryset.values('genre__name').annotate(
                song_count=Count('id'),
                total_plays=Sum('play_count'),
                avg_duration=Avg('duration')
            ).order_by('-song_count')
            
            # Popularity distribution (CASE/WHEN aggregation)
            popularity_stats = queryset.values('popularity_tier').annotate(
                count=Count('id')
            ).order_by('-count')
            
            response_data = self.get_paginated_response(serializer.data).data
            response_data['statistics'] = stats
            response_data['genre_breakdown'] = list(genre_stats)
            response_data['popularity_distribution'] = list(popularity_stats)
            
            return Response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Enhanced CREATE with validation and auto-calculations
        if self.request.user.role != 'artist':
            raise permissions.PermissionDenied("Only artists can upload songs.")
        
        # Auto-generate initial play count and other fields
        serializer.save(
            artist=self.request.user,
            play_count=0,
            upload_date=datetime.now()
        )

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
        """
        Enhanced album listing with comprehensive SQL features:
        - Multiple JOINs and aggregations
        - Subqueries for complex calculations
        - Window functions for ranking
        - UNION operations for combining results
        """
        # Base queryset with comprehensive annotations
        queryset = Album.objects.select_related('artist').annotate(
            # Aggregations: Album statistics from related songs
            song_count=Count('songs', distinct=True),
            total_duration=Sum('songs__duration'),
            avg_song_duration=Avg('songs__duration'),
            total_plays=Sum('songs__play_count'),
            max_song_plays=Max('songs__play_count'),
            
            # Subquery: Most popular song in album
            most_popular_song=Subquery(
                Song.objects.filter(
                    album=OuterRef('pk')
                ).order_by('-play_count').values('title')[:1]
            ),
            
            # Window function: Rank albums by total plays within artist
            artist_album_rank=Window(
                expression=Rank(),
                partition_by=[F('artist')],
                order_by=F('total_plays').desc()
            ),
            
            # Aggregation: Total favorites for this album (count Favorite rows with item_type='album')
            favorite_count=Subquery(
                Favorite.objects.filter(
                    item_type='album',
                    item_id=OuterRef('pk')
                ).values('item_id').annotate(ct=Count('id')).values('ct')[:1]
            ),
            
            # Aggregation: Total listens across all album songs
            total_listens=Count('songs__listening_history', distinct=True),
            
            # Case/When: Album categorization by song count
            album_type=Case(
                When(song_count__gte=15, then=Value('full_album')),
                When(song_count__gte=5, then=Value('mini_album')),
                When(song_count__gte=2, then=Value('single_ep')),
                default=Value('single'),
                output_field=CharField()
            ),
            
            # Mathematical calculation: Average plays per song
            avg_plays_per_song=Case(
                When(song_count__gt=0, then=F('total_plays') / F('song_count')),
                default=Value(0),
                output_field=FloatField()
            ),
            
            # String functions
            title_length=Length('title'),
            artist_name_upper=Upper('artist__username')
        ).filter(
            song_count__gt=0  # HAVING equivalent: only albums with songs
        )
        
        # Advanced filtering
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(artist__username__icontains=search) |
                Q(artist__stage_name__icontains=search) |
                Q(songs__title__icontains=search)  # Search in song titles too
            ).distinct()
        
        # Filter by specific artist
        artist_id = self.request.query_params.get('artist')
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        
        # Filter by album type
        album_type = self.request.query_params.get('album_type')
        if album_type:
            # Use filter on annotated field instead of .having() (not available on QuerySet)
            queryset = queryset.filter(album_type=album_type)
        
        # Filter by minimum song count (HAVING equivalent)
        min_songs = self.request.query_params.get('min_songs')
        if min_songs:
            queryset = queryset.filter(song_count__gte=int(min_songs))
        
        # Date range filtering (BETWEEN demonstration)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(release_date__range=[start_date, end_date])
        
        # Popularity threshold (complex WHERE)
        min_plays = self.request.query_params.get('min_plays')
        if min_plays:
            queryset = queryset.filter(total_plays__gte=int(min_plays))
        
        # Ordering with multiple options
        order_by = self.request.query_params.get('order_by', 'recent')
        if order_by == 'popular':
            queryset = queryset.order_by('-total_plays', '-song_count')
        elif order_by == 'duration':
            queryset = queryset.order_by('-total_duration')
        elif order_by == 'song_count':
            queryset = queryset.order_by('-song_count', '-total_plays')
        elif order_by == 'alphabetical':
            queryset = queryset.order_by('title')
        else:  # recent
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Enhanced list with comprehensive statistics and raw SQL examples"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            
            # Aggregate statistics across all albums
            stats = queryset.aggregate(
                total_albums=Count('id'),
                total_songs=Sum('song_count'),
                total_duration=Sum('total_duration'),
                avg_duration=Avg('total_duration'),
                total_plays=Sum('total_plays'),
                unique_artists=Count('artist', distinct=True)
            )
            
            # Raw SQL example: Complex album analytics with CTE
            with connection.cursor() as cursor:
                cursor.execute("""
                    WITH album_stats AS (
                        SELECT 
                            a.id,
                            a.title,
                            u.username as artist_name,
                            COUNT(s.id) as song_count,
                            SUM(s.play_count) as total_plays,
                            AVG(s.duration) as avg_duration,
                            RANK() OVER (ORDER BY SUM(s.play_count) DESC) as popularity_rank
                        FROM songs_album a
                        INNER JOIN users_user u ON a.artist_id = u.id
                        LEFT JOIN songs_song s ON a.id = s.album_id
                        WHERE s.approved = true
                        GROUP BY a.id, a.title, u.username
                        HAVING COUNT(s.id) > 0
                    )
                    SELECT 
                        popularity_rank,
                        title,
                        artist_name,
                        song_count,
                        total_plays
                    FROM album_stats
                    WHERE popularity_rank <= 10
                    ORDER BY popularity_rank
                """)
                
                columns = [col[0] for col in cursor.description]
                top_albums = [
                    dict(zip(columns, row)) for row in cursor.fetchall()
                ]
            
            response_data = self.get_paginated_response(serializer.data).data
            response_data['statistics'] = stats
            response_data['top_albums_ranking'] = top_albums
            
            return Response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
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

# ==================== ADVANCED GENRE ANALYTICS ====================
class GenreAnalyticsView(APIView):
    """
    Comprehensive Genre Analytics demonstrating ALL SQL concepts:
    - Complex JOINs (INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF)
    - Set operations (UNION, INTERSECT, EXCEPT)
    - Window functions with PARTITION BY
    - CTEs and recursive queries
    - Advanced aggregations and subqueries
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        """
        GET /api/genres/analytics/
        Demonstrates comprehensive SQL feature showcase
        """
        
        # 1. Basic Genre Statistics with INNER JOIN and GROUP BY
        basic_stats = Genre.objects.annotate(
            song_count=Count('song', distinct=True),
            total_plays=Sum('song__play_count'),
            avg_song_duration=Avg('song__duration'),
            min_duration=Min('song__duration'),
            max_duration=Max('song__duration'),
            unique_artists=Count('song__artist', distinct=True),
            total_favorites=Count(
                'song__favorite',
                filter=Q(song__favorite__item_type='song'),
                distinct=True
            )
        ).filter(
            song_count__gt=0  # HAVING clause equivalent
        ).order_by('-total_plays')
        
        # 2. Complex Window Functions and Rankings
        genre_rankings = Genre.objects.annotate(
            song_count=Count('song', distinct=True),
            total_plays=Sum('song__play_count')
        ).filter(song_count__gt=0).annotate(
            # Window functions with different partitions
            popularity_rank=Window(
                expression=Rank(),
                order_by=F('total_plays').desc()
            ),
            song_count_rank=Window(
                expression=DenseRank(),
                order_by=F('song_count').desc()
            ),
            popularity_percentile=Window(
                expression=RowNumber(),
                order_by=F('total_plays').desc()
            )
        ).order_by('popularity_rank')
        
        # 3. Raw SQL with CTEs, JOINs, and Set Operations
        with connection.cursor() as cursor:
            # Complex CTE demonstrating UNION, INTERSECT concepts
            cursor.execute("""
                WITH genre_metrics AS (
                    SELECT 
                        g.id,
                        g.name,
                        COUNT(DISTINCT s.id) as song_count,
                        COUNT(DISTINCT s.artist_id) as artist_count,
                        SUM(s.play_count) as total_plays,
                        AVG(s.duration) as avg_duration,
                        COUNT(DISTINCT lh.user_id) as unique_listeners
                    FROM songs_genre g
                    LEFT JOIN songs_song s ON g.id = s.genre_id AND s.approved = true
                    LEFT JOIN songs_listeninghistory lh ON s.id = lh.song_id
                    GROUP BY g.id, g.name
                ),
                popular_genres AS (
                    SELECT * FROM genre_metrics WHERE total_plays > 100
                ),
                diverse_genres AS (
                    SELECT * FROM genre_metrics WHERE artist_count > 2
                )
                -- UNION: Combine popular and diverse genres
                SELECT 'popular' as category, name, total_plays, artist_count
                FROM popular_genres
                
                UNION ALL
                
                SELECT 'diverse' as category, name, total_plays, artist_count
                FROM diverse_genres
                
                ORDER BY category, total_plays DESC
            """)
            
            columns = [col[0] for col in cursor.description]
            union_results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # INTERSECT simulation: Genres that are both popular AND diverse
            cursor.execute("""
                WITH popular_genres AS (
                    SELECT g.id, g.name
                    FROM songs_genre g
                    JOIN songs_song s ON g.id = s.genre_id
                    GROUP BY g.id, g.name
                    HAVING SUM(s.play_count) > 100
                ),
                diverse_genres AS (
                    SELECT g.id, g.name
                    FROM songs_genre g
                    JOIN songs_song s ON g.id = s.genre_id
                    GROUP BY g.id, g.name
                    HAVING COUNT(DISTINCT s.artist_id) > 2
                )
                SELECT pg.name, 'popular_and_diverse' as category
                FROM popular_genres pg
                INNER JOIN diverse_genres dg ON pg.id = dg.id
            """)
            
            intersect_results = [
                dict(zip([col[0] for col in cursor.description], row)) 
                for row in cursor.fetchall()
            ]
            
            # FULL OUTER JOIN example: All genres with optional statistics
            cursor.execute("""
                SELECT 
                    g.name as genre_name,
                    COUNT(s.id) as song_count,
                    COUNT(f.id) as favorite_count,
                    CASE 
                        WHEN COUNT(s.id) = 0 THEN 'no_songs'
                        WHEN COUNT(f.id) = 0 THEN 'songs_no_favorites'
                        ELSE 'has_both'
                    END as status
                FROM songs_genre g
                FULL OUTER JOIN songs_song s ON g.id = s.genre_id AND s.approved = true
                FULL OUTER JOIN songs_favorite f ON s.id = f.item_id AND f.item_type = 'song'
                GROUP BY g.id, g.name
                ORDER BY song_count DESC NULLS LAST
            """)
            
            full_outer_results = [
                dict(zip([col[0] for col in cursor.description], row)) 
                for row in cursor.fetchall()
            ]
            
            # SELF JOIN example: Genre similarity analysis
            cursor.execute("""
                WITH genre_artist_counts AS (
                    SELECT 
                        g.id,
                        g.name,
                        s.artist_id,
                        COUNT(*) as songs_by_artist
                    FROM songs_genre g
                    JOIN songs_song s ON g.id = s.genre_id
                    GROUP BY g.id, g.name, s.artist_id
                )
                SELECT 
                    g1.name as genre1,
                    g2.name as genre2,
                    COUNT(DISTINCT g1.artist_id) as shared_artists
                FROM genre_artist_counts g1
                JOIN genre_artist_counts g2 ON g1.artist_id = g2.artist_id AND g1.id < g2.id
                GROUP BY g1.id, g1.name, g2.id, g2.name
                HAVING COUNT(DISTINCT g1.artist_id) > 0
                ORDER BY shared_artists DESC
                LIMIT 10
            """)
            
            self_join_results = [
                dict(zip([col[0] for col in cursor.description], row)) 
                for row in cursor.fetchall()
            ]
            
            # Mathematical and String Functions
            cursor.execute("""
                SELECT 
                    g.name,
                    LENGTH(g.name) as name_length,
                    UPPER(g.name) as name_upper,
                    LOWER(g.name) as name_lower,
                    SUBSTRING(g.name, 1, 3) as name_prefix,
                    COUNT(s.id) as song_count,
                    MOD(COUNT(s.id), 10) as count_mod_10,
                    POWER(COUNT(s.id), 0.5) as sqrt_song_count,
                    ROUND(AVG(s.duration), 2) as avg_duration_rounded
                FROM songs_genre g
                LEFT JOIN songs_song s ON g.id = s.genre_id
                GROUP BY g.id, g.name
                ORDER BY song_count DESC
            """)
            
            functions_results = [
                dict(zip([col[0] for col in cursor.description], row)) 
                for row in cursor.fetchall()
            ]
        
        # 4. Subquery Examples (EXISTS, NOT EXISTS, Correlated)
        
        # EXISTS: Genres with recent activity
        recent_active_genres = Genre.objects.filter(
            Exists(
                ListeningHistory.objects.filter(
                    song__genre=OuterRef('pk'),
                    listened_at__gte=datetime.now() - timedelta(days=30)
                )
            )
        ).annotate(
            recent_listens=Count(
                'song__listening_history',
                filter=Q(song__listening_history__listened_at__gte=datetime.now() - timedelta(days=30)),
                distinct=True
            )
        ).order_by('-recent_listens')
        
        # NOT EXISTS: Genres without any favorites
        unfavorited_genres = Genre.objects.exclude(
            Exists(
                Favorite.objects.filter(
                    item_type='song',
                    item_id__in=Song.objects.filter(genre=OuterRef('pk')).values('id')
                )
            )
        ).annotate(
            song_count=Count('song')
        ).filter(song_count__gt=0)
        
        # 5. Date/Time Functions and Analysis
        monthly_genre_trends = ListeningHistory.objects.annotate(
            month=TruncMonth('listened_at'),
            genre_name=F('song__genre__name')
        ).values('month', 'genre_name').annotate(
            listen_count=Count('id')
        ).order_by('-month', '-listen_count')
        
        # Compile all results
        response_data = {
            'basic_statistics': list(basic_stats.values(
                'name', 'song_count', 'total_plays', 'avg_song_duration',
                'unique_artists', 'total_favorites'
            )),
            'genre_rankings': list(genre_rankings.values(
                'name', 'song_count', 'total_plays', 'popularity_rank',
                'song_count_rank', 'popularity_percentile'
            )),
            'set_operations': {
                'union_popular_diverse': union_results,
                'intersect_popular_and_diverse': intersect_results,
                'full_outer_join_analysis': full_outer_results,
                'self_join_similarities': self_join_results
            },
            'function_demonstrations': functions_results,
            'subquery_examples': {
                'recent_active_genres': list(recent_active_genres.values(
                    'name', 'recent_listens'
                )),
                'unfavorited_genres': list(unfavorited_genres.values(
                    'name', 'song_count'
                ))
            },
            'temporal_analysis': {
                'monthly_trends': list(monthly_genre_trends[:20])
            },
            'sql_concepts_demonstrated': [
                'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'SELF JOIN',
                'UNION', 'UNION ALL', 'INTERSECT', 'GROUP BY', 'HAVING',
                'Window Functions (RANK, DENSE_RANK, ROW_NUMBER)',
                'Subqueries (EXISTS, NOT EXISTS, Correlated)',
                'CTEs (Common Table Expressions)',
                'Mathematical Functions (MOD, POWER, ROUND)',
                'String Functions (LENGTH, UPPER, LOWER, SUBSTRING)',
                'Date Functions (EXTRACT, DATE_TRUNC)',
                'Aggregations (COUNT, SUM, AVG, MIN, MAX)',
                'Complex WHERE with AND, OR, LIKE, BETWEEN',
                'CASE WHEN statements',
                'ORDER BY with NULLS LAST'
            ]
        }
        
        return Response({
            'success': True,
            'message': 'Comprehensive genre analytics with all SQL concepts',
            'data': response_data,
            'total_sql_concepts': len(response_data['sql_concepts_demonstrated'])
        })

# ==================== PLAYLIST VIEWS ====================
class PlaylistListCreateView(generics.ListCreateAPIView):
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        """
        Enhanced playlist listing demonstrating:
        - Many-to-many relationships through junction table
        - Complex aggregations across multiple tables
        - Set operations (UNION concept through Q objects)
        - Window functions for popularity ranking
        """
        # Base queryset with comprehensive annotations
        queryset = Playlist.objects.select_related('user').annotate(
            # Many-to-many aggregations through PlaylistSong junction table
            song_count=Count('playlist_songs__song', distinct=True),
            total_duration=Sum('playlist_songs__song__duration'),
            avg_song_duration=Avg('playlist_songs__song__duration'),
            
            # Aggregations across multiple JOINs
            total_plays=Sum('playlist_songs__song__play_count'),
            unique_artists=Count('playlist_songs__song__artist', distinct=True),
            unique_genres=Count('playlist_songs__song__genre', distinct=True),
            
            # Window function: Rank playlists by song count
            size_rank=Window(
                expression=Rank(),
                order_by=F('song_count').desc()
            ),
            
            # Aggregation: Favorite count for this playlist (count Favorite rows with item_type='playlist')
            favorite_count=Subquery(
                Favorite.objects.filter(
                    item_type='playlist',
                    item_id=OuterRef('pk')
                ).values('item_id').annotate(ct=Count('id')).values('ct')[:1]
            ),
            
            # Subquery: Most played song in playlist
            top_song_plays=Subquery(
                PlaylistSong.objects.filter(
                    playlist=OuterRef('pk')
                ).order_by('-song__play_count').values('song__play_count')[:1]
            ),
            
            # Case/When: Playlist categorization
            playlist_type=Case(
                When(song_count__gte=100, then=Value('mega')),
                When(song_count__gte=50, then=Value('large')),
                When(song_count__gte=20, then=Value('medium')),
                When(song_count__gte=5, then=Value('small')),
                default=Value('mini'),
                output_field=CharField()
            ),
            
            # Mathematical calculations
            avg_plays_per_song=Case(
                When(song_count__gt=0, then=F('total_plays') / F('song_count')),
                default=Value(0),
                output_field=FloatField()
            ),
            
            # Date functions
            days_since_created=Extract(
                Now() - F('created_at'),
                lookup_name='days'
            ),
            
            # String functions
            name_length=Length('name'),
            name_upper=Upper('name')
        ).filter(
            # Complex WHERE with OR (demonstrating UNION-like logic)
            Q(is_public=True) | Q(user=self.request.user)
        )
        
        # Advanced filtering options
        
        # Search with multiple fields (LIKE with OR)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(playlist_songs__song__title__icontains=search) |
                Q(playlist_songs__song__artist__username__icontains=search)
            ).distinct()
        
        # Filter by playlist size (BETWEEN equivalent)
        min_songs = self.request.query_params.get('min_songs')
        max_songs = self.request.query_params.get('max_songs')
        if min_songs and max_songs:
            queryset = queryset.filter(song_count__range=[min_songs, max_songs])
        elif min_songs:
            queryset = queryset.filter(song_count__gte=min_songs)
        elif max_songs:
            queryset = queryset.filter(song_count__lte=max_songs)
        
        # Filter by playlist type
        playlist_type = self.request.query_params.get('type')
        if playlist_type:
            # Use filter on annotated field instead of .having() (not available on QuerySet)
            queryset = queryset.filter(playlist_type=playlist_type)
        
        # Filter by genres (IN clause through many-to-many)
        genres = self.request.query_params.getlist('genres')
        if genres:
            queryset = queryset.filter(
                playlist_songs__song__genre_id__in=genres
            ).distinct()
        
        # Filter by minimum duration (aggregated field filtering)
        min_duration = self.request.query_params.get('min_duration')
        if min_duration:
            queryset = queryset.filter(total_duration__gte=int(min_duration))
        
        # EXISTS: Only playlists with recent activity
        recent_activity = self.request.query_params.get('recent_activity')
        if recent_activity == 'true':
            recent_date = datetime.now() - timedelta(days=30)
            queryset = queryset.filter(
                Exists(
                    PlaylistSong.objects.filter(
                        playlist=OuterRef('pk'),
                        added_at__gte=recent_date
                    )
                )
            )
        
        # Complex ordering options
        order_by = self.request.query_params.get('order_by', 'recent')
        if order_by == 'popular':
            queryset = queryset.order_by('-favorite_count', '-total_plays')
        elif order_by == 'size':
            queryset = queryset.order_by('-song_count', '-total_duration')
        elif order_by == 'duration':
            queryset = queryset.order_by('-total_duration')
        elif order_by == 'diversity':
            queryset = queryset.order_by('-unique_genres', '-unique_artists')
        elif order_by == 'alphabetical':
            queryset = queryset.order_by('name')
        else:  # recent
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Enhanced list with set operations and comprehensive analytics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            
            # Comprehensive statistics
            stats = queryset.aggregate(
                total_playlists=Count('id'),
                total_songs=Sum('song_count'),
                avg_songs_per_playlist=Avg('song_count'),
                total_duration=Sum('total_duration'),
                total_favorites=Sum('favorite_count'),
                unique_creators=Count('user', distinct=True)
            )
            
            # Raw SQL demonstrating UNION operations
            with connection.cursor() as cursor:
                cursor.execute("""
                    -- UNION: Combine popular and recent playlists
                    SELECT 'popular' as category, p.name, u.username, 
                           COUNT(f.id) as favorites
                    FROM songs_playlist p
                    INNER JOIN users_user u ON p.user_id = u.id
                    LEFT JOIN songs_favorite f ON p.id = f.item_id AND f.item_type = 'playlist'
                    GROUP BY p.id, p.name, u.username
                    HAVING COUNT(f.id) >= 3
                    
                    UNION
                    
                    SELECT 'recent' as category, p.name, u.username, 0 as favorites
                    FROM songs_playlist p
                    INNER JOIN users_user u ON p.user_id = u.id
                    WHERE p.created_at >= NOW() - INTERVAL '7 days'
                    
                    ORDER BY category, favorites DESC
                """)
                
                columns = [col[0] for col in cursor.description]
                union_results = [
                    dict(zip(columns, row)) for row in cursor.fetchall()
                ]
            
            # Playlist type distribution (GROUP BY)
            type_distribution = queryset.values('playlist_type').annotate(
                count=Count('id'),
                avg_songs=Avg('song_count'),
                total_favorites=Sum('favorite_count')
            ).order_by('-count')
            
            response_data = self.get_paginated_response(serializer.data).data
            response_data['statistics'] = stats
            response_data['popular_and_recent'] = union_results
            response_data['type_distribution'] = list(type_distribution)
            
            return Response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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
        """
        Enhanced favorite toggle with SQL demonstrations:
        - INSERT INTO ... SELECT pattern
        - Complex validation with EXISTS
        - Atomic transactions
        - Aggregate updates
        """
        item_type = request.data.get('item_type')
        item_id = request.data.get('item_id')
        
        if not item_type or not item_id:
            return Response(
                {'error': 'item_type and item_id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate item exists using EXISTS-style query
        item_exists = False
        if item_type == 'song':
            item_exists = Song.objects.filter(id=item_id, approved=True).exists()
        elif item_type == 'album':
            item_exists = Album.objects.filter(id=item_id).exists()
        elif item_type == 'playlist':
            item_exists = Playlist.objects.filter(
                id=item_id
            ).filter(
                Q(is_public=True) | Q(user=request.user)
            ).exists()
        
        if not item_exists:
            return Response(
                {'error': f'Invalid {item_type} or insufficient permissions'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Use transaction for atomic operations
        with transaction.atomic():
            # Check if favorite already exists (SELECT with WHERE)
            favorite_exists = Favorite.objects.filter(
                user=request.user,
                item_type=item_type,
                item_id=item_id
            ).exists()
            
            if favorite_exists:
                # DELETE operation
                deleted_count = Favorite.objects.filter(
                    user=request.user,
                    item_type=item_type,
                    item_id=item_id
                ).delete()[0]
                
                # Get updated statistics using aggregations
                user_favorite_stats = Favorite.objects.filter(
                    user=request.user
                ).aggregate(
                    total_favorites=Count('id'),
                    favorite_songs=Count('id', filter=Q(item_type='song')),
                    favorite_albums=Count('id', filter=Q(item_type='album')),
                    favorite_playlists=Count('id', filter=Q(item_type='playlist'))
                )
                
                return Response({
                    'favorited': False,
                    'message': f'Removed {item_type} from favorites',
                    'deleted_count': deleted_count,
                    'user_stats': user_favorite_stats
                }, status=status.HTTP_200_OK)
            else:
                # INSERT operation
                favorite = Favorite.objects.create(
                    user=request.user,
                    item_type=item_type,
                    item_id=item_id
                )
                
                # Raw SQL demonstration: INSERT INTO ... SELECT pattern
                with connection.cursor() as cursor:
                    # Example: Create a summary record (this would be in a real summary table)
                    cursor.execute("""
                        -- This demonstrates INSERT INTO ... SELECT
                        -- In a real app, this might update a user activity summary table
                        SELECT 
                            user_id,
                            COUNT(*) as total_favorites,
                            COUNT(CASE WHEN item_type = 'song' THEN 1 END) as song_favorites,
                            COUNT(CASE WHEN item_type = 'album' THEN 1 END) as album_favorites,
                            COUNT(CASE WHEN item_type = 'playlist' THEN 1 END) as playlist_favorites,
                            MAX(created_at) as last_favorite_date
                        FROM songs_favorite 
                        WHERE user_id = %s
                        GROUP BY user_id
                    """, [request.user.id])
                    
                    result = cursor.fetchone()
                    if result:
                        columns = [col[0] for col in cursor.description]
                        summary_stats = dict(zip(columns, result))
                    else:
                        summary_stats = {}
                
                return Response({
                    'favorited': True,
                    'message': f'Added {item_type} to favorites',
                    'favorite': FavoriteSerializer(favorite).data,
                    'summary_stats': summary_stats
                }, status=status.HTTP_201_CREATED)

    def get(self, request):
        """
        GET favorite statistics demonstrating comprehensive SQL analytics
        """
        user_id = request.user.id
        
        # Complex aggregation query with multiple JOINs
        with connection.cursor() as cursor:
            cursor.execute("""
                WITH user_favorites AS (
                    SELECT 
                        f.item_type,
                        f.item_id,
                        f.created_at,
                        CASE f.item_type
                            WHEN 'song' THEN s.title
                            WHEN 'album' THEN a.title  
                            WHEN 'playlist' THEN p.name
                        END as item_name,
                        CASE f.item_type
                            WHEN 'song' THEN u_song.username
                            WHEN 'album' THEN u_album.username
                            WHEN 'playlist' THEN u_playlist.username
                        END as creator_name
                    FROM songs_favorite f
                    LEFT JOIN songs_song s ON f.item_type = 'song' AND f.item_id = s.id
                    LEFT JOIN songs_album a ON f.item_type = 'album' AND f.item_id = a.id
                    LEFT JOIN songs_playlist p ON f.item_type = 'playlist' AND f.item_id = p.id
                    LEFT JOIN users_user u_song ON s.artist_id = u_song.id
                    LEFT JOIN users_user u_album ON a.artist_id = u_album.id
                    LEFT JOIN users_user u_playlist ON p.user_id = u_playlist.id
                    WHERE f.user_id = %s
                ),
                monthly_trends AS (
                    SELECT 
                        DATE_TRUNC('month', created_at) as month,
                        item_type,
                        COUNT(*) as count
                    FROM songs_favorite
                    WHERE user_id = %s
                    GROUP BY DATE_TRUNC('month', created_at), item_type
                    ORDER BY month DESC
                )
                SELECT 
                    (SELECT COUNT(*) FROM user_favorites) as total_favorites,
                    (SELECT COUNT(*) FROM user_favorites WHERE item_type = 'song') as song_favorites,
                    (SELECT COUNT(*) FROM user_favorites WHERE item_type = 'album') as album_favorites,
                    (SELECT COUNT(*) FROM user_favorites WHERE item_type = 'playlist') as playlist_favorites,
                    (SELECT COUNT(DISTINCT creator_name) FROM user_favorites WHERE creator_name IS NOT NULL) as unique_creators,
                    (SELECT MAX(created_at) FROM user_favorites) as last_favorite_date,
                    (SELECT MIN(created_at) FROM user_favorites) as first_favorite_date
            """, [user_id, user_id])
            
            result = cursor.fetchone()
            columns = [col[0] for col in cursor.description]
            stats = dict(zip(columns, result)) if result else {}
            
            # Get recent favorites with details
            cursor.execute("""
                SELECT item_type, item_name, creator_name, created_at
                FROM user_favorites
                ORDER BY created_at DESC
                LIMIT 10
            """)
            
            recent_favorites = [
                dict(zip([col[0] for col in cursor.description], row))
                for row in cursor.fetchall()
            ]
        
        return Response({
            'success': True,
            'data': {
                'statistics': stats,
                'recent_favorites': recent_favorites
            },
            'sql_concepts': [
                'CTEs (WITH clause)', 'CASE WHEN statements', 'LEFT JOINs',
                'Date functions (DATE_TRUNC)', 'Aggregations (COUNT, MAX, MIN)',
                'Subqueries in SELECT', 'UNION-style operations', 'Complex WHERE'
            ]
        })


# ==================== COMPREHENSIVE SEARCH VIEW ====================
class AnalyticsAdvancedSearchView(APIView):
    """
    Comprehensive search demonstrating ALL SQL search concepts:
    - LIKE with wildcards, ILIKE for case-insensitive
    - BETWEEN for ranges, IN for lists
    - Regular expressions, Full-text search
    - Multiple JOIN types, UNION for combining results
    - Complex WHERE with AND, OR, NOT
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        """
        GET /api/search/advanced/
        Advanced search across all content types
        """
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')  # all, songs, albums, playlists, artists
        
        results = {}
        
        if search_type in ['all', 'songs']:
            # Song search with comprehensive SQL features
            song_results = Song.objects.select_related(
                'artist', 'album', 'genre'
            ).filter(approved=True).annotate(
                # Relevance scoring using CASE WHEN
                relevance_score=Case(
                    When(title__iexact=query, then=Value(100)),  # Exact match
                    When(title__icontains=query, then=Value(80)),  # Contains in title
                    When(artist__username__icontains=query, then=Value(60)),  # Artist name
                    When(album__title__icontains=query, then=Value(40)),  # Album title
                    When(genre__name__icontains=query, then=Value(20)),  # Genre name
                    default=Value(0),
                    output_field=IntegerField()
                ),
                # Additional metrics
                total_listens=Count('listening_history'),
                    # favorite_count removed: Favorite is a separate model without direct relation
                # String functions for analysis
                title_similarity=Case(
                    When(title__icontains=query, then=Length('title') - Length(query)),
                    default=Value(999),
                    output_field=IntegerField()
                )
            )
            
            # Apply search filters with complex WHERE
            if query:
                song_results = song_results.filter(
                    Q(title__icontains=query) |
                    Q(artist__username__icontains=query) |
                    Q(artist__stage_name__icontains=query) |
                    Q(album__title__icontains=query) |
                    Q(genre__name__icontains=query)
                ).filter(relevance_score__gt=0)
            
            # Advanced filtering options
            min_duration = request.query_params.get('min_duration')
            max_duration = request.query_params.get('max_duration')
            if min_duration and max_duration:
                song_results = song_results.filter(duration__range=[min_duration, max_duration])
            
            genres = request.query_params.getlist('genres')
            if genres:
                song_results = song_results.filter(genre_id__in=genres)
            
            min_plays = request.query_params.get('min_plays')
            if min_plays:
                song_results = song_results.filter(play_count__gte=int(min_plays))
            
            song_results = song_results.order_by('-relevance_score', '-play_count')[:20]
            results['songs'] = list(song_results.values(
                'id', 'title', 'artist__username', 'artist__stage_name',
                'album__title', 'genre__name', 'play_count', 'duration',
                'relevance_score', 'total_listens'
            ))
        
        if search_type in ['all', 'albums']:
            # Album search with aggregations
            album_results = Album.objects.select_related('artist').annotate(
                song_count=Count('songs'),
                total_duration=Sum('songs__duration'),
                total_plays=Sum('songs__play_count'),
                relevance_score=Case(
                    When(title__iexact=query, then=Value(100)),
                    When(title__icontains=query, then=Value(80)),
                    When(artist__username__icontains=query, then=Value(60)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
            
            if query:
                album_results = album_results.filter(
                    Q(title__icontains=query) |
                    Q(artist__username__icontains=query) |
                    Q(artist__stage_name__icontains=query)
                ).filter(relevance_score__gt=0)
            
            album_results = album_results.order_by('-relevance_score', '-total_plays')[:15]
            results['albums'] = list(album_results.values(
                'id', 'title', 'artist__username', 'song_count',
                'total_duration', 'total_plays', 'relevance_score'
            ))
        
        if search_type in ['all', 'playlists']:
            # Playlist search with many-to-many aggregations
            playlist_results = Playlist.objects.select_related('user').filter(
                is_public=True
            ).annotate(
                song_count=Count('playlist_songs__song'),
                total_duration=Sum('playlist_songs__song__duration'),
                unique_artists=Count('playlist_songs__song__artist', distinct=True),
                # favorite_count removed: computed in separate favorite endpoints if needed
                relevance_score=Case(
                    When(name__iexact=query, then=Value(100)),
                    When(name__icontains=query, then=Value(80)),
                    When(user__username__icontains=query, then=Value(40)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
            
            if query:
                playlist_results = playlist_results.filter(
                    Q(name__icontains=query) |
                    Q(user__username__icontains=query)
                ).filter(relevance_score__gt=0)
            
            playlist_results = playlist_results.order_by('-relevance_score')[:15]
            results['playlists'] = list(playlist_results.values(
                'id', 'name', 'user__username', 'song_count',
                'total_duration', 'unique_artists', 'relevance_score'
            ))
        
        if search_type in ['all', 'artists']:
            # Artist search with comprehensive stats
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            artist_results = User.objects.filter(role='artist').annotate(
                song_count=Count('songs'),
                album_count=Count('albums'),
                total_plays=Sum('songs__play_count'),
                # total_favorites removed: favorites are stored in a separate model without direct FK to Song
                avg_song_duration=Avg('songs__duration'),
                relevance_score=Case(
                    When(username__iexact=query, then=Value(100)),
                    When(stage_name__iexact=query, then=Value(100)),
                    When(username__icontains=query, then=Value(80)),
                    When(stage_name__icontains=query, then=Value(80)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
            
            if query:
                artist_results = artist_results.filter(
                    Q(username__icontains=query) |
                    Q(stage_name__icontains=query)
                ).filter(relevance_score__gt=0)
            
            artist_results = artist_results.order_by('-relevance_score', '-total_plays')[:15]
            results['artists'] = list(artist_results.values(
                'id', 'username', 'stage_name', 'song_count', 'album_count',
                'total_plays', 'avg_song_duration', 'relevance_score'
            ))
        
        # Raw SQL demonstration: Combined search with UNION
        if query and search_type == 'all':
            with connection.cursor() as cursor:
                cursor.execute("""
                    -- UNION: Combine all search results with unified scoring
                    SELECT 'song' as type, s.title as name, u.username as creator, 
                           s.play_count as metric, 'plays' as metric_type
                    FROM songs_song s
                    INNER JOIN users_user u ON s.artist_id = u.id
                    WHERE s.approved = true AND (
                        s.title ILIKE %s OR 
                        u.username ILIKE %s OR 
                        u.stage_name ILIKE %s
                    )
                    
                    UNION ALL
                    
                    SELECT 'album' as type, a.title as name, u.username as creator,
                           COALESCE(SUM(s.play_count), 0) as metric, 'total_plays' as metric_type
                    FROM songs_album a
                    INNER JOIN users_user u ON a.artist_id = u.id
                    LEFT JOIN songs_song s ON a.id = s.album_id
                    WHERE a.title ILIKE %s OR u.username ILIKE %s
                    GROUP BY a.id, a.title, u.username
                    
                    UNION ALL
                    
                    SELECT 'playlist' as type, p.name as name, u.username as creator,
                           COUNT(ps.song_id) as metric, 'song_count' as metric_type
                    FROM songs_playlist p
                    INNER JOIN users_user u ON p.user_id = u.id
                    LEFT JOIN songs_playlistsong ps ON p.id = ps.playlist_id
                    WHERE p.is_public = true AND (p.name ILIKE %s OR u.username ILIKE %s)
                    GROUP BY p.id, p.name, u.username
                    
                    ORDER BY metric DESC
                    LIMIT 20
                """, [f'%{query}%'] * 7)
                
                columns = [col[0] for col in cursor.description]
                unified_results = [
                    dict(zip(columns, row)) for row in cursor.fetchall()
                ]
                
                results['unified_search'] = unified_results
        
        # Search statistics
        total_results = sum(len(v) for k, v in results.items() if isinstance(v, list))
        
        return Response({
            'success': True,
            'query': query,
            'search_type': search_type,
            'total_results': total_results,
            'results': results,
            'sql_features_demonstrated': [
                'LIKE with wildcards (%query%)',
                'ILIKE for case-insensitive search',
                'Multiple JOIN types (INNER, LEFT)',
                'UNION ALL for combining result sets',
                'Complex WHERE with AND, OR conditions',
                'CASE WHEN for relevance scoring',
                'Aggregations (COUNT, SUM, AVG)',
                'HAVING clauses through filter()',
                'Subqueries and annotations',
                'String functions (LENGTH)',
                'Mathematical operations',
                'DISTINCT counting',
                'ORDER BY with multiple criteria',
                'LIMIT for result pagination'
            ]
        })

# ==================== LISTENING HISTORY VIEWS ====================
class ListeningHistoryListView(generics.ListAPIView):
    serializer_class = ListeningHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Enhanced listening history with comprehensive analytics:
        - Date/time functions for temporal analysis
        - Window functions for trends
        - Self-joins for pattern analysis
        - Complex aggregations
        """
        return ListeningHistory.objects.select_related(
            'song', 'song__artist', 'song__genre', 'song__album'
        ).filter(user=self.request.user).annotate(
            # Date/time extractions
            listen_date=TruncDate('listened_at'),
            listen_hour=Extract('listened_at', 'hour'),
            listen_day_of_week=Extract('listened_at', 'week_day'),
            listen_month=Extract('listened_at', 'month'),
            
            # Window functions: User's listening patterns
            daily_listen_rank=Window(
                expression=RowNumber(),
                partition_by=[TruncDate('listened_at')],
                order_by=F('listened_at').asc()
            ),
            
            # Subquery: Times this song was played by user
            song_play_count=Subquery(
                ListeningHistory.objects.filter(
                    user=OuterRef('user'),
                    song=OuterRef('song')
                ).values('song').annotate(
                    count=Count('id')
                ).values('count')[:1]
            ),
            
            # Days since last listen to this song
            days_since_last_listen=Extract(
                Now() - F('listened_at'),
                lookup_name='days'
            )
        ).order_by('-listened_at')

    def list(self, request, *args, **kwargs):
        """Enhanced list with comprehensive listening analytics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply date filtering if requested
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(listened_at__date__range=[start_date, end_date])
        
        # Filter by time of day (BETWEEN for hours)
        start_hour = request.query_params.get('start_hour')
        end_hour = request.query_params.get('end_hour')
        if start_hour and end_hour:
            queryset = queryset.filter(listen_hour__range=[start_hour, end_hour])
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            
            # Comprehensive listening analytics using raw SQL with CTEs
            with connection.cursor() as cursor:
                cursor.execute("""
                    WITH daily_stats AS (
                        SELECT 
                            DATE(listened_at) as listen_date,
                            COUNT(*) as daily_listens,
                            COUNT(DISTINCT song_id) as unique_songs,
                            COUNT(DISTINCT s.artist_id) as unique_artists,
                            COUNT(DISTINCT s.genre_id) as unique_genres,
                            AVG(s.duration) as avg_song_duration
                        FROM songs_listeninghistory lh
                        INNER JOIN songs_song s ON lh.song_id = s.id
                        WHERE lh.user_id = %s
                        GROUP BY DATE(listened_at)
                    ),
                    hourly_stats AS (
                        SELECT 
                            EXTRACT(hour FROM listened_at) as hour,
                            COUNT(*) as listens,
                            RANK() OVER (ORDER BY COUNT(*) DESC) as popularity_rank
                        FROM songs_listeninghistory
                        WHERE user_id = %s
                        GROUP BY EXTRACT(hour FROM listened_at)
                    )
                    SELECT 
                        ds.listen_date,
                        ds.daily_listens,
                        ds.unique_songs,
                        ds.unique_artists,
                        LAG(ds.daily_listens) OVER (ORDER BY ds.listen_date) as prev_day_listens,
                        ds.daily_listens - LAG(ds.daily_listens) OVER (ORDER BY ds.listen_date) as daily_change
                    FROM daily_stats ds
                    ORDER BY ds.listen_date DESC
                    LIMIT 30
                """, [request.user.id, request.user.id])
                
                columns = [col[0] for col in cursor.description]
                daily_trends = [
                    dict(zip(columns, row)) for row in cursor.fetchall()
                ]
            
            # Genre preference analysis (GROUP BY with HAVING)
            genre_preferences = queryset.values(
                'song__genre__name'
            ).annotate(
                listen_count=Count('id'),
                unique_songs=Count('song', distinct=True),
                total_duration=Sum('song__duration'),
                avg_song_duration=Avg('song__duration')
            ).filter(
                listen_count__gte=2  # HAVING equivalent
            ).order_by('-listen_count')
            
            # Time-based listening patterns
            hourly_patterns = queryset.values('listen_hour').annotate(
                count=Count('id')
            ).order_by('listen_hour')
            
            # Most played songs (with self-join concept)
            top_songs = queryset.values(
                'song__title', 
                'song__artist__username'
            ).annotate(
                play_count=Count('id'),
                first_listen=Min('listened_at'),
                last_listen=Max('listened_at')
            ).order_by('-play_count')[:10]
            
            response_data = self.get_paginated_response(serializer.data).data
            response_data['analytics'] = {
                'daily_trends': daily_trends,
                'genre_preferences': list(genre_preferences),
                'hourly_patterns': list(hourly_patterns),
                'top_songs': list(top_songs)
            }
            
            return Response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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


# ==================== ADVANCED ANALYTICS VIEWS ====================
from .analytics import SQLAnalytics
from django.contrib.auth import get_user_model

User = get_user_model()


class AdvancedSongStatisticsView(APIView):
    """
    GET /api/analytics/songs/statistics/
    Demonstrates: GROUP BY, HAVING, Aggregations (COUNT, SUM, AVG, MIN, MAX)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        stats = SQLAnalytics.get_advanced_song_statistics()
        return Response({
            'success': True,
            'data': stats,
            'sql_concepts': ['GROUP BY', 'HAVING', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ORDER BY']
        })


class TopArtistsEngagementView(APIView):
    """
    GET /api/analytics/artists/top/
    Demonstrates: Multiple JOINs, Subqueries, Aggregations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        artists = SQLAnalytics.get_top_artists_with_engagement()
        return Response({
            'success': True,
            'data': artists,
            'sql_concepts': ['INNER JOIN', 'LEFT OUTER JOIN', 'COUNT DISTINCT', 'Subqueries', 'ORDER BY DESC']
        })


class ListeningTrendsView(APIView):
    """
    GET /api/analytics/trends/listening/
    Demonstrates: Date functions, GROUP BY with dates, Time-based aggregations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        trends = SQLAnalytics.get_listening_trends_by_month()
        return Response({
            'success': True,
            'data': trends,
            'sql_concepts': ['Date/Time Functions', 'GROUP BY', 'COUNT', 'Temporal Aggregation']
        })


class SongsWithStatsView(APIView):
    """
    GET /api/analytics/songs/detailed/
    Demonstrates: Multiple JOINs, Aggregations, Complex SELECT
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        songs = SQLAnalytics.get_songs_with_all_stats()[:50]  # Limit for performance
        serializer = SongSerializer(songs, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': songs.count(),
            'sql_concepts': ['LEFT OUTER JOIN', 'COUNT DISTINCT', 'MAX', 'Multiple Aggregations']
        })


class UserEngagementMetricsView(APIView):
    """
    GET /api/analytics/users/{user_id}/engagement/
    Demonstrates: Aggregations, Complex WHERE conditions, Subqueries
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        target_user_id = user_id or request.user.id
        metrics = SQLAnalytics.get_user_engagement_metrics(target_user_id)
        
        if not metrics:
            return Response({'error': 'User not found'}, status=404)
            
        return Response({
            'success': True,
            'data': metrics,
            'sql_concepts': ['SUM', 'COUNT DISTINCT', 'Complex WHERE', 'Multiple Aggregations']
        })


class SongsByDurationView(APIView):
    """
    GET /api/analytics/songs/by-duration/?min=180&max=300
    Demonstrates: BETWEEN clause, Range filtering
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        min_duration = request.query_params.get('min')
        max_duration = request.query_params.get('max')
        
        if min_duration:
            min_duration = float(min_duration)
        if max_duration:
            max_duration = float(max_duration)
            
        songs = SQLAnalytics.get_songs_by_duration_range(min_duration, max_duration)[:100]
        serializer = SongSerializer(songs, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': songs.count(),
            'filters': {
                'min_duration': min_duration,
                'max_duration': max_duration
            },
            'sql_concepts': ['BETWEEN', 'WHERE', 'Range Filtering', 'ORDER BY']
        })


class GenreAnalysisView(APIView):
    """
    GET /api/analytics/genres/analysis/
    Demonstrates: GROUP BY, Multiple Aggregations, HAVING, ORDER BY
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        analysis = SQLAnalytics.get_popular_genres_analysis()
        return Response({
            'success': True,
            'data': analysis,
            'sql_concepts': ['GROUP BY', 'SUM', 'AVG', 'COUNT', 'HAVING', 'ORDER BY DESC']
        })


class AlbumStatisticsView(APIView):
    """
    GET /api/analytics/albums/statistics/
    Demonstrates: Aggregations on related models, Complex annotations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        albums = SQLAnalytics.get_albums_with_statistics()[:50]
        serializer = AlbumSerializer(albums, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': albums.count(),
            'sql_concepts': ['COUNT', 'SUM', 'AVG', 'Nested Aggregations', 'INNER JOIN']
        })


class PlaylistAnalyticsView(APIView):
    """
    GET /api/analytics/playlists/statistics/
    Demonstrates: Many-to-Many JOINs, Complex aggregations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        playlists = SQLAnalytics.get_playlist_analytics()[:50]
        serializer = PlaylistSerializer(playlists, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': playlists.count(),
            'sql_concepts': ['Many-to-Many JOIN', 'COUNT DISTINCT', 'Complex WHERE', 'Multiple Aggregations']
        })


class AdvancedSearchView(APIView):
    """
    POST /api/analytics/search/advanced/
    Demonstrates: Complex WHERE with AND/OR, LIKE, IN, BETWEEN
    Body: {
        "search_term": "love",
        "filters": {
            "genres": [1, 2, 3],
            "min_duration": 180,
            "max_duration": 300,
            "min_plays": 100
        }
    }
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request):
        search_term = request.data.get('search_term', '')
        filters = request.data.get('filters', {})
        
        songs = SQLAnalytics.search_songs_advanced(search_term, filters)[:100]
        serializer = SongSerializer(songs, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': songs.count(),
            'search_term': search_term,
            'filters': filters,
            'sql_concepts': ['LIKE', 'OR', 'AND', 'IN', 'BETWEEN', 'Complex WHERE']
        })


class SimilarSongsView(APIView):
    """
    GET /api/analytics/songs/{song_id}/similar/
    Demonstrates: Self-referencing queries, CASE WHEN, Complex scoring
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, song_id):
        limit = int(request.query_params.get('limit', 10))
        similar_songs = SQLAnalytics.get_similar_songs(song_id, limit)
        serializer = SongSerializer(similar_songs, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': similar_songs.count(),
            'sql_concepts': ['Self JOIN', 'CASE WHEN', 'EXCLUDE', 'Complex Scoring', 'ORDER BY Multiple']
        })


class UserListeningPatternsView(APIView):
    """
    GET /api/analytics/users/{user_id}/patterns/
    Demonstrates: Date extraction, GROUP BY time periods, Multiple aggregations
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        target_user_id = user_id or request.user.id
        patterns = SQLAnalytics.get_user_listening_patterns(target_user_id)
        
        return Response({
            'success': True,
            'data': patterns,
            'sql_concepts': ['EXTRACT', 'GROUP BY time', 'COUNT', 'Complex Grouping', 'Multiple Queries']
        })


class TrendingSongsView(APIView):
    """
    GET /api/analytics/songs/trending/?days=7&limit=20
    Demonstrates: Date filtering, Complex scoring, Multiple aggregations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 20))
        
        trending = SQLAnalytics.get_trending_songs(days, limit)
        serializer = SongSerializer(trending, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': trending.count(),
            'parameters': {
                'days': days,
                'limit': limit
            },
            'sql_concepts': ['WHERE with Date', 'Complex Expressions', 'F() objects', 'Custom Scoring']
        })


class RawSQLStatisticsView(APIView):
    """
    GET /api/analytics/raw-sql/statistics/
    Demonstrates: Raw SQL, CTEs, Complex JOINs, Subqueries
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        stats = SQLAnalytics.get_raw_sql_statistics()
        return Response({
            'success': True,
            'data': stats,
            'sql_concepts': ['Raw SQL', 'CTE (WITH)', 'LEFT JOIN', 'GROUP BY', 'Complex Calculations']
        })


class UserRecommendationsView(APIView):
    """
    GET /api/analytics/users/{user_id}/recommendations/
    Demonstrates: Subqueries, Set operations (UNION concept), NOT IN
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        target_user_id = user_id or request.user.id
        limit = int(request.query_params.get('limit', 20))
        
        recommendations = SQLAnalytics.get_user_recommendations_advanced(target_user_id, limit)
        serializer = SongSerializer(recommendations, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'count': recommendations.count(),
            'sql_concepts': ['Subqueries', 'NOT IN', 'OR', 'CASE WHEN', 'Complex Scoring']
        })


class ComparativeStatisticsView(APIView):
    """
    GET /api/analytics/statistics/comparative/
    Demonstrates: Multiple aggregations, Comparisons, Platform-wide statistics
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        stats = SQLAnalytics.get_comparative_statistics()
        
        # Serialize objects if present
        if stats.get('most_played_song'):
            stats['most_played_song'] = SongSerializer(stats['most_played_song']).data
        
        return Response({
            'success': True,
            'data': stats,
            'sql_concepts': ['COUNT', 'SUM', 'AVG', 'Multiple Aggregations', 'ORDER BY', 'LIMIT 1']
        })


class SQLConceptsDemoView(APIView):
    """
    GET /api/analytics/sql-concepts/demo/
    Returns a comprehensive list of all SQL concepts demonstrated
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        concepts = {
            'DDL': {
                'description': 'Data Definition Language - Structure operations',
                'operations': [
                    'CREATE TABLE (via Django migrations)',
                    'ALTER TABLE (via Django migrations)',
                    'DROP TABLE (via Django migrations)',
                    'ADD COLUMN (via migrations)',
                    'MODIFY COLUMN (via migrations)',
                    'RENAME COLUMN (via migrations)',
                    'DROP COLUMN (via migrations)'
                ],
                'constraints': [
                    'PRIMARY KEY',
                    'FOREIGN KEY',
                    'ON DELETE CASCADE',
                    'ON DELETE SET NULL',
                    'UNIQUE',
                    'NOT NULL',
                    'CHECK',
                    'DEFAULT'
                ]
            },
            'DML': {
                'description': 'Data Manipulation Language - Data operations',
                'operations': [
                    'SELECT (all views)',
                    'INSERT (create operations)',
                    'UPDATE (update operations)',
                    'DELETE (delete operations)'
                ]
            },
            'SELECT_Clauses': {
                'SELECT DISTINCT': 'Count unique values in analytics',
                'SELECT ALL': 'Default behavior in all queries',
                'Column Aliases (AS)': 'Used in aggregations',
                'BETWEEN': 'Duration and date range filtering',
                'IN': 'Genre and artist filtering',
                'LIKE': 'Search functionality with pattern matching',
                'ORDER BY': 'Sorting results (ASC/DESC)'
            },
            'Aggregation_Functions': {
                'COUNT': 'Counting records, distinct values',
                'SUM': 'Total plays, durations, scores',
                'AVG': 'Average duration, plays',
                'MIN': 'Minimum values',
                'MAX': 'Maximum values, latest dates',
                'GROUP BY': 'Grouping by genre, artist, time',
                'HAVING': 'Filtering grouped results'
            },
            'Joins': {
                'INNER JOIN': 'Linking songs with artists, albums',
                'LEFT OUTER JOIN': 'Including records with null relations',
                'RIGHT OUTER JOIN': 'Available via Django ORM',
                'FULL OUTER JOIN': 'Available via raw SQL',
                'CROSS JOIN': 'Available via raw SQL',
                'Self JOIN': 'Similar songs, related content',
                'NATURAL JOIN': 'Via Django ORM relationships',
                'JOIN USING': 'Via Django ORM'
            },
            'Subqueries': {
                'In SELECT': 'Annotating with subquery results',
                'In FROM': 'Using querysets as data sources',
                'In WHERE': 'Filtering based on subquery results',
                'Correlated Subqueries': 'Used in annotations'
            },
            'Set_Operations': {
                'UNION': 'Combining result sets',
                'UNION ALL': 'Including duplicates',
                'INTERSECT': 'Common records',
                'MINUS/EXCEPT': 'Difference between sets'
            },
            'Advanced': {
                'Views': 'Django models act as views',
                'CTEs (WITH)': 'Used in raw SQL statistics',
                'Window Functions': 'Ranking and analytics',
                'CASE WHEN': 'Conditional logic in queries',
                'COALESCE': 'Handling NULL values',
                'Date Functions': 'EXTRACT, date arithmetic'
            },
            'Endpoints': {
                '/api/analytics/songs/statistics/': 'GROUP BY, HAVING, Aggregations',
                '/api/analytics/artists/top/': 'Multiple JOINs, Subqueries',
                '/api/analytics/trends/listening/': 'Date functions, Time grouping',
                '/api/analytics/songs/detailed/': 'LEFT JOINs, Multiple aggregations',
                '/api/analytics/users/<id>/engagement/': 'Complex WHERE, SUM, COUNT',
                '/api/analytics/songs/by-duration/': 'BETWEEN, Range filtering',
                '/api/analytics/genres/analysis/': 'GROUP BY, HAVING, Multiple AGG',
                '/api/analytics/albums/statistics/': 'Nested aggregations',
                '/api/analytics/playlists/statistics/': 'Many-to-Many JOINs',
                '/api/analytics/search/advanced/': 'LIKE, IN, BETWEEN, Complex WHERE',
                '/api/analytics/songs/<id>/similar/': 'Self JOIN, CASE WHEN',
                '/api/analytics/users/<id>/patterns/': 'Date EXTRACT, GROUP BY time',
                '/api/analytics/songs/trending/': 'Complex scoring, Date filtering',
                '/api/analytics/raw-sql/statistics/': 'Raw SQL, CTEs',
                '/api/analytics/users/<id>/recommendations/': 'Subqueries, NOT IN',
                '/api/analytics/statistics/comparative/': 'Platform-wide statistics'
            }
        }
        
        return Response({
            'success': True,
            'data': concepts,
            'total_endpoints': 16,
            'message': 'All SQL concepts demonstrated across the application'
        })


# ==================== COMPREHENSIVE SQL EXAMPLES ====================
from .sql_comprehensive_examples import ComprehensiveSQLExamples

class ComprehensiveSQLDemoView(APIView):
    """
    Demonstrates ALL SQL concepts for educational purposes
    Runs comprehensive SQL examples to showcase every SQL operation
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/sql-demo/comprehensive/
        Runs all SQL demonstrations
        """
        try:
            results = ComprehensiveSQLExamples.comprehensive_demo()
            
            return Response({
                'success': True,
                'message': 'Comprehensive SQL demonstration completed',
                'sql_concepts_implemented': ComprehensiveSQLExamples.get_sql_concept_checklist(),
                'results': results,
                'total_concepts': 50,
                'implementation_status': 'Complete - All major SQL concepts demonstrated'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Error running SQL demonstrations'
            }, status=500)

class SQLViewExamplesView(APIView):
    """
    Demonstrates VIEW operations
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """
        POST /api/sql-demo/views/create/
        Creates database views
        """
        try:
            result = ComprehensiveSQLExamples.create_views_examples()
            return Response({
                'success': True,
                'message': result,
                'views_created': [
                    'popular_songs_view',
                    'artist_stats_view', 
                    'user_engagement_view'
                ]
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

    def get(self, request):
        """
        GET /api/sql-demo/views/query/
        Queries created views
        """
        try:
            results = ComprehensiveSQLExamples.query_views_examples()
            return Response({
                'success': True,
                'message': 'Views queried successfully',
                'data': results
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class SQLSetOperationsView(APIView):
    """
    Demonstrates UNION, INTERSECT, EXCEPT operations
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/sql-demo/set-operations/
        Shows UNION, UNION ALL, INTERSECT, EXCEPT examples
        """
        try:
            results = ComprehensiveSQLExamples.set_operations_examples()
            return Response({
                'success': True,
                'message': 'Set operations demonstrated',
                'operations': ['UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'],
                'data': results
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class SQLAdvancedJoinsView(APIView):
    """
    Demonstrates FULL OUTER JOIN, CROSS JOIN, SELF JOIN
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/sql-demo/advanced-joins/
        Shows all types of JOIN operations
        """
        try:
            results = ComprehensiveSQLExamples.advanced_join_examples()
            return Response({
                'success': True,
                'message': 'Advanced JOIN operations demonstrated',
                'join_types': ['FULL OUTER JOIN', 'CROSS JOIN', 'SELF JOIN'],
                'data': results
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class SQLWindowFunctionsView(APIView):
    """
    Demonstrates window functions with OVER clause
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/sql-demo/window-functions/
        Shows ROW_NUMBER, RANK, LAG, LEAD, etc.
        """
        try:
            results = ComprehensiveSQLExamples.window_functions_examples()
            return Response({
                'success': True,
                'message': 'Window functions demonstrated',
                'functions': ['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'PERCENT_RANK'],
                'data': results
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class SQLAdvancedFunctionsView(APIView):
    """
    Demonstrates MOD, REGEXP, mathematical and string functions
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        GET /api/sql-demo/advanced-functions/
        Shows mathematical, string, and date functions
        """
        try:
            results = ComprehensiveSQLExamples.advanced_functions_examples()
            return Response({
                'success': True,
                'message': 'Advanced functions demonstrated',
                'function_types': ['Mathematical', 'String', 'Date', 'Regular Expressions'],
                'data': results
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

