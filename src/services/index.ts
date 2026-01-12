// ============================================
// Services Index - Export all services
// ============================================

export { StudentService } from './StudentService';
export { ProfessorService } from './ProfessorService';
export { RoomService } from './RoomService';
export { QuizService } from './QuizService';
export { EvaluationService } from './EvaluationService';
export { ModerationService } from './ModerationService';
export { ChatService } from './ChatService';
export { AuthService, getStoredTokens, getStoredUser } from './AuthService';

// Re-export types from AuthService
export type { AuthUser, LoginCredentials, RegisterData, AuthTokens } from './AuthService';

// ============================================
// API Configuration (à décommenter pour le backend)
// ============================================
// export const API_CONFIG = {
//   baseUrl: import.meta.env.VITE_API_URL || '/api',
//   wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.example.com/ws',
//   timeout: 30000,
// };

// ============================================
// HTTP Client Configuration (à implémenter avec le backend)
// ============================================
// import axios from 'axios';
// 
// export const apiClient = axios.create({
//   baseURL: API_CONFIG.baseUrl,
//   timeout: API_CONFIG.timeout,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
// 
// // Request interceptor for auth token
// apiClient.interceptors.request.use(
//   (config) => {
//     const { accessToken } = getStoredTokens();
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
// 
// // Response interceptor for token refresh
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       
//       const refreshResult = await AuthService.refreshToken();
//       if (refreshResult.success) {
//         originalRequest.headers.Authorization = `Bearer ${refreshResult.data.accessToken}`;
//         return apiClient(originalRequest);
//       }
//     }
//     
//     return Promise.reject(error);
//   }
// );
