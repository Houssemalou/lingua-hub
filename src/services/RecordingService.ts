// ============================================
// Recording Service
// Fetches session recording URLs from the backend
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
};

