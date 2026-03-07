export type ProfessorType = 'PROF_PRIMAIRE' | 'PROF_BASE' | 'PROF_SECONDAIRE' | 'FORMATEUR' | 'PROF_PREPA';
export type StudentType = 'SCOLAIRE' | 'FORMATION' | 'PREPA';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  nickname: string;
  bio: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2';
  studentType?: StudentType;
  joinedAt: string;
  skills: {
    pronunciation: number;
    grammar: number;
    vocabulary: number;
    fluency: number;
  };
  totalSessions: number;
  hoursLearned: number;
  createdBy?: string;
  premiumExpiresAt?: string;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  languages: string[];
  specialization: string;
  professorType?: ProfessorType;
  joinedAt: string;
  totalSessions: number;
  createdBy?: string;
}

export interface Room {
  id: string;
  name: string;
  language: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2';
  objective: string;
  scheduledAt: string;
  duration: number; // in minutes
  maxStudents: number;
  status: 'scheduled' | 'live' | 'completed';
  invitedStudents: string[];
  joinedStudents: string[];
  createdAt: string;
  animatorType: 'ai' | 'professor';
  professorId?: string;
}

export interface Session {
  id: string;
  roomId: string;
  roomName: string;
  language: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2';
  objective: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'completed';
  participantsCount: number;
  animatorType: 'ai' | 'professor';
  professorId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
}

export type UserRole = 'admin' | 'student' | 'professor';

// LiveKit Data Track Types
export interface SessionSummaryData {
  type: 'session_summary';
  summary: {
    sessionObjective?: string;
    learnedGroups: {
      group: string;
      words: string[];
    }[];
  };
  timestamp: string;
} 

export interface TranscriptionData {
  type: 'transcription';
  content: string;
  timestamp: string;
  isUser: boolean;
}

export type DataTrackMessage = SessionSummaryData | TranscriptionData;
