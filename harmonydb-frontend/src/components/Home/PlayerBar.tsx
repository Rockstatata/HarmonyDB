import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2 } from 'lucide-react';
import { usePlayer } from '../../context/playerContext';
import { useState, useRef } from 'react';
import FavoriteButton from '../ui/FavoriteButton';

const PlayerBar = () => {
  const { state, pauseSong, resumeSong, skipToNext, skipToPrevious, seekTo, setVolume, toggleShuffle, toggleRepeat } = usePlayer();
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pauseSong();
    } else if (state.currentSong) {
      resumeSong();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !state.duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * state.duration;
    
    seekTo(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (!state.currentSong) {
    return (
      <div className="h-20 bg-surface border-t border-accent/30 flex items-center justify-center">
        <p className="text-text-muted font-poppins">No song selected</p>
      </div>
    );
  }

  return (
    <div className="h-20 bg-surface border-t border-accent/30 px-4 flex items-center justify-between">
      {/* Song Info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <img 
          src={state.currentSong.cover_image || '/placeholder-album.png'} 
          alt={state.currentSong.title}
          className="w-12 h-12 rounded object-cover"
        />
        <div className="min-w-0">
          <p className="text-text-primary text-sm font-medium truncate font-poppins">{state.currentSong.title}</p>
          <p className="text-text-muted text-xs truncate font-poppins">{state.currentSong.artist_name}</p>
        </div>
        <FavoriteButton 
          itemType="song" 
          itemId={state.currentSong.id} 
          size={16}
          className="ml-2"
        />
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
        {/* Control Buttons */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleShuffle}
            className={`transition-colors ${
              state.shuffle ? 'text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Shuffle size={18} />
          </button>
          
          <button 
            onClick={skipToPrevious}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={handlePlayPause}
            className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {state.isPlaying ? (
              <Pause size={18} className="text-white" />
            ) : (
              <Play size={18} className="text-white ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={skipToNext}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <SkipForward size={20} />
          </button>
          
          <button 
            onClick={toggleRepeat}
            className={`transition-colors ${
              state.repeat !== 'none' ? 'text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2 w-full text-xs text-text-muted font-poppins">
          <span>{formatTime(state.currentTime)}</span>
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-accent/50 rounded-full cursor-pointer group relative"
          >
            <div 
              className="h-full bg-gradient-primary rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg" />
            </div>
          </div>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3 flex-1 justify-end">
        <div className="relative">
          <button 
            onClick={() => setIsVolumeOpen(!isVolumeOpen)}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <Volume2 size={20} />
          </button>
          
          {isVolumeOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-surface border border-accent/30 rounded-lg p-2 w-32 glass">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={state.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-accent/50 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${state.volume * 100}%, var(--color-accent) ${state.volume * 100}%, var(--color-accent) 100%)`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;