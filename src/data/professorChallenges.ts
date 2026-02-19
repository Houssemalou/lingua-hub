// ============================================
// Professor Challenges System
// ============================================

export type ChallengeSubject =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'French'
  | 'English'
  | 'Arabic'
  | 'EarthScience';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface ProfessorChallenge {
  id: string;
  professorId: string;
  professorName: string;
  subject: ChallengeSubject;
  difficulty: ChallengeDifficulty;
  title: string;
  titleFr: string;
  titleAr: string;
  question: string;
  questionFr: string;
  questionAr: string;
  options: string[];
  optionsFr: string[];
  optionsAr: string[];
  correctAnswer: number; // Index of correct option
  basePoints: number;
  imageUrl?: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  participantCount?: number;
}

export interface StudentChallengeAttempt {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  challengeId: string;
  attempts: number; // 1, 2, or 3
  pointsEarned: number;
  isCorrect: boolean;
  completedAt: string;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  totalPoints: number;
  challengesCompleted: number;
  perfectAnswers: number; // First attempt correct
}

// Subject configuration
export const challengeSubjects: { id: ChallengeSubject; name: string; nameFr: string; nameAr: string; icon: string; color: string }[] = [
  { id: 'Mathematics', name: 'Mathematics', nameFr: 'Mathématiques', nameAr: 'الرياضيات', icon: '📐', color: 'hsl(217, 91%, 60%)' },
  { id: 'Physics', name: 'Physics', nameFr: 'Physique', nameAr: 'الفيزياء', icon: '⚛️', color: 'hsl(262, 83%, 58%)' },
  { id: 'Chemistry', name: 'Chemistry', nameFr: 'Chimie', nameAr: 'الكيمياء', icon: '🧪', color: 'hsl(142, 71%, 45%)' },
  { id: 'Biology', name: 'Biology', nameFr: 'Biologie', nameAr: 'علم الأحياء', icon: '🧬', color: 'hsl(25, 95%, 53%)' },
  { id: 'EarthScience', name: 'Earth Science', nameFr: 'Sciences de la Terre', nameAr: 'علوم الأرض', icon: '🌍', color: 'hsl(200, 70%, 50%)' },
  { id: 'French', name: 'French', nameFr: 'Français', nameAr: 'الفرنسية', icon: '🇫🇷', color: 'hsl(340, 80%, 55%)' },
  { id: 'English', name: 'English', nameFr: 'Anglais', nameAr: 'الإنجليزية', icon: '🇬🇧', color: 'hsl(210, 80%, 55%)' },
  { id: 'Arabic', name: 'Arabic', nameFr: 'Arabe', nameAr: 'العربية', icon: '🇸🇦', color: 'hsl(150, 60%, 45%)' },
];

export const difficultyConfig: { id: ChallengeDifficulty; name: string; nameFr: string; nameAr: string; multiplier: number; color: string }[] = [
  { id: 'easy', name: 'Easy', nameFr: 'Facile', nameAr: 'سهل', multiplier: 1, color: 'hsl(142, 71%, 45%)' },
  { id: 'medium', name: 'Medium', nameFr: 'Moyen', nameAr: 'متوسط', multiplier: 1.5, color: 'hsl(48, 96%, 53%)' },
  { id: 'hard', name: 'Hard', nameFr: 'Difficile', nameAr: 'صعب', multiplier: 2, color: 'hsl(0, 84%, 60%)' },
];

// Calculate points based on attempt
export const calculateChallengePoints = (basePoints: number, difficulty: ChallengeDifficulty, attempt: number): number => {
  const diffConfig = difficultyConfig.find(d => d.id === difficulty);
  const multiplier = diffConfig?.multiplier || 1;
  const totalPoints = Math.round(basePoints * multiplier);

  if (attempt === 1) return totalPoints; // Full points
  if (attempt === 2) return Math.round(totalPoints / 2); // Half points
  return 0; // No points after 2 attempts
};
