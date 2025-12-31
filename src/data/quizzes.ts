export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  sessionId: string;
  sessionName: string;
  language: string;
  questions: QuizQuestion[];
  completed: boolean;
  score?: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  sessionName: string;
  language: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  passed: boolean;
}

// Mock quizzes for completed sessions
export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    sessionId: '3',
    sessionName: 'Advanced English Grammar',
    language: 'English',
    questions: [
      {
        id: 'q1',
        question: 'Which sentence uses the correct grammatical structure?',
        options: [
          'If I would have known, I would have come.',
          'If I had known, I would have come.',
          'If I knew, I would have come.',
          'If I have known, I would have come.',
        ],
        correctAnswer: 1,
      },
      {
        id: 'q2',
        question: 'Choose the correct form: "She suggested that he ___ early."',
        options: ['leaves', 'left', 'leave', 'leaving'],
        correctAnswer: 2,
      },
      {
        id: 'q3',
        question: 'Which is the correct passive voice?',
        options: [
          'The book was being read by her.',
          'The book was read by she.',
          'The book is being read by her.',
          'The book was being reading by her.',
        ],
        correctAnswer: 0,
      },
    ],
    completed: false,
  },
];

// Mock quiz results for admin dashboard
export const mockQuizResults: QuizResult[] = [
  {
    id: 'result-1',
    quizId: 'quiz-1',
    studentId: '1',
    studentName: 'Sarah Johnson',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    sessionName: 'Advanced English Grammar',
    language: 'Anglais',
    score: 85,
    totalQuestions: 3,
    completedAt: '2024-01-15T10:30:00Z',
    passed: true,
  },
  {
    id: 'result-2',
    quizId: 'quiz-1',
    studentId: '2',
    studentName: 'Mohammed Ali',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
    sessionName: 'Conversation Française',
    language: 'Français',
    score: 67,
    totalQuestions: 3,
    completedAt: '2024-01-14T14:20:00Z',
    passed: true,
  },
  {
    id: 'result-3',
    quizId: 'quiz-1',
    studentId: '3',
    studentName: 'Fatima Zahra',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    sessionName: 'Spanish Basics',
    language: 'Espagnol',
    score: 100,
    totalQuestions: 3,
    completedAt: '2024-01-13T09:15:00Z',
    passed: true,
  },
  {
    id: 'result-4',
    quizId: 'quiz-1',
    studentId: '4',
    studentName: 'Youssef Benali',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef',
    sessionName: 'German Vocabulary',
    language: 'Allemand',
    score: 45,
    totalQuestions: 3,
    completedAt: '2024-01-12T16:45:00Z',
    passed: false,
  },
  {
    id: 'result-5',
    quizId: 'quiz-1',
    studentId: '5',
    studentName: 'Amina Khalil',
    studentAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina',
    sessionName: 'Italian Pronunciation',
    language: 'Italien',
    score: 78,
    totalQuestions: 3,
    completedAt: '2024-01-11T11:00:00Z',
    passed: true,
  },
];

export const getQuizForSession = (sessionId: string): Quiz | undefined => {
  return mockQuizzes.find(q => q.sessionId === sessionId);
};

export const getPendingQuizzes = (): Quiz[] => {
  return mockQuizzes.filter(q => !q.completed);
};

export const getQuizResults = (): QuizResult[] => {
  return mockQuizResults;
};
