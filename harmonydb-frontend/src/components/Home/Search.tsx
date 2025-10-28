import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Music, User as UserIcon, Disc, Filter, X, PlayCircle } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Song, Album, Playlist, User } from '../../types';
import MediaCard from '../MediaCard';
import FavoriteButton from '../ui/FavoriteButton';

interface SearchFilters {
  contentType: 'all' | 'songs' | 'albums' | 'playlists' | 'artists';
  genre: string;
  year: string;
  sortBy: 'relevance' | 'recent' | 'popular' | 'alphabetical';
  duration: 'all' | 'short' | 'medium' | 'long';
}

const Search: React.FC = () => {
  const { playSong } = usePlayer();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<{
    songs: Song[];
    albums: Album[];
    playlists: Playlist[];
    users: User[];
  }>({
    songs: [],
    albums: [],
    playlists: [],
    users: []
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: 'all',
    genre: '',
    year: '',
    sortBy: 'relevance',
    duration: 'all'
  });
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    const initialQuery = searchParams.get('q') || '';
    setQuery(initialQuery);
    loadGenres();
    
    // Load initial content if there's a query parameter
    if (initialQuery.trim()) {
      // Need to call performSearch but avoid ESLint warning
      const doSearch = async () => {
        await performSearch(initialQuery);
      };
      doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadGenres = async () => {
    try {
      const response = await apiService.getGenres();
      // Handle both array format and results format
      const genreList = Array.isArray(response) ? response : (response as { results?: { name: string }[] }).results || [];
      setGenres(genreList.map((g: { name: string }) => g.name));
    } catch (error) {
      console.error('Error loading genres:', error);
      // Set some default genres if loading fails
      setGenres(['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'R&B']);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], albums: [], playlists: [], users: [] });
      return;
    }
    
    setLoading(true);
    try {
      // Use advanced search endpoint when filters are applied
      const hasAdvancedFilters = filters.genre || filters.duration !== 'all' || 
                                  filters.year || filters.sortBy !== 'relevance';

      if (hasAdvancedFilters && filters.contentType === 'songs') {
        // Use the advanced analytics search endpoint
        // Demonstrates: LIKE, IN, BETWEEN, Complex WHERE with AND/OR
        const advancedFilters: Record<string, string | number | number[]> = {};
        
        if (filters.genre) {
          // Get genre ID for IN clause
          const genreResponse = await apiService.getGenres();
          const genreList = Array.isArray(genreResponse) ? genreResponse : (genreResponse as { results?: { name: string; id: number }[] }).results || [];
          const selectedGenre = genreList.find((g: { name: string; id: number }) => g.name === filters.genre);
          if (selectedGenre) {
            advancedFilters.genres = [selectedGenre.id];
          }
        }
        
        if (filters.duration !== 'all') {
          // BETWEEN clause for duration
          if (filters.duration === 'short') {
            advancedFilters.min_duration = 0;
            advancedFilters.max_duration = 180;
          } else if (filters.duration === 'medium') {
            advancedFilters.min_duration = 180;
            advancedFilters.max_duration = 360;
          } else if (filters.duration === 'long') {
            advancedFilters.min_duration = 360;
            advancedFilters.max_duration = 10000;
          }
        }
        
        if (filters.year) {
          // Date BETWEEN for year range
          advancedFilters.start_date = `${filters.year}-01-01`;
          advancedFilters.end_date = `${filters.year}-12-31`;
        }
        
        // Call advanced search endpoint
        const response = await fetch('http://localhost:8000/api/analytics/search/advanced/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            search_term: searchQuery,
            filters: advancedFilters
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setResults({
            songs: data.data || [],
            albums: [],
            playlists: [],
            users: []
          });
          setLoading(false);
          return;
        }
      }
      
      // Standard search with basic filters
      const baseParams: Record<string, string> = { search: searchQuery };
      
      // Add genre filter
      if (filters.genre) {
        baseParams.genre = filters.genre;
      }
      
      // Add year filter
      if (filters.year) {
        baseParams.year = filters.year;
      }
      
      // Add ordering/sorting
      if (filters.sortBy !== 'relevance') {
        if (filters.sortBy === 'recent') {
          baseParams.ordering = '-upload_date';
        } else if (filters.sortBy === 'popular') {
          baseParams.ordering = '-play_count';
        } else if (filters.sortBy === 'alphabetical') {
          baseParams.ordering = 'title';
        }
      }

      let songs: Song[] = [];
      let albums: Album[] = [];
      let playlists: Playlist[] = [];
      let users: User[] = [];

      // Fetch songs with duration filtering
      if (filters.contentType === 'all' || filters.contentType === 'songs') {
        const songParams = { ...baseParams };
        
        // Add duration filtering for songs only
        if (filters.duration !== 'all') {
          if (filters.duration === 'short') {
            songParams.duration_max = '180';
          } else if (filters.duration === 'medium') {
            songParams.duration_min = '180';
            songParams.duration_max = '360';
          } else if (filters.duration === 'long') {
            songParams.duration_min = '360';
          }
        }
        
        songs = await apiService.getSongs(songParams);
        
        // Client-side filtering for duration if backend doesn't support it
        if (filters.duration !== 'all') {
          songs = songs.filter(song => {
            const duration = song.duration;
            if (filters.duration === 'short') return duration < 180;
            if (filters.duration === 'medium') return duration >= 180 && duration <= 360;
            if (filters.duration === 'long') return duration > 360;
            return true;
          });
        }
      }
      
      // Fetch albums
      if (filters.contentType === 'all' || filters.contentType === 'albums') {
        const albumParams = { ...baseParams };
        if (filters.sortBy === 'recent') albumParams.ordering = '-created_at';
        albums = await apiService.getAlbums(albumParams);
        
        // Client-side year filtering for albums if needed
        if (filters.year) {
          albums = albums.filter(album => {
            const year = album.release_date ? new Date(album.release_date).getFullYear().toString() : '';
            return year === filters.year;
          });
        }
      }
      
      // Fetch playlists
      if (filters.contentType === 'all' || filters.contentType === 'playlists') {
        const playlistParams = { ...baseParams };
        if (filters.sortBy === 'recent') playlistParams.ordering = '-created_at';
        playlists = await apiService.getPlaylists(playlistParams);
      }
      
      // Fetch users/artists
      if (filters.contentType === 'all' || filters.contentType === 'artists') {
        const userParams = { search: searchQuery };
        users = await apiService.getUsers(userParams);
      }

      setResults({ songs, albums, playlists, users });
    } catch (error) {
      console.error('Search error:', error);
      setResults({ songs: [], albums: [], playlists: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], albums: [], playlists: [], users: [] });
      return;
    }

    const searchDelayed = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchDelayed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song, results.songs);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearFilters = () => {
    setFilters({
      contentType: 'all',
      genre: '',
      year: '',
      sortBy: 'relevance',
      duration: 'all'
    });
  };

  const hasActiveFilters = filters.contentType !== 'all' || filters.genre || filters.year || 
                          filters.sortBy !== 'relevance' || filters.duration !== 'all';

  return (
    <div className="p-6 md:p-8 min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6 font-poppins">Search</h1>
        
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Search for songs, albums, artists, playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-accent/20 rounded-xl pl-12 pr-4 py-4 text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-poppins"
          />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-surface hover:bg-surface/80 text-text-secondary rounded-xl transition-all duration-200 border border-accent/20"
          >
            <Filter size={18} />
            <span className="font-poppins">Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {[filters.contentType !== 'all', filters.genre, filters.year, filters.sortBy !== 'relevance', filters.duration !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
          
          {query && !loading && (
            <p className="text-text-muted text-sm font-poppins">
              Found {results.songs.length + results.albums.length + results.playlists.length + results.users.length} results for "{query}"
            </p>
          )}
        </div>

        {showFilters && (
          <div className="bg-surface border border-accent/20 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary font-poppins">Search Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 text-accent hover:text-primary transition-colors text-sm font-poppins"
                >
                  <X size={16} />
                  <span>Clear all</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-poppins">Content Type</label>
                <select
                  value={filters.contentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, contentType: e.target.value as SearchFilters['contentType'] }))}
                  className="w-full bg-background border border-accent/30 rounded-lg px-3 py-2 text-text-primary focus:border-primary focus:outline-none font-poppins"
                >
                  <option value="all">All Content</option>
                  <option value="songs">Songs</option>
                  <option value="albums">Albums</option>
                  <option value="playlists">Playlists</option>
                  <option value="artists">Artists</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-poppins">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full bg-background border border-accent/30 rounded-lg px-3 py-2 text-text-primary focus:border-primary focus:outline-none font-poppins"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-poppins">Release Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full bg-background border border-accent/30 rounded-lg px-3 py-2 text-text-primary focus:border-primary focus:outline-none font-poppins"
                >
                  <option value="">Any Year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018">2018</option>
                  <option value="2017">2017</option>
                  <option value="2016">2016</option>
                  <option value="2015">2015</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-poppins">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                  className="w-full bg-background border border-accent/30 rounded-lg px-3 py-2 text-text-primary focus:border-primary focus:outline-none font-poppins"
                >
                  <option value="relevance">Relevance</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2 font-poppins">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value as SearchFilters['duration'] }))}
                  className="w-full bg-background border border-accent/30 rounded-lg px-3 py-2 text-text-primary focus:border-primary focus:outline-none font-poppins"
                >
                  <option value="all">Any Length</option>
                  <option value="short">Short (&lt; 3 min)</option>
                  <option value="medium">Medium (3-6 min)</option>
                  <option value="long">Long (&gt; 6 min)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {!query && recentSearches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4 font-poppins">Recent searches</h2>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search)}
                className="flex items-center space-x-3 p-3 w-full text-left hover:bg-surface rounded-xl transition-colors group"
              >
                <SearchIcon className="text-text-muted group-hover:text-accent transition-colors" size={20} />
                <span className="text-text-primary font-poppins">{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="ml-3 text-text-muted font-poppins">Searching...</span>
        </div>
      )}

      {query && !loading && (
        <div className="space-y-8">
          {results.songs.length > 0 && (filters.contentType === 'all' || filters.contentType === 'songs') && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Music className="text-accent" size={24} />
                <h2 className="text-xl font-bold text-text-primary font-poppins">Songs</h2>
                <span className="text-text-muted text-sm font-poppins">({results.songs.length})</span>
              </div>
              <div className="space-y-2">
                {results.songs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center space-x-4 p-4 hover:bg-surface rounded-xl cursor-pointer group transition-all duration-200"
                  >
                    <div className="relative">
                      <img
                        src={song.cover_image || '/placeholder-album.png'}
                        alt={song.title}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handlePlaySong(song)}
                        className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <PlayCircle className="text-white" size={24} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium truncate font-poppins">{song.title}</p>
                      <p className="text-text-muted text-sm truncate font-poppins">{song.artist_name}</p>
                      {song.album_title && (
                        <p className="text-text-muted text-xs truncate font-poppins">{song.album_title}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <FavoriteButton 
                        itemType="song" 
                        itemId={song.id} 
                        size={16}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="text-text-muted text-sm font-poppins">{formatDuration(song.duration)}</span>
                      <span className="text-text-muted text-xs font-poppins">{song.play_count?.toLocaleString() || 0} plays</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.albums.length > 0 && (filters.contentType === 'all' || filters.contentType === 'albums') && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Disc className="text-accent" size={24} />
                <h2 className="text-xl font-bold text-text-primary font-poppins">Albums</h2>
                <span className="text-text-muted text-sm font-poppins">({results.albums.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {results.albums.map((album) => (
                  <MediaCard
                    key={album.id}
                    variant="media"
                    mediaType="album"
                    title={album.title}
                    subtitle={album.artist_name}
                    imageSrc={album.cover_image || '/placeholder-album.png'}
                    releaseDate={album.release_date}
                  />
                ))}
              </div>
            </section>
          )}

          {results.playlists.length > 0 && (filters.contentType === 'all' || filters.contentType === 'playlists') && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Music className="text-accent" size={24} />
                <h2 className="text-xl font-bold text-text-primary font-poppins">Playlists</h2>
                <span className="text-text-muted text-sm font-poppins">({results.playlists.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {results.playlists.map((playlist) => (
                  <MediaCard
                    key={playlist.id}
                    variant="media"
                    mediaType="playlist"
                    title={playlist.name}
                    subtitle={`${playlist.songs_count || 0} songs • ${playlist.user_name || 'Unknown'}`}
                    imageSrc={playlist.cover_image || '/placeholder-playlist.png'}
                  />
                ))}
              </div>
            </section>
          )}

          {results.users.length > 0 && (filters.contentType === 'all' || filters.contentType === 'artists') && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <UserIcon className="text-accent" size={24} />
                <h2 className="text-xl font-bold text-text-primary font-poppins">Artists</h2>
                <span className="text-text-muted text-sm font-poppins">({results.users.length})</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {results.users.map((user) => (
                  <MediaCard
                    key={user.id}
                    variant="artist"
                    title={user.stage_name || user.username}
                    subtitle={`${user.songs_count || 0} songs • ${user.albums_count || 0} albums`}
                    imageSrc={user.profile_picture || '/placeholder-profile.png'}
                  />
                ))}
              </div>
            </section>
          )}

          {results.songs.length === 0 && results.albums.length === 0 && 
           results.playlists.length === 0 && results.users.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="mx-auto text-text-muted mb-4" size={64} />
              <h3 className="text-xl font-semibold text-text-secondary mb-2 font-poppins">No results found</h3>
              <p className="text-text-muted font-poppins">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
