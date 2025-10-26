export interface User {
  id: number;
  username: string;
  email: string;
  role: 'listener' | 'artist';
  email_verified: boolean;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  stage_name?: string;
  birth_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Song {
  id: number;
  title: string;
  artist: number;
  artist_name: string;
  album?: number;
  album_title?: string;
  genre?: number;
  genre_name?: string;
  cover_image?: string;
  audio_file: string;
  audio_url: string;
  release_date: string;
  duration: number;
  play_count: number;
  upload_date: string;
  approved: boolean;
}

export interface Album {
  id: number;
  title: string;
  artist: number;
  artist_name: string;
  cover_image?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
  songs_count: number;
  songs?: Song[];
}

export interface Genre {
  id: number;
  name: string;
  description?: string;
}

export interface Playlist {
  id: number;
  name: string;
  user: number;
  user_name: string;
  cover_image?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  songs: PlaylistSong[];
  songs_count: number;
}

export interface PlaylistSong {
  id: number;
  song: Song;
  song_id: number;
  added_at: string;
  order: number;
}

export interface Favorite {
  id: number;
  user: number;
  item_type: 'song' | 'album' | 'playlist';
  item_id: number;
  created_at: string;
}

export interface ListeningHistory {
  id: number;
  user: number;
  song: Song;
  listened_at: string;
}

export interface Comment {
  id: number;
  user: number;
  user_name: string;
  item_type: 'song' | 'album';
  item_id: number;
  content: string;
  created_at: string;
}

export interface AIPrompt {
  id: number;
  user: number;
  prompt_text: string;
  response_text?: string;
  generated_sql?: string;
  executed_result?: string;
  created_at: string;
  interactions: AIInteraction[];
}

export interface AIInteraction {
  id: number;
  message_type: 'user' | 'ai';
  message_text: string;
  timestamp: string;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: Song[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}