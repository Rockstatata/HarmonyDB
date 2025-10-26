import React, { createContext, useContext, useReducer, useRef } from 'react';
import type { Song, PlayerState } from '../types';

interface PlayerContextType {
  state: PlayerState;
  playSong: (song: Song, playlist?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlaylist: (playlist: Song[]) => void;
}

type PlayerAction =
  | { type: 'PLAY_SONG'; payload: { song: Song; playlist?: Song[] } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SKIP_NEXT' }
  | { type: 'SKIP_PREVIOUS' }
  | { type: 'SEEK'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_PLAYLIST'; payload: Song[] }
  | { type: 'UPDATE_TIME'; payload: { currentTime: number; duration: number } };

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  playlist: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 'none',
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY_SONG': {
      const { song, playlist = [] } = action.payload;
      const newPlaylist = playlist.length > 0 ? playlist : [song];
      const currentIndex = newPlaylist.findIndex(s => s.id === song.id);
      
      return {
        ...state,
        currentSong: song,
        isPlaying: true,
        playlist: newPlaylist,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
      };
    }

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'RESUME':
      return { ...state, isPlaying: true };

    case 'SKIP_NEXT': {
      if (state.playlist.length === 0) return state;
      
      let nextIndex = state.currentIndex + 1;
      if (state.shuffle) {
        nextIndex = Math.floor(Math.random() * state.playlist.length);
      } else if (nextIndex >= state.playlist.length) {
        if (state.repeat === 'all') {
          nextIndex = 0;
        } else {
          return { ...state, isPlaying: false };
        }
      }
      
      return {
        ...state,
        currentSong: state.playlist[nextIndex],
        currentIndex: nextIndex,
        isPlaying: true,
      };
    }

    case 'SKIP_PREVIOUS': {
      if (state.playlist.length === 0) return state;
      
      let prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = state.repeat === 'all' ? state.playlist.length - 1 : 0;
      }
      
      return {
        ...state,
        currentSong: state.playlist[prevIndex],
        currentIndex: prevIndex,
        isPlaying: true,
      };
    }

    case 'SEEK':
      return { ...state, currentTime: action.payload };

    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };

    case 'TOGGLE_SHUFFLE':
      return { ...state, shuffle: !state.shuffle };

    case 'TOGGLE_REPEAT': {
      const repeatStates: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
      const currentRepeatIndex = repeatStates.indexOf(state.repeat);
      const nextRepeat = repeatStates[(currentRepeatIndex + 1) % repeatStates.length];
      return { ...state, repeat: nextRepeat };
    }

    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload };

    case 'UPDATE_TIME':
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
      };

    default:
      return state;
  }
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSong = (song: Song, playlist?: Song[]) => {
    dispatch({ type: 'PLAY_SONG', payload: { song, playlist } });
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    dispatch({ type: 'PAUSE' });
  };

  const resumeSong = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
    dispatch({ type: 'RESUME' });
  };

  const skipToNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    dispatch({ type: 'SKIP_NEXT' });
  };

  const skipToPrevious = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    dispatch({ type: 'SKIP_PREVIOUS' });
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    dispatch({ type: 'SEEK', payload: time });
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    dispatch({ type: 'SET_VOLUME', payload: volume });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const toggleRepeat = () => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  };

  const setPlaylist = (playlist: Song[]) => {
    dispatch({ type: 'SET_PLAYLIST', payload: playlist });
  };

  // Handle audio events
  React.useEffect(() => {
    if (!state.currentSong) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    // Only set src if it's different to prevent reloading
    if (audio.src !== state.currentSong.audio_url) {
      audio.src = state.currentSong.audio_url;
    }
    
    audio.volume = state.volume;

    if (state.isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }

    const handleTimeUpdate = () => {
      dispatch({
        type: 'UPDATE_TIME',
        payload: {
          currentTime: audio.currentTime,
          duration: audio.duration || 0,
        },
      });
    };

    const handleEnded = () => {
      if (state.repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        dispatch({ type: 'SKIP_NEXT' });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleTimeUpdate);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [state.currentSong, state.isPlaying, state.repeat, state.volume]);

  // Handle volume changes separately to avoid resetting playback
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  const value: PlayerContextType = {
    state,
    playSong,
    pauseSong,
    resumeSong,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setPlaylist,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}