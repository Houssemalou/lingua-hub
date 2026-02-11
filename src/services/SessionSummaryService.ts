// ============================================
// Session Summary Service
// Gestion des résumés de session créés par les professeurs
// ============================================

import { ApiResponse } from '@/models';
import { apiClient } from '@/lib/apiClient';

// ============================================
// Types
// ============================================

export interface SessionSummary {
  id: string;
  roomId: string;
  roomName: string;
  professorId: string;
  professorName: string;
  summary: string;
  keyTopics: string[];
  vocabularyCovered: string[];
  grammarPoints: string[];
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  nextSessionFocus: string;
  overallScore: number;
  pronunciationScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  participationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionSummaryData {
  roomId: string;
  summary: string;
  keyTopics: string[];
  vocabularyCovered: string[];
  grammarPoints: string[];
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  nextSessionFocus: string;
  overallScore: number;
  pronunciationScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  participationScore: number;
}

// ============================================
// Service Methods
// ============================================

export const SessionSummaryService = {
  // Créer ou mettre à jour un résumé de session
  async createOrUpdate(data: CreateSessionSummaryData): Promise<ApiResponse<SessionSummary>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: SessionSummary;
      }>('/session-summaries', data);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to create summary',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Create summary error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create summary',
      };
    }
  },

  // Récupérer le résumé d'une session
  async getByRoomId(roomId: string): Promise<ApiResponse<SessionSummary>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: SessionSummary;
      }>(`/session-summaries/room/${roomId}`);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to fetch summary',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Fetch summary error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summary',
      };
    }
  },

  // Récupérer les résumés de plusieurs sessions
  async getByRoomIds(roomIds: string[]): Promise<ApiResponse<SessionSummary[]>> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: SessionSummary[];
      }>('/session-summaries/by-rooms', roomIds);

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to fetch summaries',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Fetch summaries error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summaries',
      };
    }
  },

  // Récupérer tous mes résumés (professeur)
  async getMySummaries(): Promise<ApiResponse<SessionSummary[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: SessionSummary[];
      }>('/session-summaries/my-summaries');

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to fetch summaries',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Fetch summaries error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summaries',
      };
    }
  },

  // Récupérer les résumés de mes sessions (étudiant)
  async getMySessionSummaries(): Promise<ApiResponse<SessionSummary[]>> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: SessionSummary[];
      }>('/session-summaries/my-sessions');

      if (!response.success) {
        return {
          success: false,
          error: response.message || 'Failed to fetch session summaries',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Fetch session summaries error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session summaries',
      };
    }
  },
};
