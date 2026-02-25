// ============================================
// API Client Configuration
// Centralized HTTP client for all backend requests
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://91.134.137.202/api';

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
}

// ============================================
// Token Management
// ============================================

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('auth_refresh_token');
};

const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('auth_access_token', accessToken);
  localStorage.setItem('auth_refresh_token', refreshToken);
};

// ============================================
// Request Interceptor
// ============================================

const createHeaders = (customHeaders?: Record<string, string>): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// ============================================
// Response Handler
// ============================================

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw new Error('RETRY_REQUEST'); // Signal to retry
    }

    // Parse error message
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Use default error message
    }

    throw new Error(errorMessage);
  }

  // Parse successful response
  const data = await response.json();
  
  // For ApiResponse wrapper, return the full object so services can check success/error
  if (data.success !== undefined && data.message !== undefined) {
    return data as T;
  }
  
  // For other responses, return data directly
  return data;
};

// ============================================
// Token Refresh
// ============================================

const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setAuthTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Main API Client Interface
// ============================================

interface ApiClient {
  request<T = unknown>(endpoint: string, config?: ApiRequestConfig): Promise<T>;
  get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  post<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T>;
  put<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T>;
  delete<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  patch<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T>;
}

// ============================================
// Main API Client
// ============================================

export const apiClient: ApiClient = {
  async request<T = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { method = 'GET', headers, body, params } = config;

    // Build URL with query params
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Make request
    try {
      const response = await fetch(url, {
        method,
        headers: createHeaders(headers),
        body: body ? JSON.stringify(body) : undefined,
      });

      return await handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'RETRY_REQUEST') {
        // Retry request with new token
        const response = await fetch(url, {
          method,
          headers: createHeaders(headers),
          body: body ? JSON.stringify(body) : undefined,
        });
        return await handleResponse<T>(response);
      }
      throw error;
    }
  },

  // Convenience methods
  get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'GET', params });
  },

  post<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'POST', body, params });
  },

  put<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'PUT', body, params });
  },

  delete<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'DELETE', params });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    return apiClient.request<T>(endpoint, { method: 'PATCH', body, params });
  },
};

// ============================================
// Export utilities
// ============================================

export { API_BASE_URL, getAuthToken, getRefreshToken, setAuthTokens };
