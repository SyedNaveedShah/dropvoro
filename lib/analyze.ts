export type Platform = 'youtube' | 'tiktok' | 'instagram';

export type AnalyzeRequest = {
  url?: string;
};

export type VideoFormat = {
  id: string;
  label: string;
  container: string;
  type: 'video' | 'audio';
  available: boolean;
};

export type VideoMetadata = {
  platform: Platform;
  title: string | null;
  thumbnail: string | null;
  duration: string | null;
  availableFormats: VideoFormat[];
};

export type AnalyzeSuccessResponse = {
  success: true;
  valid: true;
  platform: Platform;
  url: string;
  title: string | null;
  thumbnail: string | null;
  duration: string | null;
  availableFormats: VideoFormat[];
};

export type AnalyzeErrorResponse = {
  success: false;
  valid: false;
  error: string;
};

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

export const PLATFORM_PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
  { platform: 'youtube', patterns: [/youtube\.com/i, /youtu\.be/i] },
  { platform: 'tiktok', patterns: [/tiktok\.com/i] },
  { platform: 'instagram', patterns: [/instagram\.com/i] },
];

export function detectPlatform(hostname: string): Platform | null {
  for (const { platform, patterns } of PLATFORM_PATTERNS) {
    if (patterns.some((p) => p.test(hostname))) {
      return platform;
    }
  }
  return null;
}

export function parseUrl(input: string): URL | null {
  try {
    const parsed = new URL(input.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export const PLACEHOLDER_FORMATS: VideoFormat[] = [
  { id: 'best-video', label: 'Best Quality (Video + Audio)', container: 'mp4', type: 'video', available: false },
  { id: '720p', label: '720p HD', container: 'mp4', type: 'video', available: false },
  { id: '480p', label: '480p', container: 'mp4', type: 'video', available: false },
  { id: 'audio-only', label: 'Audio Only', container: 'mp3', type: 'audio', available: false },
];
