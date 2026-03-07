// ============================================
// Recording Service
// Fetches session recording URLs from the backend
// Recordings are available for 3 days after creation
// ============================================

import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/models';

// ============================================
// Types
// ============================================

export interface SessionRecording {
  id: number;
  roomName: string;
  recordingUrl: string;
  createdAt: string;
  expiresAt: string;
}

// ============================================
// Service Methods
// ============================================

export const RecordingService = {
  /**
   * Get all recordings for a room by its LiveKit room name.
   */
  async getRecordingsByRoomName(roomName: string): Promise<ApiResponse<SessionRecording[]>> {
    try {
      const data = await apiClient.get<ApiResponse<SessionRecording[]>>(
        `/livekit/recordings/${encodeURIComponent(roomName)}`
      );
      // The backend wraps in ApiResponse { success, data, message }
      if (data && data.success !== undefined) {
        return data;
      }
      return { success: true, data: data as unknown as SessionRecording[] };
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recordings',
      };
    }
  },

  /**
   * Get a presigned download URL for a specific recording.
   */
  async getDownloadUrl(roomName: string, recordingId: number): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const data = await apiClient.get<ApiResponse<{ downloadUrl: string }>>(
        `/livekit/recordings/${encodeURIComponent(roomName)}/download/${recordingId}`
      );
      if (data && data.success !== undefined) {
        return data;
      }
      return { success: true, data: data as unknown as { downloadUrl: string } };
    } catch (error) {
      console.error('Error fetching download URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get download URL',
      };
    }
  },
};

