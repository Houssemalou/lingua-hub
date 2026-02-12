// ============================================
// Room Service
// Ready for backend integration
// ============================================

import { 
  RoomModel, 
  CreateRoomDTO, 
  UpdateRoomDTO, 
  RoomFilters,
  PaginatedResponse,
  ApiResponse 
} from '@/models';
import { apiClient } from '@/lib/apiClient';
import { mockRooms } from '@/data/mockData';

// ============================================
// Types
// ============================================

export interface RoomParticipant {
  id: string;
  roomId: string;
  studentId: string;
  studentName?: string;
  joinedAt: string;
  isMuted: boolean;
  isPinged: boolean;
  pingedAt?: string;
  handRaised: boolean;
}

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const ROOMS_ENDPOINT = `${API_BASE_URL}/rooms`;

// ============================================
// Service Methods
// ============================================

export const RoomService = {
  // Get all rooms (no backend filtering, filtering done on frontend)
  async getAll(): Promise<PaginatedResponse<RoomModel>> {
    try {
      return await apiClient.get<PaginatedResponse<RoomModel>>('/rooms');
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }

  },

  // Get my sessions (filtered by user role and invitation)
  async getMySessions(): Promise<PaginatedResponse<RoomModel>> {
    try {
      return await apiClient.get<PaginatedResponse<RoomModel>>('/rooms/my-sessions');
    } catch (error) {
      console.error('Error fetching my sessions:', error);
      throw error;
    }
  },

  // Get room by ID
  async getById(id: string): Promise<ApiResponse<RoomModel>> {
    try {
      const data = await apiClient.get<RoomModel>(`/rooms/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Create new room
  async create(data: CreateRoomDTO): Promise<ApiResponse<RoomModel>> {
    try {
      const result = await apiClient.post<RoomModel>('/rooms', data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Update room
  async update(id: string, data: UpdateRoomDTO): Promise<ApiResponse<RoomModel>> {
    try {
      const result = await apiClient.put<RoomModel>(`/rooms/${id}`, data);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

  
  },

  // Delete room
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>(`/rooms/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Join room
  async join(roomId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post<void>(`/rooms/${roomId}/join`);
      return { success: true };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Check if user can join room
  async canJoin(roomId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await apiClient.get<boolean>(`/rooms/${roomId}/can-join`);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error checking join permission:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: false };
    }
  },

  // Leave room
  async leave(roomId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post(`/rooms/${roomId}/leave`);
      return { success: true };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to leave room' };
    }
  },

  // Start session (professor only)
  async startSession(roomId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post<void>(`/rooms/${roomId}/start`);
      return { success: true };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Start session and get token (professor only)
  async startAndJoin(roomId: string, userId: string): Promise<ApiResponse<LiveKitTokenResponse>> {
    try {
      // First start the room
      await apiClient.post<void>(`/rooms/${roomId}/start`);
      
      // Then join and get token
      await apiClient.post<void>(`/rooms/${roomId}/join`);
      const token = await apiClient.post<LiveKitTokenResponse>('/livekit/token', { roomId, userId });
      
      return { success: true, data: token };
    } catch (error) {
      console.error('Error starting and joining session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // End session (professor only)
  async endSession(roomId: string): Promise<ApiResponse<RoomModel>> {
    try {
      const result = await apiClient.post<RoomModel>(`/rooms/${roomId}/end`);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Get room participants
  async getParticipants(roomId: string): Promise<ApiResponse<RoomParticipant[]>> {
    try {
      const data = await apiClient.get<RoomParticipant[]>(`/rooms/${roomId}/participants`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching participants:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

  },

  // Mute participant
  async muteParticipant(data: { roomId: string; participantId: string; muted: boolean }): Promise<ApiResponse<void>> {
    try {
      await apiClient.post<void>('/rooms/participants/mute', data);
      return { success: true };
    } catch (error) {
      console.error('Error muting participant:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

  },

  // Ping participant (attention request)
  async pingParticipant(data: { roomId: string; participantId: string; message?: string }): Promise<ApiResponse<void>> {
    try {
      await apiClient.post<void>('/rooms/participants/ping', data);
      return { success: true };
    } catch (error) {
      console.error('Error pinging participant:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    
  },

  // Delete ping
  async deletePing(roomId: string, participantId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete<void>('/rooms/participants/ping', { roomId, participantId });
      return { success: true };
    } catch (error) {
      console.error('Error deleting ping:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

  },

  // Get LiveKit token for joining a room
  async getLiveKitToken(roomId: string, userId: string): Promise<ApiResponse<LiveKitTokenResponse>> {
    try {
      console.log('Getting LiveKit token for room:', roomId, 'user:', userId);
      const response = await apiClient.post<unknown>('/livekit/token', { roomId, userId });
      
      // Handle ApiResponse wrapper from backend - use type assertion
      const responseData = response as { data?: unknown };
      const rawData = responseData.data ? responseData.data : response;
      const tokenData = rawData as { token?: string; serverUrl?: string; identity?: string; roomName?: string; expiresAt?: string };
      
      console.log('LiveKit token response:', tokenData);
      
      if (!tokenData || !tokenData.token || !tokenData.serverUrl) {
        throw new Error('Invalid token response from server');
      }
      
      return { 
        success: true, 
        data: {
          token: tokenData.token,
          serverUrl: tokenData.serverUrl,
          identity: tokenData.identity,
          roomName: tokenData.roomName,
          expiresAt: tokenData.expiresAt
        }
      };
    } catch (error) {
      console.error('Error getting LiveKit token:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  // Join a room and get LiveKit token (for any user: admin, professor, student)
  async joinRoomAndGetToken(roomId: string): Promise<ApiResponse<LiveKitTokenResponse>> {
    try {
      console.log('Joining room and getting token:', roomId);
      const response = await apiClient.post<unknown>(`/rooms/${roomId}/join`);
      
      // Handle ApiResponse wrapper from backend - use type assertion
      const responseData = response as { data?: unknown };
      const rawData = responseData.data ? responseData.data : response;
      const tokenData = rawData as { token?: string; serverUrl?: string; identity?: string; roomName?: string; expiresAt?: string };
      
      console.log('Join room token response:', tokenData);
      
      if (!tokenData || !tokenData.token || !tokenData.serverUrl) {
        throw new Error('Invalid token response from server');
      }
      
      return { 
        success: true, 
        data: {
          token: tokenData.token,
          serverUrl: tokenData.serverUrl,
          identity: tokenData.identity,
          roomName: tokenData.roomName,
          expiresAt: tokenData.expiresAt
        }
      };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

interface LiveKitTokenResponse {
  token: string;
  serverUrl: string;
  identity?: string;
  roomName?: string;
  expiresAt?: string;
}

export default RoomService;
