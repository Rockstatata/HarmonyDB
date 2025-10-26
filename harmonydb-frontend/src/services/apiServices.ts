import type { 
  User, Song, Album, Genre, Playlist, PlaylistSong, Favorite, 
  ListeningHistory, Comment, AIPrompt 
} from '../types';
import type { SQLDebugInfo } from '../context/sqlDebugTypes';

const API_BASE_URL = 'http://localhost:8000/api';

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
  // SQL Debug callback - will be set by the SQLDebugProvider
  private sqlDebugCallback: ((debugInfo: SQLDebugInfo) => void) | null = null;

  setSQLDebugCallback(callback: (debugInfo: SQLDebugInfo) => void) {
    this.sqlDebugCallback = callback;
  }

  // Enhanced fetch wrapper that captures ALL SQL debug info
  private async fetchWithDebug(url: string, options?: RequestInit): Promise<{ response: Response; data?: unknown }> {
    const response = await fetch(url, options);
    
    let cleanedData: unknown = undefined;
    
    // Always try to extract SQL debug info from response
    if (response.headers.get('content-type')?.includes('application/json') || 
        response.headers.get('X-SQL-Debug-Count')) {
      
      // Clone response to read it multiple times
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        cleanedData = this.extractSQLDebugInfo(data, response.headers);
      } catch {
        // If JSON parsing fails, still check headers
        this.extractSQLDebugInfo(null, response.headers);
      }
    }
    
    return { response, data: cleanedData };
  }

  private extractSQLDebugInfo(data: unknown, headers?: Headers) {
    // First check if debug info is in the response data
    if (data && typeof data === 'object' && data !== null && '_sql_debug' in data) {
      const typedData = data as Record<string, unknown>;
      if (this.sqlDebugCallback && typedData._sql_debug) {
        this.sqlDebugCallback(typedData._sql_debug as SQLDebugInfo);
      }
      // Remove debug info from the actual data to keep it clean
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _sql_debug, ...cleanData } = typedData;
      return cleanData;
    }
    
    // If no debug info in data, check headers (for non-JSON responses)
    if (headers && this.sqlDebugCallback) {
      const queryCount = headers.get('X-SQL-Debug-Count');
      const totalTime = headers.get('X-SQL-Debug-Time');
      
      if (queryCount && totalTime) {
        // Collect individual queries from headers if available
        const queries = [];
        for (let i = 1; i <= Math.min(parseInt(queryCount, 10), 5); i++) {
          const queryHeader = headers.get(`X-SQL-Debug-Query-${i}`);
          if (queryHeader) {
            queries.push({
              sql: queryHeader,
              time: '0.000', // Approximate since we don't have individual times
              formatted_sql: this._formatSQLFromString(queryHeader)
            });
          }
        }
        
        // If no individual queries in headers, create a summary
        if (queries.length === 0) {
          queries.push({
            sql: `-- ${queryCount} SQL queries executed in ${totalTime}`,
            time: totalTime,
            formatted_sql: `-- Database Activity Summary:\n-- Total queries: ${queryCount}\n-- Total execution time: ${totalTime}`
          });
        }
        
        const headerDebugInfo: SQLDebugInfo = {
          count: parseInt(queryCount, 10),
          total_time: totalTime,
          queries: queries
        };
        this.sqlDebugCallback(headerDebugInfo);
      }
    }
    
    return data;
  }

  // Helper method to format SQL strings
  private _formatSQLFromString(sql: string): string {
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
      'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'INSERT', 'UPDATE', 'DELETE'
    ];
    
    let formatted = sql;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword.toUpperCase()} `);
    });
    
    return formatted.trim();
  }

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
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const rawResult = await response.json();
    return this.extractSQLDebugInfo(rawResult, response.headers);
  }

  async login(data: LoginData) {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const rawResult = await response.json();
    const result = this.extractSQLDebugInfo(rawResult, response.headers);
    this.storeTokens((result as { tokens: AuthTokens }).tokens);
    return result;
  }

  async getMe(): Promise<User> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/me/`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as User;
  }

  async updateProfile(data: FormData): Promise<User> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as User;
  }

  async changePassword(data: { current_password: string; new_password: string; confirm_new_password: string }): Promise<void> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/change-password/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.current_password?.[0] || error.new_password?.[0] || 'Password change failed');
    }
  }

  async refreshToken() {
    const tokens = this.getStoredTokens();
    if (!tokens?.refresh) {
      throw new Error('No refresh token available');
    }

    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refresh: tokens.refresh }),
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const rawResult = await response.json();
    const result = this.extractSQLDebugInfo(rawResult, response.headers);
    this.storeTokens({ ...tokens, access: (result as { access: string }).access });
    return result;
  }

  logout() {
    const tokens = this.getStoredTokens();
    if (tokens?.refresh) {
      // Call backend logout to blacklist tokens
      this.fetchWithDebug(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ refresh: tokens.refresh }),
      }).catch(error => {
        console.error('Backend logout failed:', error);
        // Continue with local logout even if backend fails
      });
    }
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

    const { response, data } = await this.fetchWithDebug(url);
    if (!response.ok) throw new Error('Failed to fetch songs');
    
    if (data) {
      return (data as { results?: Song[] }).results || (data as Song[]);
    }
    
    // Fallback: parse response manually if data extraction failed
    const rawData = await response.json();
    const cleanedData = this.extractSQLDebugInfo(rawData, response.headers);
    return (cleanedData as { results?: Song[] }).results || (cleanedData as Song[]);
  }

  async getSong(id: number): Promise<Song> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/songs/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch song');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Song;
  }

  async createSong(data: FormData): Promise<Song> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/songs/`, {
      method: 'POST',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to create song');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Song;
  }

  async updateSong(id: number, data: FormData): Promise<Song> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/songs/${id}/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to update song');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Song;
  }

  async deleteSong(id: number): Promise<void> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/songs/${id}/`, {
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

    const { response, data } = await this.fetchWithDebug(url);
    if (!response.ok) throw new Error('Failed to fetch albums');
    
    if (data) {
      return (data as { results?: Album[] }).results || (data as Album[]);
    }
    
    // Fallback: parse response manually if data extraction failed
    const rawData = await response.json();
    const cleanedData = this.extractSQLDebugInfo(rawData, response.headers);
    return (cleanedData as { results?: Album[] }).results || (cleanedData as Album[]);
  }

  async getAlbum(id: number): Promise<Album> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch album');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Album;
  }

  async createAlbum(data: FormData): Promise<Album> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/`, {
      method: 'POST',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to create album');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Album;
  }

  async updateAlbum(id: number, data: FormData): Promise<Album> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/${id}/`, {
      method: 'PATCH',
      headers: this.getMultipartHeaders(true),
      body: data,
    });

    if (!response.ok) throw new Error('Failed to update album');
    
    const rawData = await response.json();
    return this.extractSQLDebugInfo(rawData, response.headers) as Album;
  }

  async deleteAlbum(id: number): Promise<void> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to delete album');
  }

  async addSongToAlbum(albumId: number, songId: number): Promise<void> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/${albumId}/add-song/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ song_id: songId }),
    });

    if (!response.ok) throw new Error('Failed to add song to album');
  }

  async removeSongFromAlbum(albumId: number, songId: number): Promise<void> {
    const { response } = await this.fetchWithDebug(`${API_BASE_URL}/albums/${albumId}/remove-song/${songId}/`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });

    if (!response.ok) throw new Error('Failed to remove song from album');
  }

  // ==================== GENRE METHODS ====================
  async getGenres(): Promise<Genre[]> {
    const { response, data } = await this.fetchWithDebug(`${API_BASE_URL}/songs/genres/`);
    if (!response.ok) throw new Error('Failed to fetch genres');
    
    if (data) {
      return (data as { results?: Genre[] }).results || (data as Genre[]);
    }
    
    // Fallback: parse response manually if data extraction failed
    const rawData = await response.json();
    const cleanedData = this.extractSQLDebugInfo(rawData, response.headers);
    return (cleanedData as { results?: Genre[] }).results || (cleanedData as Genre[]);
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

  async addSongToPlaylist(playlistId: number, songId: number): Promise<PlaylistSong> {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/add-song/`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ song_id: songId }),
    });

    if (!response.ok) throw new Error('Failed to add song to playlist');
    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/songs/history/`, {
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

  // ==================== USER METHODS ====================
  async getUsers(params?: Record<string, string>): Promise<User[]> {
    let url = `${API_BASE_URL}/users/`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams}`;
    }

    const { response, data } = await this.fetchWithDebug(url);
    if (!response.ok) throw new Error('Failed to fetch users');
    
    if (data) {
      return (data as { results?: User[] }).results || (data as User[]);
    }
    
    // Fallback: parse response manually if data extraction failed
    const rawData = await response.json();
    const cleanedData = this.extractSQLDebugInfo(rawData, response.headers);
    return (cleanedData as { results?: User[] }).results || (cleanedData as User[]);
  }
}

export const apiService = new ApiService();
export type { User, RegisterData, LoginData, AuthTokens };