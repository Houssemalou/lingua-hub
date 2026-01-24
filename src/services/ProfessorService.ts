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
  ApiResponse 
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
  // Get all professors with optional filters
  async getAll(filters?: ProfessorFilters): Promise<PaginatedResponse<ProfessorModel>> {
    try {
      return await apiClient.get<PaginatedResponse<ProfessorModel>>('/professors', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching professors:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
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

    return {
      data: filtered,
      total: filtered.length,
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: Math.ceil(filtered.length / (filters?.limit || 10)),
    };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const professor = mockProfessors.find(p => p.id === id);
    if (professor) {
      return { success: true, data: professor as ProfessorModel };
    }
    return { success: false, error: 'Professor not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const newProfessor: ProfessorModel = {
      id: `prof-${Date.now()}`,
      name: data.name,
      email: data.email,
      bio: data.bio || '',
      languages: data.languages,
      specialization: data.specialization,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      joinedAt: new Date().toISOString(),
      totalSessions: 0,
      rating: 0,
    };
    return { success: true, data: newProfessor };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const professor = mockProfessors.find(p => p.id === id);
    if (professor) {
      const updated = { ...professor, ...data } as ProfessorModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Professor not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const index = mockProfessors.findIndex(p => p.id === id);
    if (index !== -1) {
      return { success: true };
    }
    return { success: false, error: 'Professor not found' };
  },

  // Get professor sessions
  async getSessions(professorId: string): Promise<ApiResponse<any[]>> {
    try {
      const data = await apiClient.get<any[]>(`/professors/${professorId}/sessions`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation - would use getProfessorSessions from mockData
    return { success: true, data: [] };
  },
};

export default ProfessorService;
