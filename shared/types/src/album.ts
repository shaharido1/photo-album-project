/**
 * Album Schema Definitions
 * Single source of truth for album data structures
 */

import { z } from 'zod';

// Re-export Firestore types for convenience
export type {
  FirestoreAlbum,
  FirestoreAlbumPage,
  FirestoreAlbumWithPages,
  FirestorePageSlot,
} from './firestore-types.js';

// Import types for local use in transformation functions
import type {
  FirestoreAlbumPage,
  FirestoreAlbumWithPages,
} from './firestore-types.js';

// =============================================================================
// Shared Primitives
// =============================================================================

/**
 * Position coordinates (x, y)
 */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * Dimensions (width, height)
 */
export const DimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export type Dimensions = z.infer<typeof DimensionsSchema>;

/**
 * Size measurement in specific units
 */
export const SizeMeasurementSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export type SizeMeasurement = z.infer<typeof SizeMeasurementSchema>;

// =============================================================================
// Album Size Configuration
// =============================================================================

/**
 * Available album size keys
 */
export const AlbumSizeKeySchema = z.enum([
  '8x8',
  '10x10',
  '12x12',
  'a4-landscape',
  'a4-portrait',
]);

export type AlbumSizeKey = z.infer<typeof AlbumSizeKeySchema>;

/**
 * Album size preset configuration
 */
export const AlbumSizePresetSchema = z.object({
  name: z.string().min(1),
  dimensions: DimensionsSchema,
  unit: z.enum(['inches', 'mm']),
  inches: SizeMeasurementSchema,
  cm: SizeMeasurementSchema,
});

export type AlbumSizePreset = z.infer<typeof AlbumSizePresetSchema>;

/**
 * All album size presets - a complete record with all size keys
 */
export type AlbumSizePresets = Record<AlbumSizeKey, AlbumSizePreset>;

// =============================================================================
// Layout Templates
// =============================================================================

/**
 * Layout slot definition (positions are percentages 0-100)
 */
export const LayoutSlotSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
});

export type LayoutSlot = z.infer<typeof LayoutSlotSchema>;

/**
 * Layout template definition
 */
export const LayoutTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  slotCount: z.number().int().min(0),
  slots: z.array(LayoutSlotSchema),
});

export type LayoutTemplate = z.infer<typeof LayoutTemplateSchema>;

/**
 * Layout template reference (lightweight)
 */
export const LayoutTemplateRefSchema = z.object({
  name: z.string().min(1),
  slots: z.number().int().min(0),
});

export type LayoutTemplateRef = z.infer<typeof LayoutTemplateRefSchema>;

/**
 * Record of layout template references by ID
 */
export type LayoutTemplateRefs = Record<string, LayoutTemplateRef>;

// =============================================================================
// Page Slots
// =============================================================================

/**
 * Page slot with photo placement
 */
export const PageSlotSchema = z.object({
  id: z.string().min(1),
  photoId: z.string().nullable(),
  position: PositionSchema,
  scale: z.number().positive(),
  rotation: z.number(),
});

export type PageSlot = z.infer<typeof PageSlotSchema>;

// =============================================================================
// Album Pages
// =============================================================================

/**
 * Album page
 */
export const AlbumPageSchema = z.object({
  id: z.string().min(1),
  layoutId: z.string().min(1),
  background: z.string(),
  slots: z.array(PageSlotSchema),
});

export type AlbumPage = z.infer<typeof AlbumPageSchema>;

// =============================================================================
// Album
// =============================================================================

/**
 * Album as returned by the API
 */
export const AlbumSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1),
  size: AlbumSizeKeySchema,
  pages: z.array(AlbumPageSchema),
  currentPageIndex: z.number().int().min(0),
});

export type Album = z.infer<typeof AlbumSchema>;

/**
 * API response for fetching an album
 */
export const AlbumResponseSchema = z.object({
  album: AlbumSchema,
});

export type AlbumResponse = z.infer<typeof AlbumResponseSchema>;

/**
 * Album summary (lightweight, for listing)
 */
export const AlbumSummarySchema = AlbumSchema.pick({
  id: true,
  name: true,
  size: true,
  currentPageIndex: true,
});

export type AlbumSummary = z.infer<typeof AlbumSummarySchema>;

/**
 * API response for listing albums
 */
export const AlbumsResponseSchema = z.object({
  albums: z.array(AlbumSummarySchema),
});

export type AlbumsResponse = z.infer<typeof AlbumsResponseSchema>;

// =============================================================================
// Firestore Data Schemas (for validation without Timestamps)
// =============================================================================

/**
 * Firestore page slot data schema
 */
export const FirestorePageSlotDataSchema = PageSlotSchema;

export type FirestorePageSlotData = z.infer<typeof FirestorePageSlotDataSchema>;

/**
 * Firestore album page data schema (without id being optional)
 */
export const FirestoreAlbumPageDataSchema = z.object({
  id: z.string().optional(),
  layoutId: z.string().min(1),
  background: z.string(),
  order: z.number().int().min(0),
  slots: z.array(FirestorePageSlotDataSchema),
});

export type FirestoreAlbumPageData = z.infer<typeof FirestoreAlbumPageDataSchema>;

/**
 * Firestore album data schema (without timestamps)
 */
export const FirestoreAlbumDataSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  name: z.string().min(1),
  size: z.string().min(1),
  currentPageIndex: z.number().int().min(0),
});

export type FirestoreAlbumData = z.infer<typeof FirestoreAlbumDataSchema>;

// =============================================================================
// Client-only State Types
// =============================================================================

/**
 * View mode for album editor
 */
export const ViewModeSchema = z.enum(['book', 'edit']);

export type ViewMode = z.infer<typeof ViewModeSchema>;

/**
 * Selected slot reference
 */
export const SelectedSlotRefSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
});

export type SelectedSlotRef = z.infer<typeof SelectedSlotRefSchema>;

/**
 * Spread info for book view
 */
export const SpreadInfoSchema = z.object({
  spreadIndex: z.number().int().min(0),
  leftPage: AlbumPageSchema.nullable(),
  rightPage: AlbumPageSchema.nullable(),
  leftPageIndex: z.number().int().min(0).nullable(),
  rightPageIndex: z.number().int().min(0).nullable(),
  isCover: z.boolean(),
});

export type SpreadInfo = z.infer<typeof SpreadInfoSchema>;

/**
 * Album Redux state
 */
export const AlbumStateSchema = z.object({
  album: AlbumSchema,
  albums: z.array(AlbumSummarySchema),
  albumsStatus: z.enum(['idle', 'loading', 'succeeded', 'failed']),
  selectedSlot: SelectedSlotRefSchema.nullable(),
  viewMode: ViewModeSchema,
  currentSpread: z.number().int().min(0),
  status: z.enum(['idle', 'loading', 'succeeded', 'failed']),
  error: z.string().nullable(),
});

export type AlbumState = z.infer<typeof AlbumStateSchema>;

// =============================================================================
// Action Payloads
// =============================================================================

export const CreateAlbumPayloadSchema = z.object({
  name: z.string().min(1).optional(),
  size: AlbumSizeKeySchema.optional(),
});

export type CreateAlbumPayload = z.infer<typeof CreateAlbumPayloadSchema>;

export const UpdatePageLayoutPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  layoutId: z.string().min(1),
});

export type UpdatePageLayoutPayload = z.infer<typeof UpdatePageLayoutPayloadSchema>;

export const SetPageBackgroundPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  color: z.string(),
});

export type SetPageBackgroundPayload = z.infer<typeof SetPageBackgroundPayloadSchema>;

export const AssignPhotoToSlotPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
  photoId: z.string().nullable(),
});

export type AssignPhotoToSlotPayload = z.infer<typeof AssignPhotoToSlotPayloadSchema>;

export const RemovePhotoFromSlotPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
});

export type RemovePhotoFromSlotPayload = z.infer<typeof RemovePhotoFromSlotPayloadSchema>;

export const UpdateSlotPositionPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
  position: PositionSchema,
});

export type UpdateSlotPositionPayload = z.infer<typeof UpdateSlotPositionPayloadSchema>;

export const UpdateSlotScalePayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
  scale: z.number().positive(),
});

export type UpdateSlotScalePayload = z.infer<typeof UpdateSlotScalePayloadSchema>;

export const UpdateSlotRotationPayloadSchema = z.object({
  pageIndex: z.number().int().min(0),
  slotIndex: z.number().int().min(0),
  rotation: z.number(),
});

export type UpdateSlotRotationPayload = z.infer<typeof UpdateSlotRotationPayloadSchema>;

// =============================================================================
// Transformation Helpers
// =============================================================================

/**
 * Transform Firestore album page to API page
 */
export function firestorePageToApi(page: FirestoreAlbumPage): AlbumPage {
  return {
    id: page.id ?? '',
    layoutId: page.layoutId,
    background: page.background,
    slots: page.slots,
  };
}

/**
 * Transform Firestore album to API album
 */
export function firestoreAlbumToApi(
  doc: FirestoreAlbumWithPages,
  id: string
): Album {
  return {
    id,
    name: doc.name,
    size: doc.size as AlbumSizeKey,
    pages: doc.pages.map(firestorePageToApi),
    currentPageIndex: doc.currentPageIndex,
  };
}

/**
 * Validate and parse album
 */
export function parseAlbum(data: unknown): Album {
  return AlbumSchema.parse(data);
}

/**
 * Safely parse album
 */
export function safeParseAlbum(data: unknown) {
  return AlbumSchema.safeParse(data);
}
