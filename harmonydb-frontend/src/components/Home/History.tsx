import { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import type { ListeningHistory } from '../../types';

const History = () => {
  const { playSong } = usePlayer();
  const [history, setHistory] = useState<ListeningHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userHistory = await apiService.getListeningHistory();
        setHistory(userHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handlePlaySong = (historyItem: ListeningHistory) => {
    playSong(historyItem.song);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400">Loading your history...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Clock className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Recently Played</h1>
          <p className="text-gray-400">{history.length} songs</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">No listening history yet</h3>
          <p className="text-gray-400">Start listening to music to see your history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg group cursor-pointer"
              onClick={() => handlePlaySong(item)}
            >
              <div className="w-8 text-gray-400 text-sm">{index + 1}</div>
              <img
                src={item.song.cover_image || '/placeholder-album.png'}
                alt={item.song.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{item.song.title}</p>
                <p className="text-gray-400 text-sm truncate">{item.song.artist_name}</p>
              </div>
              <div className="text-gray-400 text-sm">
                {new Date(item.listened_at).toLocaleDateString()}
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

export default History;