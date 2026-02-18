// ============================================
// Challenge Service
// Gestion des défis (challenges) pour professeurs et étudiants
// ============================================

import { ApiResponse } from '@/models';
import { apiClient } from '@/lib/apiClient';
import {
  ProfessorChallenge,
  ChallengeLeaderboardEntry,
  StudentChallengeAttempt,
  ChallengeSubject,
  ChallengeDifficulty
} from '@/data/professorChallenges';

// ============================================
// Backend Types
// ============================================

export interface CreateChallengeData {
  subject: ChallengeSubject;
  difficulty: ChallengeDifficulty;
  title: string;
  question: string;
  options: string[];
  correctAnswer: number;
  basePoints: number;
  imageUrl?: string;
  expiresIn: number; // hours
}

export interface BackendChallengeDTO {
  id: string;
  professorId: string;
  professorName: string;
  subject: ChallengeSubject;
  difficulty: ChallengeDifficulty;
  title: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  basePoints: number;
  imageUrl: string | null;
  expiresAt: string;
  isActive: boolean;
  participantCount?: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface SubmitAnswerData {
  challengeId: string;
  selectedAnswer: number;
}

export interface SubmitAnswerResponseData {
  isCorrect: boolean;
  correctAnswer: number | null;
  pointsEarned: number;
  attemptNumber: number;
  isFinalAttempt: boolean;
}

export interface BackendAttemptDTO {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  challengeId: string;
  attempts: number;
  pointsEarned: number;
  isCorrect: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface BackendLeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  totalPoints: number;
  challengesCompleted: number;
  perfectAnswers: number;
}

export interface ChallengeStatsData {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  averageScore: number;
  successRate: number;
}

// ============================================
// Mappers
// ============================================

function mapBackendToFrontend(dto: BackendChallengeDTO): ProfessorChallenge {
  return {
    id: dto.id,
    professorId: dto.professorId,
    professorName: dto.professorName,
    subject: dto.subject,
    difficulty: dto.difficulty,
    title: dto.title,
    titleFr: dto.title,
    titleAr: dto.title,
    question: dto.question,
    questionFr: dto.question,
    questionAr: dto.question,
    options: dto.options,
    optionsFr: dto.options,
    optionsAr: dto.options,
    correctAnswer: dto.correctAnswer ?? -1,
    basePoints: dto.basePoints,
    imageUrl: dto.imageUrl || undefined,
    createdAt: dto.createdAt,
    expiresAt: dto.expiresAt,
    isActive: dto.isActive,
    participantCount: dto.participantCount,
  };
}

function mapBackendAttempt(dto: BackendAttemptDTO): StudentChallengeAttempt {
  return {
    id: dto.id,
    studentId: dto.studentId,
    studentName: dto.studentName,
    studentAvatar: dto.studentAvatar || '',
    challengeId: dto.challengeId,
    attempts: dto.attempts,
    pointsEarned: dto.pointsEarned,
    isCorrect: dto.isCorrect,
    completedAt: dto.completedAt || dto.createdAt,
  };
}

function mapBackendLeaderboard(dto: BackendLeaderboardEntry): ChallengeLeaderboardEntry {
  return {
    rank: dto.rank,
    studentId: dto.studentId,
    studentName: dto.studentName,
    studentAvatar: dto.studentAvatar || '',
    totalPoints: dto.totalPoints,
    challengesCompleted: dto.challengesCompleted,
    perfectAnswers: dto.perfectAnswers,
  };
}

// ============================================
// Service Methods
// ============================================

export const ChallengeService = {

  // Professor: Create a challenge
  async create(data: CreateChallengeData): Promise<ApiResponse<ProfessorChallenge>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: BackendChallengeDTO;
      }>('/challenges', data);

      return { success: true, data: mapBackendToFrontend(response.data) };
    } catch (error) {
      console.error('Create challenge error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create challenge' };
    }
  },

  // Professor: Get my challenges
  async getMyChallenges(): Promise<ApiResponse<ProfessorChallenge[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BackendChallengeDTO[];
      }>('/challenges/my-challenges');

      return { success: true, data: response.data.map(mapBackendToFrontend) };
    } catch (error) {
      console.error('Fetch my challenges error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch challenges' };
    }
  },

  // Professor: Delete a challenge
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/challenges/${id}`);

      return { success: true };
    } catch (error) {
      console.error('Delete challenge error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete challenge' };
    }
  },

  // Professor: Get challenge stats
  async getStats(): Promise<ApiResponse<ChallengeStatsData>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: ChallengeStatsData;
      }>('/challenges/stats');

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Fetch challenge stats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stats' };
    }
  },

  // Professor: Get attempts on a challenge
  async getChallengeAttempts(challengeId: string): Promise<ApiResponse<StudentChallengeAttempt[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BackendAttemptDTO[];
      }>(`/challenges/${challengeId}/attempts`);

      return { success: true, data: response.data.map(mapBackendAttempt) };
    } catch (error) {
      console.error('Fetch challenge attempts error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch attempts' };
    }
  },

  // Student: Get active challenges
  async getActiveChallenges(): Promise<ApiResponse<ProfessorChallenge[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BackendChallengeDTO[];
      }>('/challenges/active');

      return { success: true, data: response.data.map(mapBackendToFrontend) };
    } catch (error) {
      console.error('Fetch active challenges error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch active challenges' };
    }
  },

  // Student: Submit an answer
  async submitAnswer(data: SubmitAnswerData): Promise<ApiResponse<SubmitAnswerResponseData>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: SubmitAnswerResponseData;
      }>('/challenges/submit', data);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Submit answer error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to submit answer' };
    }
  },

  // Student: Get my attempts
  async getMyAttempts(): Promise<ApiResponse<StudentChallengeAttempt[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BackendAttemptDTO[];
      }>('/challenges/my-attempts');

      return { success: true, data: response.data.map(mapBackendAttempt) };
    } catch (error) {
      console.error('Fetch my attempts error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch attempts' };
    }
  },

  // Common: Get leaderboard
  async getLeaderboard(): Promise<ApiResponse<ChallengeLeaderboardEntry[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: BackendLeaderboardEntry[];
      }>('/challenges/leaderboard');

      return { success: true, data: response.data.map(mapBackendLeaderboard) };
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch leaderboard' };
    }
  },
};

export default ChallengeService;
