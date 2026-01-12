// ============================================
// Models Index - Export all models
// ============================================

export * from './Student';
export * from './Professor';
export * from './Room';
export * from './Session';
export * from './Quiz';
export * from './Evaluation';
export * from './ChatMessage';

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type SortOrder = 'asc' | 'desc';
