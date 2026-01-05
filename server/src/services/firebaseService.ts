/**
 * Firebase Service Layer
 *
 * Provides CRUD operations for Firestore collections:
 * - users: User profiles
 * - photos: Photo metadata
 * - albums: Album documents with pages subcollection
 */

import { getFirestore } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import {
  type Photo,
  type FirestorePhoto,
  type FirestoreAlbum,
  type FirestoreAlbumPage,
  type FirestoreAlbumWithPages,
  type UserSettings,
  type UpdateSettingsRequest,
  DEFAULT_USER_SETTINGS,
  firestorePhotoToApi,
} from '@photo-album/types';

const db = () => getFirestore();

// ============================================
// User Service
// ============================================

export const userService = {
  /**
   * Get or create user profile on first login
   */
  async getOrCreate(
    uid: string,
    email: string,
    displayName: string
  ): Promise<void> {
    const userRef = db().collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  },

  /**
   * Update user profile
   */
  async update(
    uid: string,
    updates: { displayName?: string; photoURL?: string | null }
  ): Promise<void> {
    await db()
      .collection('users')
      .doc(uid)
      .update({
        ...updates,
        updatedAt: Timestamp.now(),
      });
  },
};

// ============================================
// Photo Service
// ============================================

export const photoService = {
  /**
   * Get all photos for a user
   */
  async getAll(userId: string): Promise<Photo[]> {
    const snapshot = await db()
      .collection('photos')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FirestorePhoto;
      return firestorePhotoToApi(data, doc.id);
    });
  },

  /**
   * Get single photo by ID
   */
  async getById(photoId: string, userId: string): Promise<Photo | null> {
    const doc = await db().collection('photos').doc(photoId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as FirestorePhoto;

    // Verify ownership
    if (data.userId !== userId) {
      return null;
    }

    return firestorePhotoToApi(data, doc.id);
  },

  /**
   * Create a new photo
   */
  async create(
    userId: string,
    photo: Omit<Photo, 'id' | 'createdAt'> & {
      source?: 'upload' | 'google';
      storageType?: 'firebase' | 'google-reference' | 'local';
      googlePhotoId?: string;
      googlePhotoUrl?: string;
    }
  ): Promise<Photo> {
    const now = Timestamp.now();

    const docData: Record<string, unknown> = {
      userId,
      name: photo.name,
      thumbnail: photo.thumbnail,
      fullSize: photo.fullSize,
      width: photo.width,
      height: photo.height,
      createdAt: now,
      updatedAt: now,
    };

    if (photo.source) docData.source = photo.source;
    if (photo.storageType) docData.storageType = photo.storageType;
    if (photo.googlePhotoId) docData.googlePhotoId = photo.googlePhotoId;
    if (photo.googlePhotoUrl) docData.googlePhotoUrl = photo.googlePhotoUrl;

    const docRef = await db().collection('photos').add(docData);

    return {
      id: docRef.id,
      name: photo.name,
      thumbnail: photo.thumbnail,
      fullSize: photo.fullSize,
      width: photo.width,
      height: photo.height,
      createdAt: now.toDate().toISOString(),
    };
  },

  /**
   * Delete a photo
   */
  async delete(photoId: string, userId: string): Promise<boolean> {
    const doc = await db().collection('photos').doc(photoId).get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as FirestorePhoto;

    // Verify ownership
    if (data.userId !== userId) {
      return false;
    }

    await db().collection('photos').doc(photoId).delete();
    return true;
  },

  /**
   * Update AI-generated data for a photo
   */
  async updateAiData(
    photoId: string,
    userId: string,
    aiData: {
      caption?: string;
      tags?: string[];
      aiProcessed?: boolean;
      aiProvider?: string;
    }
  ): Promise<boolean> {
    const doc = await db().collection('photos').doc(photoId).get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as FirestorePhoto;

    // Verify ownership
    if (data.userId !== userId) {
      return false;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (aiData.caption !== undefined) updateData.caption = aiData.caption;
    if (aiData.tags !== undefined) updateData.tags = aiData.tags;
    if (aiData.aiProcessed !== undefined) updateData.aiProcessed = aiData.aiProcessed;
    if (aiData.aiProvider !== undefined) updateData.aiProvider = aiData.aiProvider;
    if (aiData.aiProcessed) updateData.aiProcessedAt = Timestamp.now();

    await db().collection('photos').doc(photoId).update(updateData);
    return true;
  },
};

// ============================================
// Settings Service
// ============================================

export const settingsService = {
  /**
   * Get user settings
   */
  async get(userId: string): Promise<UserSettings> {
    const userRef = db().collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return DEFAULT_USER_SETTINGS;
    }

    const userData = doc.data();
    const settings = userData?.settings || {};

    // Merge with defaults to ensure all settings exist
    return {
      ...DEFAULT_USER_SETTINGS,
      ...settings,
    };
  },

  /**
   * Update user settings (partial update)
   */
  async update(userId: string, updates: UpdateSettingsRequest): Promise<void> {
    const userRef = db().collection('users').doc(userId);

    // Use dot notation to update nested settings field
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateData[`settings.${key}`] = value;
      }
    }

    await userRef.update(updateData);
  },
};

// ============================================
// Album Service
// ============================================

export const albumService = {
  /**
   * Get all albums for a user
   */
  async getAll(userId: string): Promise<FirestoreAlbum[]> {
    const snapshot = await db()
      .collection('albums')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FirestoreAlbum, 'id'>),
    }));
  },

  /**
   * Get single album by ID with pages
   */
  async getById(
    albumId: string,
    userId: string
  ): Promise<FirestoreAlbumWithPages | null> {
    const doc = await db().collection('albums').doc(albumId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as FirestoreAlbum;

    // Verify ownership
    if (data.userId !== userId) {
      return null;
    }

    // Get pages subcollection
    const pagesSnapshot = await db()
      .collection('albums')
      .doc(albumId)
      .collection('pages')
      .orderBy('order')
      .get();

    const pages = pagesSnapshot.docs.map((pageDoc) => ({
      id: pageDoc.id,
      ...(pageDoc.data() as Omit<FirestoreAlbumPage, 'id'>),
    }));

    return {
      id: doc.id,
      ...data,
      pages,
    };
  },

  /**
   * Create a new album
   */
  async create(
    userId: string,
    name: string,
    size: string
  ): Promise<FirestoreAlbumWithPages> {
    const now = Timestamp.now();

    const docRef = await db().collection('albums').add({
      userId,
      name,
      size,
      currentPageIndex: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      userId,
      name,
      size,
      currentPageIndex: 0,
      createdAt: now,
      updatedAt: now,
      pages: [],
    };
  },

  /**
   * Update an album
   */
  async update(
    albumId: string,
    userId: string,
    updates: Partial<Pick<FirestoreAlbum, 'name' | 'size' | 'currentPageIndex'>>
  ): Promise<boolean> {
    const doc = await db().collection('albums').doc(albumId).get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as FirestoreAlbum;

    // Verify ownership
    if (data.userId !== userId) {
      return false;
    }

    await db()
      .collection('albums')
      .doc(albumId)
      .update({
        ...updates,
        updatedAt: Timestamp.now(),
      });

    return true;
  },

  /**
   * Delete an album and its pages
   */
  async delete(albumId: string, userId: string): Promise<boolean> {
    const doc = await db().collection('albums').doc(albumId).get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as FirestoreAlbum;

    // Verify ownership
    if (data.userId !== userId) {
      return false;
    }

    // Delete pages subcollection first
    const pagesSnapshot = await db()
      .collection('albums')
      .doc(albumId)
      .collection('pages')
      .get();

    const batch = db().batch();
    pagesSnapshot.docs.forEach((pageDoc) => batch.delete(pageDoc.ref));
    batch.delete(db().collection('albums').doc(albumId));
    await batch.commit();

    return true;
  },

  /**
   * Add a page to an album
   */
  async addPage(
    albumId: string,
    userId: string,
    page: Omit<FirestoreAlbumPage, 'id'>
  ): Promise<FirestoreAlbumPage> {
    const albumDoc = await db().collection('albums').doc(albumId).get();

    if (!albumDoc.exists) {
      throw new Error('Album not found');
    }

    const albumData = albumDoc.data() as FirestoreAlbum;

    // Verify ownership
    if (albumData.userId !== userId) {
      throw new Error('Access denied');
    }

    const docRef = await db()
      .collection('albums')
      .doc(albumId)
      .collection('pages')
      .add(page);

    // Update album's updatedAt
    await db().collection('albums').doc(albumId).update({
      updatedAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...page,
    };
  },

  /**
   * Update a page in an album
   */
  async updatePage(
    albumId: string,
    pageId: string,
    userId: string,
    updates: Partial<Omit<FirestoreAlbumPage, 'id'>>
  ): Promise<boolean> {
    const albumDoc = await db().collection('albums').doc(albumId).get();

    if (!albumDoc.exists) {
      return false;
    }

    const albumData = albumDoc.data() as FirestoreAlbum;

    // Verify ownership
    if (albumData.userId !== userId) {
      return false;
    }

    await db()
      .collection('albums')
      .doc(albumId)
      .collection('pages')
      .doc(pageId)
      .update(updates);

    // Update album's updatedAt
    await db().collection('albums').doc(albumId).update({
      updatedAt: Timestamp.now(),
    });

    return true;
  },

  /**
   * Update an album and all its pages in a single batch
   */
  async updateFull(
    albumId: string,
    userId: string,
    updates: {
      name?: string;
      size?: string;
      currentPageIndex?: number;
      pages?: Array<{
        id?: string;
        layoutId: string;
        background: string;
        slots: any[];
      }>;
    }
  ): Promise<boolean> {
    const albumRef = db().collection('albums').doc(albumId);
    const doc = await albumRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data() as FirestoreAlbum;

    // Verify ownership
    if (data.userId !== userId) {
      return false;
    }

    const batch = db().batch();
    const now = Timestamp.now();

    // Update album metadata
    const albumUpdates: Record<string, any> = {
      updatedAt: now,
    };
    if (updates.name !== undefined) albumUpdates.name = updates.name;
    if (updates.size !== undefined) albumUpdates.size = updates.size;
    if (updates.currentPageIndex !== undefined)
      albumUpdates.currentPageIndex = updates.currentPageIndex;

    batch.update(albumRef, albumUpdates);

    // Update pages if provided
    if (updates.pages) {
      const pagesCollection = albumRef.collection('pages');

      updates.pages.forEach((page, index) => {
        const pageData = {
          layoutId: page.layoutId,
          background: page.background,
          order: index,
          slots: page.slots,
        };

        if (page.id) {
          batch.set(pagesCollection.doc(page.id), pageData, { merge: true });
        } else {
          // If no ID, it's a new page
          batch.set(pagesCollection.doc(), pageData);
        }
      });
    }

    await batch.commit();
    return true;
  },

  /**
   * Delete a page from an album
   */
  async deletePage(
    albumId: string,
    pageId: string,
    userId: string
  ): Promise<boolean> {
    const albumDoc = await db().collection('albums').doc(albumId).get();

    if (!albumDoc.exists) {
      return false;
    }

    const albumData = albumDoc.data() as FirestoreAlbum;

    // Verify ownership
    if (albumData.userId !== userId) {
      return false;
    }

    await db()
      .collection('albums')
      .doc(albumId)
      .collection('pages')
      .doc(pageId)
      .delete();

    // Update album's updatedAt
    await db().collection('albums').doc(albumId).update({
      updatedAt: Timestamp.now(),
    });

    return true;
  },
};
