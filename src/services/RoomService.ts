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
  // Get all rooms with optional filters
  async getAll(filters?: RoomFilters): Promise<PaginatedResponse<RoomModel>> {
    try {
      return await apiClient.get<PaginatedResponse<RoomModel>>('/rooms', filters as Record<string, unknown>);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    let filtered = [...mockRooms] as RoomModel[];

    if (filters?.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters?.language) {
      filtered = filtered.filter(r => r.language === filters.language);
    }
    if (filters?.level) {
      filtered = filtered.filter(r => r.level === filters.level);
    }
    if (filters?.professorId) {
      filtered = filtered.filter(r => r.professorId === filters.professorId);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(search) || 
        r.objective.toLowerCase().includes(search)
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

  // Get room by ID
  async getById(id: string): Promise<ApiResponse<RoomModel>> {
    try {
      const data = await apiClient.get<RoomModel>(`/rooms/${id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching room:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const room = mockRooms.find(r => r.id === id);
    if (room) {
      return { success: true, data: room as RoomModel };
    }
    return { success: false, error: 'Room not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const newRoom: RoomModel = {
      id: `room-${Date.now()}`,
      ...data,
      status: 'scheduled',
      invitedStudents: data.invitedStudents || [],
      joinedStudents: [],
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newRoom };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const room = mockRooms.find(r => r.id === id);
    if (room) {
      const updated = { ...room, ...data } as RoomModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Room not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const index = mockRooms.findIndex(r => r.id === id);
    if (index !== -1) {
      return { success: true };
    }
    return { success: false, error: 'Room not found' };
  },

  // Join room
  async join(roomId: string, studentId: string): Promise<ApiResponse<RoomModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/join`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify({ studentId }),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to join room');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error joining room:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const room = mockRooms.find(r => r.id === roomId);
    if (room) {
      const updated = { 
        ...room, 
        joinedStudents: [...room.joinedStudents, studentId] 
      } as RoomModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Room not found' };
  },

  // Leave room
  async leave(roomId: string, studentId: string): Promise<ApiResponse<RoomModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/leave`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify({ studentId }),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to leave room');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error leaving room:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const room = mockRooms.find(r => r.id === roomId);
    if (room) {
      const updated = { 
        ...room, 
        joinedStudents: room.joinedStudents.filter(id => id !== studentId) 
      } as RoomModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Room not found' };
  },

  // Start session (professor only)
  async startSession(roomId: string): Promise<ApiResponse<RoomModel>> {
    try {
      const result = await apiClient.post<RoomModel>(`/rooms/${roomId}/start`);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    const room = mockRooms.find(r => r.id === roomId);
    if (room) {
      const updated = { ...room, status: 'live' as const } as RoomModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Room not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // Mock implementation
    // const room = mockRooms.find(r => r.id === roomId);
    // if (room) {
    //   const updated = { ...room, status: 'completed' as const } as RoomModel;
    //   return { success: true, data: updated };
    // }
    // return { success: false, error: 'Room not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // const room = mockRooms.find(r => r.id === roomId);
    // if (room) {
    //   return { success: true, data: room.joinedStudents || [] };
    // }
    // return { success: false, error: 'Room not found' };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // return { success: true };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // return { success: true };
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

    // ============================================
    // Mock Implementation (fallback)
    // ============================================
    // return { success: true };
  },
};

export default RoomService;
