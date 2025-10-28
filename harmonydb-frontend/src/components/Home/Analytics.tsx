import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Music, Users, Disc, ListMusic, Clock, Award, 
  BarChart3, PieChart, Activity, Database, ChevronRight 
} from 'lucide-react';

interface AnalyticsStat {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'artists' | 'genres' | 'users'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [songStats, setSongStats] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [genreAnalysis, setGenreAnalysis] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [sqlConcepts, setSqlConcepts] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    loadSQLConcepts();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load comparative statistics
      const statsResponse = await fetch('http://localhost:8000/api/analytics/statistics/comparative/');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load song statistics
      const songStatsResponse = await fetch('http://localhost:8000/api/analytics/songs/statistics/');
      const songStatsData = await songStatsResponse.json();
      if (songStatsData.success) {
        setSongStats(songStatsData.data);
      }

      // Load top artists
      const artistsResponse = await fetch('http://localhost:8000/api/analytics/artists/top/');
      const artistsData = await artistsResponse.json();
      if (artistsData.success) {
        setTopArtists(artistsData.data);
      }

      // Load genre analysis
      const genreResponse = await fetch('http://localhost:8000/api/analytics/genres/analysis/');
      const genreData = await genreResponse.json();
      if (genreData.success) {
        setGenreAnalysis(genreData.data);
      }

      // Load trending songs
      const trendingResponse = await fetch('http://localhost:8000/api/analytics/songs/trending/?days=7&limit=10');
      const trendingData = await trendingResponse.json();
      if (trendingData.success) {
        setTrendingSongs(trendingData.data);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSQLConcepts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics/sql-concepts/demo/');
      const data = await response.json();
      if (data.success) {
        setSqlConcepts(data.data);
      }
    } catch (error) {
      console.error('Error loading SQL concepts:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">Loading Analytics...</p>
          <p className="text-text-muted text-sm mt-2 font-poppins">Executing complex SQL queries...</p>
        </div>
      </div>
    );
  }

  const overviewStats: AnalyticsStat[] = stats ? [
    {
      label: 'Total Songs',
      value: formatNumber(stats.total_songs),
      icon: <Music size={24} />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Total Artists',
      value: formatNumber(stats.total_artists),
      icon: <Users size={24} />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Total Plays',
      value: formatNumber(stats.total_plays),
      icon: <Activity size={24} />,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Total Albums',
      value: formatNumber(stats.total_albums),
      icon: <Disc size={24} />,
      color: 'from-pink-500 to-pink-600'
    },
    {
      label: 'Total Playlists',
      value: formatNumber(stats.total_playlists),
      icon: <ListMusic size={24} />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      label: 'Total Listens',
      value: formatNumber(stats.total_listens),
      icon: <Clock size={24} />,
      color: 'from-red-500 to-red-600'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 font-poppins flex items-center">
              <BarChart3 className="mr-3 text-primary" size={32} />
              Advanced Analytics
            </h1>
            <p className="text-text-secondary font-poppins">
              Demonstrating comprehensive SQL concepts with real-time data analysis
            </p>
          </div>
          <div className="bg-surface border border-accent/20 rounded-xl px-4 py-2">
            <div className="flex items-center space-x-2 text-primary">
              <Database size={20} />
              <span className="font-semibold font-poppins">PostgreSQL</span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-poppins">16+ Analytics Endpoints</p>
          </div>
        </div>

        {/* SQL Concepts Badge */}
        {sqlConcepts && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-accent mb-1 font-poppins">SQL Concepts Demonstrated</h3>
                <p className="text-xs text-text-muted font-poppins">
                  All queries visible in SQL Terminal (bottom-right corner)
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">JOINs</span>
                <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">Aggregations</span>
                <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded">Subqueries</span>
                <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">CTEs</span>
                <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded">Complex WHERE</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
          { key: 'songs', label: 'Songs', icon: <Music size={16} /> },
          { key: 'artists', label: 'Artists', icon: <Users size={16} /> },
          { key: 'genres', label: 'Genres', icon: <PieChart size={16} /> },
          { key: 'users', label: 'Trending', icon: <TrendingUp size={16} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-poppins text-sm transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-surface text-text-secondary hover:bg-surface/80 border border-accent/20'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overviewStats.map((stat, index) => (
              <div
                key={index}
                className="bg-surface border border-accent/20 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                  {stat.change && (
                    <span className="text-sm text-green-400 font-semibold">{stat.change}</span>
                  )}
                </div>
                <h3 className="text-text-muted text-sm mb-1 font-poppins">{stat.label}</h3>
                <p className="text-3xl font-bold text-text-primary font-poppins">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* SQL Concepts Section */}
          {sqlConcepts && (
            <div className="bg-surface border border-accent/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 font-poppins flex items-center">
                <Database className="mr-2 text-primary" size={24} />
                SQL Concepts Coverage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(sqlConcepts).filter(([key]) => !['Endpoints', 'total_endpoints', 'message'].includes(key)).map(([category, data]: [string, any]) => (
                  <div key={category} className="bg-background border border-accent/10 rounded-lg p-4">
                    <h3 className="text-primary font-semibold mb-2 font-poppins">{category.replace(/_/g, ' ')}</h3>
                    {data.description && (
                      <p className="text-xs text-text-muted mb-2 font-poppins">{data.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(data) ? data : Object.keys(data).filter(k => k !== 'description')).slice(0, 5).map((item: any, i: number) => (
                        <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                          {typeof item === 'string' ? item.split('(')[0] : item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Songs Tab */}
      {activeTab === 'songs' && (
        <div className="space-y-6">
          <div className="bg-surface border border-accent/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary font-poppins">
                Song Statistics by Genre
              </h2>
              <span className="text-xs text-text-muted font-poppins">
                SQL: GROUP BY, HAVING, COUNT, SUM, AVG, MIN, MAX
              </span>
            </div>
            <div className="space-y-3">
              {songStats.slice(0, 10).map((genre, index) => (
                <div key={index} className="bg-background border border-accent/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-text-primary font-semibold font-poppins">{genre.genre__name || 'Unknown'}</h3>
                    <span className="text-sm text-accent font-poppins">{genre.total_songs} songs</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Total Plays</p>
                      <p className="text-text-primary font-semibold font-poppins">
                        {formatNumber(genre.total_plays || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Avg Duration</p>
                      <p className="text-text-primary font-semibold font-poppins">
                        {formatDuration(genre.avg_duration || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Min Duration</p>
                      <p className="text-text-primary font-semibold font-poppins">
                        {formatDuration(genre.min_duration || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Max Duration</p>
                      <p className="text-text-primary font-semibold font-poppins">
                        {formatDuration(genre.max_duration || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Artists Tab */}
      {activeTab === 'artists' && (
        <div className="space-y-6">
          <div className="bg-surface border border-accent/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary font-poppins">
                Top Artists by Engagement
              </h2>
              <span className="text-xs text-text-muted font-poppins">
                SQL: Multiple JOINs, Subqueries, COUNT DISTINCT
              </span>
            </div>
            <div className="space-y-3">
              {topArtists.slice(0, 20).map((artist, index) => (
                <div key={artist.id} className="bg-background border border-accent/10 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-text-primary font-semibold font-poppins">
                          {artist.stage_name || artist.username}
                        </h3>
                        <p className="text-xs text-text-muted font-poppins">@{artist.username}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-text-muted" size={20} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Songs</p>
                      <p className="text-text-primary font-semibold font-poppins">{artist.total_songs}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Albums</p>
                      <p className="text-text-primary font-semibold font-poppins">{artist.total_albums || 0}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Total Plays</p>
                      <p className="text-text-primary font-semibold font-poppins">
                        {formatNumber(artist.total_plays || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs font-poppins">Favorites</p>
                      <p className="text-text-primary font-semibold font-poppins">{artist.favorites_count || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <div className="space-y-6">
          <div className="bg-surface border border-accent/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary font-poppins">
                Genre Analysis
              </h2>
              <span className="text-xs text-text-muted font-poppins">
                SQL: GROUP BY, Multiple Aggregations, HAVING
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {genreAnalysis.map((genre) => (
                <div key={genre.id} className="bg-background border border-accent/10 rounded-lg p-4 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-text-primary font-poppins">{genre.name}</h3>
                    <Award className="text-primary" size={20} />
                  </div>
                  {genre.description && (
                    <p className="text-sm text-text-muted mb-3 font-poppins">{genre.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-surface rounded-lg p-2">
                      <p className="text-text-muted text-xs font-poppins">Songs</p>
                      <p className="text-primary font-bold font-poppins">{genre.song_count}</p>
                    </div>
                    <div className="bg-surface rounded-lg p-2">
                      <p className="text-text-muted text-xs font-poppins">Total Plays</p>
                      <p className="text-primary font-bold font-poppins">
                        {formatNumber(genre.total_plays || 0)}
                      </p>
                    </div>
                    <div className="bg-surface rounded-lg p-2">
                      <p className="text-text-muted text-xs font-poppins">Avg Plays/Song</p>
                      <p className="text-primary font-bold font-poppins">
                        {Math.round(genre.avg_plays_per_song || 0)}
                      </p>
                    </div>
                    <div className="bg-surface rounded-lg p-2">
                      <p className="text-text-muted text-xs font-poppins">Favorites</p>
                      <p className="text-primary font-bold font-poppins">{genre.total_favorites || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-surface border border-accent/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary font-poppins flex items-center">
                <TrendingUp className="mr-2 text-primary" size={24} />
                Trending Songs (Last 7 Days)
              </h2>
              <span className="text-xs text-text-muted font-poppins">
                SQL: Date Filtering, Complex Scoring, F() expressions
              </span>
            </div>
            <div className="space-y-3">
              {trendingSongs.map((song, index) => (
                <div key={song.id} className="bg-background border border-accent/10 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      #{index + 1}
                    </div>
                    {song.cover_image_url && (
                      <img 
                        src={song.cover_image_url} 
                        alt={song.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-text-primary font-semibold font-poppins">{song.title}</h3>
                      <p className="text-sm text-text-muted font-poppins">{song.artist_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold font-poppins">{formatNumber(song.play_count || 0)} plays</p>
                      <p className="text-xs text-text-muted font-poppins">{formatDuration(song.duration)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
