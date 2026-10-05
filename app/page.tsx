'use client';

import { useState, FormEvent } from 'react';
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Youtube,
  Instagram,
  Music2,
  ClipboardPaste,
  X,
  Play,
  Shield,
  Clock,
  FileVideo,
  FileAudio,
  Lock,
} from 'lucide-react';

type Status = {
  type: 'success' | 'error' | null;
  message: string;
};

type VideoFormat = {
  id: string;
  label: string;
  container: string;
  type: string;
  available: boolean;
};

type Result = {
  platform: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  duration: string | null;
  availableFormats: VideoFormat[];
};

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { name: 'TikTok', icon: Music2, color: 'text-cyan-400' },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
];

const PLATFORM_STYLES: Record<string, { badge: string; icon: typeof Youtube }> = {
  YouTube: { badge: 'bg-red-500/15 text-red-400 border-red-500/30', icon: Youtube },
  TikTok: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', icon: Music2 },
  Instagram: { badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30', icon: Instagram },
};

const PLATFORM_DISPLAY: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

type ApiResponse =
  | { success: true; valid: true; platform: string; url: string; title: string | null; thumbnail: string | null; duration: string | null; availableFormats: VideoFormat[] }
  | { success: false; valid: false; error: string };

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>({ type: null, message: '' });
  const [isShaking, setIsShaking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleClear = () => {
    setUrl('');
    setStatus({ type: null, message: '' });
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setIsShaking(true);
      setStatus({ type: 'error', message: 'Please paste a video URL first.' });
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    if (!isValidUrl(url)) {
      setIsShaking(true);
      setResult(null);
      setStatus({ type: 'error', message: "That doesn't look like a valid URL. Make sure it starts with http:// or https://" });
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    setIsChecking(true);
    setStatus({ type: null, message: '' });
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: ApiResponse = await res.json();

      setIsChecking(false);

      if (data.success) {
        const displayName = PLATFORM_DISPLAY[data.platform] ?? data.platform;
        setStatus({ type: 'success', message: `${displayName} link detected` });
        setResult({
          platform: displayName,
          url: data.url,
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          availableFormats: data.availableFormats,
        });
      } else {
        const errorMap: Record<string, string> = {
          'Unsupported platform': 'Please enter a supported YouTube, TikTok, or Instagram URL.',
          'Invalid URL format': "That doesn't look like a valid URL. Make sure it starts with http:// or https://",
          'URL is required': 'Please paste a video URL first.',
          'Failed to retrieve metadata': 'We could not retrieve information for this link. Please try again.',
        };
        setStatus({
          type: 'error',
          message: errorMap[data.error] ?? data.error,
        });
      }
    } catch {
      setIsChecking(false);
      setStatus({
        type: 'error',
        message: 'Something went wrong. Please check your connection and try again.',
      });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setStatus({ type: null, message: '' });
      }
    } catch {
      // Clipboard API not available — silently ignore
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] animate-glow" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[360px] w-[360px] rounded-full bg-accent/15 blur-[100px] animate-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pb-8 pt-10 sm:max-w-lg sm:px-8">
        {/* Logo */}
        <header className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Drop<span className="text-primary">Load</span>
            </span>
          </div>
        </header>

        {/* Hero + Form */}
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Download Videos Easily
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Paste a video link and get started.
            </p>
          </div>

          {/* URL Form */}
          <form
            onSubmit={handleSubmit}
            className={`mt-8 animate-fade-in-up ${isShaking ? 'animate-shake' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <div className="group relative">
              <input
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (status.type !== null) setStatus({ type: null, message: '' });
                }}
                placeholder="Paste YouTube, TikTok or Instagram URL"
                className="w-full rounded-xl border border-border bg-card/70 px-4 py-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handlePaste}
                aria-label="Paste from clipboard"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ClipboardPaste className="h-5 w-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold tracking-wide text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {isChecking ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  <span>CHECKING…</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>DOWNLOAD</span>
                </>
              )}
            </button>
          </form>

          {/* Error status message */}
          {status.type === 'error' && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 animate-fade-in-up">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm leading-relaxed text-destructive/90">
                {status.message}
              </p>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur animate-fade-in-up">
              {/* Thumbnail area */}
              <div className="relative aspect-video w-full bg-secondary/50">
                {result.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.thumbnail}
                    alt={result.title ?? 'Video thumbnail'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                      <Play className="h-6 w-6 fill-primary text-primary" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Thumbnail preview</p>
                  </div>
                )}
                {/* Platform badge over thumbnail */}
                <div className="absolute left-3 top-3">
                  {(() => {
                    const style = PLATFORM_STYLES[result.platform];
                    const Icon = style?.icon ?? Youtube;
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style?.badge ?? 'bg-secondary text-muted-foreground border-border'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {result.platform}
                      </span>
                    );
                  })()}
                </div>
                {/* Duration badge */}
                {result.duration && (
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                      <Clock className="h-3 w-3" />
                      {result.duration}
                    </span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {result.title ? (
                      <h2 className="text-base font-semibold leading-snug text-foreground">
                        {result.title}
                      </h2>
                    ) : (
                      <h2 className="truncate text-base font-semibold text-foreground">
                        {result.platform}
                      </h2>
                    )}
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Link detected successfully
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear and enter another URL"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Video title placeholder (shown when title is null) */}
                {!result.title && (
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded-full bg-secondary" />
                    <div className="h-3 w-3/4 rounded-full bg-secondary" />
                  </div>
                )}

                {/* Available formats */}
                {result.availableFormats.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Available Formats
                    </p>
                    <div className="space-y-1.5">
                      {result.availableFormats.map((fmt) => (
                        <div
                          key={fmt.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {fmt.type === 'audio' ? (
                              <FileAudio className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileVideo className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm text-foreground">{fmt.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase text-muted-foreground">{fmt.container}</span>
                            {!fmt.available && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                <Lock className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download button — disabled/non-functional for now */}
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary/50 text-sm font-bold tracking-wide text-primary-foreground/70 transition-all duration-200"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>

                {/* Permission note */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Download is available only for content you own or have permission to download.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Supported platforms */}
          <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Supports
            </p>
            <div className="flex items-center gap-5">
              {SUPPORTED_PLATFORMS.map(({ name, icon: Icon, color }) => (
                <div key={name} className="flex flex-col items-center gap-1.5 transition-transform duration-200 hover:scale-110">
                  <Icon className={`h-6 w-6 ${color}`} />
                  <span className="text-[11px] font-medium text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="animate-fade-in-up text-center" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs text-muted-foreground/60">
            DropLoad — for personal use only. Respect creators' rights.
          </p>
        </footer>
      </div>
    </main>
  );
}
