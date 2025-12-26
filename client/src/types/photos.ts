/**
 * Photos State Type Definitions
 * Types for photos state management
 */

import type { Photo } from '@photo-album/types';

export type PhotosStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type UploadStatus = 'idle' | 'uploading' | 'succeeded' | 'failed';

export interface UploadProgress {
  current: number;
  total: number;
  progress: number;
}

export interface PhotosState {
  items: Photo[];
  selectedIds: string[];
  status: PhotosStatus;
  error: string | null;
  uploadStatus: UploadStatus;
  uploadProgress: UploadProgress | null;
  uploadError: string | null;
}
