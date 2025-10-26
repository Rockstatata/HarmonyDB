import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Play, Upload, Music, Disc, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import { useAuth } from '../../context/authContext';
import type { Song, Album } from '../../types';

const MyMusic = () => {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    album: '',
    genre: '',
    cover_image: null as File | null,
    audio_file: null as File | null
  });
  const [albumForm, setAlbumForm] = useState({
    title: '',
    cover_image: null as File | null,
    release_date: ''
  });

  useEffect(() => {
    const fetchMyMusic = async () => {
      if (!user) return;
      
      try {
        const [userSongs, userAlbums] = await Promise.all([
          apiService.getSongs({ artist: user.id.toString() }),
          apiService.getAlbums({ artist: user.id.toString() })
        ]);

        setSongs(userSongs);
        setAlbums(userAlbums);
      } catch (error) {
        console.error('Error fetching my music:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMusic();
  }, [user]);

  const handlePlaySong = (song: Song) => {
    playSong(song, songs);
  };

  const handleDeleteSong = async (songId: number) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      await apiService.deleteSong(songId);
      setSongs(songs.filter(s => s.id !== songId));
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const handleDeleteAlbum = async (albumId: number) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    try {
      await apiService.deleteAlbum(albumId);
      setAlbums(albums.filter(a => a.id !== albumId));
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.audio_file) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('audio_file', uploadForm.audio_file);
      if (uploadForm.album) formData.append('album', uploadForm.album);
      if (uploadForm.genre) formData.append('genre', uploadForm.genre);
      if (uploadForm.cover_image) formData.append('cover_image', uploadForm.cover_image);

      const newSong = await apiService.createSong(formData);
      setSongs([newSong, ...songs]);
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        album: '',
        genre: '',
        cover_image: null,
        audio_file: null
      });
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Failed to upload song');
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.title) {
      alert('Please enter an album title');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', albumForm.title);
      if (albumForm.cover_image) formData.append('cover_image', albumForm.cover_image);
      if (albumForm.release_date) formData.append('release_date', albumForm.release_date);

      const newAlbum = await apiService.createAlbum(formData);
      setAlbums([newAlbum, ...albums]);
      setShowCreateAlbumModal(false);
      setAlbumForm({
        title: '',
        cover_image: null,
        release_date: ''
      });
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album');
    }
  };

  // Show access denied for non-artists
  if (user?.role !== 'artist') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-4">This section is only available to artists.</p>
        <p className="text-gray-500 text-sm">
          Artists can upload their own songs, create albums, and manage their music library.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading your music...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">My Music</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateAlbumModal(true)}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} className="text-white" />
            <span className="text-white">Create Album</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={20} className="text-white" />
            <span className="text-white">Upload Song</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'songs'
              ? 'text-white border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Music size={20} />
          <span>Songs ({songs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'albums'
              ? 'text-white border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Disc size={20} />
          <span>Albums ({albums.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">No songs yet</h3>
              <p className="text-gray-400 mb-4">Upload your first song to get started</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white transition-colors"
              >
                Upload Song
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song, index) => (
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
                      {song.album_title || 'Single'} • {song.play_count} plays
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePlaySong(song)}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                    >
                      <Play size={16} className="text-white ml-0.5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'albums' && (
        <div className="space-y-4">
          {albums.length === 0 ? (
            <div className="text-center py-12">
              <Disc className="mx-auto text-gray-600 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-white mb-2">No albums yet</h3>
              <p className="text-gray-400 mb-4">Create your first album to organize your songs</p>
              <button
                onClick={() => setShowCreateAlbumModal(true)}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg text-white transition-colors"
              >
                Create Album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => navigate(`/home/album/${album.id}`)}
                  className="bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-4 group cursor-pointer transition-all duration-300"
                >
                  <div className="relative mb-4">
                    <img
                      src={album.cover_image || '/placeholder-album.png'}
                      alt={album.title}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Play first song if available
                          if (album.songs_count > 0) {
                            // For now, just navigate to album detail
                            navigate(`/home/album/${album.id}`);
                          }
                        }}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded-full"
                      >
                        <Play className="text-white ml-0.5" size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1 truncate">{album.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {album.songs_count} song{album.songs_count !== 1 ? 's' : ''}
                    </p>
                    {album.release_date && (
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(album.release_date).getFullYear()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/home/album/${album.id}`);
                      }}
                      className="flex-1 text-center py-1 text-gray-400 hover:text-white text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(album.id);
                      }}
                      className="flex-1 text-center py-1 text-gray-400 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Song Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Upload Song</h2>
            <form onSubmit={handleUploadSong} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File *
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadForm({...uploadForm, audio_file: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadForm({...uploadForm, cover_image: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Album (Optional)
                </label>
                <select
                  value={uploadForm.album}
                  onChange={(e) => setUploadForm({...uploadForm, album: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                >
                  <option value="">Select Album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>{album.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-white transition-colors"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Album</h2>
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Album Title *
                </label>
                <input
                  type="text"
                  value={albumForm.title}
                  onChange={(e) => setAlbumForm({...albumForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAlbumForm({...albumForm, cover_image: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Release Date
                </label>
                <input
                  type="date"
                  value={albumForm.release_date}
                  onChange={(e) => setAlbumForm({...albumForm, release_date: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAlbumModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded text-white transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMusic;