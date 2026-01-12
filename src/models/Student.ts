// ============================================
// Student Model
// ============================================

export interface StudentSkills {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
}

export interface StudentModel {
  id: string;
  name: string;
  email: string;
  avatar: string;
  nickname: string;
  bio: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  joinedAt: string;
  skills: StudentSkills;
  totalSessions: number;
  hoursLearned: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentDTO {
  name: string;
  email: string;
  password: string;
  nickname: string;
  bio?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface UpdateStudentDTO {
  name?: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface StudentFilters {
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  search?: string;
  sortBy?: 'name' | 'level' | 'joinedAt' | 'totalSessions';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
