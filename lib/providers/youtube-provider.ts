import type { Platform, VideoMetadata, VideoFormat } from '@/lib/analyze';
import { PLACEHOLDER_FORMATS } from '@/lib/analyze';
import type { MetadataProvider } from './index';

// ---------------------------------------------------------------------------
// YouTubeMetadataProvider
//
// Retrieves video metadata (title, thumbnail, duration) from the official
// YouTube Data API v3 via a Supabase Edge Function proxy.
//
// ARCHITECTURE:
//   The YOUTUBE_API_KEY secret lives in Supabase Secrets and is only available
//   to Supabase Edge Functions — NOT to the Next.js server runtime. So this
//   provider calls the "youtube-metadata" edge function, which in turn calls
//   the YouTube Data API v3 with the key.
//
// SECURITY:
//   - The API key is never in the Next.js environment or client code.
//   - The edge function never includes the key in its response.
//   - Does NOT scrape, use yt-dlp, bypass DRM, or circumvent any restrictions.
//   - Only requests part=snippet,contentDetails (minimum required fields).
// ---------------------------------------------------------------------------

const UNAVAILABLE_FORMATS: VideoFormat[] = PLACEHOLDER_FORMATS;

/**
 * Extracts the YouTube video ID from a YouTube URL.
 * Supports youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, and youtube.com/embed/ formats.
 */
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return id || null;
    }

    if (host.endsWith('youtube.com')) {
      // /watch?v=VIDEO_ID
      const vParam = parsed.searchParams.get('v');
      if (vParam) return vParam;

      // /shorts/VIDEO_ID or /embed/VIDEO_ID
      const parts = parsed.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'shorts' || parts[0] === 'embed') && parts[1]) {
        return parts[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Converts ISO 8601 duration (e.g. "PT4M13S") to a human-readable string (e.g. "4:13").
 */
function iso8601ToHumanDuration(iso: string): string {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return iso;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

type EdgeFunctionResult = {
  title: string | null;
  thumbnail: string | null;
  duration: string | null;
};

export class YouTubeMetadataProvider implements MetadataProvider {
  readonly id = 'youtube-official';

  async getMetadata(url: string, platform: Platform): Promise<VideoMetadata | null> {
    // Only handle YouTube URLs
    if (platform !== 'youtube') {
      return null;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return null;
    }

    return this.fetchFromEdgeFunction(videoId, platform);
  }

  /**
   * Calls the "youtube-metadata" Supabase Edge Function, which proxies the
   * official YouTube Data API v3 using the server-side YOUTUBE_API_KEY secret.
   *
   * On any error or missing video, returns placeholder metadata so the
   * application continues to function gracefully.
   */
  private async fetchFromEdgeFunction(videoId: string, platform: Platform): Promise<VideoMetadata> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { platform, title: null, thumbnail: null, duration: null, availableFormats: UNAVAILABLE_FORMATS };
    }

    const endpoint = `${supabaseUrl}/functions/v1/youtube-metadata`;

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ videoId }),
      });
    } catch {
      // Network error — fail gracefully
      return { platform, title: null, thumbnail: null, duration: null, availableFormats: UNAVAILABLE_FORMATS };
    }

    if (!res.ok) {
      // Edge function error — fail gracefully
      return { platform, title: null, thumbnail: null, duration: null, availableFormats: UNAVAILABLE_FORMATS };
    }

    let data: EdgeFunctionResult;
    try {
      data = await res.json() as EdgeFunctionResult;
    } catch {
      return { platform, title: null, thumbnail: null, duration: null, availableFormats: UNAVAILABLE_FORMATS };
    }

    return {
      platform,
      title: data.title ?? null,
      thumbnail: data.thumbnail ?? null,
      duration: data.duration ? iso8601ToHumanDuration(data.duration) : null,
      availableFormats: UNAVAILABLE_FORMATS,
    };
  }
}
