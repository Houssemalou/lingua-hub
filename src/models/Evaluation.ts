// ============================================
// Evaluation Model
// ============================================

export interface EvaluationCriteria {
  pronunciation: number; // 0-100
  grammar: number; // 0-100
  vocabulary: number; // 0-100
  fluency: number; // 0-100
  participation: number; // 0-100
  comprehension: number; // 0-100
}

export interface EvaluationModel {
  id: string;
  sessionId: string;
  studentId: string;
  professorId: string;
  criteria: EvaluationCriteria;
  overallScore: number;
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEvaluationDTO {
  sessionId: string;
  studentId: string;
  criteria: EvaluationCriteria;
  feedback: string;
  strengths?: string[];
  areasToImprove?: string[];
}

export interface UpdateEvaluationDTO {
  criteria?: Partial<EvaluationCriteria>;
  feedback?: string;
  strengths?: string[];
  areasToImprove?: string[];
}

export interface EvaluationFilters {
  sessionId?: string;
  studentId?: string;
  professorId?: string;
  fromDate?: string;
  toDate?: string;
  minScore?: number;
  page?: number;
  limit?: number;
}

// Calculate overall score from criteria
export const calculateOverallScore = (criteria: EvaluationCriteria): number => {
  const weights = {
    pronunciation: 0.2,
    grammar: 0.2,
    vocabulary: 0.15,
    fluency: 0.2,
    participation: 0.1,
    comprehension: 0.15,
  };

  return Math.round(
    criteria.pronunciation * weights.pronunciation +
    criteria.grammar * weights.grammar +
    criteria.vocabulary * weights.vocabulary +
    criteria.fluency * weights.fluency +
    criteria.participation * weights.participation +
    criteria.comprehension * weights.comprehension
  );
};
