/**
 * Image Analysis Service Unit Tests
 *
 * Tests for the image analysis provider system and service.
 * Uses mocked providers to test behavior without external dependencies.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type {
  ImageAnalysisProvider,
  ImageAnalysisResult,
  ImageAnalysisOptions,
} from '../../../src/services/imageAnalysis/types.js';
import { ImageAnalysisError } from '../../../src/services/imageAnalysis/types.js';

describe('Image Analysis', () => {
  describe('ImageAnalysisError', () => {
    it('should create error with provider name', () => {
      const error = new ImageAnalysisError('Test error', 'test-provider');

      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('test-provider');
      expect(error.name).toBe('ImageAnalysisError');
    });

    it('should include cause error when provided', () => {
      const cause = new Error('Original error');
      const error = new ImageAnalysisError('Wrapped error', 'provider', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('ImageAnalysisProvider interface', () => {
    let mockProvider: ImageAnalysisProvider;
    const mockImageBuffer = Buffer.from('fake-image-data');

    beforeEach(() => {
      mockProvider = {
        name: 'mock-provider',
        isAvailable: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        analyzeImage: jest.fn<
          (
            buffer: Buffer,
            options?: ImageAnalysisOptions
          ) => Promise<ImageAnalysisResult>
        >().mockResolvedValue({
          caption: 'A beautiful sunset over the ocean',
          tags: ['sunset', 'ocean', 'beach', 'nature'],
          provider: 'mock-provider',
        }),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should have a name property', () => {
      expect(mockProvider.name).toBe('mock-provider');
    });

    it('should check availability', async () => {
      const available = await mockProvider.isAvailable();

      expect(available).toBe(true);
      expect(mockProvider.isAvailable).toHaveBeenCalledTimes(1);
    });

    it('should analyze image and return result', async () => {
      const result = await mockProvider.analyzeImage(mockImageBuffer);

      expect(result).toEqual({
        caption: 'A beautiful sunset over the ocean',
        tags: ['sunset', 'ocean', 'beach', 'nature'],
        provider: 'mock-provider',
      });
      expect(mockProvider.analyzeImage).toHaveBeenCalledWith(mockImageBuffer);
    });

    it('should pass options to analyzeImage', async () => {
      const options: ImageAnalysisOptions = {
        captionLength: 'long',
        maxTags: 10,
      };

      await mockProvider.analyzeImage(mockImageBuffer, options);

      expect(mockProvider.analyzeImage).toHaveBeenCalledWith(
        mockImageBuffer,
        options
      );
    });

    it('should handle unavailable provider', async () => {
      (mockProvider.isAvailable as jest.Mock).mockResolvedValue(false);

      const available = await mockProvider.isAvailable();

      expect(available).toBe(false);
    });

    it('should handle analysis errors', async () => {
      const error = new ImageAnalysisError(
        'Analysis failed',
        'mock-provider'
      );
      (mockProvider.analyzeImage as jest.Mock).mockRejectedValue(error);

      await expect(mockProvider.analyzeImage(mockImageBuffer)).rejects.toThrow(
        ImageAnalysisError
      );
    });
  });

  describe('ImageAnalysisResult', () => {
    it('should have required properties', () => {
      const result: ImageAnalysisResult = {
        caption: 'Test caption',
        tags: ['tag1', 'tag2'],
        provider: 'test',
      };

      expect(result.caption).toBe('Test caption');
      expect(result.tags).toHaveLength(2);
      expect(result.provider).toBe('test');
    });

    it('should allow empty tags array', () => {
      const result: ImageAnalysisResult = {
        caption: 'No tags',
        tags: [],
        provider: 'test',
      };

      expect(result.tags).toHaveLength(0);
    });

    it('should allow empty caption', () => {
      const result: ImageAnalysisResult = {
        caption: '',
        tags: ['tag1'],
        provider: 'test',
      };

      expect(result.caption).toBe('');
    });
  });

  describe('ImageAnalysisOptions', () => {
    it('should support caption length options', () => {
      const shortOptions: ImageAnalysisOptions = { captionLength: 'short' };
      const normalOptions: ImageAnalysisOptions = { captionLength: 'normal' };
      const longOptions: ImageAnalysisOptions = { captionLength: 'long' };

      expect(shortOptions.captionLength).toBe('short');
      expect(normalOptions.captionLength).toBe('normal');
      expect(longOptions.captionLength).toBe('long');
    });

    it('should support maxTags option', () => {
      const options: ImageAnalysisOptions = { maxTags: 5 };

      expect(options.maxTags).toBe(5);
    });

    it('should support combined options', () => {
      const options: ImageAnalysisOptions = {
        captionLength: 'long',
        maxTags: 20,
      };

      expect(options.captionLength).toBe('long');
      expect(options.maxTags).toBe(20);
    });
  });
});

describe('Tag Processing', () => {
  const processRawTags = (
    rawTags: string,
    maxTags: number = 15
  ): string[] => {
    return rawTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length < 50)
      .slice(0, maxTags);
  };

  it('should parse comma-separated tags', () => {
    const raw = 'Dog, Cat, Bird';
    const tags = processRawTags(raw);

    expect(tags).toEqual(['dog', 'cat', 'bird']);
  });

  it('should convert to lowercase', () => {
    const raw = 'UPPERCASE, MixedCase';
    const tags = processRawTags(raw);

    expect(tags).toEqual(['uppercase', 'mixedcase']);
  });

  it('should trim whitespace', () => {
    const raw = '  spaces  ,  around  ';
    const tags = processRawTags(raw);

    expect(tags).toEqual(['spaces', 'around']);
  });

  it('should filter empty tags', () => {
    const raw = 'valid,,,,another';
    const tags = processRawTags(raw);

    expect(tags).toEqual(['valid', 'another']);
  });

  it('should filter tags over 50 characters', () => {
    const longTag = 'a'.repeat(60);
    const raw = `short, ${longTag}, valid`;
    const tags = processRawTags(raw);

    expect(tags).toEqual(['short', 'valid']);
  });

  it('should respect maxTags limit', () => {
    const raw = 'one, two, three, four, five';
    const tags = processRawTags(raw, 3);

    expect(tags).toEqual(['one', 'two', 'three']);
  });

  it('should handle empty input', () => {
    const tags = processRawTags('');

    expect(tags).toEqual([]);
  });

  it('should handle single tag', () => {
    const tags = processRawTags('single');

    expect(tags).toEqual(['single']);
  });
});
