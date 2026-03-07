// ============================================
// Room Model
// ============================================

export type RoomStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type AnimatorType = 'ai' | 'professor';
export type LanguageLevel = 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2';

export interface RoomModel {
  id: string;
  name: string;
  language: string;
  level: LanguageLevel;
  objective: string;
  scheduledAt: string;
  duration: number; // in minutes
  maxStudents: number;
  status: RoomStatus;
  invitedStudents?: string[];
  joinedStudents?: string[];
  createdAt: string;
  animatorType: AnimatorType;
  professorId?: string;
  livekitRoomName?: string;
  updatedAt?: string;
}

export interface CreateRoomDTO {
  name: string;
  language: string;
  // allow empty string when level not applicable
  level: LanguageLevel | '';
  objective: string;
  scheduledAt: string;
  duration: number;
  maxStudents: number;
  animatorType: AnimatorType;
  professorId?: string;
  invitedStudents?: string[];
}

export interface UpdateRoomDTO {
  name?: string;
  objective?: string;
  scheduledAt?: string;
  duration?: number;
  maxStudents?: number;
  status?: RoomStatus;
  invitedStudents?: string[];
}

export interface RoomFilters {
  status?: RoomStatus;
  language?: string;
  level?: LanguageLevel | '';
  professorId?: string;
  animatorType?: AnimatorType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  sortBy?: 'scheduledAt' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
