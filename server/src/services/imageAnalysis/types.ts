/**
 * Image Analysis Provider Types
 *
 * Abstract interface for image analysis services (Moondream, OpenAI, etc.)
 * This allows easy swapping of providers without changing the application code.
 */

/**
 * Result of image analysis containing caption and tags
 */
export interface ImageAnalysisResult {
  caption: string;
  tags: string[];
  provider: string;
}

/**
 * Options for image analysis
 */
export interface ImageAnalysisOptions {
  /** Caption length preference */
  captionLength?: 'short' | 'normal' | 'long';
  /** Maximum number of tags to extract */
  maxTags?: number;
}

/**
 * Abstract interface for image analysis providers
 */
export interface ImageAnalysisProvider {
  /** Unique identifier for this provider */
  readonly name: string;

  /**
   * Check if the provider is available and ready to process images
   */
  isAvailable(): Promise<boolean>;

  /**
   * Analyze an image and extract caption and tags
   * @param imageBuffer - The image data as a Buffer
   * @param options - Optional analysis options
   * @returns Analysis result with caption and tags
   */
  analyzeImage(
    imageBuffer: Buffer,
    options?: ImageAnalysisOptions
  ): Promise<ImageAnalysisResult>;
}

/**
 * Error thrown when image analysis fails
 */
export class ImageAnalysisError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}
