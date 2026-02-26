import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Professor } from '@/types';
import { AuthService, StudentRegisterData, ProfessorRegisterData, AdminRegisterData } from '@/services/AuthService';
import { StudentService } from '@/services/StudentService';
import { ProfessorService } from '@/services/ProfessorService';

export type AuthRole = 'admin' | 'student' | 'professor' | null;

interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: AuthRole;
  student?: Student;
  professor?: Professor;
}

export interface StudentSignupData extends StudentRegisterData {}
export interface ProfessorSignupData extends ProfessorRegisterData {}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupAdmin: (data: AdminRegisterData) => Promise<{ success: boolean; error?: string }>;
  signupStudent: (data: StudentSignupData) => Promise<{ success: boolean; error?: string }>;
  signupProfessor: (data: ProfessorSignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateAccessToken: (token: string) => boolean;
  updateUser: (updates: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<void>;
}

// Valid access tokens for registration (kept for backward compatibility)
const validAccessTokens = ['STUDENT2024', 'LANG-ABC123', 'EDU-TOKEN-01', 'ACCESS-2024-XYZ'];
const validProfessorTokens = ['PROF2024', 'TEACHER-ABC', 'PROF-TOKEN-01'];
const validAdminTokens = ['ADMIN2024', 'ADMIN-TOKEN-01', 'SUPER-ADMIN'];

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

  // Fetch full profile from backend for current user
  const fetchProfile = async (role: string, authUser: AuthUser): Promise<AuthUser> => {
    if (role === 'student') {
      try {
        const profileResponse = await StudentService.getMyProfile();
        if (profileResponse.success && profileResponse.data) {
          const p = profileResponse.data;
          authUser.student = {
            id: String(p.id),
            name: p.name || authUser.username,
            email: p.email || authUser.email,
            avatar: p.avatar || '',
            nickname: p.nickname || '',
            bio: p.bio || '',
            level: p.level || 'YEAR1',
            joinedAt: p.joinedAt || new Date().toISOString(),
            skills: p.skills || { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0 },
            totalSessions: p.totalSessions || 0,
            hoursLearned: p.hoursLearned || 0,
            createdBy: p.createdBy || undefined,
          };
        }
      } catch (error) {
        console.error('Failed to fetch student profile:', error);
      }
    } else if (role === 'professor') {
      try {
        const profileResponse = await ProfessorService.getMyProfile();
        if (profileResponse.success && profileResponse.data) {
          const p = profileResponse.data;
          authUser.professor = {
            id: String(p.id),
            name: p.name || authUser.username,
            email: p.email || authUser.email,
            avatar: p.avatar || '',
            bio: p.bio || '',
            languages: p.languages || [],
            specialization: p.specialization || '',
            joinedAt: p.joinedAt || new Date().toISOString(),
            totalSessions: p.totalSessions || 0,
            rating: p.rating || 0,
            createdBy: p.createdBy || undefined,
          };
        }
      } catch (error) {
        console.error('Failed to fetch professor profile:', error);
      }
    }
    return authUser;
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
            avatar: localStorage.getItem('temp_student_avatar') || '',
            nickname: localStorage.getItem('temp_student_nickname') || '', // Will be fetched s
            level: (localStorage.getItem('temp_student_level') as 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6') || 'YEAR1',
            joinedAt: new Date().toISOString(),
            skills: { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0 },
            totalSessions: 0,
            hoursLearned: 0,
            bio: localStorage.getItem('temp_student_bio') || '',
          };
          authUser = {
            id: response.data.user.id,
            username: response.data.user.name,
            email: response.data.user.email,
            role: response.data.user.role,
            student: studentProfile,
          };
        } else if (response.data.user.role === 'professor') {
          const professorProfile: Professor = {
            // initially use the user id; we'll fetch the real professor record right after
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

          // fetch the full profile immediately so that we have the correct professor table ID
          try {
            const updated = await fetchProfile('professor', authUser);
            authUser.professor = updated.professor; // update professor sub-object with full profile
          } catch (err) {
            console.warn('Could not refresh professor profile after login:', err);
          }
        } else {
          // Admin
          authUser = {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
          };
        }

        setUser(authUser);

        // Clean up temp localStorage data
        ['temp_student_avatar', 'temp_student_bio', 'temp_student_nickname', 'temp_student_level',
         'temp_professor_avatar', 'temp_professor_bio', 'temp_professor_languages', 'temp_professor_specialization'
        ].forEach(key => localStorage.removeItem(key));

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
    window.location.href = '/auth';
  };

  // Update user state (used by profile pages after editing)
  const updateUser = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  // Refresh profile from backend
  const refreshProfile = async () => {
    if (!user || !user.role) return;
    const updatedUser = await fetchProfile(user.role, { ...user });
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signupAdmin, signupStudent, signupProfessor, logout, validateAccessToken, updateUser, refreshProfile }}>
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
