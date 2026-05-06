import { LanguageLevel } from './Room';

export interface CourseModel {
  id: string;
  name: string;
  level: LanguageLevel;
  description?: string;
  fileName: string;
  objectKey?: string;
  fileNames?: string[];
  objectKeys?: string[];
  fileUrls?: string[];
  fileSize?: number;
  contentType?: string;
  professorId?: string;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseDTO {
  name: string;
  level: LanguageLevel;
  description?: string;
  files: File[];
}

export interface UpdateCourseDTO {
  name?: string;
  level?: LanguageLevel;
  description?: string;
  files?: File[];
}
