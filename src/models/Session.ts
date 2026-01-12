// ============================================
// Session Model (Derived from Room for student/professor view)
// ============================================

import { AnimatorType, LanguageLevel, RoomStatus } from './Room';

export interface SessionModel {
  id: string;
  roomId: string;
  roomName: string;
  language: string;
  level: LanguageLevel;
  objective: string;
  scheduledAt: string;
  duration: number;
  status: RoomStatus;
  participantsCount: number;
  animatorType: AnimatorType;
  professorId?: string;
  professorName?: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  studentId: string;
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
}

export interface SessionFilters {
  status?: RoomStatus;
  language?: string;
  level?: LanguageLevel;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
