// ============================================
// Authentication Service
// Integrated with backend Spring Boot API
// Tokens are now stored in HttpOnly cookies (not localStorage)
// ============================================

import { ApiResponse } from '@/models';
import { apiClient } from '@/lib/apiClient';

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
  // Système éducatif tunisien : primaire (1-6), collège (7-9), secondaire (10-13/Bac), prépa (PREPA1-2), formation
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2';
  studentType?: 'SCOLAIRE' | 'FORMATION' | 'PREPA';
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
  professorType: 'PROF_PRIMAIRE' | 'PROF_BASE' | 'PROF_SECONDAIRE' | 'FORMATEUR' | 'PROF_PREPA';
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

// Storage key for user profile (non-sensitive data, OK in localStorage)
const USER_KEY = 'auth_user';

// ============================================
// Helper Functions
// ============================================

export const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  // Tokens are now in HttpOnly cookies — not accessible from JS
  return {
    accessToken: null,
    refreshToken: null,
  };
};

export const getStoredUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

const storeUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  const keysToPreserve = [
    'temp_student_avatar', 'temp_student_bio', 'temp_student_nickname',
    'temp_professor_avatar', 'temp_professor_bio',
  ];
  const preserved: Record<string, string> = {};
  keysToPreserve.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) preserved[key] = val;
  });
  localStorage.clear();
  Object.entries(preserved).forEach(([key, val]) => localStorage.setItem(key, val));
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

      // Tokens are set automatically via HttpOnly Set-Cookie headers from the backend
      const tokens: AuthTokens = {
        accessToken: '', // Token is in HttpOnly cookie, not accessible from JS
        refreshToken: '',
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      storeUser(user);
      console.log('Login successful - User stored:', user);
      console.log('Login successful - Tokens in HttpOnly cookies (not accessible from JS)');

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
        accessToken: '',
        refreshToken: '',
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

  // Register Professor (email verification required - no tokens stored)
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
        accessToken: '',
        refreshToken: '',
        expiresIn: response.data?.expiresIn || 0,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      // Don't store tokens - professor needs to verify email first

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
        accessToken: '',
        refreshToken: '',
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      // Tokens are managed via HttpOnly cookies from the backend
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
        accessToken: '',
        refreshToken: '',
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      // Tokens are managed via HttpOnly cookies from the backend
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

  // Logout - call backend to clear HttpOnly cookies, then clear local state
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint which clears HttpOnly cookies
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    // Always clear local state regardless of API call result
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

  // Refresh token - the refresh token is sent via HttpOnly cookie automatically
  async refreshToken(): Promise<ApiResponse<{ user: AuthUser; tokens: AuthTokens }>> {
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
      }>('/auth/refresh', {});

      if (!response.success) {
        clearAuth();
        return {
          success: false,
          error: response.message || 'Token refresh failed',
        };
      }

      const tokens: AuthTokens = {
        accessToken: '',
        refreshToken: '',
        expiresIn: response.data.expiresIn,
      };

      const user: AuthUser = {
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role.toLowerCase() as 'admin' | 'student' | 'professor',
      };

      // New tokens are set automatically via HttpOnly cookies
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

  // Generate Access Tokens (bulk)
  async generateAccessToken(role: 'STUDENT' | 'PROFESSOR' | 'ADMIN', count: number = 1): Promise<ApiResponse<Array<{ token: string; role: string; expiresAt: string; createdAt: string }>>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: Array<{
          token: string;
          role: string;
          expiresAt: string;
          createdAt: string;
        }>;
        error: string | null;
      }>('/auth/generate-access-token', { role, count });

      if (!response.success) {
        return {
          success: false,
          error: response.message || response.error || 'Failed to generate access tokens',
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
        error: error instanceof Error ? error.message : 'Failed to generate access tokens',
      };
    }
  },

  // Verify Email
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
      }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Email verification failed',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email verification failed',
      };
    }
  },

  // Resend Verification Email
  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>(`/auth/resend-verification?email=${encodeURIComponent(email)}`, {});

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to resend verification email',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification email',
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

  // ===== Premium Token Methods =====

  // Generate Premium Tokens (admin, bulk)
  async generatePremiumToken(count: number = 1): Promise<ApiResponse<Array<{ token: string; role: string; expiresAt: string; createdAt: string }>>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: Array<{ token: string; role: string; expiresAt: string; createdAt: string }>;
        error: string | null;
      }>('/auth/generate-premium-token', { count });

      if (!response.success) {
        return { success: false, error: response.message || response.error || 'Failed to generate premium tokens' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Generate premium token error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate premium tokens' };
    }
  },

  // Get Available Premium Tokens (admin)
  async getAvailablePremiumTokens(): Promise<ApiResponse<Array<{ token: string; role: string; expiresAt: string; createdAt: string }>>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: Array<{ token: string; role: string; expiresAt: string; createdAt: string }>;
        error: string | null;
      }>('/auth/premium-tokens');

      if (!response.success) {
        return { success: false, error: response.message || response.error || 'Failed to fetch premium tokens' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get premium tokens error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch premium tokens' };
    }
  },

  // Activate Premium Token (student)
  async activatePremiumToken(token: string): Promise<ApiResponse<{ premiumExpiresAt: string }>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: { premiumExpiresAt: string };
        error: string | null;
      }>('/auth/activate-premium', { token });

      if (!response.success) {
        return { success: false, error: response.message || response.error || 'Failed to activate premium token' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Activate premium token error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to activate premium token' };
    }
  },

  // Get Premium Status (student)
  async getPremiumStatus(): Promise<ApiResponse<{ isPremium: boolean }>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { isPremium: boolean };
        error: string | null;
      }>('/auth/premium-status');

      if (!response.success) {
        return { success: false, error: response.message || response.error || 'Failed to check premium status' };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get premium status error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to check premium status' };
    }
  },
};
