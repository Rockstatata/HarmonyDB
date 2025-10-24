import { useState, useEffect } from 'react';
import { Search as SearchIcon, Music, User, Disc } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Song, Album, Playlist } from '../../types';
import MediaCard from '../MediaCard';

const Search = () => {
  const { playSong } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    songs: Song[];
    albums: Album[];
    playlists: Playlist[];
  }>({
    songs: [],
    albums: [],
    playlists: []
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], albums: [], playlists: [] });
      return;
    }

    const searchDelayed = setTimeout(async () => {
      setLoading(true);
      try {
        const [songs, albums, playlists] = await Promise.all([
          apiService.getSongs({ search: query }),
          apiService.getAlbums({ search: query }),
          apiService.getPlaylists({ search: query })
        ]);

        setResults({ songs, albums, playlists });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDelayed);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 9)]);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song, results.songs);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-full border-none outline-none focus:bg-gray-700 transition-colors"
          />
        </div>
      </div>

      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Recent searches</h2>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => setQuery(search)}
                className="flex items-center space-x-3 p-3 w-full text-left hover:bg-gray-800 rounded-lg transition-colors"
              >
                <SearchIcon className="text-gray-400" size={20} />
                <span className="text-white">{search}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Searching...</div>
        </div>
      )}

      {/* Search Results */}
      {query && !loading && (
        <div className="space-y-8">
          {/* Songs */}
          {results.songs.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Music className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Songs</h2>
              </div>
              <div className="space-y-2">
                {results.songs.slice(0, 5).map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handlePlaySong(song)}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer group transition-colors"
                  >
                    <img
                      src={song.cover_image || '/placeholder-album.png'}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-sm truncate">{song.artist_name}</p>
                    </div>
                    <span className="text-gray-400 text-sm">{Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {results.albums.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Disc className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Albums</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {results.albums.slice(0, 6).map((album) => (
                  <MediaCard
                    key={album.id}
                    title={album.title}
                    subtitle={album.artist_name}
                    imageSrc={album.cover_image || '/placeholder-album.png'}
                    mediaType="album"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {results.playlists.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <User className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Playlists</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {results.playlists.slice(0, 6).map((playlist) => (
                  <MediaCard
                    key={playlist.id}
                    title={playlist.name}
                    subtitle={`${playlist.songs_count} songs • ${playlist.user_name}`}
                    imageSrc={playlist.cover_image || '/placeholder-playlist.png'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {results.songs.length === 0 && results.albums.length === 0 && results.playlists.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="mx-auto text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-400">Try searching for something else</p>
            </div>
          )}
        </div>
      )}

      {/* Browse categories when not searching */}
      {!query && !loading && (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Pop', color: 'bg-pink-500', icon: '🎵' },
              { name: 'Rock', color: 'bg-red-500', icon: '🎸' },
              { name: 'Hip Hop', color: 'bg-purple-500', icon: '🎤' },
              { name: 'Electronic', color: 'bg-blue-500', icon: '🎛️' },
              { name: 'Jazz', color: 'bg-yellow-500', icon: '🎺' },
              { name: 'Classical', color: 'bg-green-500', icon: '🎻' },
              { name: 'R&B', color: 'bg-indigo-500', icon: '💫' },
              { name: 'Country', color: 'bg-orange-500', icon: '🤠' }
            ].map((category) => (
              <div
                key={category.name}
                className={`${category.color} rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform relative overflow-hidden`}
              >
                <h3 className="text-white font-bold text-lg mb-2">{category.name}</h3>
                <div className="text-4xl absolute bottom-2 right-2 opacity-80">
                  {category.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;