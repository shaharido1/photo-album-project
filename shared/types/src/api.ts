/**
 * API Response Schema Definitions
 * Common API response types
 */

import { z } from 'zod';
import { UserSchema } from './user.js';

// =============================================================================
// Common API Responses
// =============================================================================

/**
 * Generic error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Generic success response
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * Auth verify response
 */
export const AuthVerifyResponseSchema = z.object({
  authenticated: z.boolean(),
  user: UserSchema.optional(),
});

export type AuthVerifyResponse = z.infer<typeof AuthVerifyResponseSchema>;

/**
 * Hello endpoint response
 */
export const HelloResponseSchema = z.object({
  message: z.string(),
});

export type HelloResponse = z.infer<typeof HelloResponseSchema>;

/**
 * Health check response
 */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime({ offset: true }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * Version response
 */
export const VersionResponseSchema = z.object({
  version: z.string(),
});

export type VersionResponse = z.infer<typeof VersionResponseSchema>;

/**
 * Foo response (for testing)
 */
export const FooResponseSchema = z.object({
  value: z.string(),
});

export type FooResponse = z.infer<typeof FooResponseSchema>;

// =============================================================================
// API Endpoints
// =============================================================================

/**
 * Centralized API endpoint paths
 */
export const API_ENDPOINTS = {
  HELLO: '/api/hello',
  VERSION: '/api/version',
  FOO: '/api/foo',
  HEALTH: '/api/health',
  PHOTOS: '/api/photos',
  ALBUMS: '/api/albums',
  FEEDBACK: '/api/feedback',
  AUTH_VERIFY: '/api/auth/verify',
  // Google Photos endpoints
  GOOGLE_PHOTOS_AUTH_START: '/api/google-photos/auth/start',
  GOOGLE_PHOTOS_STATUS: '/api/google-photos/status',
  GOOGLE_PHOTOS_DISCONNECT: '/api/google-photos/disconnect',
  GOOGLE_PHOTOS_ALBUMS: '/api/google-photos/albums',
  GOOGLE_PHOTOS_PHOTOS: '/api/google-photos/photos',
  GOOGLE_PHOTOS_IMPORT: '/api/google-photos/import',
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

// =============================================================================
// Feedback Schemas
// =============================================================================

/**
 * Feedback submission request
 */
export const FeedbackRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  feedbackType: z.enum(['bug', 'feature', 'general']).optional().default('general'),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

/**
 * Feedback submission response
 */
export const FeedbackResponseSchema = z.object({
  success: z.boolean(),
  issue: z.object({
    number: z.number(),
    url: z.string().url(),
  }),
});

export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate error response
 */
export function parseErrorResponse(data: unknown): ErrorResponse {
  return ErrorResponseSchema.parse(data);
}

/**
 * Safely parse error response
 */
export function safeParseErrorResponse(data: unknown) {
  return ErrorResponseSchema.safeParse(data);
}

/**
 * Check if response is an error
 */
export function isErrorResponse(data: unknown): data is ErrorResponse {
  return ErrorResponseSchema.safeParse(data).success;
}
