// ============================================
// Quiz Service
// Ready for backend integration
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
import { mockQuizzes, mockQuizResults } from '@/data/quizzes';

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const QUIZZES_ENDPOINT = `${API_BASE_URL}/quizzes`;

// ============================================
// Service Methods
// ============================================

export const QuizService = {
  // Get all quizzes with optional filters
  async getAll(filters?: QuizFilters): Promise<PaginatedResponse<QuizModel>> {
    try {
      return await apiClient.get<PaginatedResponse<QuizModel>>('/quizzes', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    let filtered = mockQuizzes.map(q => ({
      ...q,
      createdBy: 'prof-1',
      createdAt: new Date().toISOString(),
      isPublished: true,
    })) as QuizModel[];

    if (filters?.sessionId) {
      filtered = filtered.filter(q => q.sessionId === filters.sessionId);
    }
    if (filters?.language) {
      filtered = filtered.filter(q => q.language === filters.language);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(search) || 
        q.description.toLowerCase().includes(search)
      );
    }

    return {
      data: filtered,
      total: filtered.length,
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: Math.ceil(filtered.length / (filters?.limit || 10)),
    };
  },

  // Get quiz by ID
  async getById(id: string): Promise<ApiResponse<QuizModel>> {
    try {
      const data = await apiClient.get<QuizModel>(`/quizzes/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const quiz = mockQuizzes.find(q => q.id === id);
    if (quiz) {
      return { 
        success: true, 
        data: {
          ...quiz,
          createdBy: 'prof-1',
          createdAt: new Date().toISOString(),
          isPublished: true,
        } as QuizModel 
      };
    }
    return { success: false, error: 'Quiz not found' };
  },

  // Create new quiz
  async create(data: CreateQuizDTO): Promise<ApiResponse<QuizModel>> {
    try {
      const result = await apiClient.post<QuizModel>('/quizzes', data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const newQuiz: QuizModel = {
      id: `quiz-${Date.now()}`,
      title: data.title,
      description: data.description,
      sessionId: data.sessionId,
      sessionName: 'Session',
      language: 'English',
      questions: data.questions.map((q, i) => ({ ...q, id: `q-${i}` })),
      createdBy: 'prof-1',
      createdAt: new Date().toISOString(),
      isPublished: false,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
    };
    return { success: true, data: newQuiz };
  },

  // Update quiz
  async update(id: string, data: UpdateQuizDTO): Promise<ApiResponse<QuizModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${QUIZZES_ENDPOINT}/${id}`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to update quiz');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error updating quiz:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const quiz = mockQuizzes.find(q => q.id === id);
    if (quiz) {
      const updated = { 
        ...quiz, 
        ...data,
        createdBy: 'prof-1',
        createdAt: new Date().toISOString(),
        isPublished: data.isPublished ?? true,
      } as QuizModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Quiz not found' };
  },

  // Delete quiz
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/quizzes/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const index = mockQuizzes.findIndex(q => q.id === id);
    if (index !== -1) {
      return { success: true };
    }
    return { success: false, error: 'Quiz not found' };
  },

  // Submit quiz answers
  async submit(data: SubmitQuizDTO): Promise<ApiResponse<QuizResultModel>> {
    try {
      const result = await apiClient.post<QuizResultModel>(`/quizzes/${data.quizId}/submit`, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const quiz = mockQuizzes.find(q => q.id === data.quizId);
    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    let correctCount = 0;
    const answers = data.answers.map(a => {
      const question = quiz.questions.find(q => q.id === a.questionId);
      const isCorrect = question?.correctAnswer === a.selectedAnswer;
      if (isCorrect) correctCount++;
      return { ...a, isCorrect };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const result: QuizResultModel = {
      id: `result-${Date.now()}`,
      quizId: data.quizId,
      studentId: '1',
      studentName: 'Student',
      studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student',
      sessionName: quiz.sessionName,
      language: quiz.language,
      score,
      totalQuestions: quiz.questions.length,
      completedAt: new Date().toISOString(),
      passed: score >= 60,
      answers,
    };

    return { success: true, data: result };
  },

  // Get quiz results
  async getResults(filters?: { 
    quizId?: string; 
    studentId?: string; 
    page?: number; 
    limit?: number 
  }): Promise<PaginatedResponse<QuizResultModel>> {
    // Note: If quizId is provided and pagination not needed, use getQuizResults(quizId) instead
    try {
      // Build params from filters
      const params: Record<string, unknown> = {};
      if (filters?.quizId) params.quizId = filters.quizId;
      if (filters?.studentId) params.studentId = filters.studentId;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;

      return await apiClient.get<PaginatedResponse<QuizResultModel>>('/quizzes/results', params);
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    // let filtered = mockQuizResults.map(r => ({ 
    //   ...r, 
    //   answers: [] 
    // })) as QuizResultModel[];
    //
    // if (filters?.quizId) {
    //   filtered = filtered.filter(r => r.quizId === filters.quizId);
    // }
    // if (filters?.studentId) {
    //   filtered = filtered.filter(r => r.studentId === filters.studentId);
    // }
    //
    // return {
    //   data: filtered,
    //   total: filtered.length,
    //   page: filters?.page || 1,
    //   limit: filters?.limit || 10,
    //   totalPages: Math.ceil(filtered.length / (filters?.limit || 10)),
    // };
  },

  // Publish quiz
  async publish(id: string): Promise<ApiResponse<QuizModel>> {
    try {
      const result = await apiClient.post<QuizModel>(`/quizzes/${id}/publish`);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error publishing quiz:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // return this.update(id, { isPublished: true });
  },

  // Get quiz results for a specific quiz (non-paginated)
  async getQuizResults(quizId: string): Promise<ApiResponse<QuizResultModel[]>> {
    try {
      const data = await apiClient.get<QuizResultModel[]>(`/quizzes/${quizId}/results`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // const filtered = mockQuizResults.filter(r => r.quizId === quizId);
    // return { success: true, data: filtered };
  },

  // Get all quiz results for a specific student
  async getStudentResults(studentId: string): Promise<ApiResponse<QuizResultModel[]>> {
    try {
      const data = await apiClient.get<QuizResultModel[]>(`/quizzes/student/${studentId}/results`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching student quiz results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // const filtered = mockQuizResults.filter(r => r.studentId === studentId);
    // return { success: true, data: filtered };
  },
};

export default QuizService;
