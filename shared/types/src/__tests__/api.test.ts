import { describe, it, expect } from '@jest/globals';
import {
  ErrorResponseSchema,
  HelloResponseSchema,
  HealthResponseSchema,
  VersionResponseSchema,
  isErrorResponse,
} from '../api.js';

describe('ErrorResponseSchema', () => {
  it('should validate error response', () => {
    const result = ErrorResponseSchema.safeParse({ error: 'Something went wrong' });
    expect(result.success).toBe(true);
  });

  it('should reject missing error field', () => {
    const result = ErrorResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('HelloResponseSchema', () => {
  it('should validate hello response', () => {
    const result = HelloResponseSchema.safeParse({ message: 'Hello World' });
    expect(result.success).toBe(true);
  });
});

describe('HealthResponseSchema', () => {
  it('should validate health response with ok status', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'ok',
      timestamp: '2024-12-20T10:30:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-ok status', () => {
    const result = HealthResponseSchema.safeParse({
      status: 'error',
      timestamp: '2024-12-20T10:30:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('VersionResponseSchema', () => {
  it('should validate version response', () => {
    const result = VersionResponseSchema.safeParse({ version: '1.0.14' });
    expect(result.success).toBe(true);
  });
});

describe('isErrorResponse', () => {
  it('should return true for error response', () => {
    expect(isErrorResponse({ error: 'Test error' })).toBe(true);
  });

  it('should return false for non-error response', () => {
    expect(isErrorResponse({ message: 'Hello' })).toBe(false);
  });

  it('should return false for null', () => {
    expect(isErrorResponse(null)).toBe(false);
  });
});
