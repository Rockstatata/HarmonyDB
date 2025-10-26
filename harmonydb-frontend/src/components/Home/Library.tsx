import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Plus, Users, Lock } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { useAuth } from '../../context/authContext';
import type { Playlist } from '../../types';

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistForm, setPlaylistForm] = useState({
    name: '',
    cover_image: null as File | null,
    is_public: true
  });

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        // Fetch user's own playlists
        const userPlaylists = user ? await apiService.getPlaylists({ user: user.id.toString() }) : [];
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error('Error fetching library:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLibrary();
    }
  }, [user]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistForm.name.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', playlistForm.name);
      formData.append('is_public', playlistForm.is_public.toString());
      if (playlistForm.cover_image) formData.append('cover_image', playlistForm.cover_image);

      const newPlaylist = await apiService.createPlaylist(formData);
      setPlaylists([newPlaylist, ...playlists]);
      setShowCreateModal(false);
      setPlaylistForm({
        name: '',
        cover_image: null,
        is_public: true
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Library</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} className="text-white" />
          <span className="text-white">Create Playlist</span>
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-400">
          {user?.role === 'artist' 
            ? 'Create playlists with your own songs and any other songs from the platform.' 
            : 'Create playlists with any songs available on the platform.'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => navigate(`/home/playlist/${playlist.id}`)}
            className="bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-4 group cursor-pointer transition-all duration-300"
          >
            <div className="relative mb-4">
              <img
                src={playlist.cover_image || '/placeholder-playlist.png'}
                alt={playlist.name}
                className="w-full aspect-square rounded-lg object-cover"
              />
              <button className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <Play className="text-black ml-0.5" size={20} />
              </button>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1 truncate">{playlist.name}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-gray-400 text-sm">
                  {playlist.songs_count} songs
                </p>
                {playlist.is_public ? (
                  <Users size={12} className="text-gray-500" />
                ) : (
                  <Lock size={12} className="text-gray-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="text-center py-12">
          <Music className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">Your library is empty</h3>
          <p className="text-gray-400 mb-4">Create your first playlist to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Create Playlist
          </button>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={playlistForm.name}
                  onChange={(e) => setPlaylistForm({...playlistForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                  required
                  placeholder="My Playlist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPlaylistForm({...playlistForm, cover_image: e.target.files?.[0] || null})}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-green-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={playlistForm.is_public}
                  onChange={(e) => setPlaylistForm({...playlistForm, is_public: e.target.checked})}
                  className="rounded border border-gray-700 bg-gray-800 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-300">
                  Make playlist public
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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

export default Library;