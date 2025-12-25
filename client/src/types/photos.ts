/**
 * Photos State Type Definitions
 * Types for photos state management
 */

import type { Photo } from './api';

export type PhotosStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PhotosState {
  items: Photo[];
  selectedIds: string[];
  status: PhotosStatus;
  error: string | null;
}
