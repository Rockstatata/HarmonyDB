import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Trash2, Users, Lock, Music } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import { useAuth } from '../../context/authContext';
import type { Playlist, Song } from '../../types';

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSong, setAddingSong] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPlaylistAndSongs = async () => {
      if (!id) return;
      
      try {
        setError(null);
        const [playlistData, songsData] = await Promise.all([
          apiService.getPlaylist(parseInt(id)),
          apiService.getSongs() // Get all available songs
        ]);
        setPlaylist(playlistData);
        setAvailableSongs(songsData);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistAndSongs();
  }, [id]);

  const handlePlayPlaylist = () => {
    if (playlist && playlist.songs.length > 0) {
      const songs = playlist.songs.map(ps => ps.song);
      playSong(songs[0], songs);
    }
  };

  const handlePlaySong = (song: Song) => {
    if (playlist) {
      const songs = playlist.songs.map(ps => ps.song);
      playSong(song, songs);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (!playlist || !user || playlist.user !== user.id) return;
    
    try {
      await apiService.removeSongFromPlaylist(playlist.id, songId);
      // Update local state
      setPlaylist({
        ...playlist,
        songs: playlist.songs.filter(ps => ps.song.id !== songId),
        songs_count: playlist.songs_count - 1
      });
    } catch (error) {
      console.error('Error removing song:', error);
      alert('Failed to remove song from playlist');
    }
  };

  const handleAddSong = async (song: Song) => {
    if (!playlist || !user || playlist.user !== user.id) return;
    
    setAddingSong(true);
    try {
      const playlistSong = await apiService.addSongToPlaylist(playlist.id, song.id);
      // Update local state
      setPlaylist({
        ...playlist,
        songs: [...playlist.songs, playlistSong],
        songs_count: playlist.songs_count + 1
      });
      alert('Song added to playlist!');
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Failed to add song to playlist. It may already be in the playlist.');
    } finally {
      setAddingSong(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist || !user || playlist.user !== user.id) return;

    setDeleting(true);
    try {
      await apiService.deletePlaylist(playlist.id);
      navigate('/home/library');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist');
      setDeleting(false);
    }
  };

  const filteredAvailableSongs = availableSongs.filter(song => {
    // Filter out songs already in the playlist
    const isInPlaylist = playlist?.songs.some(ps => ps.song.id === song.id);
    if (isInPlaylist) return false;

    // Filter by search query
    if (searchQuery) {
      return song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             song.artist_name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6 text-center">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Playlist</h3>
          <p className="text-gray-400">{error || 'Playlist not found'}</p>
          <button
            onClick={() => navigate('/home/library')}
            className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && playlist.user === user.id;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/home/library')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="text-gray-400" size={24} />
        </button>
        
        <div className="flex items-center space-x-6 flex-1">
          <div className="w-32 h-32 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            {playlist.cover_image ? (
              <img
                src={playlist.cover_image}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Music size={48} />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-gray-400 text-sm">Playlist</span>
              {playlist.is_public ? (
                <Users size={16} className="text-gray-500" />
              ) : (
                <Lock size={16} className="text-gray-500" />
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
            <p className="text-gray-400 mb-4">
              Created by {playlist.user_name} • {playlist.songs_count} songs
            </p>
            
            <div className="flex items-center space-x-4">
              {playlist.songs_count > 0 && (
                <button
                  onClick={handlePlayPlaylist}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-full transition-colors"
                >
                  <Play size={20} className="text-white ml-0.5" />
                  <span className="text-white font-medium">Play</span>
                </button>
              )}
              
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowAddSongs(true)}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={20} className="text-white" />
                    <span className="text-white">Add Songs</span>
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} className="text-white" />
                    <span className="text-white">Delete Playlist</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      {playlist.songs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">No songs in this playlist</h3>
          <p className="text-gray-400 mb-4">
            {isOwner ? 'Add some songs to get started' : 'This playlist is empty'}
          </p>
          {isOwner && (
            <button
              onClick={() => setShowAddSongs(true)}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white transition-colors"
            >
              Add Songs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {playlist.songs.map((playlistSong, index) => (
            <div
              key={playlistSong.id}
              className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg group"
            >
              <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
              
              <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                {playlistSong.song.cover_image ? (
                  <img
                    src={playlistSong.song.cover_image}
                    alt={playlistSong.song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Music size={16} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{playlistSong.song.title}</p>
                <p className="text-gray-400 text-sm truncate">{playlistSong.song.artist_name}</p>
              </div>
              
              <div className="text-gray-400 text-sm">
                {new Date(playlistSong.added_at).toLocaleDateString()}
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePlaySong(playlistSong.song)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                >
                  <Play size={16} className="text-white ml-0.5" />
                </button>
                
                {isOwner && (
                  <button
                    onClick={() => handleRemoveSong(playlistSong.song.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Songs Modal */}
      {showAddSongs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Songs to Playlist</h2>
              <button
                onClick={() => setShowAddSongs(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 outline-none"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredAvailableSongs.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="mx-auto text-gray-600 mb-2" size={48} />
                  <p className="text-gray-400">No songs available to add</p>
                </div>
              ) : (
                filteredAvailableSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center space-x-4 p-3 hover:bg-gray-800/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                      {song.cover_image ? (
                        <img
                          src={song.cover_image}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Music size={12} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-gray-400 text-sm truncate">{song.artist_name}</p>
                    </div>
                    
                    <button
                      onClick={() => handleAddSong(song)}
                      disabled={addingSong}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white text-sm transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Playlist Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <Trash2 className="mx-auto text-red-500 mb-4" size={48} />
              <h2 className="text-xl font-bold text-white mb-2">Delete Playlist</h2>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlaylist}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;