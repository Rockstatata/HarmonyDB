
interface AuthTokens {
  access: string;
  refresh: string;
}

import type { 
  User, Song, Album, Genre, Playlist, Favorite, 
  ListeningHistory, Comment, AIPrompt 
} from '../types';

const API_BASE_URL = '/api';

interface AuthTokens {
  access: string;
  refresh: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  role: 'listener' | 'artist';
}

interface LoginData {
  username: string;
  password: string;
}

class ApiService {
  private getHeaders(includeAuth = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const tokens = this.getStoredTokens();
      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }
    }

    return headers;
  }

  private getMultipartHeaders(includeAuth = false) {
    const headers: Record<string, string> = {};

    if (includeAuth) {
      const tokens = this.getStoredTokens();
      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }
    }

    return headers;
  }

  private getStoredTokens(): AuthTokens | null {
    const stored = localStorage.getItem('harmonydb_tokens');
    return stored ? JSON.parse(stored) : null;
  }

  private storeTokens(tokens: AuthTokens) {
    localStorage.setItem('harmonydb_tokens', JSON.stringify(tokens));
  }

  private clearTokens() {
    localStorage.removeItem('harmonydb_tokens');
  }

  // ==================== AUTH METHODS ====================
  async register(data: RegisterData) {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(data: LoginData) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const result = await response.json();
    this.storeTokens(result.tokens);
    return result;
  }

  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  async updateProfile(data: FormData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return response.json();
  }

  async refreshToken() {
    const tokens = this.getStoredTokens();
    if (!tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    this.storeTokens({ ...tokens, access: result.access });
    return result;
  }

  logout() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!tokens?.access;
  }

  // ==================== SONG METHODS ====================
  async getSongs(params?: Record<string, string>): Promise<Song[]> {
    let url = `${API_BASE_URL}/songs/`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch songs');
    
    const data = await response.json();
    return data.results || data;
  }

  async getSong(id: number): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/songs/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch song');
    return response.json();
  }

  async createSong(data: FormData): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/songs/`, {
      method: 'POST',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to create song');
    return response.json();
  }

  async updateSong(id: number, data: FormData): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/songs/${id}/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to update song');
    return response.json();
  }

  async deleteSong(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/songs/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to delete song');
  }

  // ==================== ALBUM METHODS ====================
  async getAlbums(params?: Record<string, string>): Promise<Album[]> {
    let url = `${API_BASE_URL}/albums/`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch albums');
    
    const data = await response.json();
    return data.results || data;
  }

  async getAlbum(id: number): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch album');
    return response.json();
  }

  async createAlbum(data: FormData): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums/`, {
      method: 'POST',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to create album');
    return response.json();
  }

  async updateAlbum(id: number, data: FormData): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums/${id}/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to update album');
    return response.json();
  }

  async deleteAlbum(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/albums/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to delete album');
  }

  // ==================== GENRE METHODS ====================
  async getGenres(): Promise<Genre[]> {
    const response = await fetch(`${API_BASE_URL}/genres/`);
    if (!response.ok) throw new Error('Failed to fetch genres');
    
    const data = await response.json();
    return data.results || data;
  }

  // ==================== PLAYLIST METHODS ====================
  async getPlaylists(params?: Record<string, string>): Promise<Playlist[]> {
    let url = `${API_BASE_URL}/playlists/`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch playlists');
    
    const data = await response.json();
    return data.results || data;
  }

  async getPlaylist(id: number): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch playlist');
    return response.json();
  }

  async createPlaylist(data: FormData): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/`, {
      method: 'POST',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to create playlist');
    return response.json();
  }

  async updatePlaylist(id: number, data: FormData): Promise<Playlist> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to update playlist');
    return response.json();
  }

  async deletePlaylist(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to delete playlist');
  }

  async addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/add-song/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ song_id: songId }),
    });

    if (!response.ok) throw new Error('Failed to add song to playlist');
  }

  async removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/remove-song/${songId}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to remove song from playlist');
  }

  // ==================== FAVORITE METHODS ====================
  async getFavorites(): Promise<Favorite[]> {
    const response = await fetch(`${API_BASE_URL}/favorites/`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch favorites');
    
    const data = await response.json();
    return data.results || data;
  }

  async addFavorite(itemType: string, itemId: number): Promise<Favorite> {
    const response = await fetch(`${API_BASE_URL}/favorites/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ item_type: itemType, item_id: itemId }),
    });

    if (!response.ok) throw new Error('Failed to add favorite');
    return response.json();
  }

  async removeFavorite(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/favorites/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to remove favorite');
  }

  // ==================== HISTORY METHODS ====================
  async getListeningHistory(): Promise<ListeningHistory[]> {
    const response = await fetch(`${API_BASE_URL}/history/`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch listening history');
    
    const data = await response.json();
    return data.results || data;
  }

  // ==================== COMMENT METHODS ====================
  async getComments(itemType: string, itemId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/comments/?item_type=${itemType}&item_id=${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    
    const data = await response.json();
    return data.results || data;
  }

  async createComment(itemType: string, itemId: number, content: string): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ item_type: itemType, item_id: itemId, content }),
    });

    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  }

  // ==================== AI METHODS ====================
  async getAIPrompts(): Promise<AIPrompt[]> {
    const response = await fetch(`${API_BASE_URL}/ai-prompts/`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch AI prompts');
    
    const data = await response.json();
    return data.results || data;
  }

  async createAIPrompt(promptText: string): Promise<AIPrompt> {
    const response = await fetch(`${API_BASE_URL}/ai-prompts/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ prompt_text: promptText }),
    });

    if (!response.ok) throw new Error('Failed to create AI prompt');
    return response.json();
  }
}

export const apiService = new ApiService();
export type { User, RegisterData, LoginData, AuthTokens };