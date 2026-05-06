export type ProfessorType = 'PROF_PRIMAIRE' | 'PROF_BASE' | 'PROF_SECONDAIRE' | 'FORMATEUR' | 'PROF_PREPA';
export type StudentType = 'SCOLAIRE' | 'FORMATION' | 'PREPA';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  nickname: string;
  bio: string;
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
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
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
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
  level: 'YEAR1' | 'YEAR2' | 'YEAR3' | 'YEAR4' | 'YEAR5' | 'YEAR6' | 'YEAR7' | 'YEAR8' | 'YEAR9' | 'YEAR10' | 'YEAR11' | 'YEAR12' | 'YEAR13' | 'PREPA1' | 'PREPA2' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
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
    detailedSummary?: string;
    learnedGroups: {
      group: string;
      words: string[];
    }[];
    examples?: {
      title: string;
      text: string;
    }[];
  };
  pdfBase64?: string | null;
  pdfFilename?: string | null;
  timestamp: string;
} 

export interface TranscriptionData {
  type: 'transcription';
  content: string;
  timestamp: string;
  isUser: boolean;
}

export interface StudentThemeSelectedData {
  type: 'student_theme_selected';
  theme: {
    id: string;
    label: string;
    group?: string;
  };
  targetLanguage?: 'fr' | 'en';
  timestamp: string;
}

export type DataTrackMessage = SessionSummaryData | TranscriptionData | StudentThemeSelectedData;
