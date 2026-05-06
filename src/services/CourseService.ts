import { API_BASE_URL } from '@/lib/apiClient';
import { ApiResponse, CourseModel, CreateCourseDTO, UpdateCourseDTO } from '@/models';

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

const buildCourseFormData = (data: Partial<CreateCourseDTO & UpdateCourseDTO>) => {
  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.level !== undefined) formData.append('level', data.level);
  if (data.description !== undefined) formData.append('description', data.description);
  if (Array.isArray(data.files)) {
    data.files.forEach((file) => {
      formData.append('files', file);
    });
  }
  return formData;
};

export const CourseService = {
  async getMyCourses(): Promise<ApiResponse<CourseModel[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<CourseModel[]>(response, 'Failed to load courses');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load courses' };
    }
  },

  async getCoursesByLevel(level?: string): Promise<ApiResponse<CourseModel[]>> {
    try {
      const query = level ? `?level=${encodeURIComponent(level)}` : '';
      const response = await fetch(`${API_BASE_URL}/courses/by-level${query}`, {
        method: 'GET',
        credentials: 'include',
      });
      return await parseResponse<CourseModel[]>(response, 'Failed to load courses by level');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to load courses by level' };
    }
  },

  async createCourse(data: CreateCourseDTO): Promise<ApiResponse<CourseModel>> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        credentials: 'include',
        body: buildCourseFormData(data),
      });
      return await parseResponse<CourseModel>(response, 'Failed to create course');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create course' };
    }
  },

  async updateCourse(courseId: string, data: UpdateCourseDTO): Promise<ApiResponse<CourseModel>> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'PUT',
        credentials: 'include',
        body: buildCourseFormData(data),
      });
      return await parseResponse<CourseModel>(response, 'Failed to update course');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update course' };
    }
  },

  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const parsed = await parseResponse<unknown>(response, 'Failed to delete course');
      if (!parsed.success) {
        return { success: false, error: parsed.error };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete course' };
    }
  },
};

export default CourseService;
