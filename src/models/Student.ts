// ============================================
// Student Model
// ============================================

export interface StudentSkills {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
}

export type StudentType = 'SCOLAIRE' | 'FORMATION' | 'PREPA';

export interface StudentModel {
  id: string;
  name: string;
  email: string;
  avatar: string;
  nickname: string;
  bio: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  studentType?: StudentType;
  joinedAt: string;
  skills: StudentSkills;
  totalSessions: number;
  hoursLearned: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  premiumExpiresAt?: string;
}

export interface CreateStudentDTO {
  name: string;
  email: string;
  password: string;
  nickname: string;
  bio?: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  studentType?: StudentType;
}

export interface UpdateStudentDTO {
  name?: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
  level?: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface StudentFilters {
  level?: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  search?: string;
  sortBy?: 'name' | 'level' | 'joinedAt' | 'totalSessions';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  createdBy?: string;
}
