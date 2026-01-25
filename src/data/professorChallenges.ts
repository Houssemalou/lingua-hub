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

// Mock professor challenges
export const mockProfessorChallenges: ProfessorChallenge[] = [
  {
    id: 'pc-1',
    professorId: 'prof-1',
    professorName: 'Dr. Martin',
    subject: 'Mathematics',
    difficulty: 'medium',
    title: 'Equation Challenge',
    titleFr: 'Défi d\'équation',
    titleAr: 'تحدي المعادلة',
    question: 'What is the value of x in the equation: 2x + 5 = 15?',
    questionFr: 'Quelle est la valeur de x dans l\'équation: 2x + 5 = 15?',
    questionAr: 'ما قيمة x في المعادلة: 2x + 5 = 15؟',
    options: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
    optionsFr: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
    optionsAr: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
    correctAnswer: 1,
    basePoints: 50,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'pc-2',
    professorId: 'prof-2',
    professorName: 'Prof. Dubois',
    subject: 'French',
    difficulty: 'easy',
    title: 'Conjugaison',
    titleFr: 'Conjugaison',
    titleAr: 'التصريف',
    question: 'Complete: Nous _____ (aller) au cinéma hier.',
    questionFr: 'Complétez: Nous _____ (aller) au cinéma hier.',
    questionAr: 'أكمل: Nous _____ (aller) au cinéma hier.',
    options: ['allons', 'sommes allés', 'irons', 'allaient'],
    optionsFr: ['allons', 'sommes allés', 'irons', 'allaient'],
    optionsAr: ['allons', 'sommes allés', 'irons', 'allaient'],
    correctAnswer: 1,
    basePoints: 30,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'pc-3',
    professorId: 'prof-1',
    professorName: 'Dr. Martin',
    subject: 'Physics',
    difficulty: 'hard',
    title: 'Newton\'s Laws',
    titleFr: 'Lois de Newton',
    titleAr: 'قوانين نيوتن',
    question: 'A 5kg object accelerates at 3 m/s². What is the net force?',
    questionFr: 'Un objet de 5kg accélère à 3 m/s². Quelle est la force nette?',
    questionAr: 'جسم كتلته 5 كجم يتسارع بمعدل 3 م/ث². ما القوة المحصلة؟',
    options: ['8 N', '15 N', '2 N', '1.67 N'],
    optionsFr: ['8 N', '15 N', '2 N', '1.67 N'],
    optionsAr: ['8 N', '15 N', '2 N', '1.67 N'],
    correctAnswer: 1,
    basePoints: 75,
    imageUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'pc-4',
    professorId: 'prof-3',
    professorName: 'Dr. Ahmed',
    subject: 'Chemistry',
    difficulty: 'medium',
    title: 'Periodic Table',
    titleFr: 'Tableau Périodique',
    titleAr: 'الجدول الدوري',
    question: 'What is the chemical symbol for Gold?',
    questionFr: 'Quel est le symbole chimique de l\'Or?',
    questionAr: 'ما هو الرمز الكيميائي للذهب؟',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    optionsFr: ['Go', 'Gd', 'Au', 'Ag'],
    optionsAr: ['Go', 'Gd', 'Au', 'Ag'],
    correctAnswer: 2,
    basePoints: 40,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'pc-5',
    professorId: 'prof-4',
    professorName: 'Prof. Smith',
    subject: 'English',
    difficulty: 'easy',
    title: 'Grammar Challenge',
    titleFr: 'Défi de Grammaire',
    titleAr: 'تحدي القواعد',
    question: 'Choose the correct form: She _____ to the store yesterday.',
    questionFr: 'Choisissez la forme correcte: She _____ to the store yesterday.',
    questionAr: 'اختر الشكل الصحيح: She _____ to the store yesterday.',
    options: ['go', 'goes', 'went', 'going'],
    optionsFr: ['go', 'goes', 'went', 'going'],
    optionsAr: ['go', 'goes', 'went', 'going'],
    correctAnswer: 2,
    basePoints: 25,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'pc-6',
    professorId: 'prof-5',
    professorName: 'Dr. Fatima',
    subject: 'EarthScience',
    difficulty: 'medium',
    title: 'Geology Quiz',
    titleFr: 'Quiz de Géologie',
    titleAr: 'اختبار الجيولوجيا',
    question: 'What type of rock is formed from cooled lava?',
    questionFr: 'Quel type de roche est formé à partir de lave refroidie?',
    questionAr: 'ما نوع الصخور التي تتكون من الحمم المبردة؟',
    options: ['Sedimentary', 'Metamorphic', 'Igneous', 'Fossil'],
    optionsFr: ['Sédimentaire', 'Métamorphique', 'Ignée', 'Fossile'],
    optionsAr: ['رسوبية', 'متحولة', 'نارية', 'أحفورية'],
    correctAnswer: 2,
    basePoints: 45,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    isActive: true
  }
];

// Mock student attempts
export const mockStudentAttempts: StudentChallengeAttempt[] = [
  {
    id: 'att-1',
    studentId: '1',
    studentName: 'Sarah Johnson',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    challengeId: 'pc-1',
    attempts: 1,
    pointsEarned: 75,
    isCorrect: true,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'att-2',
    studentId: '2',
    studentName: 'Mohammed Ali',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
    challengeId: 'pc-1',
    attempts: 2,
    pointsEarned: 37,
    isCorrect: true,
    completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'att-3',
    studentId: '3',
    studentName: 'Fatima Zahra',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    challengeId: 'pc-2',
    attempts: 1,
    pointsEarned: 30,
    isCorrect: true,
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

// Mock challenge leaderboard
export const mockChallengeLeaderboard: ChallengeLeaderboardEntry[] = [
  { rank: 1, studentId: '3', studentName: 'Fatima Zahra', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', totalPoints: 520, challengesCompleted: 12, perfectAnswers: 8 },
  { rank: 2, studentId: '1', studentName: 'Sarah Johnson', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', totalPoints: 485, challengesCompleted: 10, perfectAnswers: 7 },
  { rank: 3, studentId: '2', studentName: 'Mohammed Ali', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed', totalPoints: 410, challengesCompleted: 9, perfectAnswers: 5 },
  { rank: 4, studentId: '5', studentName: 'Amina Khalil', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina', totalPoints: 355, challengesCompleted: 8, perfectAnswers: 4 },
  { rank: 5, studentId: '4', studentName: 'Youssef Benali', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef', totalPoints: 290, challengesCompleted: 7, perfectAnswers: 3 },
];

// Utility functions
export const getActiveChallenges = (): ProfessorChallenge[] => {
  return mockProfessorChallenges.filter(c => c.isActive && new Date(c.expiresAt) > new Date());
};

export const getChallengesBySubject = (subject: ChallengeSubject): ProfessorChallenge[] => {
  return getActiveChallenges().filter(c => c.subject === subject);
};

export const getStudentChallengeAttempt = (studentId: string, challengeId: string): StudentChallengeAttempt | undefined => {
  return mockStudentAttempts.find(a => a.studentId === studentId && a.challengeId === challengeId);
};

export const hasStudentCompletedChallenge = (studentId: string, challengeId: string): boolean => {
  const attempt = getStudentChallengeAttempt(studentId, challengeId);
  return !!attempt?.isCorrect;
};
