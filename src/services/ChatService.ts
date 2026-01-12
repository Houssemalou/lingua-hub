// ============================================
// Chat Service
// Ready for backend integration (WebSocket/Real-time)
// ============================================

import { 
  ChatMessageModel, 
  SendMessageDTO, 
  MessageFilters,
  PaginatedResponse,
  ApiResponse 
} from '@/models';
import { mockChatMessages } from '@/data/mockData';

// ============================================
// API Endpoints (à décommenter pour le backend)
// ============================================
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;
// const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.example.com/ws';

// ============================================
// WebSocket Connection (à implémenter avec le backend)
// ============================================
// let ws: WebSocket | null = null;
// let messageCallbacks: ((message: ChatMessageModel) => void)[] = [];
// 
// const connectWebSocket = (sessionId: string) => {
//   ws = new WebSocket(`${WS_URL}/chat/${sessionId}`);
//   
//   ws.onopen = () => {
//     console.log('Chat WebSocket connected');
//   };
//   
//   ws.onmessage = (event) => {
//     const message = JSON.parse(event.data) as ChatMessageModel;
//     messageCallbacks.forEach(cb => cb(message));
//   };
//   
//   ws.onclose = () => {
//     console.log('Chat WebSocket disconnected');
//     setTimeout(() => connectWebSocket(sessionId), 3000);
//   };
//   
//   ws.onerror = (error) => {
//     console.error('Chat WebSocket error:', error);
//   };
// };
// 
// const disconnectWebSocket = () => {
//   if (ws) {
//     ws.close();
//     ws = null;
//   }
//   messageCallbacks = [];
// };
// 
// const onNewMessage = (callback: (message: ChatMessageModel) => void) => {
//   messageCallbacks.push(callback);
//   return () => {
//     messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
//   };
// };

// ============================================
// Service Methods
// ============================================

export const ChatService = {
  // Get messages for a session
  async getMessages(filters: MessageFilters): Promise<PaginatedResponse<ChatMessageModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const params = new URLSearchParams();
    //   params.append('sessionId', filters.sessionId);
    //   if (filters.senderId) params.append('senderId', filters.senderId);
    //   if (filters.type) params.append('type', filters.type);
    //   if (filters.fromDate) params.append('fromDate', filters.fromDate);
    //   if (filters.toDate) params.append('toDate', filters.toDate);
    //   if (filters.search) params.append('search', filters.search);
    //   if (filters.page) params.append('page', String(filters.page));
    //   if (filters.limit) params.append('limit', String(filters.limit));
    //
    //   const response = await fetch(`${CHAT_ENDPOINT}/messages?${params.toString()}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to fetch messages');
    //   return await response.json();
    // } catch (error) {
    //   console.error('Error fetching messages:', error);
    //   throw error;
    // }

    // Mock implementation
    let filtered = mockChatMessages.map(m => ({
      ...m,
      sessionId: filters.sessionId,
      type: 'text' as const,
    })) as ChatMessageModel[];

    if (filters.senderId) {
      filtered = filtered.filter(m => m.senderId === filters.senderId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m => m.content.toLowerCase().includes(search));
    }

    return {
      data: filtered,
      total: filtered.length,
      page: filters.page || 1,
      limit: filters.limit || 50,
      totalPages: Math.ceil(filtered.length / (filters.limit || 50)),
    };
  },

  // Send a message
  async sendMessage(data: SendMessageDTO): Promise<ApiResponse<ChatMessageModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   // For file uploads
    //   if (data.attachments && data.attachments.length > 0) {
    //     const formData = new FormData();
    //     formData.append('sessionId', data.sessionId);
    //     formData.append('content', data.content);
    //     formData.append('type', data.type || 'text');
    //     if (data.replyTo) formData.append('replyTo', data.replyTo);
    //     data.attachments.forEach((file, i) => {
    //       formData.append(`attachment_${i}`, file);
    //     });
    //
    //     const response = await fetch(`${CHAT_ENDPOINT}/messages`, {
    //       method: 'POST',
    //       headers: {
    //         'Authorization': `Bearer ${getAuthToken()}`,
    //       },
    //       body: formData,
    //     });
    //
    //     if (!response.ok) throw new Error('Failed to send message');
    //     return { success: true, data: await response.json() };
    //   }
    //
    //   // For text messages, use WebSocket if connected
    //   if (ws && ws.readyState === WebSocket.OPEN) {
    //     ws.send(JSON.stringify({
    //       type: 'SEND_MESSAGE',
    //       payload: data,
    //     }));
    //     return { success: true, message: 'Message sent' };
    //   }
    //
    //   // Fallback to REST
    //   const response = await fetch(`${CHAT_ENDPOINT}/messages`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify(data),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to send message');
    //   return { success: true, data: await response.json() };
    // } catch (error) {
    //   console.error('Error sending message:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const newMessage: ChatMessageModel = {
      id: `msg-${Date.now()}`,
      sessionId: data.sessionId,
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date().toISOString(),
      replyTo: data.replyTo,
    };

    return { success: true, data: newMessage };
  },

  // Edit a message
  async editMessage(messageId: string, content: string): Promise<ApiResponse<ChatMessageModel>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${CHAT_ENDPOINT}/messages/${messageId}`, {
    //     method: 'PATCH',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //     body: JSON.stringify({ content }),
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to edit message');
    //   return { success: true, data: await response.json() };
    // } catch (error) {
    //   console.error('Error editing message:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const message = mockChatMessages.find(m => m.id === messageId);
    if (message) {
      const updated: ChatMessageModel = {
        ...message,
        sessionId: 'session-1',
        type: 'text',
        content,
        isEdited: true,
      };
      return { success: true, data: updated };
    }
    return { success: false, error: 'Message not found' };
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    // ============================================
    // Backend Implementation (commenté)
    // ============================================
    // try {
    //   const response = await fetch(`${CHAT_ENDPOINT}/messages/${messageId}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${getAuthToken()}`,
    //     },
    //   });
    //
    //   if (!response.ok) throw new Error('Failed to delete message');
    //   return { success: true };
    // } catch (error) {
    //   console.error('Error deleting message:', error);
    //   return { success: false, error: error.message };
    // }

    // Mock implementation
    const index = mockChatMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      return { success: true };
    }
    return { success: false, error: 'Message not found' };
  },

  // Connect to real-time chat
  // connectToSession: connectWebSocket,
  // disconnectFromSession: disconnectWebSocket,
  // onNewMessage,
};

export default ChatService;
