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
import { mockRooms } from '@/data/mockData';

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const params = new URLSearchParams();
    //   if (filters?.status) params.append('status', filters.status);
    //   if (filters?.language) params.append('language', filters.language);
    //   if (filters?.level) params.append('level', filters.level);
    //   if (filters?.professorId) params.append('professorId', filters.professorId);
    //   if (filters?.animatorType) params.append('animatorType', filters.animatorType);
    //   if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    //   if (filters?.toDate) params.append('toDate', filters.toDate);
    //   if (filters?.search) params.append('search', filters.search);
    //   if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    //   if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    //   if (filters?.page) params.append('page', String(filters.page));
    //   if (filters?.limit) params.append('limit', String(filters.limit));
    //
    //   const response = await fetch(`${ROOMS_ENDPOINT}?${params.toString()}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to fetch rooms');
    //   return await response.json();
    // } catch (error) {
    //   console.error('Error fetching rooms:', error);
    //   throw error;
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${id}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Room not found');
    //   const data = await response.json();
    //   return { success: true, data };
    // } catch (error) {
    //   console.error('Error fetching room:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const room = mockRooms.find(r => r.id === id);
    if (room) {
      return { success: true, data: room as RoomModel };
    }
    return { success: false, error: 'Room not found' };
  },

  // Create new room
  async create(data: CreateRoomDTO): Promise<ApiResponse<RoomModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(ROOMS_ENDPOINT, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to create room');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error creating room:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${id}`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to update room');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error updating room:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to delete room');
    //   return { success: true };
    // } catch (error) {
    //   console.error('Error deleting room:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/start`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to start session');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error starting session:', error);
    //   return { success: false, error: error.message };
    // }

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
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${ROOMS_ENDPOINT}/${roomId}/end`, {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to end session');
    //   const result = await response.json();
    //   return { success: true, data: result };
    // } catch (error) {
    //   console.error('Error ending session:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const room = mockRooms.find(r => r.id === roomId);
    if (room) {
      const updated = { ...room, status: 'completed' as const } as RoomModel;
      return { success: true, data: updated };
    }
    return { success: false, error: 'Room not found' };
  },
};

export default RoomService;
