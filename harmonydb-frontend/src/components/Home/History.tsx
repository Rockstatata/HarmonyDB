import { useState, useEffect } from 'react';
import { Clock, Play, Trash2 } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { ListeningHistory } from '../../types';

const History = () => {
  const { playSong } = usePlayer();
  const [history, setHistory] = useState<ListeningHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError(null);
        const userHistory = await apiService.getListeningHistory();
        setHistory(userHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Failed to load listening history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handlePlaySong = (historyItem: ListeningHistory) => {
    if (historyItem.song) {
      playSong(historyItem.song);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all listening history? This action cannot be undone.')) {
      return;
    }
    
    // Note: This would need a backend endpoint to clear all history
    // For now, we'll just show a message
    alert('Clear history feature coming soon!');
  };

  const formatListenTime = (dateString: string) => {
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
      <div className="p-8 flex items-center justify-center min-h-96 font-poppins">
        <div className="text-text-secondary">Loading your history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 font-poppins">
        <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
          <h3 className="text-error font-semibold mb-2">Error Loading History</h3>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-error hover:bg-error/80 rounded text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-poppins">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-secondary rounded-lg flex items-center justify-center">
            <Clock className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Recently Played</h1>
            <p className="text-text-secondary">{history.length} songs</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-2 px-4 py-2 bg-surface/50 hover:bg-surface/70 rounded-lg transition-colors border border-border/20"
          >
            <Trash2 size={16} className="text-text-muted" />
            <span className="text-text-muted">Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto text-text-muted mb-4" size={64} />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No listening history yet</h3>
          <p className="text-text-secondary">Start listening to music to see your history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={`${item.id}-${item.listened_at}`}
              className="flex items-center space-x-4 p-4 hover:bg-surface/30 rounded-lg group cursor-pointer transition-colors"
              onClick={() => handlePlaySong(item)}
            >
              <div className="w-8 text-text-muted text-sm">{index + 1}</div>
              
              {/* Song Cover */}
              <div className="w-12 h-12 rounded overflow-hidden bg-surface/50 flex-shrink-0">
                {item.song?.cover_image ? (
                  <img
                    src={item.song.cover_image}
                    alt={item.song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Clock size={16} />
                  </div>
                )}
              </div>
              
              {/* Song Details */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">
                  {item.song?.title || 'Unknown Song'}
                </p>
                <p className="text-text-secondary text-sm truncate">
                  {item.song?.artist_name || 'Unknown Artist'}
                  {item.song?.album_title && (
                    <span> • {item.song.album_title}</span>
                  )}
                </p>
              </div>
              
              {/* Listen Time */}
              <div className="text-text-muted text-sm flex-shrink-0">
                {formatListenTime(item.listened_at)}
              </div>
              
              {/* Play Button */}
              <button 
                className="p-2 bg-primary hover:bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaySong(item);
                }}
              >
                <Play size={16} className="text-white ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;