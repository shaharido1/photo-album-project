/**
 * API Type Definitions
 * Shared types for data exchanged between client and server
 */

// Photo type (matches server/src/mock/photos structure)
export interface Photo {
  id: string;
  name: string;
  thumbnail: string;
  fullSize: string;
  width: number;
  height: number;
  createdAt: string;
  isUploaded?: boolean;
}

// API Response types
export interface HelloResponse {
  message: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface FooResponse {
  value: string;
}

export interface VersionResponse {
  version: string;
}

export interface PhotosResponse {
  photos: Photo[];
}

export interface PhotoResponse {
  photo: Photo;
}

export interface ErrorResponse {
  error: string;
}
