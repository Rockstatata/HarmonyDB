import { useState, useEffect } from 'react';
import { Heart, Play, Music, Disc, List } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Favorite } from '../../types';

const Favorites = () => {
  const { playSong } = usePlayer();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'albums' | 'playlists'>('all');

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

  const handlePlaySong = (favorite: Favorite) => {
    if (favorite.item_type === 'song' && favorite.item) {
      playSong(favorite.item);
    }
  };

  const handleRemoveFavorite = async (favoriteId: number) => {
    try {
      await apiService.removeFavorite(favoriteId);
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    if (activeTab === 'all') return true;
    return fav.item_type === activeTab.slice(0, -1); // Remove 's' from end
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'song': return <Music size={20} />;
      case 'album': return <Disc size={20} />;
      case 'playlist': return <List size={20} />;
      default: return <Heart size={20} />;
    }
  };

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
          <h1 className="text-3xl font-bold text-white">Liked Music</h1>
          <p className="text-gray-400">{favorites.length} items</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        {[
          { key: 'all', label: 'All', count: favorites.length },
          { key: 'songs', label: 'Songs', count: favorites.filter(f => f.item_type === 'song').length },
          { key: 'albums', label: 'Albums', count: favorites.filter(f => f.item_type === 'album').length },
          { key: 'playlists', label: 'Playlists', count: favorites.filter(f => f.item_type === 'playlist').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'all' | 'songs' | 'albums' | 'playlists')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-white border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">
            {activeTab === 'all' ? 'No liked items yet' : `No liked ${activeTab} yet`}
          </h3>
          <p className="text-gray-400">Like songs, albums, or playlists to see them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFavorites.map((favorite, index) => (
            <div
              key={favorite.id}
              className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg group"
            >
              <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
              
              {/* Item Icon/Image */}
              <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex items-center justify-center">
                {favorite.item && favorite.item.cover_image ? (
                  <img
                    src={favorite.item.cover_image}
                    alt={favorite.item.title || favorite.item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">
                    {getIconForType(favorite.item_type)}
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {favorite.item ? (favorite.item.title || favorite.item.name) : 'Unknown Item'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {favorite.item_type === 'song' && favorite.item?.artist_name && (
                    <>Artist: {favorite.item.artist_name}</>
                  )}
                  {favorite.item_type === 'album' && favorite.item?.artist_name && (
                    <>Album by {favorite.item.artist_name}</>
                  )}
                  {favorite.item_type === 'playlist' && favorite.item?.user_name && (
                    <>Playlist by {favorite.item.user_name}</>
                  )}
                  {!favorite.item && (
                    <span className="text-red-400">Item no longer available</span>
                  )}
                </p>
              </div>

              {/* Added Date */}
              <div className="text-gray-400 text-sm">
                {new Date(favorite.created_at).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {favorite.item_type === 'song' && favorite.item && (
                  <button
                    onClick={() => handlePlaySong(favorite)}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                  >
                    <Play size={16} className="text-white ml-0.5" />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove from favorites"
                >
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;