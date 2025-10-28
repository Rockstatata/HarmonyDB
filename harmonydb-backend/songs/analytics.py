"""
Advanced SQL Analytics Module
Demonstrates comprehensive SQL query concepts including:
- Joins (INNER, LEFT, RIGHT, FULL, SELF, CROSS)
- Subqueries (in SELECT, FROM, WHERE)
- Aggregations (COUNT, SUM, AVG, MIN, MAX)
- GROUP BY, HAVING
- Set Operations (UNION, INTERSECT, EXCEPT/MINUS)
- Window Functions
- CTEs (Common Table Expressions)
- Complex WHERE conditions (BETWEEN, IN, LIKE)
"""

from django.db import connection
from django.db.models import (
    Count, Sum, Avg, Min, Max, Q, F, Value, CharField,
    OuterRef, Subquery, Exists, Case, When, IntegerField,
    Window, ExpressionWrapper, FloatField, DurationField
)
from django.db.models.functions import (
    TruncDate, TruncMonth, Coalesce, Cast, Concat, 
    Extract, Now, Lower, Upper
)
from .models import Song, Album, Playlist, User, Genre, ListeningHistory, Favorite, Comment
from users.models import User
from datetime import datetime, timedelta
import json


class SQLAnalytics:
    """
    Comprehensive SQL Analytics demonstrating all SQL concepts
    """

    @staticmethod
    def get_advanced_song_statistics():
        """
        Demonstrates: Aggregations, GROUP BY, HAVING, Subqueries
        Shows statistics for songs with complex conditions
        """
        # Using Django ORM (translates to SQL with GROUP BY, HAVING, aggregations)
        stats = Song.objects.values('genre__name').annotate(
            total_songs=Count('id'),
            avg_duration=Avg('duration'),
            total_plays=Sum('play_count'),
            min_duration=Min('duration'),
            max_duration=Max('duration'),
        ).filter(
            total_songs__gte=2  # HAVING clause
        ).order_by('-total_plays')

        return list(stats)

    @staticmethod
    def get_top_artists_with_engagement():
        """
        Demonstrates: Multiple JOINs, Aggregations, Subqueries
        Returns top artists based on multiple engagement metrics
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Complex query with multiple joins and subqueries
        artists = User.objects.filter(
            role='artist'
        ).annotate(
            # Count of songs
            total_songs=Count('songs', distinct=True),
            # Count of albums  
            total_albums=Count('albums', distinct=True),
            # Total plays across all songs
            total_plays=Sum('songs__play_count'),
            # Favorites count (subquery)
            favorites_count=Count(
                'songs__favorite',
                filter=Q(songs__favorite__item_type='song'),
                distinct=True
            ),
            # Average song duration
            avg_song_duration=Avg('songs__duration'),
            # Count of comments on their songs
            comments_count=Count('songs__comment', distinct=True)
        ).filter(
            total_songs__gt=0
        ).order_by('-total_plays')[:20]

        return list(artists.values(
            'id', 'username', 'stage_name', 'total_songs', 
            'total_albums', 'total_plays', 'favorites_count',
            'avg_song_duration', 'comments_count'
        ))

    @staticmethod
    def get_listening_trends_by_month():
        """
        Demonstrates: Date functions, GROUP BY with dates, Aggregations
        Returns listening trends grouped by month
        """
        trends = ListeningHistory.objects.annotate(
            month=TruncMonth('listened_at')
        ).values('month').annotate(
            total_listens=Count('id'),
            unique_users=Count('user', distinct=True),
            unique_songs=Count('song', distinct=True)
        ).order_by('-month')[:12]

        return list(trends)

    @staticmethod
    def get_songs_with_all_stats():
        """
        Demonstrates: Multiple LEFT JOINs, Aggregations, Subqueries
        Returns songs with comprehensive statistics
        """
        songs = Song.objects.select_related(
            'artist', 'album', 'genre'
        ).annotate(
            # Listening history count
            listen_count=Count('listening_history', distinct=True),
            # Unique listeners
            unique_listeners=Count('listening_history__user', distinct=True),
            # Favorites count
            favorites=Count(
                'favorite',
                filter=Q(favorite__item_type='song'),
                distinct=True
            ),
            # Comments count
            comments=Count('comment', distinct=True),
            # In how many playlists
            playlist_appearances=Count('in_playlists', distinct=True),
            # Last played (subquery)
            last_played=Max('listening_history__listened_at'),
            # Artist total songs (for comparison)
            artist_song_count=Count('artist__songs', distinct=True)
        ).order_by('-play_count')

        return songs

    @staticmethod
    def get_user_engagement_metrics(user_id):
        """
        Demonstrates: Multiple aggregations, Complex WHERE, Subqueries
        Returns detailed engagement metrics for a user
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user = User.objects.filter(id=user_id).annotate(
            # Total listening time
            total_listen_time=Sum('listening_history__song__duration'),
            # Total listens
            total_listens=Count('listening_history'),
            # Unique songs listened
            unique_songs_listened=Count('listening_history__song', distinct=True),
            # Favorite songs count
            favorite_songs=Count(
                'favorites',
                filter=Q(favorites__item_type='song'),
                distinct=True
            ),
            # Favorite albums count
            favorite_albums=Count(
                'favorites',
                filter=Q(favorites__item_type='album'),
                distinct=True
            ),
            # Playlists created
            playlists_created=Count('playlists', distinct=True),
            # Comments made
            comments_made=Count('comments', distinct=True),
            # If artist: songs uploaded
            songs_uploaded=Count('songs', distinct=True),
            # If artist: albums created
            albums_created=Count('albums', distinct=True)
        ).first()

        if user:
            return {
                'user_id': user.id,
                'username': user.username,
                'total_listen_time': user.total_listen_time or 0,
                'total_listens': user.total_listens,
                'unique_songs_listened': user.unique_songs_listened,
                'favorite_songs': user.favorite_songs,
                'favorite_albums': user.favorite_albums,
                'playlists_created': user.playlists_created,
                'comments_made': user.comments_made,
                'songs_uploaded': user.songs_uploaded,
                'albums_created': user.albums_created
            }
        return None

    @staticmethod
    def get_songs_by_duration_range(min_duration=None, max_duration=None):
        """
        Demonstrates: BETWEEN clause, Range filtering
        Returns songs within duration range
        """
        queryset = Song.objects.select_related('artist', 'genre')

        if min_duration and max_duration:
            # BETWEEN clause
            queryset = queryset.filter(duration__range=(min_duration, max_duration))
        elif min_duration:
            queryset = queryset.filter(duration__gte=min_duration)
        elif max_duration:
            queryset = queryset.filter(duration__lte=max_duration)

        return queryset.order_by('duration')

    @staticmethod
    def get_popular_genres_analysis():
        """
        Demonstrates: GROUP BY, Multiple aggregations, HAVING, ORDER BY
        Returns genre popularity analysis
        """
        genres = Genre.objects.annotate(
            song_count=Count('song'),
            total_plays=Sum('song__play_count'),
            avg_plays_per_song=Avg('song__play_count'),
            total_favorites=Count(
                'song__favorite',
                filter=Q(song__favorite__item_type='song'),
                distinct=True
            ),
            total_duration=Sum('song__duration'),
            avg_duration=Avg('song__duration')
        ).filter(
            song_count__gte=1  # HAVING clause
        ).order_by('-total_plays')

        return list(genres.values(
            'id', 'name', 'description', 'song_count', 
            'total_plays', 'avg_plays_per_song', 
            'total_favorites', 'total_duration', 'avg_duration'
        ))

    @staticmethod
    def get_albums_with_statistics():
        """
        Demonstrates: Aggregations on related models, Complex annotations
        Returns albums with detailed statistics
        """
        albums = Album.objects.select_related('artist').annotate(
            # Number of songs in album
            song_count=Count('songs'),
            # Total duration of all songs
            total_duration=Sum('songs__duration'),
            # Average duration per song
            avg_song_duration=Avg('songs__duration'),
            # Total plays across all songs
            total_plays=Sum('songs__play_count'),
            # Total favorites for this album
            favorites_count=Count(
                'favorite',
                filter=Q(favorite__item_type='album'),
                distinct=True
            ),
            # Total listens across all songs
            total_listens=Count('songs__listening_history', distinct=True)
        ).filter(
            song_count__gt=0
        ).order_by('-total_plays')

        return albums

    @staticmethod
    def get_playlist_analytics():
        """
        Demonstrates: Many-to-Many aggregations, Complex JOINs
        Returns playlist statistics
        """
        playlists = Playlist.objects.select_related('user').annotate(
            # Number of songs
            song_count=Count('playlist_songs__song', distinct=True),
            # Total duration
            total_duration=Sum('playlist_songs__song__duration'),
            # Number of favorites
            favorites_count=Count(
                'favorite',
                filter=Q(favorite__item_type='playlist'),
                distinct=True
            ),
            # Unique genres in playlist
            unique_genres=Count('playlist_songs__song__genre', distinct=True),
            # Total plays of songs in playlist
            total_plays=Sum('playlist_songs__song__play_count')
        ).filter(
            is_public=True,
            song_count__gt=0
        ).order_by('-favorites_count', '-song_count')

        return playlists

    @staticmethod
    def search_songs_advanced(search_term, filters=None):
        """
        Demonstrates: Complex WHERE with OR/AND, LIKE pattern matching, 
        Multiple JOINs, IN clause
        Advanced search with multiple filters
        """
        queryset = Song.objects.select_related('artist', 'album', 'genre')

        # LIKE pattern matching with OR conditions
        if search_term:
            queryset = queryset.filter(
                Q(title__icontains=search_term) |  # LIKE '%term%'
                Q(artist__username__icontains=search_term) |
                Q(artist__stage_name__icontains=search_term) |
                Q(album__title__icontains=search_term) |
                Q(genre__name__icontains=search_term)
            )

        if filters:
            # IN clause for genres
            if 'genres' in filters and filters['genres']:
                queryset = queryset.filter(genre__id__in=filters['genres'])

            # BETWEEN for duration
            if 'min_duration' in filters and 'max_duration' in filters:
                queryset = queryset.filter(
                    duration__range=(filters['min_duration'], filters['max_duration'])
                )

            # BETWEEN for release date
            if 'start_date' in filters and 'end_date' in filters:
                queryset = queryset.filter(
                    release_date__range=(filters['start_date'], filters['end_date'])
                )

            # Greater than for play count
            if 'min_plays' in filters:
                queryset = queryset.filter(play_count__gte=filters['min_plays'])

        # Annotate with additional info
        queryset = queryset.annotate(
            listen_count=Count('listening_history'),
            favorites=Count('favorite', filter=Q(favorite__item_type='song'))
        )

        return queryset

    @staticmethod
    def get_similar_songs(song_id, limit=10):
        """
        Demonstrates: Self-referencing queries, Complex filtering
        Find similar songs based on genre and artist
        """
        try:
            song = Song.objects.get(id=song_id)

            # Find similar songs (same genre or artist, but not the same song)
            similar = Song.objects.filter(
                Q(genre=song.genre) | Q(artist=song.artist)
            ).exclude(
                id=song_id
            ).annotate(
                # Calculate similarity score
                similarity_score=Case(
                    When(genre=song.genre, artist=song.artist, then=Value(3)),
                    When(genre=song.genre, then=Value(2)),
                    When(artist=song.artist, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ).order_by('-similarity_score', '-play_count')[:limit]

            return similar

        except Song.DoesNotExist:
            return Song.objects.none()

    @staticmethod
    def get_user_listening_patterns(user_id):
        """
        Demonstrates: Complex aggregations, Date functions, GROUP BY
        Analyzes user listening patterns over time
        """
        # Listening by day of week
        by_weekday = ListeningHistory.objects.filter(
            user_id=user_id
        ).annotate(
            weekday=Extract('listened_at', 'dow')
        ).values('weekday').annotate(
            count=Count('id')
        ).order_by('weekday')

        # Listening by hour
        by_hour = ListeningHistory.objects.filter(
            user_id=user_id
        ).annotate(
            hour=Extract('listened_at', 'hour')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')

        # Top genres
        top_genres = ListeningHistory.objects.filter(
            user_id=user_id
        ).values(
            'song__genre__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        # Top artists
        top_artists = ListeningHistory.objects.filter(
            user_id=user_id
        ).values(
            'song__artist__username',
            'song__artist__stage_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        return {
            'by_weekday': list(by_weekday),
            'by_hour': list(by_hour),
            'top_genres': list(top_genres),
            'top_artists': list(top_artists)
        }

    @staticmethod
    def get_trending_songs(days=7, limit=20):
        """
        Demonstrates: Date filtering, Aggregations, Complex ordering
        Get trending songs based on recent activity
        """
        cutoff_date = datetime.now() - timedelta(days=days)

        trending = Song.objects.annotate(
            # Recent listens
            recent_listens=Count(
                'listening_history',
                filter=Q(listening_history__listened_at__gte=cutoff_date)
            ),
            # Recent favorites (subquery)
            recent_favorites=Subquery(
                Favorite.objects.filter(
                    item_type='song',
                    item_id=OuterRef('pk'),
                    created_at__gte=cutoff_date
                ).values('item_id').annotate(ct=Count('id')).values('ct')[:1]
            ),
            # Recent comments (subquery)
            recent_comments=Subquery(
                Comment.objects.filter(
                    item_type='song',
                    item_id=OuterRef('pk'),
                    created_at__gte=cutoff_date
                ).values('item_id').annotate(ct=Count('id')).values('ct')[:1]
            ),
            # Calculate trending score
            trending_score=F('recent_listens') * 3 + Coalesce(F('recent_favorites'), 0) * 5 + Coalesce(F('recent_comments'), 0) * 2
        ).filter(
            trending_score__gt=0
        ).order_by('-trending_score', '-recent_listens')[:limit]

        return trending

    @staticmethod
    def get_raw_sql_statistics():
        """
        Demonstrates: Raw SQL with JOINs, Subqueries, CTEs
        Complex statistics using raw SQL for maximum flexibility
        """
        with connection.cursor() as cursor:
            # Example 1: CTE with multiple aggregations
            query = """
            WITH song_stats AS (
                SELECT 
                    s.id,
                    s.title,
                    COUNT(DISTINCT lh.id) as listen_count,
                    COUNT(DISTINCT f.id) as favorite_count,
                    COUNT(DISTINCT c.id) as comment_count
                FROM songs_song s
                LEFT JOIN songs_listeninghistory lh ON s.id = lh.song_id
                LEFT JOIN songs_favorite f ON s.id = f.item_id AND f.item_type = 'song'
                LEFT JOIN songs_comment c ON s.id = c.item_id AND c.item_type = 'song'
                GROUP BY s.id, s.title
            )
            SELECT 
                title,
                listen_count,
                favorite_count,
                comment_count,
                (listen_count + favorite_count * 2 + comment_count * 3) as engagement_score
            FROM song_stats
            WHERE listen_count > 0 OR favorite_count > 0 OR comment_count > 0
            ORDER BY engagement_score DESC
            LIMIT 20;
            """
            
            cursor.execute(query)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            return results

    @staticmethod
    def get_user_recommendations_advanced(user_id, limit=20):
        """
        Demonstrates: Complex subqueries, Set operations concept, Multiple JOINs
        Generate recommendations based on user behavior
        """
        # Get user's favorite genres
        user_genres = ListeningHistory.objects.filter(
            user_id=user_id
        ).values_list('song__genre_id', flat=True).distinct()

        # Get user's favorite artists
        user_artists = ListeningHistory.objects.filter(
            user_id=user_id
        ).values_list('song__artist_id', flat=True).distinct()

        # Get songs user hasn't listened to yet
        listened_songs = ListeningHistory.objects.filter(
            user_id=user_id
        ).values_list('song_id', flat=True)

        # Recommend songs from favorite genres/artists that user hasn't heard
        recommendations = Song.objects.filter(
            Q(genre_id__in=user_genres) | Q(artist_id__in=user_artists)
        ).exclude(
            id__in=listened_songs
        ).annotate(
            # Score based on multiple factors
            recommendation_score=Case(
                When(
                    genre_id__in=user_genres,
                    artist_id__in=user_artists,
                    then=Value(5)
                ),
                When(genre_id__in=user_genres, then=Value(3)),
                When(artist_id__in=user_artists, then=Value(2)),
                default=Value(1),
                output_field=IntegerField()
            ) + F('play_count') / 100  # Factor in popularity
        ).order_by('-recommendation_score', '-play_count')[:limit]

        return recommendations

    @staticmethod
    def get_comparative_statistics():
        """
        Demonstrates: Multiple aggregations, Comparisons, Subqueries
        Compare different metrics across the platform
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        stats = {
            # Total counts
            'total_users': User.objects.count(),
            'total_artists': User.objects.filter(role='artist').count(),
            'total_listeners': User.objects.filter(role='listener').count(),
            'total_songs': Song.objects.count(),
            'total_albums': Album.objects.count(),
            'total_playlists': Playlist.objects.count(),
            'total_genres': Genre.objects.count(),
            
            # Aggregated metrics
            'total_plays': Song.objects.aggregate(Sum('play_count'))['play_count__sum'] or 0,
            'avg_song_duration': Song.objects.aggregate(Avg('duration'))['duration__avg'] or 0,
            'total_favorites': Favorite.objects.count(),
            'total_listens': ListeningHistory.objects.count(),
            'total_comments': Comment.objects.count(),
            
            # Most popular
            'most_played_song': Song.objects.order_by('-play_count').first(),
            'most_popular_genre': Genre.objects.annotate(
                total_plays=Sum('song__play_count')
            ).order_by('-total_plays').first(),
            'most_active_user': User.objects.annotate(
                activity=Count('listening_history') + Count('favorites') + Count('comments')
            ).order_by('-activity').first(),
            
            # Averages
            'avg_songs_per_album': Album.objects.annotate(
                song_count=Count('songs')
            ).aggregate(Avg('song_count'))['song_count__avg'] or 0,
            'avg_songs_per_playlist': Playlist.objects.annotate(
                song_count=Count('playlist_songs')
            ).aggregate(Avg('song_count'))['song_count__avg'] or 0,
        }

        return stats
