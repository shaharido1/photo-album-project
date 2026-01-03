/**
 * Moondream Image Analysis Provider
 *
 * Implementation of ImageAnalysisProvider using Moondream2 for local inference.
 * Requires a local Moondream server running at the configured endpoint.
 */

import {
  ImageAnalysisProvider,
  ImageAnalysisResult,
  ImageAnalysisOptions,
  ImageAnalysisError,
} from './types.js';

// Moondream endpoint (defaults to local server)
const MOONDREAM_ENDPOINT =
  process.env.MOONDREAM_ENDPOINT || 'http://localhost:2020/v1';

// Use unknown type for the dynamically imported Moondream client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MoondreamClient = any;

/**
 * Moondream provider for image analysis
 */
export class MoondreamProvider implements ImageAnalysisProvider {
  readonly name = 'moondream';
  private model: MoondreamClient | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Lazily initialize the Moondream client
   */
  private async initializeClient(): Promise<void> {
    if (this.model) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        // Dynamic import to avoid issues if package is not installed
        const { vl } = await import('moondream');
        this.model = new vl({ endpoint: MOONDREAM_ENDPOINT });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Moondream package not available:', error);
        this.model = null;
      }
    })();

    await this.initPromise;
  }

  /**
   * Check if Moondream server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.initializeClient();
      if (!this.model) return false;

      // Try a simple health check by hitting the endpoint
      const response = await fetch(MOONDREAM_ENDPOINT.replace('/v1', '/health'), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      // If health endpoint doesn't exist, try the base endpoint
      if (!response || !response.ok) {
        const baseResponse = await fetch(MOONDREAM_ENDPOINT, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
        return baseResponse !== null;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Analyze image using Moondream
   */
  async analyzeImage(
    imageBuffer: Buffer,
    options: ImageAnalysisOptions = {}
  ): Promise<ImageAnalysisResult> {
    await this.initializeClient();

    if (!this.model) {
      throw new ImageAnalysisError(
        'Moondream client not initialized. Is the moondream package installed?',
        this.name
      );
    }

    const captionLength = options.captionLength || 'normal';
    const maxTags = options.maxTags || 15;

    try {
      // Generate caption
      const captionResult = await this.model.caption({
        image: imageBuffer,
        length: captionLength,
        stream: false,
      });

      const caption = captionResult.caption || '';

      // Extract tags using a query
      const tagsResult = await this.model.query({
        image: imageBuffer,
        question:
          'List the main objects, people, colors, activities, and themes visible in this image as comma-separated tags. Be specific and concise.',
        stream: false,
      });

      // Parse tags from the response
      const rawTags = tagsResult.answer || '';
      const tags = rawTags
        .split(',')
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0 && tag.length < 50)
        .slice(0, maxTags);

      return {
        caption,
        tags,
        provider: this.name,
      };
    } catch (error) {
      throw new ImageAnalysisError(
        `Failed to analyze image with Moondream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }
}

// Singleton instance
let moondreamProviderInstance: MoondreamProvider | null = null;

/**
 * Get the singleton Moondream provider instance
 */
export function getMoondreamProvider(): MoondreamProvider {
  if (!moondreamProviderInstance) {
    moondreamProviderInstance = new MoondreamProvider();
  }
  return moondreamProviderInstance;
}
