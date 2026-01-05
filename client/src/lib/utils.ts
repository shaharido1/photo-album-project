import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { API_ENDPOINTS } from '@photo-album/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get the display URL for a photo, applying proxying if needed
 */
export function getPhotoUrl(photo: { thumbnail?: string; fullSize?: string; storageType?: string; source?: string } | null | undefined, useFullSize = false, token?: string): string {
  if (!photo) return '';

  const rawUrl = useFullSize ? (photo.fullSize || photo.thumbnail) : (photo.thumbnail || photo.fullSize);
  if (!rawUrl) return '';

  if (photo.storageType === 'google-reference') {
    // If it's a Google Photos URL that needs proxying (CORs/Auth)
    if (rawUrl.startsWith('http')) {
      return `${API_ENDPOINTS.GOOGLE_PHOTOS_PROXY_IMAGE}?url=${encodeURIComponent(rawUrl)}${token ? `&token=${token}` : ''}`;
    }
  }

  return rawUrl;
}
