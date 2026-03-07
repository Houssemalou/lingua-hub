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
// Tokens are now stored in HttpOnly cookies managed by the backend.
// These functions are kept for backward compatibility but no longer
// read/write tokens from localStorage.
// ============================================

const getAuthToken = (): string | null => {
  // Token is now in HttpOnly cookie — not accessible from JS (by design)
  return null;
};

const getRefreshToken = (): string | null => {
  // Refresh token is now in HttpOnly cookie — not accessible from JS (by design)
  return null;
};

const setAuthTokens = (_accessToken: string, _refreshToken: string) => {
  // No-op: tokens are set by the backend via Set-Cookie headers
  // This function is kept for backward compatibility
};

// ============================================
// Request Interceptor
// ============================================

const createHeaders = (customHeaders?: Record<string, string>): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // No Authorization header needed — HttpOnly cookie is sent automatically
  // via credentials: 'include'

  return headers;
};

// ============================================
// Response Handler
// ============================================

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh token via cookie-based refresh endpoint
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        // Redirect to login
        window.location.href = '/auth';
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
  try {
    // The refresh token is sent automatically via HttpOnly cookie
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send HttpOnly cookies
      body: JSON.stringify({}),
    });

    if (!response.ok) return false;

    // New tokens are set automatically via Set-Cookie headers in the response
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

    // Make request with credentials: 'include' to send HttpOnly cookies
    try {
      const response = await fetch(url, {
        method,
        headers: createHeaders(headers),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Send HttpOnly cookies automatically
      });

      return await handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'RETRY_REQUEST') {
        // Retry request with new token (set via cookie from refresh)
        const response = await fetch(url, {
          method,
          headers: createHeaders(headers),
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
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
