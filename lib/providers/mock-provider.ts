import type { Platform, VideoMetadata } from '@/lib/analyze';
import { PLACEHOLDER_FORMATS } from '@/lib/analyze';
import type { MetadataProvider } from './index';

// ---------------------------------------------------------------------------
// MockMetadataProvider
//
// This is a DEMO/MOCK provider for development and UI testing only.
//
// It does NOT fetch or scrape YouTube, TikTok, or Instagram.
// It returns placeholder metadata (null title, null thumbnail, null duration)
// and a static list of unavailable formats.
//
// AUTHORIZED PROVIDER INTEGRATION POINT:
// To use real metadata, create an authorized provider that implements the
// MetadataProvider interface (see lib/providers/index.ts) and register it.
// The authorized provider must use official APIs only and must not scrape
// or bypass any platform restrictions.
// ---------------------------------------------------------------------------

export class MockMetadataProvider implements MetadataProvider {
  readonly id = 'mock';

  async getMetadata(_url: string, platform: Platform): Promise<VideoMetadata> {
    return {
      platform,
      title: null,
      thumbnail: null,
      duration: null,
      availableFormats: PLACEHOLDER_FORMATS,
    };
  }
}
