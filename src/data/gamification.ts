// ============================================
// Gamification System
// ============================================

export interface Achievement {
  id: string;
  name: string;
  nameFr: string;
  nameAr: string;
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  icon: string;
  category: 'learning' | 'social' | 'streak' | 'mastery' | 'special';
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  titleFr: string;
  titleAr: string;
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  type: 'quiz' | 'exercise' | 'session' | 'practice';
  subject: string;
  points: number;
  completed: boolean;
  expiresAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  points: number;
  level: number;
  streak: number;
}

export interface GameReward {
  id: string;
  type: 'xp' | 'badge' | 'trophy' | 'streak_bonus';
  value: number;
  message: string;
  messageFr: string;
  messageAr: string;
}

export interface MiniGame {
  id: string;
  name: string;
  nameFr: string;
  nameAr: string;
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  type: 'math_puzzle' | 'word_match' | 'equation_race' | 'memory_cards' | 'drag_drop';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
  maxPoints: number;
  icon: string;
}

// Mock achievements
export const mockAchievements: Achievement[] = [
  {
    id: 'ach-1',
    name: 'First Steps',
    nameFr: 'Premiers pas',
    nameAr: 'الخطوات الأولى',
    description: 'Complete your first session',
    descriptionFr: 'Terminez votre première session',
    descriptionAr: 'أكمل جلستك الأولى',
    icon: '🎯',
    category: 'learning',
    points: 50,
    unlocked: true,
    unlockedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'ach-2',
    name: 'Math Wizard',
    nameFr: 'Magicien des Maths',
    nameAr: 'ساحر الرياضيات',
    description: 'Score 100% on 5 math quizzes',
    descriptionFr: 'Obtenez 100% sur 5 quiz de maths',
    descriptionAr: 'احصل على 100% في 5 اختبارات رياضيات',
    icon: '🧙‍♂️',
    category: 'mastery',
    points: 200,
    unlocked: false,
    progress: 3,
    maxProgress: 5
  },
  {
    id: 'ach-3',
    name: 'Week Warrior',
    nameFr: 'Guerrier de la Semaine',
    nameAr: 'محارب الأسبوع',
    description: 'Maintain a 7-day study streak',
    descriptionFr: 'Maintenez une série de 7 jours',
    descriptionAr: 'حافظ على سلسلة دراسة 7 أيام',
    icon: '🔥',
    category: 'streak',
    points: 150,
    unlocked: true,
    unlockedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'ach-4',
    name: 'Science Explorer',
    nameFr: 'Explorateur Scientifique',
    nameAr: 'مستكشف العلوم',
    description: 'Try all science subjects',
    descriptionFr: 'Essayez toutes les matières scientifiques',
    descriptionAr: 'جرب جميع المواد العلمية',
    icon: '🔬',
    category: 'special',
    points: 100,
    unlocked: false,
    progress: 2,
    maxProgress: 4
  },
  {
    id: 'ach-5',
    name: 'Team Player',
    nameFr: 'Esprit d\'équipe',
    nameAr: 'روح الفريق',
    description: 'Participate in 10 group sessions',
    descriptionFr: 'Participez à 10 sessions de groupe',
    descriptionAr: 'شارك في 10 جلسات جماعية',
    icon: '🤝',
    category: 'social',
    points: 120,
    unlocked: false,
    progress: 7,
    maxProgress: 10
  },
  {
    id: 'ach-6',
    name: 'Polyglot',
    nameFr: 'Polyglotte',
    nameAr: 'متعدد اللغات',
    description: 'Learn 3 different languages',
    descriptionFr: 'Apprenez 3 langues différentes',
    descriptionAr: 'تعلم 3 لغات مختلفة',
    icon: '🌍',
    category: 'mastery',
    points: 250,
    unlocked: false,
    progress: 2,
    maxProgress: 3
  }
];

// Mock daily challenges
export const mockDailyChallenges: DailyChallenge[] = [
  {
    id: 'dc-1',
    title: 'Math Sprint',
    titleFr: 'Sprint Mathématique',
    titleAr: 'سباق الرياضيات',
    description: 'Solve 10 algebra problems in under 5 minutes',
    descriptionFr: 'Résolvez 10 problèmes d\'algèbre en moins de 5 minutes',
    descriptionAr: 'حل 10 مسائل جبرية في أقل من 5 دقائق',
    type: 'exercise',
    subject: 'Mathematics',
    points: 75,
    completed: false,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dc-2',
    title: 'Vocabulary Builder',
    titleFr: 'Constructeur de Vocabulaire',
    titleAr: 'باني المفردات',
    description: 'Learn 15 new French words',
    descriptionFr: 'Apprenez 15 nouveaux mots français',
    descriptionAr: 'تعلم 15 كلمة فرنسية جديدة',
    type: 'practice',
    subject: 'French',
    points: 50,
    completed: true,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'dc-3',
    title: 'Physics Challenge',
    titleFr: 'Défi de Physique',
    titleAr: 'تحدي الفيزياء',
    description: 'Complete the mechanics quiz with 80%+ accuracy',
    descriptionFr: 'Terminez le quiz de mécanique avec 80%+ de précision',
    descriptionAr: 'أكمل اختبار الميكانيكا بدقة 80%+',
    type: 'quiz',
    subject: 'Physics',
    points: 100,
    completed: false,
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  }
];

// Mock leaderboard
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, studentId: '3', studentName: 'Fatima Zahra', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', points: 2450, level: 15, streak: 21 },
  { rank: 2, studentId: '1', studentName: 'Sarah Johnson', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', points: 2180, level: 13, streak: 14 },
  { rank: 3, studentId: '2', studentName: 'Mohammed Ali', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed', points: 1920, level: 12, streak: 7 },
  { rank: 4, studentId: '5', studentName: 'Amina Khalil', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina', points: 1750, level: 11, streak: 10 },
  { rank: 5, studentId: '4', studentName: 'Youssef Benali', studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef', points: 1580, level: 10, streak: 5 }
];

// Mock mini-games
export const mockMiniGames: MiniGame[] = [
  {
    id: 'game-1',
    name: 'Equation Race',
    nameFr: 'Course aux Équations',
    nameAr: 'سباق المعادلات',
    description: 'Solve equations as fast as you can!',
    descriptionFr: 'Résolvez les équations le plus vite possible!',
    descriptionAr: 'حل المعادلات بأسرع ما يمكنك!',
    type: 'equation_race',
    subject: 'Mathematics',
    difficulty: 'medium',
    timeLimit: 120,
    maxPoints: 500,
    icon: '🏎️'
  },
  {
    id: 'game-2',
    name: 'Word Match',
    nameFr: 'Associations de Mots',
    nameAr: 'مطابقة الكلمات',
    description: 'Match words with their translations',
    descriptionFr: 'Associez les mots avec leurs traductions',
    descriptionAr: 'طابق الكلمات مع ترجماتها',
    type: 'word_match',
    subject: 'French',
    difficulty: 'easy',
    timeLimit: 90,
    maxPoints: 300,
    icon: '🔗'
  },
  {
    id: 'game-3',
    name: 'Math Puzzle',
    nameFr: 'Puzzle Mathématique',
    nameAr: 'لغز رياضي',
    description: 'Drag numbers to complete the equation',
    descriptionFr: 'Glissez les nombres pour compléter l\'équation',
    descriptionAr: 'اسحب الأرقام لإكمال المعادلة',
    type: 'drag_drop',
    subject: 'Mathematics',
    difficulty: 'hard',
    timeLimit: 180,
    maxPoints: 750,
    icon: '🧩'
  },
  {
    id: 'game-4',
    name: 'Element Memory',
    nameFr: 'Mémoire des Éléments',
    nameAr: 'ذاكرة العناصر',
    description: 'Match chemical elements with their symbols',
    descriptionFr: 'Associez les éléments chimiques avec leurs symboles',
    descriptionAr: 'طابق العناصر الكيميائية مع رموزها',
    type: 'memory_cards',
    subject: 'Chemistry',
    difficulty: 'medium',
    timeLimit: 150,
    maxPoints: 400,
    icon: '🧠'
  }
];

// Gamification utilities
export const calculateLevel = (points: number): number => {
  return Math.floor(points / 200) + 1;
};

export const getPointsForNextLevel = (currentLevel: number): number => {
  return currentLevel * 200;
};

export const getStudentStats = (studentId: string) => {
  const entry = mockLeaderboard.find(e => e.studentId === studentId);
  return entry || { points: 0, level: 1, streak: 0 };
};
