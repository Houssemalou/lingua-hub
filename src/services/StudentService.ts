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
  // Get all students with optional filters
  async getAll(filters?: StudentFilters): Promise<PaginatedResponse<StudentModel>> {
    try {
      return await apiClient.get<PaginatedResponse<StudentModel>>('/students', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    let filtered = [...mockStudents] as StudentModel[];

    if (filters?.level) {
      filtered = filtered.filter(s => s.level === filters.level);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(search) || 
        s.email.toLowerCase().includes(search)
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

  // Get student by ID
  async getById(id: string): Promise<ApiResponse<StudentModel>> {
    try {
      const data = await apiClient.get<StudentModel>(`/students/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const student = mockStudents.find(s => s.id === id);
    if (student) {
      return { success: true, data: student as StudentModel };
    }
    return { success: false, error: 'Student not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const newStudent: StudentModel = {
      id: `student-${Date.now()}`,
      name: data.name,
      email: data.email,
      nickname: data.nickname,
      bio: data.bio || '',
      level: data.level,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      joinedAt: new Date().toISOString(),
      skills: { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0 },
      totalSessions: 0,
      hoursLearned: 0,
    };
    return { success: true, data: newStudent };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const student = mockStudents.find(s => s.id === id);
    if (student) {
      const updated = { ...student, ...data } as StudentModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Student not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const index = mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      return { success: true };
    }
    return { success: false, error: 'Student not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    // const student = mockStudents.find(s => s.id === id);
    // if (student) {
    //   const updated = { 
    //     ...student, 
    //     skills: { ...student.skills, ...skills } 
    //   } as StudentModel;
    //   return { success: true, data: updated };
    // }
    // return { success: false, error: 'Student not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // const students = mockStudents.filter(s => ids.includes(s.id));
    // return { success: true, data: students as StudentModel[] };
  },
};

export default StudentService;
