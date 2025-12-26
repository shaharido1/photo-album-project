/**
 * File Upload Middleware
 *
 * Configures multer for handling multipart/form-data file uploads
 * - Stores files in memory for processing before uploading to Firebase Storage
 * - Validates file types and sizes
 */

import multer from 'multer';
import { Request } from 'express';

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// File filter to validate uploads
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP`
      )
    );
  }
};

// Configure multer with memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
});

// Single file upload middleware
export const uploadSingle = upload.single('photo');

// Multiple files upload middleware
export const uploadMultiple = upload.array('photos', 10);
