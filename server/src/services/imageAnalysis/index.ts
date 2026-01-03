/**
 * Image Analysis Service
 *
 * Factory for image analysis providers with easy provider switching.
 * Currently supports Moondream, but can be extended for other providers.
 */

export * from './types.js';
export * from './moondreamProvider.js';

import {
  ImageAnalysisProvider,
  ImageAnalysisResult,
  ImageAnalysisOptions,
  ImageAnalysisError,
} from './types.js';
import { getMoondreamProvider } from './moondreamProvider.js';

// Provider type enum for configuration
export type ImageAnalysisProviderType = 'moondream' | 'none';

// Current provider configuration (can be changed via environment variable)
const PROVIDER_TYPE: ImageAnalysisProviderType =
  (process.env.IMAGE_ANALYSIS_PROVIDER as ImageAnalysisProviderType) || 'moondream';

/**
 * Get the configured image analysis provider
 */
export function getImageAnalysisProvider(): ImageAnalysisProvider | null {
  switch (PROVIDER_TYPE) {
    case 'moondream':
      return getMoondreamProvider();
    case 'none':
      return null;
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unknown image analysis provider: ${PROVIDER_TYPE}, defaulting to moondream`);
      return getMoondreamProvider();
  }
}

/**
 * Image Analysis Service
 *
 * High-level service that wraps the provider and adds additional functionality
 */
export const imageAnalysisService = {
  /**
   * Check if image analysis is available
   */
  async isAvailable(): Promise<boolean> {
    const provider = getImageAnalysisProvider();
    if (!provider) return false;
    return provider.isAvailable();
  },

  /**
   * Get the current provider name
   */
  getProviderName(): string | null {
    const provider = getImageAnalysisProvider();
    return provider?.name || null;
  },

  /**
   * Analyze an image
   */
  async analyzeImage(
    imageBuffer: Buffer,
    options?: ImageAnalysisOptions
  ): Promise<ImageAnalysisResult> {
    const provider = getImageAnalysisProvider();
    if (!provider) {
      throw new ImageAnalysisError(
        'No image analysis provider configured',
        'none'
      );
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new ImageAnalysisError(
        `Image analysis provider "${provider.name}" is not available`,
        provider.name
      );
    }

    return provider.analyzeImage(imageBuffer, options);
  },
};
