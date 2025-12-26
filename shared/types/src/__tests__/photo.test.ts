import { describe, it, expect } from '@jest/globals';
import {
  PhotoSchema,
  ClientPhotoSchema,
  PhotosResponseSchema,
  PhotoResponseSchema,
  parsePhoto,
  safeParsePhoto,
  parsePhotosResponse,
  safeParsePhotosResponse,
  firestorePhotoToApi,
} from '../photo.js';

describe('PhotoSchema', () => {
  const validPhoto = {
    id: 'photo-123',
    name: 'Sunset Beach',
    thumbnail: 'https://example.com/thumb.jpg',
    fullSize: 'https://example.com/full.jpg',
    width: 1200,
    height: 800,
    createdAt: '2024-12-20T10:30:00.000Z',
  };

  it('should validate a correct photo', () => {
    const result = PhotoSchema.safeParse(validPhoto);
    expect(result.success).toBe(true);
  });

  it('should reject photo with empty id', () => {
    const result = PhotoSchema.safeParse({ ...validPhoto, id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject photo with invalid thumbnail URL', () => {
    const result = PhotoSchema.safeParse({ ...validPhoto, thumbnail: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should reject photo with negative width', () => {
    const result = PhotoSchema.safeParse({ ...validPhoto, width: -100 });
    expect(result.success).toBe(false);
  });
});

describe('ClientPhotoSchema', () => {
  const validPhoto = {
    id: 'photo-123',
    name: 'Sunset Beach',
    thumbnail: 'https://example.com/thumb.jpg',
    fullSize: 'https://example.com/full.jpg',
    width: 1200,
    height: 800,
    createdAt: '2024-12-20T10:30:00.000Z',
  };

  it('should validate photo without isUploaded', () => {
    const result = ClientPhotoSchema.safeParse(validPhoto);
    expect(result.success).toBe(true);
  });

  it('should validate photo with isUploaded: true', () => {
    const result = ClientPhotoSchema.safeParse({ ...validPhoto, isUploaded: true });
    expect(result.success).toBe(true);
  });
});

describe('PhotosResponseSchema', () => {
  it('should validate empty photos array', () => {
    const result = PhotosResponseSchema.safeParse({ photos: [] });
    expect(result.success).toBe(true);
  });
});

describe('PhotoResponseSchema', () => {
  it('should validate single photo response', () => {
    const result = PhotoResponseSchema.safeParse({
      photo: {
        id: '1',
        name: 'Photo 1',
        thumbnail: 'https://example.com/1.jpg',
        fullSize: 'https://example.com/1-full.jpg',
        width: 800,
        height: 600,
        createdAt: '2024-12-20T10:30:00.000Z',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('parsePhoto', () => {
  it('should return parsed photo for valid data', () => {
    const validPhoto = {
      id: 'photo-123',
      name: 'Sunset Beach',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/full.jpg',
      width: 1200,
      height: 800,
      createdAt: '2024-12-20T10:30:00.000Z',
    };
    const result = parsePhoto(validPhoto);
    expect(result).toEqual(validPhoto);
  });

  it('should throw for invalid data', () => {
    expect(() => parsePhoto({ id: '' })).toThrow();
  });
});

describe('safeParsePhoto', () => {
  it('should return success for valid data', () => {
    const validPhoto = {
      id: 'photo-123',
      name: 'Sunset Beach',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/full.jpg',
      width: 1200,
      height: 800,
      createdAt: '2024-12-20T10:30:00.000Z',
    };
    const result = safeParsePhoto(validPhoto);
    expect(result.success).toBe(true);
  });

  it('should return error for invalid data', () => {
    const result = safeParsePhoto({ id: '' });
    expect(result.success).toBe(false);
  });
});

describe('parsePhotosResponse', () => {
  it('should parse valid response', () => {
    const response = { photos: [] };
    const result = parsePhotosResponse(response);
    expect(result.photos).toHaveLength(0);
  });
});

describe('safeParsePhotosResponse', () => {
  it('should safely parse valid response', () => {
    const result = safeParsePhotosResponse({ photos: [] });
    expect(result.success).toBe(true);
  });
});

describe('firestorePhotoToApi', () => {
  it('should transform Firestore photo to API photo', () => {
    const firestorePhoto = {
      userId: 'user-123',
      name: 'Sunset Beach',
      thumbnail: 'https://example.com/thumb.jpg',
      fullSize: 'https://example.com/full.jpg',
      width: 1200,
      height: 800,
      createdAt: {
        toDate: () => new Date('2024-12-20T10:30:00.000Z'),
        toMillis: () => 1734692200000,
      },
      updatedAt: {
        toDate: () => new Date('2024-12-20T10:30:00.000Z'),
        toMillis: () => 1734692200000,
      },
    };

    const result = firestorePhotoToApi(firestorePhoto, 'photo-123');

    expect(result.id).toBe('photo-123');
    expect(result.name).toBe('Sunset Beach');
    expect(result.createdAt).toBe('2024-12-20T10:30:00.000Z');
  });
});
