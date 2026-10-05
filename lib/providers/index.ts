import type { Platform, VideoMetadata } from '@/lib/analyze';

// ---------------------------------------------------------------------------
// MetadataProvider interface
//
// This interface defines the contract for any metadata provider that supplies
// video information (title, thumbnail, duration, available formats) for a
// given supported URL.
//
// AUTHORIZED PROVIDER INTEGRATION POINT:
// To connect an official/authorized API (e.g. YouTube Data API, TikTok
// Display API, Instagram Graph API), create a new class that implements
// this interface and register it in getProviderForPlatform() below.
//
// The provider must only return metadata that the authorized API exposes.
// It must NOT scrape, bypass DRM, bypass authentication, or circumvent any
// platform restrictions.
// ---------------------------------------------------------------------------

export interface MetadataProvider {
  /** Unique identifier for this provider (e.g. "mock", "youtube-official"). */
  readonly id: string;

  /**
   * Fetch structured metadata for a supported URL.
   * Returns null if the provider cannot resolve the URL.
   */
  getMetadata(url: string, platform: Platform): Promise<VideoMetadata | null>;
}

// ---------------------------------------------------------------------------
// Platform-specific provider resolution
//
// AUTHORIZED PROVIDER INTEGRATION POINT:
// Each platform gets its own provider. YouTube uses the YouTubeMetadataProvider
// (which is API-key-ready but returns placeholder data until the key is set and
// the integration is enabled). TikTok and Instagram continue using the mock
// provider until their official API providers are implemented.
// ---------------------------------------------------------------------------

let mockProviderInstance: MetadataProvider | null = null;
let youtubeProviderInstance: MetadataProvider | null = null;

function getMockProvider(): MetadataProvider {
  if (!mockProviderInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockMetadataProvider } = require('./mock-provider');
    mockProviderInstance = new MockMetadataProvider();
  }
  return mockProviderInstance as MetadataProvider;
}

function getYoutubeProvider(): MetadataProvider {
  if (!youtubeProviderInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { YouTubeMetadataProvider } = require('./youtube-provider');
    youtubeProviderInstance = new YouTubeMetadataProvider();
  }
  return youtubeProviderInstance as MetadataProvider;
}

/**
 * Returns the appropriate metadata provider for a given platform.
 *
 * - YouTube:  YouTubeMetadataProvider (API-key-ready, returns placeholder
 *             data until YOUTUBE_API_KEY is configured and the integration
 *             is enabled)
 * - TikTok:   MockMetadataProvider (placeholder data)
 * - Instagram: MockMetadataProvider (placeholder data)
 */
export function getProviderForPlatform(platform: Platform): MetadataProvider {
  switch (platform) {
    case 'youtube':
      return getYoutubeProvider();
    case 'tiktok':
    case 'instagram':
    default:
      return getMockProvider();
  }
}

// ---------------------------------------------------------------------------
// Legacy registry functions (kept for backward compatibility)
// ---------------------------------------------------------------------------

const providers: MetadataProvider[] = [];

export function registerProvider(provider: MetadataProvider): void {
  providers.push(provider);
}

export function getProviders(): MetadataProvider[] {
  return providers;
}

export function clearProviders(): void {
  providers.length = 0;
}

/**
 * Returns the active metadata provider.
 * @deprecated Use getProviderForPlatform() for platform-specific resolution.
 */
export function getActiveProvider(): MetadataProvider {
  if (providers.length > 0) {
    return providers[providers.length - 1];
  }
  return getMockProvider();
}
