import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, MoreHorizontal, Music, Disc, Users, Verified, Calendar } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import MediaCard from '../MediaCard';
import type { User as Artist, Song, Album } from '../../types';

interface ArtistStats {
  totalPlays: number;
  totalSongs: number;
  totalAlbums: number;
  followers: number;
}

const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [stats, setStats] = useState<ArtistStats>({ totalPlays: 0, totalSongs: 0, totalAlbums: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'songs' | 'albums'>('songs');
  const [isPlaying, setIsPlaying] = useState(false);
  const { state, playSong } = usePlayer();
  const { currentSong, isPlaying: playerIsPlaying } = state;

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const artistId = parseInt(id);
        
        // Fetch artist details
        const allUsers = await apiService.getUsers();
        const artistData = allUsers.find(user => user.id === artistId && user.role === 'artist');
        
        if (!artistData) {
          throw new Error('Artist not found');
        }
        
        setArtist(artistData);
        
        // Fetch artist's songs
        const artistSongs = await apiService.getSongs({ artist: id });
        setSongs(artistSongs.sort((a, b) => b.play_count - a.play_count));
        
        // Fetch artist's albums
        const artistAlbums = await apiService.getAlbums({ artist: id });
        setAlbums(artistAlbums.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        
        // Calculate stats
        const totalPlays = artistSongs.reduce((sum, song) => sum + song.play_count, 0);
        setStats({
          totalPlays,
          totalSongs: artistSongs.length,
          totalAlbums: artistAlbums.length,
          followers: Math.floor(totalPlays / 100) // Mock followers based on plays
        });
        
      } catch (error) {
        console.error('Error fetching artist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [id]);

  const playArtistSongs = () => {
    if (songs.length > 0) {
      playSong(songs[0]);
      setIsPlaying(true);
    }
  };

  const handleSongPlay = (song: Song) => {
    playSong(song);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/home/artists" className="p-2 hover:bg-dark-800/50 rounded-full transition-colors">
            <ArrowLeft className="text-white" size={24} />
          </Link>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-600 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-600 rounded w-32" />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80">
            <div className="w-80 h-80 bg-gray-600 rounded-lg animate-pulse" />
          </div>
          <div className="flex-1 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-600 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
        <Link 
          to="/home/artists" 
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          Back to Artists
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary-900/40 to-dark-900/40 p-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link 
            to="/home/artists" 
            className="p-2 hover:bg-dark-800/50 rounded-full transition-colors"
          >
            <ArrowLeft className="text-white" size={24} />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-end">
          {/* Artist Image */}
          <div className="relative group">
            <img
              src={artist.profile_picture || '/placeholder-profile.png'}
              alt={artist.stage_name || artist.username}
              className="w-80 h-80 rounded-lg object-cover shadow-2xl"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button
                onClick={playArtistSongs}
                className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying && playerIsPlaying ? (
                  <Pause className="text-white" size={32} fill="currentColor" />
                ) : (
                  <Play className="text-white" size={32} fill="currentColor" />
                )}
              </button>
            </div>
          </div>

          {/* Artist Info */}
          <div className="flex-1 text-white">
            <div className="flex items-center space-x-2 mb-2">
              {artist.email_verified && (
                <Verified className="text-blue-500" size={20} />
              )}
              <span className="text-sm text-gray-300 uppercase tracking-wide font-medium">
                Verified Artist
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-4">
              {artist.stage_name || artist.username}
            </h1>
            
            {artist.bio && (
              <p className="text-gray-300 text-lg mb-6 max-w-2xl">{artist.bio}</p>
            )}
            
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <span className="flex items-center space-x-1">
                <Users size={16} />
                <span>{stats.followers.toLocaleString()} followers</span>
              </span>
              <span className="flex items-center space-x-1">
                <Music size={16} />
                <span>{stats.totalSongs} songs</span>
              </span>
              <span className="flex items-center space-x-1">
                <Disc size={16} />
                <span>{stats.totalAlbums} albums</span>
              </span>
              <span>{stats.totalPlays.toLocaleString()} total plays</span>
            </div>
            
            {artist.created_at && (
              <div className="flex items-center space-x-1 mt-2 text-gray-400 text-sm">
                <Calendar size={16} />
                <span>Joined {new Date(artist.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mt-8">
          <button
            onClick={playArtistSongs}
            className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying && playerIsPlaying ? (
              <Pause className="text-white" size={24} fill="currentColor" />
            ) : (
              <Play className="text-white" size={24} fill="currentColor" />
            )}
          </button>
          
          <button className="p-3 hover:bg-dark-800/50 rounded-full transition-colors">
            <Heart className="text-gray-400 hover:text-white" size={24} />
          </button>
          
          <button className="p-3 hover:bg-dark-800/50 rounded-full transition-colors">
            <MoreHorizontal className="text-gray-400 hover:text-white" size={24} />
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="p-8">
        <div className="flex space-x-8 border-b border-gray-600 mb-8">
          <button
            onClick={() => setSelectedTab('songs')}
            className={`pb-4 text-lg font-medium transition-colors ${
              selectedTab === 'songs'
                ? 'text-white border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Songs ({songs.length})
          </button>
          <button
            onClick={() => setSelectedTab('albums')}
            className={`pb-4 text-lg font-medium transition-colors ${
              selectedTab === 'albums'
                ? 'text-white border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Albums ({albums.length})
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'songs' ? (
          <div className="space-y-2">
            {songs.length > 0 ? (
              songs.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-dark-800/30 transition-colors cursor-pointer"
                  onClick={() => handleSongPlay(song)}
                >
                  <div className="w-8 text-center">
                    <span className={`text-sm font-medium ${
                      currentSong?.id === song.id ? 'text-primary-400' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  
                  <img
                    src={song.cover_image || '/placeholder-album.png'}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      currentSong?.id === song.id ? 'text-primary-400' : 'text-white'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-gray-400 text-sm truncate">
                      {song.album_title || 'Single'}
                    </p>
                  </div>
                  
                  <div className="text-gray-400 text-sm">
                    {song.play_count.toLocaleString()}
                  </div>
                  
                  <div className="text-gray-400 text-sm">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Music className="mx-auto text-gray-500 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Songs</h3>
                <p className="text-gray-500">This artist hasn't released any songs yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.length > 0 ? (
              albums.map((album) => (
                <MediaCard
                  key={album.id}
                  variant="media"
                  mediaType="album"
                  title={album.title}
                  subtitle={`${album.songs_count || 0} songs`}
                  imageSrc={album.cover_image || '/placeholder-album.png'}
                  releaseDate={album.release_date}
                  className="bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-200"
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Disc className="mx-auto text-gray-500 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Albums</h3>
                <p className="text-gray-500">This artist hasn't released any albums yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDetail;