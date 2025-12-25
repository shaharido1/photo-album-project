/**
 * Album Type Definitions
 * Types for album state management
 */

// Album size presets
export interface Dimensions {
  width: number;
  height: number;
}

export interface SizeMeasurement {
  width: number;
  height: number;
}

export interface AlbumSizePreset {
  name: string;
  dimensions: Dimensions;
  unit: 'inches' | 'mm';
  inches: SizeMeasurement;
  cm: SizeMeasurement;
}

export type AlbumSizeKey =
  | '8x8'
  | '10x10'
  | '12x12'
  | 'a4-landscape'
  | 'a4-portrait';

export type AlbumSizePresets = Record<AlbumSizeKey, AlbumSizePreset>;

// Layout template reference (used in albumSlice)
export interface LayoutTemplateRef {
  name: string;
  slots: number;
}

export type LayoutTemplateRefs = Record<string, LayoutTemplateRef>;

// Slot position
export interface Position {
  x: number;
  y: number;
}

// Page slot
export interface PageSlot {
  id: string;
  photoId: string | null;
  position: Position;
  scale: number;
  rotation: number;
}

// Page
export interface AlbumPage {
  id: string;
  layoutId: string;
  background: string;
  slots: PageSlot[];
}

// Album
export interface Album {
  id: string | null;
  name: string;
  size: AlbumSizeKey;
  pages: AlbumPage[];
  currentPageIndex: number;
}

// Selected slot reference
export interface SelectedSlotRef {
  pageIndex: number;
  slotIndex: number;
}

// View mode type
export type ViewMode = 'book' | 'edit';

// Spread info (for book view)
export interface SpreadInfo {
  spreadIndex: number;
  leftPage: AlbumPage | null;
  rightPage: AlbumPage | null;
  leftPageIndex: number | null;
  rightPageIndex: number | null;
  isCover: boolean;
}

// Album state
export interface AlbumState {
  album: Album;
  selectedSlot: SelectedSlotRef | null;
  viewMode: ViewMode;
  currentSpread: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Action payload types
export interface CreateAlbumPayload {
  name?: string;
  size?: AlbumSizeKey;
}

export interface UpdatePageLayoutPayload {
  pageIndex: number;
  layoutId: string;
}

export interface SetPageBackgroundPayload {
  pageIndex: number;
  color: string;
}

export interface AssignPhotoToSlotPayload {
  pageIndex: number;
  slotIndex: number;
  photoId: string | null;
}

export interface RemovePhotoFromSlotPayload {
  pageIndex: number;
  slotIndex: number;
}

export interface UpdateSlotPositionPayload {
  pageIndex: number;
  slotIndex: number;
  position: Position;
}

export interface UpdateSlotScalePayload {
  pageIndex: number;
  slotIndex: number;
  scale: number;
}

export interface UpdateSlotRotationPayload {
  pageIndex: number;
  slotIndex: number;
  rotation: number;
}
