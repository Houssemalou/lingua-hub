// ============================================
// Evaluation Service
// Ready for backend integration
// ============================================

import { 
  EvaluationModel, 
  CreateEvaluationDTO, 
  UpdateEvaluationDTO, 
  EvaluationFilters,
  calculateOverallScore,
  PaginatedResponse,
  ApiResponse 
} from '@/models';
import { apiClient } from '@/lib/apiClient';

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const EVALUATIONS_ENDPOINT = `${API_BASE_URL}/evaluations`;

// Mock storage for evaluations
const mockEvaluations: EvaluationModel[] = [];

// ============================================
// Service Methods
// ============================================

export const EvaluationService = {
  // Get all evaluations with optional filters
  async getAll(filters?: EvaluationFilters): Promise<PaginatedResponse<EvaluationModel>> {
    try {
      return await apiClient.get<PaginatedResponse<EvaluationModel>>('/evaluations', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    let filtered = [...mockEvaluations];

    if (filters?.sessionId) {
      filtered = filtered.filter(e => e.sessionId === filters.sessionId);
    }
    if (filters?.studentId) {
      filtered = filtered.filter(e => e.studentId === filters.studentId);
    }
    if (filters?.professorId) {
      filtered = filtered.filter(e => e.professorId === filters.professorId);
    }
    if (filters?.minScore) {
      filtered = filtered.filter(e => e.overallScore >= filters.minScore!);
    }

    return {
      data: filtered,
      total: filtered.length,
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: Math.ceil(filtered.length / (filters?.limit || 10)),
    };
  },

  // Get evaluation by ID
  async getById(id: string): Promise<ApiResponse<EvaluationModel>> {
    try {
      const data = await apiClient.get<EvaluationModel>(`/evaluations/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching evaluation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const evaluation = mockEvaluations.find(e => e.id === id);
    if (evaluation) {
      return { success: true, data: evaluation };
    }
    return { success: false, error: 'Evaluation not found' };
  },

  // Get evaluations for a specific session
  async getBySession(sessionId: string): Promise<ApiResponse<EvaluationModel[]>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${EVALUATIONS_ENDPOINT}/session/${sessionId}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to fetch evaluations');
    //   const data = await response.json();
    //   return { success: true, data };
    // } catch (error) {
    //   console.error('Error fetching evaluations:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const evaluations = mockEvaluations.filter(e => e.sessionId === sessionId);
    return { success: true, data: evaluations };
  },

  // Get evaluations for a specific student
  async getByStudent(studentId: string): Promise<ApiResponse<EvaluationModel[]>> {
    try {
      const data = await apiClient.get<EvaluationModel[]>(`/evaluations/student/${studentId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const evaluations = mockEvaluations.filter(e => e.studentId === studentId);
    return { success: true, data: evaluations };
  },

  // Create new evaluation
  async create(data: CreateEvaluationDTO, professorId: string): Promise<ApiResponse<EvaluationModel>> {
    try {
      const result = await apiClient.post<EvaluationModel>('/evaluations', { ...data, professorId });
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating evaluation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const newEvaluation: EvaluationModel = {
      id: `eval-${Date.now()}`,
      sessionId: data.sessionId,
      studentId: data.studentId,
      professorId,
      criteria: data.criteria,
      overallScore: calculateOverallScore(data.criteria),
      feedback: data.feedback,
      strengths: data.strengths || [],
      areasToImprove: data.areasToImprove || [],
      createdAt: new Date().toISOString(),
    };
    
    mockEvaluations.push(newEvaluation);
    return { success: true, data: newEvaluation };
  },

  // Update evaluation
  async update(id: string, data: UpdateEvaluationDTO): Promise<ApiResponse<EvaluationModel>> {
    try {
      const result = await apiClient.put<EvaluationModel>(`/evaluations/${id}`, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating evaluation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const index = mockEvaluations.findIndex(e => e.id === id);
    if (index !== -1) {
      const existing = mockEvaluations[index];
      const updatedCriteria = data.criteria 
        ? { ...existing.criteria, ...data.criteria }
        : existing.criteria;
      
      const updated: EvaluationModel = {
        ...existing,
        ...data,
        criteria: updatedCriteria,
        overallScore: calculateOverallScore(updatedCriteria),
        updatedAt: new Date().toISOString(),
      };
      
      mockEvaluations[index] = updated;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Evaluation not found' };
  },

  // Delete evaluation
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/evaluations/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    // const index = mockEvaluations.findIndex(e => e.id === id);
    // if (index !== -1) {
    //   mockEvaluations.splice(index, 1);
    //   return { success: true };
    // }
    // return { success: false, error: 'Evaluation not found' };
  },

  // Get student statistics
  async getStudentStatistics(studentId: string): Promise<ApiResponse<{
    averageScore: number;
    evaluationCount: number;
    skillsTrend: Record<string, number[]>;
    recentEvaluations: EvaluationModel[];
  }>> {
    try {
      const data = await apiClient.get<{
        averageScore: number;
        evaluationCount: number;
        skillsTrend: Record<string, number[]>;
        recentEvaluations: EvaluationModel[];
      }>(`/evaluations/student/${studentId}/statistics`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // const studentEvals = mockEvaluations.filter(e => e.studentId === studentId);
    // const averageScore = studentEvals.length > 0
    //   ? studentEvals.reduce((sum, e) => sum + e.overallScore, 0) / studentEvals.length
    //   : 0;
    //
    // return {
    //   success: true,
    //   data: {
    //     averageScore: Math.round(averageScore),
    //     evaluationCount: studentEvals.length,
    //     skillsTrend: {
    //       pronunciation: studentEvals.map(e => e.criteria.pronunciation),
    //       grammar: studentEvals.map(e => e.criteria.grammar),
    //       vocabulary: studentEvals.map(e => e.criteria.vocabulary),
    //       fluency: studentEvals.map(e => e.criteria.fluency),
    //     },
    //     recentEvaluations: studentEvals.slice(-5),
    //   },
    // };
  },
};

export default EvaluationService;
