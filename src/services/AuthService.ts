// ============================================
// Authentication Service
// Integrated with backend Spring Boot API
// ============================================

import { ApiResponse } from '@/models';
import { apiClient, setAuthTokens as setClientTokens } from '@/lib/apiClient';

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student' | 'professor';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'professor';
  accessToken?: string; // For registration validation
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

// ============================================
// Helper Functions
// ============================================

export const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
};

export const getStoredUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const storeTokens = (tokens: AuthTokens) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  setClientTokens(tokens.accessToken, tokens.refreshToken);
};

const storeUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setClientTokens('', '');
};

// ============================================
// Service Methods
// ============================================

export const AuthService = {
  // Login
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      storeTokens(response.tokens);
      storeUser(response.user);
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // try {
    //   const response = await fetch(`${AUTH_ENDPOINT}/login`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(credentials),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     return { success: false, error: error.message || 'Login failed' };
    //   }
    //
    //   const data = await response.json();
    //   storeTokens(data.tokens);
    //   storeUser(data.user);
    //   return { success: true, data };
    // } catch (error) {
    //   console.error('Login error:', error);
    //   return { success: false, error: 'Network error' };
    // }

    // Mock implementation
    const mockUsers = [
      { id: 'admin-1', email: 'admin@example.com', password: 'admin123', name: 'Admin', role: 'admin' as const },
      { id: 'prof-1', email: 'prof@example.com', password: 'prof123', name: 'Professor', role: 'professor' as const },
      { id: 'student-1', email: 'student@example.com', password: 'student123', name: 'Student', role: 'student' as const },
    ];

    const user = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);
    
    if (user) {
      const authUser: AuthUser = { id: user.id, email: user.email, name: user.name, role: user.role };
      const tokens: AuthTokens = {
        accessToken: `mock-token-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
        expiresIn: 3600,
      };
      
      storeTokens(tokens);
      storeUser(authUser);
      
      return { success: true, data: { user: authUser, tokens } };
    }
    
    return { success: false, error: 'Invalid email or password' };
  },

  // Register
  async register(data: RegisterData): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      storeTokens(response.tokens);
      storeUser(response.user);
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // try {
    //   const response = await fetch(`${AUTH_ENDPOINT}/register`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     return { success: false, error: error.message || 'Registration failed' };
    //   }
    //
    //   const result = await response.json();
    //   storeTokens(result.tokens);
    //   storeUser(result.user);
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Registration error:', error);
    //   return { success: false, error: 'Network error' };
    // }

    // Mock implementation
    // const authUser: AuthUser = {
    //   id: `user-${Date.now()}`,
    //   email: data.email,
    //   name: data.name,
    //   role: data.role,
    // };
    // 
    // const tokens: AuthTokens = {
    //   accessToken: `mock-token-${Date.now()}`,
    //   refreshToken: `mock-refresh-${Date.now()}`,
    //   expiresIn: 3600,
    // };
    // 
    // storeTokens(tokens);
    // storeUser(authUser);
    // 
    // return { success: true, data: { user: authUser, tokens } };
  },

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    clearAuth();
    return { success: true };
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    try {
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
      
      storeTokens(response);
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const { accessToken } = getStoredTokens();
    //   
    //   if (!accessToken) {
    //     return { success: false, error: 'Not authenticated' };
    //   }
    //
    //   const response = await fetch(`${AUTH_ENDPOINT}/me`, {
    //     method: 'GET',
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //     },
    //   });
    //
    //   if (!response.ok) {
    //     if (response.status === 401) {
    //       // Try to refresh token
    //       const refreshResult = await this.refreshToken();
    //       if (refreshResult.success) {
    //         return this.getCurrentUser();
    //       }
    //     }
    //     return { success: false, error: 'Failed to get user' };
    //   }
    //
    //   const user = await response.json();
    //   storeUser(user);
    //   return { success: true, data: user };
    // } catch (error) {
    //   console.error('Get user error:', error);
    //   return { success: false, error: 'Network error' };
    // }

    // Mock implementation
    const user = getStoredUser();
    if (user) {
      return { success: true, data: user };
    }
    return { success: false, error: 'Not authenticated' };
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${AUTH_ENDPOINT}/password`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getStoredTokens().accessToken}`,
    //     },
    //     body: JSON.stringify({ currentPassword, newPassword }),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     return { success: false, error: error.message || 'Password update failed' };
    //   }
    //
    //   return { success: true };
    // } catch (error) {
    //   console.error('Password update error:', error);
    //   return { success: false, error: 'Network error' };
    // }

    // Mock implementation
    return { success: true, message: 'Password updated successfully' };
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${AUTH_ENDPOINT}/forgot-password`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ email }),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     return { success: false, error: error.message || 'Request failed' };
    //   }
    //
    //   return { success: true, message: 'Reset email sent' };
    // } catch (error) {
    //   console.error('Password reset request error:', error);
    //   return { success: false, error: 'Network error' };
    // }

    // Mock implementation
    return { success: true, message: 'Password reset email sent' };
  },

  // Verify access token validity
  isAuthenticated(): boolean {
    const { accessToken } = getStoredTokens();
    return !!accessToken;
  },

  // Get auth header
  getAuthHeader(): { Authorization?: string } {
    const { accessToken } = getStoredTokens();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  },
};

export default AuthService;
