// ============================================
// Recording Service
// Manages session recordings stored in MinIO
// ============================================

import { apiClient } from '@/lib/apiClient';
import { ApiResponse, PaginatedResponse } from '@/models';

// ============================================
// Types
// ============================================

export enum RecordingStatus {
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface SessionRecording {
  id: number;
  roomId: number;
  roomName: string;
  livekitRecordingId: string;
  fileName: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  format: string;
  status: RecordingStatus;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  playbackUrl?: string; // Pre-signed URL for viewing
}

export interface StartRecordingRequest {
  roomId: number;
  livekitRecordingId: string;
}

// ============================================
// Service Methods
// ============================================

export const RecordingService = {
  /**
   * Start a new recording
   */
  async startRecording(roomId: number, livekitRecordingId: string): Promise<ApiResponse<SessionRecording>> {
    try {
      const data = await apiClient.post<SessionRecording>(
        '/recordings/start',
        null,
        { roomId, livekitRecordingId } as Record<string, unknown>
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error starting recording:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start recording' 
      };
    }
  },

  /**
   * Upload recording file
   */
  async uploadRecording(
    livekitRecordingId: string, 
    file: File, 
    durationSeconds?: number
  ): Promise<ApiResponse<SessionRecording>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('livekitRecordingId', livekitRecordingId);
      if (durationSeconds) {
        formData.append('durationSeconds', durationSeconds.toString());
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/recordings/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error uploading recording:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload recording' 
      };
    }
  },

  /**
   * Get recording by ID
   */
  async getRecording(id: number): Promise<ApiResponse<SessionRecording>> {
    try {
      const data = await apiClient.get<SessionRecording>(`/recordings/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching recording:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recording' 
      };
    }
  },

  /**
   * Get all recordings for a specific room
   */
  async getRoomRecordings(roomId: number): Promise<ApiResponse<SessionRecording[]>> {
    try {
      const data = await apiClient.get<SessionRecording[]>(`/recordings/room/${roomId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching room recordings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch room recordings' 
      };
    }
  },

  /**
   * Get all recordings for a student (rooms they participated in)
   */
  async getStudentRecordings(studentId: number): Promise<ApiResponse<SessionRecording[]>> {
    try {
      const data = await apiClient.get<SessionRecording[]>(`/recordings/student/${studentId}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching student recordings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch student recordings' 
      };
    }
  },

  /**
   * Get all completed recordings (admin only, paginated)
   */
  async getAllRecordings(page = 0, size = 20): Promise<ApiResponse<PaginatedResponse<SessionRecording>>> {
    try {
      const data = await apiClient.get<PaginatedResponse<SessionRecording>>(
        '/recordings/all',
        { page, size } as Record<string, unknown>
      );
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching all recordings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recordings' 
      };
    }
  },

  /**
   * Delete recording (admin only)
   */
  async deleteRecording(id: number): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/recordings/${id}`);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Error deleting recording:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete recording' 
      };
    }
  },

  /**
   * Get playback URL for recording
   */
  async getPlaybackUrl(id: number): Promise<ApiResponse<string>> {
    try {
      const data = await apiClient.get<string>(`/recordings/${id}/playback-url`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching playback URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch playback URL' 
      };
    }
  },

  /**
   * Format file size to human-readable string
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  /**
   * Format duration to human-readable string
   */
  formatDuration(seconds?: number): string {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },
};

export default RecordingService;
