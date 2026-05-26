// ============================================
// Recording Service
// Fetches session recording URLs from the backend
// Recordings are available for 3 days after creation
// ============================================

import { apiClient, API_BASE_URL } from '@/lib/apiClient';
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get download URL',
      };
    }
  },

  /**
   * Upload an external recording file with progress tracking.
   */
  async uploadExternalRecording(
    roomName: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<SessionRecording>> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve({ success: true });
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              error: response.error || response.message || 'Upload failed',
            });
          } catch {
            resolve({ success: false, error: 'Upload failed' });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: 'Network error during upload' });
      });

      xhr.addEventListener('abort', () => {
        resolve({ success: false, error: 'Upload cancelled' });
      });

      xhr.open('POST', `${API_BASE_URL}/livekit/recordings/${encodeURIComponent(roomName)}/upload`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  },
};

