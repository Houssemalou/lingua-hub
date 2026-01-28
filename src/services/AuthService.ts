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
  username: string;
  password: string;
}

export interface StudentRegisterData {
  name: string;
  uniqueCode: string;
  password: string;
  nickname: string;
  bio?: string;
  avatar?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  accessToken: string;
}

export interface ProfessorRegisterData {
  name: string;
  email: string;
  password: string;
  bio?: string;
  avatar?: string;
  languages: string[];
  specialization: string;
  accessToken: string;
}

export interface AdminRegisterData {
  name: string;
  email: string;
  password: string;
  accessToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'professor';
  accessToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        };
        error: string | null;
      }>('/auth/login', credentials);

      if (!response.success) {
        return {
          success: false,
          error: response.message || response.error || 'Login failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeTokens(tokens);
      storeUser(user);
      console.log('Login successful - Tokens stored:', tokens);
      console.log('Login successful - User stored:', user);
      console.log('Login successful - localStorage accessToken:', !!localStorage.getItem(ACCESS_TOKEN_KEY));
      console.log('Login successful - localStorage user:', !!localStorage.getItem(USER_KEY));

      return {
        success: true,
        data: { user, tokens },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  // Register Student
  async registerStudent(data: StudentRegisterData): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        }
      }>('/auth/register/student', data);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Registration failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      // Note: Don't store tokens automatically after registration
      // User should login manually to get tokens

      return {
        success: true,
        data: { user, tokens },
      };
    } catch (error) {
      console.error('Student registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  // Register Professor
  async registerProfessor(data: ProfessorRegisterData): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        }
      }>('/auth/register/professor', data);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Registration failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeTokens(tokens);
      storeUser(user);

      return {
        success: true,
        data: { user, tokens },
      };
    } catch (error) {
      console.error('Professor registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  // Register Admin
  async registerAdmin(data: AdminRegisterData): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        }
      }>('/auth/register/admin', data);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Registration failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeTokens(tokens);
      storeUser(user);

      return {
        success: true,
        data: { user, tokens },
      };
    } catch (error) {
      console.error('Admin registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  // Register (generic - kept for backward compatibility)
  async register(data: RegisterData): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        }
      }>('/auth/register', data);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Registration failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeTokens(tokens);
      storeUser(user);

      return {
        success: true,
        data: { user, tokens },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  // Logout
  logout(): void {
    clearAuth();
  },

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: {
          userId: string;
          email: string;
          name: string;
          role: string;
        }
      }>('/auth/me');

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to get user',
        };
      }

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const storedTokens = getStoredTokens();
      if (!storedTokens.refreshToken) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          refreshToken: string;
          userId: string;
          email: string;
          name: string;
          role: string;
          expiresIn: number;
        }
      }>('/auth/refresh', { refreshToken: storedTokens.refreshToken });

      if (!response.success) {
        clearAuth();
        return {
          success: false,
          error: response.message || 'Token refresh failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeTokens(tokens);
      storeUser(user);

      return {
        success: true,
        data: { user, tokens },
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

  // Generate Access Token
  async generateAccessToken(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN'): Promise<ApiResponse<{ token: string; role: string; expiresAt: string; createdAt: string }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          role: string;
          expiresAt: string;
          createdAt: string;
        };
        error: string | null;
      }>('/auth/generate-access-token', { role });

      if (!response.success) {
        return {
          success: false,
          error: response.message || response.error || 'Failed to generate access token',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Generate access token error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate access token',
      };
    }
  },

  // Get Available Access Tokens
  async getAvailableAccessTokens(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN'): Promise<ApiResponse<Array<{ token: string; role: string; expiresAt: string; createdAt: string }>>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: Array<{
          token: string;
          role: string;
          expiresAt: string;
          createdAt: string;
        }>;
        error: string | null;
      }>(`/auth/access-tokens/${role}`);

      if (!response.success) {
        return {
          success: false,
          error: response.message || response.error || 'Failed to fetch access tokens',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Get access tokens error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch access tokens',
      };
    }
  },
};
