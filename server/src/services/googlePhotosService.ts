/**
 * Google Photos Service
 *
 * Interacts with Google Photos Library API
 * - Lists albums and media items
 * - Downloads photos for import
 * - Handles pagination
 */

import type {
  GooglePhotosAlbum,
  GooglePhotosMediaItem,
  ImportOptions,
  ImportPhotoResult,
} from '@photo-album/types';
import { storageService, type StorageFile } from './storageService.js';
import { photoService } from './firebaseService.js';

const GOOGLE_PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1';
const PAGE_SIZE = 50;

/**
 * Make an authenticated request to Google Photos API
 */
const googlePhotosRequest = async <T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${GOOGLE_PHOTOS_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Photos API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
};

/**
 * Download a photo from Google Photos
 */
const downloadPhoto = async (
  accessToken: string,
  baseUrl: string,
  width?: number,
  height?: number
): Promise<Buffer> => {
  let downloadUrl = baseUrl;
  if (width && height) {
    downloadUrl = `${baseUrl}=w${width}-h${height}`;
  } else {
    downloadUrl = `${baseUrl}=d`;
  }

  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download photo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const googlePhotosService = {
  /**
   * List user's Google Photos albums
   */
  async listAlbums(
    accessToken: string,
    pageToken?: string
  ): Promise<{ albums: GooglePhotosAlbum[]; nextPageToken: string | null }> {
    interface GoogleAlbumsResponse {
      albums?: Array<{
        id: string;
        title: string;
        productUrl?: string;
        mediaItemsCount?: string;
        coverPhotoBaseUrl?: string;
        coverPhotoMediaItemId?: string;
      }>;
      nextPageToken?: string;
    }

    const params = new URLSearchParams({
      pageSize: PAGE_SIZE.toString(),
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await googlePhotosRequest<GoogleAlbumsResponse>(
      accessToken,
      `/albums?${params.toString()}`
    );

    const albums: GooglePhotosAlbum[] = (response.albums || []).map((album) => ({
      id: album.id,
      title: album.title,
      productUrl: album.productUrl,
      mediaItemsCount: album.mediaItemsCount,
      coverPhotoBaseUrl: album.coverPhotoBaseUrl,
      coverPhotoMediaItemId: album.coverPhotoMediaItemId,
    }));

    return {
      albums,
      nextPageToken: response.nextPageToken || null,
    };
  },

  /**
   * List photos from Google Photos library
   */
  async listPhotos(
    accessToken: string,
    albumId?: string,
    pageToken?: string
  ): Promise<{ photos: GooglePhotosMediaItem[]; nextPageToken: string | null }> {
    interface GoogleMediaItemsResponse {
      mediaItems?: Array<{
        id: string;
        description?: string;
        productUrl?: string;
        baseUrl: string;
        mimeType: string;
        mediaMetadata?: {
          creationTime?: string;
          width?: string;
          height?: string;
          photo?: {
            cameraMake?: string;
            cameraModel?: string;
            focalLength?: number;
            apertureFNumber?: number;
            isoEquivalent?: number;
            exposureTime?: string;
          };
        };
        filename: string;
      }>;
      nextPageToken?: string;
    }

    let response: GoogleMediaItemsResponse;

    if (albumId) {
      const body = {
        albumId,
        pageSize: PAGE_SIZE,
        pageToken: pageToken || undefined,
      };

      response = await googlePhotosRequest<GoogleMediaItemsResponse>(
        accessToken,
        '/mediaItems:search',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );
    } else {
      const params = new URLSearchParams({
        pageSize: PAGE_SIZE.toString(),
      });

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      response = await googlePhotosRequest<GoogleMediaItemsResponse>(
        accessToken,
        `/mediaItems?${params.toString()}`
      );
    }

    const photos: GooglePhotosMediaItem[] = (response.mediaItems || [])
      .filter((item) => item.mimeType.startsWith('image/'))
      .map((item) => ({
        id: item.id,
        description: item.description,
        productUrl: item.productUrl,
        baseUrl: item.baseUrl,
        mimeType: item.mimeType,
        mediaMetadata: item.mediaMetadata
          ? {
              creationTime: item.mediaMetadata.creationTime,
              width: item.mediaMetadata.width,
              height: item.mediaMetadata.height,
              photo: item.mediaMetadata.photo,
            }
          : undefined,
        filename: item.filename,
      }));

    return {
      photos,
      nextPageToken: response.nextPageToken || null,
    };
  },

  /**
   * Get a single media item by ID
   */
  async getPhoto(
    accessToken: string,
    mediaItemId: string
  ): Promise<GooglePhotosMediaItem> {
    interface GoogleMediaItemResponse {
      id: string;
      description?: string;
      productUrl?: string;
      baseUrl: string;
      mimeType: string;
      mediaMetadata?: {
        creationTime?: string;
        width?: string;
        height?: string;
        photo?: {
          cameraMake?: string;
          cameraModel?: string;
          focalLength?: number;
          apertureFNumber?: number;
          isoEquivalent?: number;
          exposureTime?: string;
        };
      };
      filename: string;
    }

    const item = await googlePhotosRequest<GoogleMediaItemResponse>(
      accessToken,
      `/mediaItems/${mediaItemId}`
    );

    return {
      id: item.id,
      description: item.description,
      productUrl: item.productUrl,
      baseUrl: item.baseUrl,
      mimeType: item.mimeType,
      mediaMetadata: item.mediaMetadata
        ? {
            creationTime: item.mediaMetadata.creationTime,
            width: item.mediaMetadata.width,
            height: item.mediaMetadata.height,
            photo: item.mediaMetadata.photo,
          }
        : undefined,
      filename: item.filename,
    };
  },

  /**
   * Import photos from Google Photos to the app
   */
  async importPhotos(
    userId: string,
    accessToken: string,
    photoIds: string[],
    options: ImportOptions
  ): Promise<{ results: ImportPhotoResult[]; imported: number; failed: number }> {
    const results: ImportPhotoResult[] = [];
    let imported = 0;
    let failed = 0;

    for (const googlePhotoId of photoIds) {
      try {
        const mediaItem = await this.getPhoto(accessToken, googlePhotoId);

        if (options.storageType === 'firebase') {
          const width = mediaItem.mediaMetadata?.width
            ? parseInt(mediaItem.mediaMetadata.width, 10)
            : undefined;
          const height = mediaItem.mediaMetadata?.height
            ? parseInt(mediaItem.mediaMetadata.height, 10)
            : undefined;

          const photoBuffer = await downloadPhoto(
            accessToken,
            mediaItem.baseUrl,
            width,
            height
          );

          const storageFile: StorageFile = {
            buffer: photoBuffer,
            mimetype: mediaItem.mimeType,
            originalname: mediaItem.filename,
          };

          const uploadResult = await storageService.uploadPhoto(userId, storageFile);

          const photo = await photoService.create(userId, {
            name: mediaItem.filename,
            thumbnail: uploadResult.thumbnailUrl,
            fullSize: uploadResult.fullSizeUrl,
            width: uploadResult.width,
            height: uploadResult.height,
            source: 'google',
            storageType: 'firebase',
            googlePhotoId,
          });

          results.push({
            googlePhotoId,
            success: true,
            photoId: photo.id,
          });
          imported++;
        } else {
          const width = mediaItem.mediaMetadata?.width
            ? parseInt(mediaItem.mediaMetadata.width, 10)
            : 800;
          const height = mediaItem.mediaMetadata?.height
            ? parseInt(mediaItem.mediaMetadata.height, 10)
            : 600;

          const thumbnailUrl = `${mediaItem.baseUrl}=w300-h300-c`;
          const fullSizeUrl = `${mediaItem.baseUrl}=w${width}-h${height}`;

          const photo = await photoService.create(userId, {
            name: mediaItem.filename,
            thumbnail: thumbnailUrl,
            fullSize: fullSizeUrl,
            width,
            height,
            source: 'google',
            storageType: 'google-reference',
            googlePhotoId,
            googlePhotoUrl: mediaItem.baseUrl,
          });

          results.push({
            googlePhotoId,
            success: true,
            photoId: photo.id,
          });
          imported++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          googlePhotoId,
          success: false,
          error: errorMessage,
        });
        failed++;
      }
    }

    return { results, imported, failed };
  },

  /**
   * Refresh Google Photos URLs for reference-type photos
   */
  async refreshPhotoUrl(
    accessToken: string,
    googlePhotoId: string
  ): Promise<{ baseUrl: string; thumbnailUrl: string; fullSizeUrl: string }> {
    const mediaItem = await this.getPhoto(accessToken, googlePhotoId);

    const width = mediaItem.mediaMetadata?.width
      ? parseInt(mediaItem.mediaMetadata.width, 10)
      : 800;
    const height = mediaItem.mediaMetadata?.height
      ? parseInt(mediaItem.mediaMetadata.height, 10)
      : 600;

    return {
      baseUrl: mediaItem.baseUrl,
      thumbnailUrl: `${mediaItem.baseUrl}=w300-h300-c`,
      fullSizeUrl: `${mediaItem.baseUrl}=w${width}-h${height}`,
    };
  },
};
