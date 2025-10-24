import { useState, useEffect } from 'react';
import { Music, Heart, Play } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Song, Album, Playlist } from '../../types';

const Library = () => {
  const { playSong } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const userPlaylists = await apiService.getPlaylists();
        setPlaylists(userPlaylists);
      } catch (error) {
        console.error('Error fetching library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Your Library</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
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
              <p className="text-gray-400 text-sm">
                {playlist.songs_count} songs
              </p>
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="text-center py-12">
          <Music className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">Your library is empty</h3>
          <p className="text-gray-400">Create your first playlist or like some songs</p>
        </div>
      )}
    </div>
  );
};

export default Library;