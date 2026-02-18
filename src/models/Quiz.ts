// ============================================
// Quiz Model
// ============================================

export interface QuizQuestionModel {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
}

export interface QuizModel {
  id: string;
  title: string;
  description: string;
  sessionId: string;
  sessionName?: string;
  language?: string;
  questions: QuizQuestionModel[];
  createdBy: string; // professorId
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  isPublished: boolean;
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage
}

export interface CreateQuizDTO {
  title: string;
  description: string;
  sessionId: string;
  language: string;
  questions: Omit<QuizQuestionModel, 'id'>[];
  timeLimit?: number;
  passingScore?: number;
}

export interface UpdateQuizDTO {
  title?: string;
  description?: string;
  questions?: Omit<QuizQuestionModel, 'id'>[];
  timeLimit?: number;
  passingScore?: number;
  isPublished?: boolean;
}

export interface QuizResultModel {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  sessionName?: string;
  language?: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  passed: boolean;
  answers?: QuizAnswerModel[];
}

export interface QuizAnswerModel {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface SubmitQuizDTO {
  quizId: string;
  answers: { questionId: string; selectedAnswer: number }[];
}

export interface QuizFilters {
  sessionId?: string;
  language?: string;
  isPublished?: boolean;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}
