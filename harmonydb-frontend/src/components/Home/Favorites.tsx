import { useState, useEffect } from 'react';
import { Heart, Play, Music, Disc, List } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { Favorite, Song, Album, Playlist } from '../../types';

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

  // Helper function to get item name
  const getItemName = (item: Song | Album | Playlist | undefined): string => {
    if (!item) return 'Unknown Item';
    if ('title' in item) return item.title;
    if ('name' in item) return item.name;
    return 'Unknown Item';
  };

  // Helper function to get item image
  const getItemImage = (item: Song | Album | Playlist | undefined): string | undefined => {
    if (!item) return undefined;
    return item.cover_image;
  };

  // Helper function to get artist/creator name
  const getItemCreator = (favorite: Favorite): string => {
    if (!favorite.item) return 'Unknown';
    
    if (favorite.item_type === 'song' || favorite.item_type === 'album') {
      const item = favorite.item as Song | Album;
      return item.artist_name || 'Unknown Artist';
    }
    
    if (favorite.item_type === 'playlist') {
      const item = favorite.item as Playlist;
      return item.user_name || 'Unknown User';
    }
    
    return 'Unknown';
  };

  const handlePlaySong = (favorite: Favorite) => {
    if (favorite.item_type === 'song' && favorite.item && 'audio_url' in favorite.item) {
      playSong(favorite.item as Song);
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
        <div className="text-text-secondary font-poppins">Loading your favorites...</div>
      </div>
    );
  }

  return (
    <div className="p-8 font-poppins">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Heart className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Liked Music</h1>
          <p className="text-text-secondary">{favorites.length} items</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border mb-6">
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
                ? 'text-text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto text-text-muted mb-4" size={64} />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {activeTab === 'all' ? 'No liked items yet' : `No liked ${activeTab} yet`}
          </h3>
          <p className="text-text-secondary">Like songs, albums, or playlists to see them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFavorites.map((favorite, index) => (
            <div
              key={favorite.id}
              className="flex items-center space-x-4 p-4 hover:bg-surface/30 rounded-lg group transition-colors"
            >
              <div className="w-8 text-text-muted text-sm">{index + 1}</div>
              
              {/* Item Icon/Image */}
              <div className="w-12 h-12 rounded overflow-hidden bg-surface/50 flex items-center justify-center">
                {getItemImage(favorite.item) ? (
                  <img
                    src={getItemImage(favorite.item)}
                    alt={getItemName(favorite.item)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-text-muted">
                    {getIconForType(favorite.item_type)}
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">
                  {getItemName(favorite.item)}
                </p>
                <p className="text-text-secondary text-sm truncate">
                  {favorite.item_type === 'song' && (
                    <>Artist: {getItemCreator(favorite)}</>
                  )}
                  {favorite.item_type === 'album' && (
                    <>Album by {getItemCreator(favorite)}</>
                  )}
                  {favorite.item_type === 'playlist' && (
                    <>Playlist by {getItemCreator(favorite)}</>
                  )}
                  {!favorite.item && (
                    <span className="text-error">Item no longer available</span>
                  )}
                </p>
              </div>

              {/* Added Date */}
              <div className="text-text-muted text-sm">
                {new Date(favorite.created_at).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {favorite.item_type === 'song' && favorite.item && (
                  <button
                    onClick={() => handlePlaySong(favorite)}
                    className="p-2 bg-primary hover:bg-primary-600 rounded-full transition-colors"
                  >
                    <Play size={16} className="text-white ml-0.5" />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="p-2 text-error hover:text-error/80 transition-colors"
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