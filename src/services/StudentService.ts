// ============================================
// Student Service
// Ready for backend integration
// ============================================

import { 
  StudentModel, 
  CreateStudentDTO, 
  UpdateStudentDTO, 
  StudentFilters,
  PaginatedResponse,
  ApiResponse 
} from '@/models';
import { apiClient } from '@/lib/apiClient';
import { mockStudents } from '@/data/mockData';

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const STUDENTS_ENDPOINT = `${API_BASE_URL}/students`;

// ============================================
// Service Methods
// ============================================

export const StudentService = {
  // Get current student's profile
  async getMyProfile(): Promise<ApiResponse<StudentModel>> {
    try {
      const response = await apiClient.get<{ success: boolean; message: string; data: StudentModel }>('/students/me');
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || 'Failed to fetch profile' };
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get all students (accepts optional filters). If `createdBy` is provided
  // the backend exposes a dedicated endpoint `/students/created-by/{createdById}`
  // which accepts pagination & sort query params.
  async getAll(filters?: StudentFilters): Promise<PaginatedResponse<StudentModel>> {
    try {
      if (filters && filters.createdBy) {
        const params: Record<string, unknown> = {
          page: filters.page ?? 0,
          size: filters.limit ?? 10,
          sortBy: filters.sortBy ?? 'createdAt',
          sortOrder: filters.sortOrder ?? 'desc',
        };
        return await apiClient.get<PaginatedResponse<StudentModel>>(`/students/created-by/${filters.createdBy}`, params);
      }

      // Fallback to generic `/students` endpoint when no creator filter is provided
      return await apiClient.get<PaginatedResponse<StudentModel>>('/students', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get student by ID
  async getById(id: string): Promise<ApiResponse<StudentModel>> {
    try {
      const response = await apiClient.get<{ success: boolean; message: string; data: StudentModel }>(`/students/${id}`);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || 'Failed to fetch student' };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Create new student
  async create(data: CreateStudentDTO): Promise<ApiResponse<StudentModel>> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; data: StudentModel }>('/students', data);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || 'Failed to create student' };
    } catch (error) {
      console.error('Error creating student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update student
  async update(id: string, data: UpdateStudentDTO): Promise<ApiResponse<StudentModel>> {
    try {
      const response = await apiClient.put<{ success: boolean; message: string; data: StudentModel }>(`/students/${id}`, data);
      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message || 'Failed to update student' };
    } catch (error) {
      console.error('Error updating student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete student
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/students/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Update student skills
  async updateSkills(
    id: string, 
    skills: Partial<StudentModel['skills']>
  ): Promise<ApiResponse<StudentModel>> {
    try {
      const result = await apiClient.patch<StudentModel>(`/students/${id}/skills`, skills);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating skills:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

  
  },

  // Get multiple students by IDs (batch)
  async getByIds(ids: string[]): Promise<ApiResponse<StudentModel[]>> {
    try {
      const data = await apiClient.post<StudentModel[]>('/students/batch', { ids });
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching students by IDs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

   
  },
};

export default StudentService;
