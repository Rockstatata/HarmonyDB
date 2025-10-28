import { useState, useEffect } from 'react';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import { useAuth } from '../../context/authContext';
import JumpBackIn from './JumpBackIn';
import type { Song, Album, Playlist } from '../../types';

const Dashboard = () => {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [songs, albums, playlists] = await Promise.all([
          apiService.getSongs(),
          apiService.getAlbums(),
          apiService.getPlaylists()
        ]);

        setRecentSongs(songs.slice(0, 6));
        setPopularSongs(songs.sort((a, b) => b.play_count - a.play_count).slice(0, 6));
        setRecentAlbums(albums.slice(0, 6));
        setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 6));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handlePlaySong = (song: Song) => {
    playSong(song, popularSongs);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-text-muted font-poppins">Loading your music...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary font-poppins">
          {getGreeting()}, {user?.display_name || user?.username}!
        </h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 bg-surface/50 hover:bg-surface rounded-full transition-colors">
            <MoreHorizontal className="text-text-primary" size={20} />
          </button>
        </div>
      </div>

      {/* Jump Back In Section */}
      {user?.role === 'listener' && <JumpBackIn />}

      {/* Quick Play Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentSongs.slice(0, 6).map((song) => (
          <div
            key={song.id}
            className="glass hover:bg-surface/30 rounded-lg p-4 flex items-center space-x-3 group cursor-pointer transition-all duration-200"
            onClick={() => handlePlaySong(song)}
          >
            <img
              src={song.cover_image || '/placeholder-album.png'}
              alt={song.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium truncate font-poppins">{song.title}</p>
              <p className="text-text-muted text-sm truncate font-poppins">{song.artist_name}</p>
            </div>
            <button className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="text-white ml-0.5" size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Popular Songs */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-poppins">Popular right now</h2>
          <button className="text-text-muted hover:text-text-primary text-sm font-medium font-poppins">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularSongs.map((song) => (
            <div
              key={song.id}
              className="glass hover:bg-surface/30 rounded-lg p-4 group cursor-pointer transition-all duration-300"
              onClick={() => handlePlaySong(song)}
            >
              <div className="relative mb-4">
                <img
                  src={song.cover_image || '/placeholder-album.png'}
                  alt={song.title}
                  className="w-full aspect-square rounded-lg object-cover"
                />
                <button className="absolute bottom-2 right-2 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  <Play className="text-white ml-0.5" size={20} />
                </button>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1 truncate font-poppins">{song.title}</h3>
                <p className="text-text-muted text-sm truncate font-poppins">{song.artist_name}</p>
                <p className="text-text-muted/70 text-xs mt-1 font-poppins">{song.play_count} plays</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Albums */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary font-poppins">New releases</h2>
          <button className="text-text-muted hover:text-text-primary text-sm font-medium font-poppins">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentAlbums.map((album) => (
            <div
              key={album.id}
              className="glass hover:bg-surface/30 rounded-lg p-4 group cursor-pointer transition-all duration-300"
            >
              <div className="relative mb-3">
                <img
                  src={album.cover_image || '/placeholder-album.png'}
                  alt={album.title}
                  className="w-full aspect-square rounded-lg object-cover"
                />
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  <Play className="text-white ml-0.5" size={16} />
                </button>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1 truncate">{album.title}</h3>
                <p className="text-gray-400 text-xs truncate">{album.artist_name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Playlists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Made for you</h2>
          <button className="text-gray-400 hover:text-white text-sm font-medium">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-4 group cursor-pointer transition-all duration-300"
            >
              <div className="relative mb-3">
                <img
                  src={playlist.cover_image || '/placeholder-playlist.png'}
                  alt={playlist.name}
                  className="w-full aspect-square rounded-lg object-cover"
                />
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Play className="text-black ml-0.5" size={16} />
                </button>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1 truncate">{playlist.name}</h3>
                <p className="text-gray-400 text-xs truncate">
                  {playlist.songs_count} songs • {playlist.user_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;