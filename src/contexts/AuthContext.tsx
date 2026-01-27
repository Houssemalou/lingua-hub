import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Professor } from '@/types';
import { AuthService, StudentRegisterData, ProfessorRegisterData, AdminRegisterData } from '@/services/AuthService';

export type AuthRole = 'admin' | 'student' | 'professor' | null;

interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  student?: Student;
  professor?: Professor;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupAdmin: (data: AdminRegisterData) => Promise<{ success: boolean; error?: string }>;
  signupStudent: (data: StudentSignupData) => Promise<{ success: boolean; error?: string }>;
  signupProfessor: (data: ProfessorSignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateAccessToken: (token: string) => boolean;
}

export interface StudentSignupData extends StudentRegisterData {}

export interface ProfessorSignupData extends ProfessorRegisterData {}

// Valid access tokens for registration
const validAccessTokens = ['STUDENT2024', 'LANG-ABC123', 'EDU-TOKEN-01', 'ACCESS-2024-XYZ'];
const validProfessorTokens = ['PROF2024', 'TEACHER-ABC', 'PROF-TOKEN-01'];
const validAdminTokens = ['ADMIN2024', 'ADMIN-TOKEN-01', 'SUPER-ADMIN'];

// Mock users database
const mockUsers: AuthUser[] = [
  {
    id: 'admin-1',
    email: 'admin@school.com',
    role: 'admin',
  },
  {
    id: 'prof-1',
    email: 'marie.dubois@example.com',
    role: 'professor',
    professor: {
      id: 'prof-1',
      name: 'Marie Dubois',
      email: 'marie.dubois@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
      bio: 'Professeur de français avec 10 ans d\'expérience',
      languages: ['French', 'English', 'Spanish'],
      specialization: 'Conversation et grammaire',
      joinedAt: '2023-01-15',
      totalSessions: 156,
      rating: 4.8,
    },
  },
  {
    id: 'student-1',
    email: 'student@example.com',
    role: 'student',
    student: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'student@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      nickname: 'Sarah',
      bio: 'Étudiante passionnée par les langues et les sciences',
      level: 'B1',
      joinedAt: '2024-01-10',
      skills: { pronunciation: 72, grammar: 68, vocabulary: 75, fluency: 65 },
      totalSessions: 12,
      hoursLearned: 18,
    },
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const validateAccessToken = (token: string): boolean => {
    return validAccessTokens.includes(token.toUpperCase().trim()) ||
           validProfessorTokens.includes(token.toUpperCase().trim()) ||
           validAdminTokens.includes(token.toUpperCase().trim());
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await AuthService.login({ username, password });

      if (response.success && response.data) {
        let authUser: AuthUser;

        if (response.data.user.role === 'student') {
          const studentProfile: Student = {
            id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email,
            avatar: response.data.user.avatar || '',
            nickname: localStorage.getItem('temp_student_nickname') || '', // Will be fetched s
            level: (localStorage.getItem('temp_student_level') as 'A1' | 'A2' | 'B1' | 'B2') || 'A1',
            joinedAt: new Date().toISOString(),
            skills: { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0 },
            totalSessions: 0,
            hoursLearned: 0,
            bio: localStorage.getItem('temp_student_bio') || '',
          };
          authUser = {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
            student: studentProfile,
          };
        } else if (response.data.user.role === 'professor') {
          const professorProfile: Professor = {
            id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email,
            avatar: localStorage.getItem('temp_professor_avatar') || '',
            bio: localStorage.getItem('temp_professor_bio') || '',
            languages: JSON.parse(localStorage.getItem('temp_professor_languages') || '[]'),
            specialization: localStorage.getItem('temp_professor_specialization') || '',
            joinedAt: new Date().toISOString(),
            totalSessions: 0,
            rating: 0,
          };
          authUser = {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
            professor: professorProfile,
          };
        } else {
          // Admin
          authUser = {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
          };
        }

        setUser(authUser);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const signupAdmin = async (data: AdminRegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await AuthService.registerAdmin(data);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Admin signup error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  };

  const signupStudent = async (data: StudentSignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await AuthService.registerStudent(data);
      localStorage.setItem('temp_student_bio', data.bio || '');
      localStorage.setItem('temp_student_nickname', data.nickname || '');
      localStorage.setItem('temp_student_level', data.level || 'A1');
      localStorage.setItem('temp_student_avatar', data.avatar || '');
     

      if (response.success) {
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Student signup error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  };

  const signupProfessor = async (data: ProfessorSignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await AuthService.registerProfessor(data);
      localStorage.setItem('temp_professor_bio', data.bio || '');
      localStorage.setItem('temp_professor_languages', JSON.stringify(data.languages || []));
      localStorage.setItem('temp_professor_specialization', data.specialization || '');
      localStorage.setItem('temp_professor_avatar', data.avatar || '');

      if (response.success) {
       return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Professor signup error:', error);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signupAdmin, signupStudent, signupProfessor, logout, validateAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
