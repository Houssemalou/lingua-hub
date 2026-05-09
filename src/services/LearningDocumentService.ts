import { API_BASE_URL } from '@/lib/apiClient';
import {
  ApiResponse,
  CreateLearningDocumentDTO,
  LearningDocumentCommentModel,
  LearningDocumentCategory,
  LearningDocumentSubject,
  LearningDocumentModel,
  UpdateLearningDocumentDTO,
  DocumentAccessModel,
  DocumentAccessResponse,
} from '@/models';

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
}

const toErrorMessage = (fallback: string, payload?: BackendResponse<unknown>) => {
  if (!payload) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  return payload.message || fallback;
};

const parseResponse = async <T>(response: Response, fallback: string): Promise<ApiResponse<T>> => {
  let payload: BackendResponse<T> | undefined;
  try {
    payload = (await response.json()) as BackendResponse<T>;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload?.success) {
    return { success: false, error: toErrorMessage(fallback, payload) };
  }

  return { success: true, data: payload.data };
};

const buildFormData = (data: Partial<CreateLearningDocumentDTO & UpdateLearningDocumentDTO>) => {
  const formData = new FormData();

  if (data.title !== undefined) formData.append('title', data.title);
  if (data.category !== undefined) formData.append('category', data.category);
  if (data.subject !== undefined) formData.append('subject', data.subject);
  if (data.level !== undefined) formData.append('level', data.level);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.isPublished !== undefined) formData.append('isPublished', String(data.isPublished));
  if (data.file) formData.append('file', data.file);
  if (data.correctionAvailableAt !== undefined) formData.append('correctionAvailableAt', data.correctionAvailableAt);
  if (data.correctionFile) formData.append('correctionFile', data.correctionFile);
  if (data.removeCorrection !== undefined) formData.append('removeCorrection', String(data.removeCorrection));

  return formData;
};

export const LearningDocumentService = {
  async getMyDocuments(): Promise<ApiResponse<LearningDocumentModel[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/my`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<LearningDocumentModel[]>(response, 'Failed to load your documents');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load your documents' };
    }
  },

  async getStudentDocuments(level?: string, category?: LearningDocumentCategory, subject?: LearningDocumentSubject): Promise<ApiResponse<LearningDocumentModel[]>> {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (category) params.append('category', category);
      if (subject) params.append('subject', subject);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/learning-documents/student${query}`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<LearningDocumentModel[]>(response, 'Failed to load student documents');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load student documents' };
    }
  },

  async downloadDocument(documentId: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to download document' };
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to download document' };
    }
  },

  async downloadCorrection(documentId: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/correction/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to download correction' };
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to download correction' };
    }
  },

  async createDocument(data: CreateLearningDocumentDTO): Promise<ApiResponse<LearningDocumentModel>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents`, {
        method: 'POST',
        credentials: 'include',
        body: buildFormData(data),
      });
      return await parseResponse<LearningDocumentModel>(response, 'Failed to create document');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create document' };
    }
  },

  async updateDocument(documentId: string, data: UpdateLearningDocumentDTO): Promise<ApiResponse<LearningDocumentModel>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}`, {
        method: 'PUT',
        credentials: 'include',
        body: buildFormData(data),
      });
      return await parseResponse<LearningDocumentModel>(response, 'Failed to update document');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update document' };
    }
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const parsed = await parseResponse<unknown>(response, 'Failed to delete document');
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete document' };
    }
  },

  async getComments(documentId: string): Promise<ApiResponse<LearningDocumentCommentModel[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/comments`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<LearningDocumentCommentModel[]>(response, 'Failed to load comments');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load comments' };
    }
  },

  async addComment(documentId: string, content: string): Promise<ApiResponse<LearningDocumentCommentModel>> {
    try {
      const body = new URLSearchParams();
      body.append('content', content);

      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      return await parseResponse<LearningDocumentCommentModel>(response, 'Failed to add comment');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add comment' };
    }
  },

  async updateComment(documentId: string, commentId: string, content: string): Promise<ApiResponse<LearningDocumentCommentModel>> {
    try {
      const body = new URLSearchParams();
      body.append('content', content);

      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/comments/${commentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      return await parseResponse<LearningDocumentCommentModel>(response, 'Failed to update comment');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update comment' };
    }
  },

  async deleteComment(documentId: string, commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const parsed = await parseResponse<unknown>(response, 'Failed to delete comment');
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete comment' };
    }
  },

  async getDocumentAccess(documentId: string, page: number = 1, pageSize: number = 10): Promise<ApiResponse<DocumentAccessResponse>> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));

      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/access?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<DocumentAccessResponse>(response, 'Failed to load student access list');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load student access list' };
    }
  },

  async trackDocumentAccess(documentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/learning-documents/${documentId}/access`, {
        method: 'POST',
        credentials: 'include',
      });
      return await parseResponse<void>(response, 'Failed to track document access');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to track document access' };
    }
  },
};

export default LearningDocumentService;
