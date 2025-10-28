"""
Analytics URL Configuration
Comprehensive endpoints demonstrating all SQL concepts
"""
from django.urls import path
from .views import (
    AdvancedSongStatisticsView,
    TopArtistsEngagementView,
    ListeningTrendsView,
    SongsWithStatsView,
    UserEngagementMetricsView,
    SongsByDurationView,
    GenreAnalysisView,
    AlbumStatisticsView,
    PlaylistAnalyticsView,
    AdvancedSearchView,
    SimilarSongsView,
    UserListeningPatternsView,
    TrendingSongsView,
    RawSQLStatisticsView,
    UserRecommendationsView,
    ComparativeStatisticsView,
    SQLConceptsDemoView,
    # Comprehensive SQL Demo Views
    ComprehensiveSQLDemoView,
    SQLViewExamplesView,
    SQLSetOperationsView,
    SQLAdvancedJoinsView,
    SQLWindowFunctionsView,
    SQLAdvancedFunctionsView
)

urlpatterns = [
    # SQL Concepts Documentation
    path('sql-concepts/demo/', SQLConceptsDemoView.as_view(), name='sql-concepts-demo'),
    
    # ==================== COMPREHENSIVE SQL DEMONSTRATIONS ====================
    # Complete SQL feature showcase for educational purposes
    path('sql-demo/comprehensive/', ComprehensiveSQLDemoView.as_view(), name='comprehensive-sql-demo'),
    path('sql-demo/views/create/', SQLViewExamplesView.as_view(), name='sql-views-create'),
    path('sql-demo/views/query/', SQLViewExamplesView.as_view(), name='sql-views-query'),
    path('sql-demo/set-operations/', SQLSetOperationsView.as_view(), name='sql-set-operations'),
    path('sql-demo/advanced-joins/', SQLAdvancedJoinsView.as_view(), name='sql-advanced-joins'),
    path('sql-demo/window-functions/', SQLWindowFunctionsView.as_view(), name='sql-window-functions'),
    path('sql-demo/advanced-functions/', SQLAdvancedFunctionsView.as_view(), name='sql-advanced-functions'),
    
    # Song Analytics
    path('songs/statistics/', AdvancedSongStatisticsView.as_view(), name='song-statistics'),
    path('songs/detailed/', SongsWithStatsView.as_view(), name='songs-detailed'),
    path('songs/by-duration/', SongsByDurationView.as_view(), name='songs-by-duration'),
    path('songs/trending/', TrendingSongsView.as_view(), name='songs-trending'),
    path('songs/<int:song_id>/similar/', SimilarSongsView.as_view(), name='similar-songs'),
    
    # Artist Analytics
    path('artists/top/', TopArtistsEngagementView.as_view(), name='top-artists'),
    
    # Genre Analytics
    path('genres/analysis/', GenreAnalysisView.as_view(), name='genre-analysis'),
    
    # Album Analytics
    path('albums/statistics/', AlbumStatisticsView.as_view(), name='album-statistics'),
    
    # Playlist Analytics
    path('playlists/statistics/', PlaylistAnalyticsView.as_view(), name='playlist-statistics'),
    
    # Trend Analytics
    path('trends/listening/', ListeningTrendsView.as_view(), name='listening-trends'),
    
    # User Analytics
    path('users/<int:user_id>/engagement/', UserEngagementMetricsView.as_view(), name='user-engagement'),
    path('users/engagement/', UserEngagementMetricsView.as_view(), name='current-user-engagement'),
    path('users/<int:user_id>/patterns/', UserListeningPatternsView.as_view(), name='user-patterns'),
    path('users/patterns/', UserListeningPatternsView.as_view(), name='current-user-patterns'),
    path('users/<int:user_id>/recommendations/', UserRecommendationsView.as_view(), name='user-recommendations'),
    path('users/recommendations/', UserRecommendationsView.as_view(), name='current-user-recommendations'),
    
    # Advanced Search
    path('search/advanced/', AdvancedSearchView.as_view(), name='advanced-search'),
    
    # Raw SQL Examples
    path('raw-sql/statistics/', RawSQLStatisticsView.as_view(), name='raw-sql-statistics'),
    
    # Comparative Statistics
    path('statistics/comparative/', ComparativeStatisticsView.as_view(), name='comparative-statistics'),
]
