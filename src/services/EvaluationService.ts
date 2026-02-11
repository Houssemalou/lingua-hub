// ============================================
// Evaluation Service
// Gestion des évaluations des étudiants par les professeurs
// ============================================

import { ApiResponse } from '@/models';
import { apiClient } from '@/lib/apiClient';

// ============================================
// Types
// ============================================

export interface EvaluationData {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  professorId: string;
  professorName: string;
  language: string;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  overallScore: number;
  assignedLevel: string | null;
  previousLevel: string | null;
  feedback: string | null;
  strengths: string[];
  areasToImprove: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateEvaluationData {
  studentId: string;
  language: string;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  assignedLevel?: string;
  feedback?: string;
  strengths?: string[];
  areasToImprove?: string[];
}

export interface UpdateStudentLevelData {
  studentId: string;
  newLevel: string;
  reason?: string;
}

export interface StudentData {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  nickname: string;
  bio: string | null;
  level: string;
  joinedAt: string | null;
  totalSessions: number;
  hoursLearned: number;
  skills: {
    pronunciation: number;
    grammar: number;
    vocabulary: number;
    fluency: number;
  } | null;
  createdAt: string;
  updatedAt: string | null;
}

// ============================================
// Service Methods
// ============================================

export const EvaluationService = {
  // Professor: Create an evaluation
  async create(data: CreateEvaluationData): Promise<ApiResponse<EvaluationData>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: EvaluationData;
      }>('/evaluations', data);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create evaluation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create evaluation' };
    }
  },

  // Professor: Get all evaluations I created
  async getMyCreatedEvaluations(): Promise<ApiResponse<EvaluationData[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: EvaluationData[];
      }>('/evaluations/my-evaluations');

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch evaluations error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch evaluations' };
    }
  },

  // Professor: Get all students
  async getAllStudents(): Promise<ApiResponse<StudentData[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: StudentData[];
      }>('/evaluations/students');

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch students error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch students' };
    }
  },

  // Professor: Update student level
  async updateStudentLevel(data: UpdateStudentLevelData): Promise<ApiResponse<StudentData>> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        message: string;
        data: StudentData;
      }>('/evaluations/update-level', data);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update level error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update student level' };
    }
  },

  // Student: Get my evaluations
  async getMyEvaluations(): Promise<ApiResponse<EvaluationData[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: EvaluationData[];
      }>('/evaluations/my-results');

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch my evaluations error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch my evaluations' };
    }
  },

  // Student: Get my evaluations by language
  async getMyEvaluationsByLanguage(language: string): Promise<ApiResponse<EvaluationData[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: EvaluationData[];
      }>(`/evaluations/my-results/${language}`);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch evaluations by language error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch evaluations' };
    }
  },
};

export default EvaluationService;

