// Authentication service for user login, registration, and token management

const API_URL = import.meta.env.VITE_API_URL || 'https://mens-hub-backend.onrender.com/api';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  username: string;
  date_joined: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Remove token
  clearToken(): void {
    localStorage.removeItem('authToken');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Registration failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  // Login user with email/password
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Login failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  // Login with Google OAuth
  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Google login failed: ${response.status}`);
    }

    const result = await response.json();
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  // Logout user (clear token)
  logout(): void {
    this.clearToken();
    localStorage.removeItem('user');
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/auth/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  }
}

export const authService = new AuthService();
