import { useState, useEffect } from 'react';
import { Heart, Play } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Favorite } from '../../types';

const Favorites = () => {
  const { playSong } = usePlayer();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const userFavorites = await apiService.getFavorites();
        setFavorites(userFavorites);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading your favorites...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Heart className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Liked Songs</h1>
          <p className="text-gray-400">{favorites.length} songs</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">No liked songs yet</h3>
          <p className="text-gray-400">Like songs to see them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((favorite, index) => (
            <div
              key={favorite.id}
              className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg group"
            >
              <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
              <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                <Heart size={16} className="text-red-500 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">Favorite Item {favorite.id}</p>
                <p className="text-gray-400 text-sm">{favorite.item_type}</p>
              </div>
              <button className="p-2 bg-green-600 hover:bg-green-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={16} className="text-white ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;