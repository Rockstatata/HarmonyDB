import { useState, useEffect } from 'react';
import { Play, Clock, RotateCcw } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { ListeningHistory } from '../../types';

const JumpBackIn = () => {
  const { playSong } = usePlayer();
  const [recentHistory, setRecentHistory] = useState<ListeningHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentHistory = async () => {
      try {
        setError(null);
        const history = await apiService.getRecentHistory(6); // Get 6 unique recent songs
        setRecentHistory(history);
      } catch (error) {
        console.error('Error fetching recent history:', error);
        setError('Failed to load recent history');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentHistory();
  }, []);

  const handlePlaySong = (historyItem: ListeningHistory) => {
    if (historyItem.song) {
      playSong(historyItem.song);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Jump back in</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-surface/50 rounded-lg p-4 animate-pulse">
              <div className="w-full h-32 bg-dark-300 rounded mb-3"></div>
              <div className="h-4 bg-dark-300 rounded mb-2"></div>
              <div className="h-3 bg-dark-400 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Jump back in</h2>
        <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
          <Clock className="mx-auto text-error/60 mb-2" size={32} />
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (recentHistory.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Jump back in</h2>
        <div className="bg-surface/30 rounded-lg p-8 text-center border border-border/20">
          <RotateCcw className="mx-auto text-text-muted mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No recent listening history</h3>
          <p className="text-text-secondary">Start listening to music to see your recent tracks here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Jump back in</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentHistory.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="group bg-surface/40 hover:bg-surface/60 rounded-lg p-4 transition-all duration-300 cursor-pointer border border-border/10 hover:border-border/30"
            onClick={() => handlePlaySong(item)}
          >
            {/* Song Cover */}
            <div className="relative mb-3">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-dark-500">
                {item.song?.cover_image ? (
                  <img
                    src={item.song.cover_image}
                    alt={item.song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted bg-gradient-dark">
                    <Clock size={32} />
                  </div>
                )}
              </div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                <button className="bg-primary hover:bg-primary-600 text-white rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-200">
                  <Play size={20} className="ml-0.5" />
                </button>
              </div>
              
              {/* Recently played badge */}
              <div className="absolute top-2 right-2 bg-accent/90 text-text-primary text-xs px-2 py-1 rounded-full">
                {formatTimeAgo(item.listened_at)}
              </div>
            </div>
            
            {/* Song Info */}
            <div>
              <h3 className="font-semibold text-text-primary truncate mb-1 group-hover:text-primary transition-colors">
                {item.song?.title || 'Unknown Song'}
              </h3>
              <p className="text-text-secondary text-sm truncate">
                {item.song?.artist_name || 'Unknown Artist'}
              </p>
              {item.song?.album_title && (
                <p className="text-text-muted text-xs truncate mt-1">
                  {item.song.album_title}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JumpBackIn;