// ============================================
// Professor Service
// Ready for backend integration
// ============================================

import { 
  ProfessorModel, 
  CreateProfessorDTO, 
  UpdateProfessorDTO, 
  ProfessorFilters,
  PaginatedResponse,
  ApiResponse,
  SessionModel
} from '@/models';
import { apiClient } from '@/lib/apiClient';
import { mockProfessors } from '@/data/mockData';

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const PROFESSORS_ENDPOINT = `${API_BASE_URL}/professors`;

// ============================================
// Service Methods
// ============================================

export const ProfessorService = {
  // Get all professors (no backend filtering, filtering done on frontend when desired)
  async getAll(filters?: ProfessorFilters): Promise<PaginatedResponse<ProfessorModel>> {
    try {
      return await apiClient.get<PaginatedResponse<ProfessorModel>>('/professors', filters as Record<string, unknown>);
    } catch (error) {
      console.warn('Error fetching professors, falling back to mock data:', error);

      // Mock Implementation (fallback)
      let filtered = [...mockProfessors] as ProfessorModel[];

      if (filters?.language) {
        filtered = filtered.filter(p => p.languages.includes(filters.language!));
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) || 
          p.email.toLowerCase().includes(search)
        );
      }
      if (filters?.minRating) {
        filtered = filtered.filter(p => p.rating >= filters.minRating!);
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const start = (page - 1) * limit;

      return {
        data: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      };
    }
  },

  // Get professor by ID
  async getById(id: string): Promise<ApiResponse<ProfessorModel>> {
    try {
      const data = await apiClient.get<ProfessorModel>(`/professors/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching professor:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Create new professor
  async create(data: CreateProfessorDTO): Promise<ApiResponse<ProfessorModel>> {
    try {
      const result = await apiClient.post<ProfessorModel>('/professors', data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating professor:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update professor
  async update(id: string, data: UpdateProfessorDTO): Promise<ApiResponse<ProfessorModel>> {
    try {
      const result = await apiClient.put<ProfessorModel>(`/professors/${id}`, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating professor:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete professor
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/professors/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting professor:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get professor sessions
  async getSessions(professorId: string): Promise<ApiResponse<SessionModel[]>> {
    try {
      const data = await apiClient.get<SessionModel[]>(`/professors/${professorId}/sessions`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export default ProfessorService;
