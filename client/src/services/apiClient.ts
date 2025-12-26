/**
 * Centralized API Client
 *
 * Provides a single source of truth for all API endpoints and a typed
 * fetch wrapper with authentication support.
 */

import { getIdToken } from './authService';

/**
 * API endpoint definitions
 */
export const API_ENDPOINTS = {
  HELLO: '/api/hello',
  VERSION: '/api/version',
  FOO: '/api/foo',
  PHOTOS: '/api/photos',
  ALBUMS: '/api/albums',
  FEEDBACK: '/api/feedback',
  // Google Photos endpoints
  GOOGLE_PHOTOS_AUTH_START: '/api/google-photos/auth/start',
  GOOGLE_PHOTOS_STATUS: '/api/google-photos/status',
  GOOGLE_PHOTOS_DISCONNECT: '/api/google-photos/disconnect',
  GOOGLE_PHOTOS_ALBUMS: '/api/google-photos/albums',
  GOOGLE_PHOTOS_PHOTOS: '/api/google-photos/photos',
  GOOGLE_PHOTOS_IMPORT: '/api/google-photos/import',
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

/**
 * API response types
 */
export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
  /** Include authentication token in request */
  authenticated?: boolean;
  /** Additional headers to include */
  headers?: HeadersInit;
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** HTTP method (defaults to GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Get authentication headers if user is logged in
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Generic API fetch wrapper with authentication support
 *
 * @param endpoint - API endpoint from API_ENDPOINTS
 * @param options - Request options
 * @returns Parsed JSON response
 * @throws Error if request fails or response is not ok
 */
export async function apiFetch<T>(
  endpoint: ApiEndpoint | string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { authenticated = false, headers = {}, body, method = 'GET' } = options;

  const requestHeaders: HeadersInit = {
    ...headers,
  };

  // Add auth headers if requested
  if (authenticated) {
    const authHeaders = await getAuthHeaders();
    Object.assign(requestHeaders, authHeaders);
  }

  // Add content-type for requests with body
  if (body) {
    Object.assign(requestHeaders, { 'Content-Type': 'application/json' });
  }

  const response = await fetch(endpoint, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Upload a file with progress tracking
 *
 * @param endpoint - API endpoint
 * @param file - File to upload
 * @param fieldName - Form field name for the file
 * @param onProgress - Progress callback (0-100)
 * @returns Parsed JSON response
 */
export async function uploadFile<T>(
  endpoint: ApiEndpoint | string,
  file: File,
  fieldName = 'photo',
  onProgress?: (progress: number) => void
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as T;
          resolve(response);
        } catch {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText) as ApiError;
          reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    const formData = new FormData();
    formData.append(fieldName, file);

    xhr.open('POST', endpoint);

    // Set auth headers
    Object.entries(authHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value as string);
    });

    xhr.send(formData);
  });
}

/**
 * Upload multiple files with progress tracking
 *
 * @param endpoint - API endpoint
 * @param files - Files to upload
 * @param fieldName - Form field name for the files
 * @param onProgress - Progress callback (0-100)
 * @returns Parsed JSON response
 */
export async function uploadFiles<T>(
  endpoint: ApiEndpoint | string,
  files: File[],
  fieldName = 'photos',
  onProgress?: (progress: number) => void
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as T;
          resolve(response);
        } catch {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText) as ApiError;
          reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    xhr.open('POST', endpoint);

    // Set auth headers
    Object.entries(authHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value as string);
    });

    xhr.send(formData);
  });
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get<T>(endpoint: ApiEndpoint | string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post<T>(endpoint: ApiEndpoint | string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'POST', body });
  },

  /**
   * PUT request
   */
  put<T>(endpoint: ApiEndpoint | string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'PUT', body });
  },

  /**
   * PATCH request
   */
  patch<T>(endpoint: ApiEndpoint | string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: ApiEndpoint | string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Upload a single file
   */
  uploadFile<T>(
    endpoint: ApiEndpoint | string,
    file: File,
    fieldName?: string,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return uploadFile<T>(endpoint, file, fieldName, onProgress);
  },

  /**
   * Upload multiple files
   */
  uploadFiles<T>(
    endpoint: ApiEndpoint | string,
    files: File[],
    fieldName?: string,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return uploadFiles<T>(endpoint, files, fieldName, onProgress);
  },
};
