import { LanguageLevel } from './Room';

export type LearningDocumentCategory = 'COURSE' | 'HOMEWORK' | 'EXERCISE';
export type LearningDocumentSubject =
  | 'ARABIC'
  | 'FRENCH'
  | 'ENGLISH'
  | 'MATHEMATICS'
  | 'SCIENCE'
  | 'HISTORY_GEOGRAPHY'
  | 'CIVIC_EDUCATION'
  | 'ISLAMIC_EDUCATION'
  | 'TECHNOLOGY'
  | 'ARTS'
  | 'OTHER';

export interface LearningDocumentModel {
  id: string;
  title: string;
  category: LearningDocumentCategory;
  subject?: LearningDocumentSubject | null;
  level: LanguageLevel;
  description?: string;

  fileName: string;
  objectKey?: string;
  contentType?: string;
  fileSize?: number;
  fileUrl?: string;

  correctionFileName?: string;
  correctionObjectKey?: string;
  correctionContentType?: string;
  correctionFileSize?: number;
  correctionFileUrl?: string;
  correctionAvailableAt?: string;

  isPublished: boolean;
  professorId?: string;
  professorUserId?: string;
  professorName?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface LearningDocumentCommentModel {
  id: string;
  documentId: string;
  professorId?: string;
  professorUserId?: string;
  professorName?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLearningDocumentDTO {
  title: string;
  category: LearningDocumentCategory;
  subject: LearningDocumentSubject;
  level: LanguageLevel;
  description?: string;
  isPublished?: boolean;
  file: File;
  correctionFile?: File;
}

export interface UpdateLearningDocumentDTO {
  title?: string;
  category?: LearningDocumentCategory;
  subject?: LearningDocumentSubject;
  level?: LanguageLevel;
  description?: string;
  isPublished?: boolean;
  file?: File;
  correctionFile?: File;
  correctionAvailableAt?: string;
  removeCorrection?: boolean;
}

export interface CreateLearningDocumentCommentDTO {
  content: string;
}

export interface DocumentAccessModel {
  id: string;
  documentId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  level?: string;
  accessedAt: string;
  completedAt?: string;
  readTime?: number;
}

export interface DocumentAccessResponse {
  data: DocumentAccessModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
