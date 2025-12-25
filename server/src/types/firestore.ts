/**
 * Firestore Document Type Definitions
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * User document stored in Firestore users collection
 */
export interface FirestoreUser {
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Photo document stored in Firestore photos collection
 */
export interface FirestorePhoto {
  userId: string;
  name: string;
  thumbnail: string;
  fullSize: string;
  width: number;
  height: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Page slot embedded in album pages
 */
export interface FirestorePageSlot {
  id: string;
  photoId: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

/**
 * Album page document in albums/{albumId}/pages subcollection
 */
export interface FirestoreAlbumPage {
  id?: string;
  layoutId: string;
  background: string;
  order: number;
  slots: FirestorePageSlot[];
}

/**
 * Album document stored in Firestore albums collection
 */
export interface FirestoreAlbum {
  id?: string;
  userId: string;
  name: string;
  size: string;
  currentPageIndex: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Album with pages included (for API responses)
 */
export interface FirestoreAlbumWithPages extends FirestoreAlbum {
  pages: FirestoreAlbumPage[];
}
