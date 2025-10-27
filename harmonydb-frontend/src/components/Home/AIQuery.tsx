import { useState, useEffect } from 'react';
import { Brain, Send, Trash2, Music, User, Disc, TrendingUp, Lightbulb, Sparkles } from 'lucide-react';
import { apiService } from '../../services/apiServices';
import { usePlayer } from '../../context/playerContext';
import MediaCard from '../MediaCard';
import type { AIPrompt, Song, Album, User as UserType } from '../../types';

interface AIQueryResult {
  prompt_id: number;
  query: string;
  intent: string;
  entities: Record<string, string | number | null>;
  ai_response: string;
  result_type: 'songs' | 'albums' | 'artists' | 'stats' | 'error' | 'aggregation' | 'joined_data' | 'subquery_result' | 'grouped_aggregation';
  results: Song[] | Album[] | UserType[] | Record<string, string | number> | AggregationResult | JoinedDataItem[] | SubqueryResultItem[] | GroupedAggregationItem[];
  count: number;
  sql_query: string;
  success: boolean;
  dbms_concept?: string;
}

interface AggregationResult {
  aggregation_type: string;
  field: string;
  result: number;
  label: string;
  query_description: string;
}

interface JoinedDataItem {
  song_title?: string;
  song_id?: number;
  album_title?: string;
  album_id?: number;
  artist_name?: string;
  cover_image?: string;
  play_count?: number;
  release_date?: string;
  songs_count?: number;
}

interface SubqueryResultItem {
  album_title?: string;
  album_id?: number;
  artist_name?: string;
  artist_id?: number;
  songs_count?: number;
  total_plays?: number;
  cover_image?: string;
  profile_picture?: string;
  release_date?: string;
  query_description?: string;
}

interface GroupedAggregationItem {
  artist_name?: string;
  artist_id?: number;
  genre_name?: string;
  genre_id?: number;
  album_title?: string;
  album_id?: number;
  count: number;
  label: string;
  cover_image?: string;
  profile_picture?: string;
  description?: string;
}

const AIQuery = () => {
  const { playSong } = usePlayer();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [currentResult, setCurrentResult] = useState<AIQueryResult | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [insights, setInsights] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const userPrompts = await apiService.getAIPrompts();
        setPrompts(userPrompts);
      } catch (error) {
        console.error('Error fetching AI prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };

    fetchPrompts();
  }, []);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || loading) return;

    setLoading(true);
    setCurrentResult(null);
    
    try {
      // Use the new AI query endpoint
      const result = await apiService.queryAI(newPrompt);
      // Reset conversation UI: show only the new result as requested
      setPrompts([]);
      setCurrentResult(result);
      
      // Refresh prompts list
      const userPrompts = await apiService.getAIPrompts();
      setPrompts(userPrompts);
      
      setNewPrompt('');
    } catch (error) {
      console.error('Error creating AI prompt:', error);
      setCurrentResult({
        prompt_id: 0,
        query: newPrompt,
        intent: 'error',
        entities: {},
        ai_response: 'Sorry, I encountered an error processing your request.',
        result_type: 'error',
        results: [],
        count: 0,
        sql_query: '',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setShowRecommendations(true);
      const response = await apiService.getAIRecommendations();
      setRecommendations(response.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await apiService.getAIInsights();
      setInsights(response.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const renderResults = (result: AIQueryResult) => {
    if (!result.success) {
      return (
        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <Brain size={16} className="text-red-400" />
            </div>
            <h4 className="text-red-300 font-medium">Error</h4>
          </div>
          <p className="text-red-200/80">{result.ai_response}</p>
        </div>
      );
    }

    if (result.result_type === 'songs') {
      const songs = result.results as Song[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Music className="text-primary-400" size={20} />
              <span>Songs Found ({songs.length})</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {songs.map((song) => (
              <MediaCard
                key={song.id}
                variant="media"
                mediaType="song"
                title={song.title}
                subtitle={song.artist_name || 'Unknown Artist'}
                imageSrc={song.cover_image || '/placeholder-album.png'}
                onClick={() => handlePlaySong(song)}
                className="backdrop-blur-sm bg-dark-800/30 border-primary-500/10"
              />
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'albums') {
      const albums = result.results as Album[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Disc className="text-secondary-400" size={20} />
              <span>Albums Found ({albums.length})</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
              <MediaCard
                key={album.id}
                variant="media"
                mediaType="album"
                title={album.title}
                subtitle={album.artist_name || 'Unknown Artist'}
                imageSrc={album.cover_image || '/placeholder-album.png'}
                releaseDate={album.release_date}
                className="backdrop-blur-sm bg-dark-800/30 border-secondary-500/10"
              />
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'artists') {
      const artists = result.results as UserType[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <User className="text-accent-400" size={20} />
              <span>Artists Found ({artists.length})</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {artists.map((artist) => (
              <MediaCard
                key={artist.id}
                variant="artist"
                title={artist.stage_name || artist.username}
                subtitle={`${artist.songs_count || 0} songs`}
                imageSrc={artist.profile_picture || '/placeholder-profile.png'}
                className="backdrop-blur-sm bg-dark-800/30 border-accent-500/10"
              />
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'aggregation') {
      const aggregation = result.results as AggregationResult;
      return (
        <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 rounded-2xl p-6 backdrop-blur-sm border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="text-primary-400" />
            <span>Aggregation Result</span>
          </h4>
          <div className="text-center p-6 bg-dark-800/30 rounded-xl border border-primary-500/5">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-2">
              {aggregation.result}
            </div>
            <div className="text-lg text-gray-300 mb-1">{aggregation.label}</div>
            <div className="text-sm text-gray-400">{aggregation.query_description}</div>
          </div>
        </div>
      );
    }

    if (result.result_type === 'joined_data') {
      const joinedData = result.results as JoinedDataItem[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="text-secondary-400" size={20} />
              <span>Joined Data ({joinedData.length})</span>
            </h4>
          </div>
          <div className="space-y-3">
            {joinedData.map((item, index) => (
              <div key={index} className="bg-dark-800/30 rounded-xl p-4 border border-secondary-500/10">
                <div className="flex items-center space-x-4">
                  {item.cover_image && (
                    <img src={item.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {item.song_title || item.album_title}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {item.album_title && item.song_title ? `Album: ${item.album_title}` : ''}
                      {item.artist_name ? ` • Artist: ${item.artist_name}` : ''}
                      {item.play_count ? ` • ${item.play_count} plays` : ''}
                      {item.songs_count ? ` • ${item.songs_count} songs` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'subquery_result') {
      const subqueryData = result.results as SubqueryResultItem[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Brain className="text-accent-400" size={20} />
              <span>Subquery Result</span>
            </h4>
          </div>
          <div className="space-y-3">
            {subqueryData.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-accent-900/20 to-primary-900/20 rounded-xl p-6 border border-accent-500/10">
                <div className="flex items-center space-x-4">
                  {item.cover_image && (
                    <img src={item.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  {item.profile_picture && (
                    <img src={item.profile_picture} alt="" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg">
                      {item.album_title || item.artist_name}
                    </div>
                    <div className="text-gray-300 text-sm mb-2">
                      {item.query_description}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {item.songs_count && (
                        <span className="text-primary-400">{item.songs_count} songs</span>
                      )}
                      {item.total_plays && (
                        <span className="text-secondary-400">{item.total_plays} total plays</span>
                      )}
                      {item.artist_name && item.album_title && (
                        <span className="text-gray-400">by {item.artist_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'grouped_aggregation') {
      const groupedData = result.results as GroupedAggregationItem[];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="text-primary-400" size={20} />
              <span>Grouped Results ({groupedData.length})</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedData.map((item, index) => (
              <div key={index} className="bg-dark-800/30 rounded-xl p-4 border border-primary-500/10">
                <div className="flex items-center space-x-3">
                  {item.cover_image && (
                    <img src={item.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  {item.profile_picture && (
                    <img src={item.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {item.artist_name || item.genre_name || item.album_title}
                    </div>
                    <div className="text-primary-400 text-sm font-semibold">
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-gray-400 text-xs mt-1">{item.description}</div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary-400">
                    {item.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (result.result_type === 'stats') {
      const stats = result.results as Record<string, string | number>;
      return (
        <div className="bg-gradient-to-br from-primary-900/20 to-secondary-900/20 rounded-2xl p-6 backdrop-blur-sm border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="text-primary-400" />
            <span>Your Music Stats</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-dark-800/30 rounded-xl border border-primary-500/5">
                <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="text-sm text-gray-400 capitalize mt-1">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const suggestedQueries = [
    // 1. Basic Queries (SELECT, WHERE, ORDER BY, LIMIT)
    "Find all songs by The Weeknd",
    "Show me all albums released after 2020",
    "Show me the top 5 most played songs",
    "List songs in Rock genre",
    
    // 2. Aggregate Functions (COUNT, AVG, MAX, MIN, SUM)
    "How many songs are there in the genre Rock?",
    "What is the average play count of songs?",
    "Find the song with the highest play count",
    "Show me the minimum play count in Pop genre",
    
    // 3. Joins (INNER JOIN, LEFT JOIN, combining tables)
    "List all songs and their corresponding album titles",
    "Show all albums with their respective artists",
    "Find all songs played more than 1000 times and their artists",
    
    // 4. Subqueries (nested queries)
    "Show the album with the highest number of songs",
    "Find the artist with the most popular songs based on play count",
    "List albums that have more than 5 songs",
    
    // 5. GROUP BY with Aggregation
    "Find the total number of songs by each artist",
    "Show the total play count by each genre",
    "List artists with their song counts",
    "Show album statistics grouped by artist",
    
    // 6. Date/Time Queries (range filtering)
    "Find songs added in the last 30 days",
    "List albums released in the last year",
    "Show songs released before 2010",
    
    // 7. Text Search (ILIKE, pattern matching)
    "Search for songs with title containing Love",
    "Find albums that contain the word Rock in their title",
    "Search for artists with names containing John",
    
    // 8. Advanced Filtering (comparison operators)
    "Show songs with play count greater than 1000",
    "Find songs with duration less than 3 minutes",
    "List albums with more than 10 songs",
    
    // 9. Statistical Queries
    "What are my music statistics?",
    "Show genre distribution in my library",
    "Find most active artists by upload count",
    
    // 10. Recommendation Queries
    "Recommend new music for me based on my preferences",
    "Find similar songs to my favorites",
    "Suggest artists I might like"
  ];

  if (loadingPrompts) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-gray-400 flex items-center space-x-3">
          <Brain className="animate-pulse text-primary-400" size={24} />
          <span>Loading AI conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Brain className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Melo AI Assistant
            </h1>
            <p className="text-gray-400 mt-1">Ask questions about your music and get personalized insights</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchRecommendations}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Sparkles size={16} />
            <span>Get Recommendations</span>
          </button>
          <button
            onClick={fetchInsights}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-secondary-600 to-accent-600 hover:from-secondary-500 hover:to-accent-500 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Lightbulb size={16} />
            <span>My Insights</span>
          </button>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="bg-dark-800/30 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/10">
        <form onSubmit={handleSubmitPrompt} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Ask me anything about your music..."
                className="w-full px-6 py-4 bg-dark-700/50 text-white rounded-xl border border-dark-600/50 outline-none focus:border-primary-500/50 focus:bg-dark-700/70 transition-all duration-200 placeholder-gray-400"
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Brain className="animate-spin text-primary-400" size={20} />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !newPrompt.trim()}
              className="px-6 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
            >
              <Send size={20} />
              <span className="hidden sm:inline">{loading ? 'Processing...' : 'Ask AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Suggested Queries */}
      {!currentResult && prompts.length === 0 && (
        <div className="bg-dark-800/20 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Lightbulb className="text-primary-400" size={20} />
            <span>Try asking:</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setNewPrompt(query)}
                className="px-4 py-2 bg-dark-700/40 hover:bg-dark-600/60 border border-primary-500/10 hover:border-primary-500/20 rounded-lg text-gray-300 hover:text-white text-sm transition-all duration-200"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Query Result */}
      {currentResult && (
        <div className="bg-dark-800/30 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/10">
          <div className="space-y-6">
            {/* User Query */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">You</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <p className="text-white font-medium">You asked:</p>
                  {currentResult.result_type && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-dark-700/40 rounded-full">
                      {currentResult.result_type === 'songs' && <Music size={14} className="text-primary-400" />}
                      {currentResult.result_type === 'albums' && <Disc size={14} className="text-secondary-400" />}
                      {currentResult.result_type === 'artists' && <User size={14} className="text-accent-400" />}
                      {currentResult.result_type === 'stats' && <TrendingUp size={14} className="text-primary-400" />}
                      <span className="text-xs text-gray-400 capitalize">
                        {currentResult.result_type}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-200 bg-dark-700/30 rounded-lg p-3">"{currentResult.query}"</p>
              </div>
            </div>
            
            {/* AI Response */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain size={18} className="text-white" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <p className="text-white font-medium">Melo AI:</p>
                    {currentResult.dbms_concept && (
                      <div className="px-3 py-1 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-500/30 rounded-full">
                        <span className="text-xs text-primary-300 font-medium uppercase tracking-wide">
                          {currentResult.dbms_concept.replace('_', ' ')} Concept
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-200 bg-gradient-to-r from-primary-900/10 to-secondary-900/10 rounded-lg p-4 border border-primary-500/10">
                    {currentResult.ai_response}
                  </p>
                </div>
                
                {currentResult.success && currentResult.count > 0 && (
                  <div className="text-sm text-gray-400 flex items-center space-x-2">
                    <span>Found {currentResult.count} result{currentResult.count !== 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {renderResults(currentResult)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-dark-800/30 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/10">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Sparkles className="text-primary-400" />
            <span>Recommendations for You</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendations.map((song) => (
              <MediaCard
                key={song.id}
                variant="media"
                mediaType="song"
                title={song.title}
                subtitle={song.artist_name || 'Unknown Artist'}
                imageSrc={song.cover_image || '/placeholder-album.png'}
                onClick={() => handlePlaySong(song)}
                className="backdrop-blur-sm bg-dark-800/30 border-primary-500/10"
              />
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="bg-dark-800/30 backdrop-blur-sm rounded-2xl p-6 border border-secondary-500/10">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Lightbulb className="text-secondary-400" />
            <span>Your Music Insights</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(insights).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gradient-to-br from-secondary-900/20 to-accent-900/20 rounded-xl border border-secondary-500/10">
                <div className="text-2xl font-bold bg-gradient-to-r from-secondary-400 to-accent-400 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="text-sm text-gray-400 capitalize mt-1">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History */}
      {prompts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Brain className="text-primary-400" size={20} />
            <span>Recent Conversations</span>
          </h3>
          <div className="space-y-4">
            {prompts.slice(0, 5).map((prompt) => (
              <div key={prompt.id} className="bg-dark-800/30 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">You</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(prompt.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-gray-200 mb-4 bg-dark-700/30 rounded-lg p-3">{prompt.prompt_text}</p>
                
                {prompt.response_text && (
                  <div className="border-l-4 border-primary-500/30 pl-4 space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <Brain size={16} className="text-white" />
                      </div>
                      <p className="text-white font-medium">Melo AI</p>
                    </div>
                    <p className="text-gray-200 bg-gradient-to-r from-primary-900/10 to-secondary-900/10 rounded-lg p-3">
                      {prompt.response_text}
                    </p>
                  </div>
                )}
                
                {!prompt.response_text && (
                  <div className="border-l-4 border-gray-600/30 pl-4">
                    <p className="text-gray-400 italic flex items-center space-x-2">
                      <Brain className="animate-pulse" size={16} />
                      <span>Processing...</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {prompts.length === 0 && !currentResult && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="text-primary-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Start a conversation with the AI assistant to get personalized music recommendations and insights
          </p>
        </div>
      )}
    </div>
  );
};

export default AIQuery;