/**
 * User Settings Schema Definitions
 * Single source of truth for user preferences and settings
 */

import { z } from 'zod';

// =============================================================================
// Settings Schemas
// =============================================================================

/**
 * User settings as stored and returned by API
 */
export const UserSettingsSchema = z.object({
  autoImageTagging: z.boolean().default(false),
  // Future settings can be added here
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

/**
 * Default settings for new users
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  autoImageTagging: false,
};

/**
 * API response for fetching settings
 */
export const SettingsResponseSchema = z.object({
  settings: UserSettingsSchema,
});

export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;

/**
 * API request for updating settings (partial updates allowed)
 * Uses strict() to reject unknown fields for security
 */
export const UpdateSettingsRequestSchema = UserSettingsSchema.partial().strict();

export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate and parse settings response
 */
export function parseSettings(data: unknown): UserSettings {
  return UserSettingsSchema.parse(data);
}

/**
 * Safely parse settings response
 */
export function safeParseSettings(data: unknown) {
  return UserSettingsSchema.safeParse(data);
}

/**
 * Validate update settings request
 */
export function parseUpdateSettingsRequest(data: unknown): UpdateSettingsRequest {
  return UpdateSettingsRequestSchema.parse(data);
}
