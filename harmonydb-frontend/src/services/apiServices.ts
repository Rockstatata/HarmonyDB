

const API_BASE_URL = '/api';  

interface AuthTokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'listener' | 'artist';
  email_verified: boolean;
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
}

export const apiService = new ApiService();
export type { User, RegisterData, LoginData, AuthTokens };