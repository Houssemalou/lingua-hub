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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const params = new URLSearchParams();
    //   if (filters?.level) params.append('level', filters.level);
    //   if (filters?.search) params.append('search', filters.search);
    //   if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    //   if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    //   if (filters?.page) params.append('page', String(filters.page));
    //   if (filters?.limit) params.append('limit', String(filters.limit));
    //
    //   const response = await fetch(`${STUDENTS_ENDPOINT}?${params.toString()}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to fetch students');
    //   return await response.json();
    // } catch (error) {
    //   console.error('Error fetching students:', error);
    //   throw error;
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${STUDENTS_ENDPOINT}/${id}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Student not found');
    //   const data = await response.json();
    //   return { success: true, data };
    // } catch (error) {
    //   console.error('Error fetching student:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const student = mockStudents.find(s => s.id === id);
    if (student) {
      return { success: true, data: student as StudentModel };
    }
    return { success: false, error: 'Student not found' };
  },

  // Create new student
  async create(data: CreateStudentDTO): Promise<ApiResponse<StudentModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(STUDENTS_ENDPOINT, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to create student');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error creating student:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${STUDENTS_ENDPOINT}/${id}`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to update student');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error updating student:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${STUDENTS_ENDPOINT}/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to delete student');
    //   return { success: true };
    // } catch (error) {
    //   console.error('Error deleting student:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${STUDENTS_ENDPOINT}/${id}/skills`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(skills),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to update skills');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error updating skills:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const student = mockStudents.find(s => s.id === id);
    if (student) {
      const updated = { 
        ...student, 
        skills: { ...student.skills, ...skills } 
      } as StudentModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Student not found' };
  },
};

export default StudentService;
