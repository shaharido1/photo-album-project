import { describe, it, expect } from '@jest/globals';
import {
  PositionSchema,
  DimensionsSchema,
  AlbumSizeKeySchema,
  AlbumSchema,
  ViewModeSchema,
  firestorePageToApi,
  firestoreAlbumToApi,
  parseAlbum,
  safeParseAlbum,
} from '../album.js';

describe('PositionSchema', () => {
  it('should validate correct position', () => {
    const result = PositionSchema.safeParse({ x: 10, y: 20 });
    expect(result.success).toBe(true);
  });

  it('should allow negative positions', () => {
    const result = PositionSchema.safeParse({ x: -10, y: -20 });
    expect(result.success).toBe(true);
  });
});

describe('DimensionsSchema', () => {
  it('should validate correct dimensions', () => {
    const result = DimensionsSchema.safeParse({ width: 100, height: 200 });
    expect(result.success).toBe(true);
  });

  it('should reject zero dimensions', () => {
    const result = DimensionsSchema.safeParse({ width: 0, height: 200 });
    expect(result.success).toBe(false);
  });
});

describe('AlbumSizeKeySchema', () => {
  it('should validate all valid size keys', () => {
    const validKeys = ['8x8', '10x10', '12x12', 'a4-landscape', 'a4-portrait'];
    validKeys.forEach((key) => {
      const result = AlbumSizeKeySchema.safeParse(key);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid size key', () => {
    const result = AlbumSizeKeySchema.safeParse('5x5');
    expect(result.success).toBe(false);
  });
});

describe('AlbumSchema', () => {
  const validAlbum = {
    id: 'album-123',
    name: 'My Album',
    size: '10x10',
    pages: [],
    currentPageIndex: 0,
  };

  it('should validate correct album', () => {
    const result = AlbumSchema.safeParse(validAlbum);
    expect(result.success).toBe(true);
  });

  it('should allow null album id', () => {
    const result = AlbumSchema.safeParse({ ...validAlbum, id: null });
    expect(result.success).toBe(true);
  });

  it('should reject invalid size key', () => {
    const result = AlbumSchema.safeParse({ ...validAlbum, size: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('ViewModeSchema', () => {
  it('should validate book mode', () => {
    expect(ViewModeSchema.safeParse('book').success).toBe(true);
  });

  it('should validate edit mode', () => {
    expect(ViewModeSchema.safeParse('edit').success).toBe(true);
  });

  it('should reject invalid mode', () => {
    expect(ViewModeSchema.safeParse('preview').success).toBe(false);
  });
});

describe('firestorePageToApi', () => {
  it('should transform Firestore page to API page', () => {
    const firestorePage = {
      id: 'page-123',
      layoutId: 'single',
      background: '#ffffff',
      order: 0,
      slots: [],
    };

    const result = firestorePageToApi(firestorePage);

    expect(result.id).toBe('page-123');
    expect(result.layoutId).toBe('single');
  });
});

describe('firestoreAlbumToApi', () => {
  it('should transform Firestore album to API album', () => {
    const firestoreAlbum = {
      userId: 'user-123',
      name: 'My Album',
      size: '10x10',
      currentPageIndex: 0,
      createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
      updatedAt: { toDate: () => new Date(), toMillis: () => Date.now() },
      pages: [],
    };

    const result = firestoreAlbumToApi(firestoreAlbum, 'album-123');

    expect(result.id).toBe('album-123');
    expect(result.name).toBe('My Album');
    expect(result.size).toBe('10x10');
  });
});

describe('parseAlbum', () => {
  it('should parse valid album', () => {
    const album = {
      id: 'album-123',
      name: 'My Album',
      size: '10x10',
      pages: [],
      currentPageIndex: 0,
    };
    const result = parseAlbum(album);
    expect(result).toEqual(album);
  });

  it('should throw for invalid album', () => {
    expect(() => parseAlbum({ id: '' })).toThrow();
  });
});

describe('safeParseAlbum', () => {
  it('should return success for valid album', () => {
    const album = {
      id: 'album-123',
      name: 'My Album',
      size: '10x10',
      pages: [],
      currentPageIndex: 0,
    };
    const result = safeParseAlbum(album);
    expect(result.success).toBe(true);
  });
});
