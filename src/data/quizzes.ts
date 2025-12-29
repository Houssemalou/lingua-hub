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

export const getQuizForSession = (sessionId: string): Quiz | undefined => {
  return mockQuizzes.find(q => q.sessionId === sessionId);
};

export const getPendingQuizzes = (): Quiz[] => {
  return mockQuizzes.filter(q => !q.completed);
};
