// ============================================
// Chat Message Model
// ============================================

export type MessageType = 'text' | 'system' | 'file' | 'audio';

export interface ChatMessageModel {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: MessageType;
  timestamp: string;
  isEdited?: boolean;
  replyTo?: string; // messageId
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'audio' | 'document';
  url: string;
  name: string;
  size: number;
}

export interface SendMessageDTO {
  sessionId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
  attachments?: File[];
}

export interface MessageFilters {
  sessionId: string;
  senderId?: string;
  type?: MessageType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
