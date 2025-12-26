/**
 * API Response Schema Definitions
 * Common API response types
 */

import { z } from 'zod';

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
