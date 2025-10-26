import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Trash2, Plus, ArrowLeft, Music } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import { useAuth } from '../../context/authContext';
import type { Album, Song } from '../../types';

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [album, setAlbum] = useState<Album | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) return;

      try {
        const albumData = await apiService.getAlbum(parseInt(id));

        // Check if user owns this album
        if (albumData.artist !== user?.id) {
          navigate('/home/my-music');
          return;
        }

        setAlbum(albumData);

        // Fetch available songs (songs by this artist that are not in any album)
        const allSongs = await apiService.getSongs({ artist: user.id.toString() });
        const availableSongs = allSongs.filter(song => !song.album);
        setAvailableSongs(availableSongs);
      } catch (error) {
        console.error('Error fetching album:', error);
        navigate('/home/my-music');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [id, user, navigate]);

  const handlePlaySong = (song: Song) => {
    if (album?.songs) {
      playSong(song, album.songs);
    }
  };

  const handleAddSong = async () => {
    if (!selectedSongId || !album) return;

    try {
      await apiService.addSongToAlbum(album.id, selectedSongId);
      // Refresh album data
      const updatedAlbum = await apiService.getAlbum(album.id);
      setAlbum(updatedAlbum);

      // Update available songs
      setAvailableSongs(availableSongs.filter(song => song.id !== selectedSongId));

      setShowAddSongModal(false);
      setSelectedSongId(null);
    } catch (error) {
      console.error('Error adding song to album:', error);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (!album) return;

    try {
      await apiService.removeSongFromAlbum(album.id, songId);
      // Refresh album data
      const updatedAlbum = await apiService.getAlbum(album.id);
      setAlbum(updatedAlbum);

      // Add song back to available songs
      const removedSong = album.songs?.find(song => song.id === songId);
      if (removedSong) {
        setAvailableSongs([...availableSongs, removedSong]);
      }
    } catch (error) {
      console.error('Error removing song from album:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading album...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Album not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/home/my-music')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mr-4"
        >
          <ArrowLeft size={20} />
          <span>Back to My Music</span>
        </button>
      </div>

      {/* Album Header */}
      <div className="flex items-center space-x-6 mb-8">
        <img
          src={album.cover_image || '/placeholder-album.png'}
          alt={album.title}
          className="w-48 h-48 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-2">{album.title}</h1>
          <p className="text-gray-400 text-lg mb-4">{album.artist_name}</p>
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>{album.songs?.length || 0} songs</span>
            {album.release_date && (
              <span>Released {new Date(album.release_date).getFullYear()}</span>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={() => album.songs && album.songs.length > 0 && handlePlaySong(album.songs[0])}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors"
              disabled={!album.songs || album.songs.length === 0}
            >
              <Play size={20} className="text-white ml-0.5" />
              <span className="text-white">Play</span>
            </button>
            <button
              onClick={() => setShowAddSongModal(true)}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-white" />
              <span className="text-white">Add Song</span>
            </button>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white mb-4">Songs</h2>

        {album.songs && album.songs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/40 rounded-lg">
            <Music className="mx-auto text-gray-600 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-white mb-2">No songs in this album</h3>
            <p className="text-gray-400 mb-4">Add songs to build your album</p>
            <button
              onClick={() => setShowAddSongModal(true)}
              className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg text-white transition-colors"
            >
              Add Your First Song
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {album.songs?.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg group"
              >
                <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
                <img
                  src={song.cover_image || '/placeholder-album.png'}
                  alt={song.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{song.title}</p>
                  <p className="text-gray-400 text-sm truncate">
                    {song.play_count} plays
                  </p>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlaySong(song)}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                  >
                    <Play size={16} className="text-white ml-0.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove from album"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add Song to Album</h2>

            {availableSongs.length === 0 ? (
              <div className="text-center py-8">
                <Music className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No available songs to add</p>
                <p className="text-gray-500 text-sm mt-2">
                  Upload more songs or remove songs from other albums first
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {availableSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => setSelectedSongId(song.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSongId === song.id
                        ? 'bg-green-600/20 border border-green-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={song.cover_image || '/placeholder-album.png'}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{song.title}</p>
                        <p className="text-gray-400 text-sm">{song.play_count} plays</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddSongModal(false);
                  setSelectedSongId(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSong}
                disabled={!selectedSongId || availableSongs.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded text-white transition-colors"
              >
                Add Song
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumDetail;