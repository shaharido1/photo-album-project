/**
 * Server Type Definitions
 */

// Photo type
export interface Photo {
  id: string;
  name: string;
  thumbnail: string;
  fullSize: string;
  width: number;
  height: number;
  createdAt: string;
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

// Package.json type (partial)
export interface PackageJson {
  version: string;
  name?: string;
  [key: string]: unknown;
}
