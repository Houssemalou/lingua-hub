import { ChallengeSubject, ChallengeDifficulty } from '@/data/professorChallenges';
import { LearningDocumentSubject } from '@/models/LearningDocument';
import { apiClient } from '@/lib/apiClient';

export interface AiGeneratedChallenge {
  subject: ChallengeSubject;
  difficulty: ChallengeDifficulty;
  title: string;
  question: string;
  options: string[];
  correctAnswer: number;
  basePoints: number;
  targetLevel: string | null;
  expiresIn: number;
}

const STORAGE_KEYS = {
  PROFESSOR_DAILY: 'ai_challenge_professor_daily',
  APPROVED_DOCS: 'ai_challenge_approved_docs',
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface BackendAiChallenge {
  subject: string;
  difficulty: string;
  title: string;
  question: string;
  options: string[];
  correctAnswer: number;
  basePoints: number;
  targetLevel: string | null;
  expiresIn: number;
}

interface BackendAiResponse {
  success: boolean;
  message: string;
  data: {
    challenges: BackendAiChallenge[];
  };
}

const VALID_SUBJECTS: ChallengeSubject[] = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'EarthScience',
  'French', 'English', 'Arabic',
];

export const GeminiService = {
  async generateChallenges(
    fileBlob: Blob,
    mimeType: string,
    subject: LearningDocumentSubject,
    level: string,
    count: number,
  ): Promise<AiGeneratedChallenge[]> {
    const base64Data = await blobToBase64(fileBlob);

    const response = await apiClient.post<BackendAiResponse>('/ai/generate-challenges', {
      fileBase64: base64Data,
      mimeType,
      subject,
      level,
      count,
    });

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la génération des défis');
    }

    return (response.data?.challenges || []).map((item) => ({
      subject: (VALID_SUBJECTS.includes(item.subject as ChallengeSubject)
        ? item.subject
        : 'Mathematics') as ChallengeSubject,
      difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty)
        ? item.difficulty
        : 'medium') as ChallengeDifficulty,
      title: item.title,
      question: item.question,
      options: item.options?.length === 4 ? item.options : ['', '', '', ''],
      correctAnswer: item.correctAnswer >= 0 && item.correctAnswer <= 3 ? item.correctAnswer : 0,
      basePoints: item.basePoints >= 10 && item.basePoints <= 200 ? item.basePoints : 50,
      targetLevel: level,
      expiresIn: 168,
    }));
  },

  canGenerateToday(): boolean {
    const lastGen = localStorage.getItem(STORAGE_KEYS.PROFESSOR_DAILY);
    if (!lastGen) return true;
    const today = new Date().toISOString().split('T')[0];
    return lastGen !== today;
  },

  markGeneratedToday(): void {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.PROFESSOR_DAILY, today);
  },

  hasApprovedChallenges(documentId: string): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPROVED_DOCS);
      if (!stored) return false;
      const docs: string[] = JSON.parse(stored);
      return docs.includes(documentId);
    } catch {
      return false;
    }
  },

  markChallengesApproved(documentId: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPROVED_DOCS);
      const docs: string[] = stored ? JSON.parse(stored) : [];
      if (!docs.includes(documentId)) {
        docs.push(documentId);
        localStorage.setItem(STORAGE_KEYS.APPROVED_DOCS, JSON.stringify(docs));
      }
    } catch {
      const docs = [documentId];
      localStorage.setItem(STORAGE_KEYS.APPROVED_DOCS, JSON.stringify(docs));
    }
  },
};

export default GeminiService;
