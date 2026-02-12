// ============================================
// Stats Service
// Fetches dashboard statistics from the backend
// ============================================

import { apiClient } from '@/lib/apiClient';

// ============================================
// Types - Admin Stats
// ============================================

export interface AdminRoomSummary {
  id: string;
  name: string;
  language: string;
  level: string;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  participantCount: number;
  status: string;
  professorName: string | null;
}

export interface AdminStudentSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  level: string;
  totalSessions: number;
  averageSkill: number;
}

export interface LevelDistribution {
  level: string;
  count: number;
}

export interface AdminStats {
  totalStudents: number;
  totalProfessors: number;
  activeRooms: number;
  scheduledSessions: number;
  completedSessions: number;
  totalEvaluations: number;
  averageEvaluationScore: number;
  liveRooms: AdminRoomSummary[];
  upcomingSessions: AdminRoomSummary[];
  recentStudents: AdminStudentSummary[];
  levelDistribution: LevelDistribution[];
}

// ============================================
// Types - Professor Stats
// ============================================

export interface ProfessorRoomSummary {
  id: string;
  name: string;
  language: string;
  level: string;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  participantCount: number;
  status: string;
}

export interface ProfessorStudentSummary {
  id: string;
  name: string;
  avatar: string | null;
  level: string;
  nickname: string;
}

export interface ProfessorStats {
  totalStudents: number;
  upcomingSessions: number;
  completedSessions: number;
  rating: number;
  totalEvaluations: number;
  averageEvaluationScore: number;
  liveRooms: ProfessorRoomSummary[];
  upcomingSessionsList: ProfessorRoomSummary[];
  myStudents: ProfessorStudentSummary[];
}

// ============================================
// Types - Student Stats
// ============================================

export interface StudentRoomSummary {
  id: string;
  name: string;
  language: string;
  level: string;
  objective: string;
  scheduledAt: string;
  duration: number;
  status: string;
  professorName: string | null;
}

export interface StudentEvaluationSummary {
  id: string;
  language: string;
  overallScore: number;
  assignedLevel: string | null;
  professorName: string;
  createdAt: string;
}

export interface StudentSkillsStats {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
}

export interface StudentStats {
  level: string;
  hoursLearned: number;
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  overallProgress: number;
  skills: StudentSkillsStats;
  liveRooms: StudentRoomSummary[];
  upcomingSessionsList: StudentRoomSummary[];
  recentEvaluations: StudentEvaluationSummary[];
}

// ============================================
// Service Methods
// ============================================

export const StatsService = {
  async getAdminStats(): Promise<AdminStats> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: AdminStats;
      }>('/stats/admin');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  },

  async getProfessorStats(): Promise<ProfessorStats> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: ProfessorStats;
      }>('/stats/professor');
      return response.data;
    } catch (error) {
      console.error('Error fetching professor stats:', error);
      throw error;
    }
  },

  async getStudentStats(): Promise<StudentStats> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: StudentStats;
      }>('/stats/student');
      return response.data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  },
};
