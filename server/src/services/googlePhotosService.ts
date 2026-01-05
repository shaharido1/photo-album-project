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
const GOOGLE_PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';
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
  console.log(`[GooglePhotosService] Requesting: ${options.method || 'GET'} ${url}`);

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
    console.error(`[GooglePhotosService] 403 Error Debug - Using Token: ${accessToken.substring(0, 15)}...`);
    console.error(`[GooglePhotosService] Response Status: ${response.status}`);
    console.error(`[GooglePhotosService] Response Error: ${errorText}`);
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

  console.log(`[GooglePhotosService] Downloading photo from: ${downloadUrl}`);

  // Try with token first
  let response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // If 403/401, retry without token (common for Picker API URLs)
  if (!response.ok && (response.status === 403 || response.status === 401)) {
    console.warn(`[GooglePhotosService] Download with token failed (${response.status}), trying WITHOUT token...`);
    response = await fetch(downloadUrl);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GooglePhotosService] Download failed (final): ${response.status} - ${errorText}`);
    throw new Error(`Failed to download photo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`[GooglePhotosService] Download success: ${arrayBuffer.byteLength} bytes`);
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

    if (albumId && albumId !== 'picker') {
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
    items: GooglePhotosMediaItem[],
    options: ImportOptions
  ): Promise<{ results: ImportPhotoResult[]; imported: number; failed: number }> {
    const results: ImportPhotoResult[] = [];
    let imported = 0;
    let failed = 0;

    for (const mediaItem of items) {
      const googlePhotoId = mediaItem.id;
      try {
        console.log(`[GooglePhotosService] Importing item: ${mediaItem.filename} (${googlePhotoId})`);

        if (options.storageType === 'firebase' || options.storageType === 'local') {
          const width = mediaItem.mediaMetadata?.width
            ? parseInt(mediaItem.mediaMetadata.width, 10)
            : undefined;
          const height = mediaItem.mediaMetadata?.height
            ? parseInt(mediaItem.mediaMetadata.height, 10)
            : undefined;

          console.log(`[GooglePhotosService] Storage: ${options.storageType}. Downloading first...`);
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
            storageType: options.storageType,
            googlePhotoId,
          });

          results.push({
            googlePhotoId,
            success: true,
            photoId: photo.id,
          });
          imported++;
        } else {
          // google-reference
          console.log(`[GooglePhotosService] Storage: google-reference.`);
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
        console.error(`[GooglePhotosService] Failed to import ${mediaItem.filename}:`, error);
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

  /**
   * Create a new picker session
   */
  async createPickerSession(
    accessToken: string
  ): Promise<{ sessionId: string; pickerUri: string }> {
    const response = await fetch(`${GOOGLE_PICKER_API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Picker API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { id: string; pickerUri: string };
    return {
      sessionId: data.id,
      pickerUri: data.pickerUri,
    };
  },

  /**
   * Get picker session status
   */
  async getPickerSession(
    accessToken: string,
    sessionId: string
  ): Promise<{ ready: boolean }> {
    const response = await fetch(`${GOOGLE_PICKER_API_BASE}/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Picker API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { mediaItemsSet: boolean };
    return {
      ready: !!data.mediaItemsSet,
    };
  },

  /**
   * List items from a completed picker session
   */
  async listPickerItems(
    accessToken: string,
    sessionId: string
  ): Promise<GooglePhotosMediaItem[]> {
    const response = await fetch(
      `${GOOGLE_PICKER_API_BASE}/mediaItems?sessionId=${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Picker API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      mediaItems?: Array<{
        id: string;
        baseUrl?: string;
        mimeType?: string;
        filename?: string;
        mediaMetadata?: any;
        mediaFile?: {
          baseUrl?: string;
          filename?: string;
          mimeType?: string;
          mediaFileMetadata?: {
            location?: {
              latitude: number;
              longitude: number;
            };
          };
        };
      }>;
    };

    return (data.mediaItems || []).map((item) => {
      // Picker API often puts attributes inside 'mediaFile'
      const baseUrl = item.mediaFile?.baseUrl || item.baseUrl || '';
      const filename = item.mediaFile?.filename || item.filename || 'unnamed';
      const mimeType = item.mediaFile?.mimeType || item.mimeType || 'image/jpeg';

      // Extract metadata (avoid location as it currently causes issues/is not stored)
      const metadata = item.mediaMetadata || {};

      return {
        id: item.id,
        baseUrl,
        mimeType,
        filename,
        mediaMetadata: metadata,
      };
    });
  },

  /**
   * Proxy an image from Google Photos
   */
  async proxyImage(
    accessToken: string,
    url: string
  ): Promise<{ buffer: Buffer; contentType: string }> {
    console.log(`[GooglePhotosService] Proxying image: ${url}`);

    // First try with the token
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // If it fails with 403 or 401, it might be a Google Photos URL that doesn't want the token
    // (e.g. from the Picker API or already expired session-based URLs)
    if (!response.ok && (response.status === 403 || response.status === 401)) {
      console.warn(`[GooglePhotosService] Proxy with token failed (${response.status}), trying WITHOUT token...`);
      response = await fetch(url);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GooglePhotosService] Proxy failed (even without token) for URL: ${url}`);
      console.error(`[GooglePhotosService] Status: ${response.status}, Error: ${errorText}`);
      throw new Error(`Google returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    console.log(`[GooglePhotosService] Proxy success, type: ${contentType}, size: ${arrayBuffer.byteLength}`);

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  },
};

