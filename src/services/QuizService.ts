// ============================================
// Quiz Service
// Backend integration
// ============================================

import {
  QuizModel,
  CreateQuizDTO,
  UpdateQuizDTO,
  QuizFilters,
  QuizResultModel,
  SubmitQuizDTO,
  PaginatedResponse,
  ApiResponse
} from '@/models';
import { apiClient } from '@/lib/apiClient';

// ============================================
// Service Methods
// ============================================

export const QuizService = {
  // Get all quizzes with optional filters
  async getAll(filters?: QuizFilters): Promise<PaginatedResponse<QuizModel>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<QuizModel>>>('/quizzes', filters as Record<string, unknown>);
      if (response.data) return response.data;
      throw new Error('Failed to fetch quizzes');
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Get quiz by ID
  async getById(id: string): Promise<ApiResponse<QuizModel>> {
    try {
      return await apiClient.get<ApiResponse<QuizModel>>(`/quizzes/${id}`);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Create new quiz
  async create(data: CreateQuizDTO): Promise<ApiResponse<QuizModel>> {
    try {
      return await apiClient.post<ApiResponse<QuizModel>>('/quizzes', data);
    } catch (error) {
      console.error('Error creating quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update quiz
  async update(id: string, data: UpdateQuizDTO): Promise<ApiResponse<QuizModel>> {
    try {
      return await apiClient.put<ApiResponse<QuizModel>>(`/quizzes/${id}`, data);
    } catch (error) {
      console.error('Error updating quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete quiz
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<ApiResponse<void>>(`/quizzes/${id}`);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Submit quiz answers
  async submit(data: SubmitQuizDTO): Promise<ApiResponse<QuizResultModel>> {
    try {
      return await apiClient.post<ApiResponse<QuizResultModel>>(`/quizzes/${data.quizId}/submit`, data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Publish quiz
  async publish(id: string): Promise<ApiResponse<QuizModel>> {
    try {
      return await apiClient.post<ApiResponse<QuizModel>>(`/quizzes/${id}/publish`);
    } catch (error) {
      console.error('Error publishing quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get quiz results for a specific quiz
  async getQuizResults(quizId: string): Promise<ApiResponse<QuizResultModel[]>> {
    try {
      return await apiClient.get<ApiResponse<QuizResultModel[]>>(`/quizzes/${quizId}/results`);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get all quiz results for a specific student
  async getStudentResults(studentId: string): Promise<ApiResponse<QuizResultModel[]>> {
    try {
      return await apiClient.get<ApiResponse<QuizResultModel[]>>(`/quizzes/student/${studentId}/results`);
    } catch (error) {
      console.error('Error fetching student quiz results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export default QuizService;
