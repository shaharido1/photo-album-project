/**
 * Centralized API Client
 *
 * Provides a single source of truth for all API endpoints and a typed
 * fetch wrapper with authentication support.
 */

import { getIdToken } from './authService';
import { API_ENDPOINTS, type ApiEndpoint } from '@photo-album/types';
export { API_ENDPOINTS, type ApiEndpoint };

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
  console.log(`[API] Request: ${method} ${endpoint}`, { authenticated, body });

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

  try {
    const response = await fetch(endpoint, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ApiError;
      console.error(`[API] Error Response: ${response.status} ${endpoint}`, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content responses (common for DELETE operations)
    if (response.status === 204) {
      console.log(`[API] Success (204 No Content): ${endpoint}`);
      return undefined as T;
    }

    const data = await response.json();
    console.log(`[API] Success: ${endpoint}`, data);
    return data as T;
  } catch (err) {
    console.error(`[API] Fetch Exception: ${endpoint}`, err);
    throw err;
  }
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
  console.log('[uploadFiles] Starting upload to:', endpoint, 'files:', files.length, 'fieldName:', fieldName);
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
      console.log('[uploadFiles] XHR load event, status:', xhr.status, 'response:', xhr.responseText.substring(0, 500));
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as T;
          console.log('[uploadFiles] Parsed response:', response);
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
/**
 * Stream SSE events from a POST endpoint
 *
 * @param endpoint - API endpoint
 * @param body - Request body
 * @param onEvent - Callback for each SSE event
 * @param onError - Callback for errors
 * @param onComplete - Callback when stream ends
 */
export async function streamSSE<T>(
  endpoint: ApiEndpoint | string,
  body: unknown,
  onEvent: (event: T) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<void> {
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as T;
            onEvent(data);
          } catch {
            console.warn('[SSE] Failed to parse event:', line);
          }
        }
      }
    }

    onComplete?.();
  } catch (error) {
    console.error('[SSE] Stream error:', error);
    onError?.(error instanceof Error ? error : new Error('Stream failed'));
  }
}

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

  /**
   * Stream SSE events from a POST endpoint
   */
  streamSSE<T>(
    endpoint: ApiEndpoint | string,
    body: unknown,
    onEvent: (event: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    return streamSSE<T>(endpoint, body, onEvent, onError, onComplete);
  },
};
