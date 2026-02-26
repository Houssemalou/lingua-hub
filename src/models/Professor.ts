// ============================================
// Professor Model
// ============================================

export interface ProfessorModel {
  id: string;
  // some backends return the underlying users table foreign key as `userId`
  // (which may differ from the professor table primary key).  we keep it
  // around for debugging/conditional logic when needed.
  userId?: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  languages: string[];
  specialization: string;
  joinedAt: string;
  totalSessions: number;
  rating: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateProfessorDTO {
  name: string;
  email: string;
  password: string;
  bio?: string;
  languages: string[];
  specialization: string;
  createdBy?: string;
}

export interface UpdateProfessorDTO {
  name?: string;
  bio?: string;
  avatar?: string;
  languages?: string[];
  specialization?: string;
}

export interface ProfessorFilters {
  language?: string;
  specialization?: string;
  search?: string;
  minRating?: number;
  sortBy?: 'name' | 'rating' | 'totalSessions' | 'joinedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
