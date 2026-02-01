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
  // Get all students (no backend filtering, filtering done on frontend)
  async getAll(): Promise<PaginatedResponse<StudentModel>> {
    try {
      return await apiClient.get<PaginatedResponse<StudentModel>>('/students');
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }

    
  },

  // Get student by ID
  async getById(id: string): Promise<ApiResponse<StudentModel>> {
    try {
      const data = await apiClient.get<StudentModel>(`/students/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

   
  },

  // Create new student
  async create(data: CreateStudentDTO): Promise<ApiResponse<StudentModel>> {
    try {
      const result = await apiClient.post<StudentModel>('/students', data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Update student
  async update(id: string, data: UpdateStudentDTO): Promise<ApiResponse<StudentModel>> {
    try {
      const result = await apiClient.put<StudentModel>(`/students/${id}`, data);
      return { success: true, data: result };
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
