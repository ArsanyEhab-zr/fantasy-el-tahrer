export const DEFAULT_CHANNEL_LOGO = '/channel-logo.png';
export const FALLBACK_LEAGUE_LOGO = '/league-logo.webp';
export const VIEWER_PRODUCTION_ORIGIN = 'https://fantasy-el-tahrer.vercel.app';

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parse a YouTube Live / Watch / Share / Embed URL or raw 11-char video ID.
 * Returns the sanitized 11-char video ID, or '' if invalid.
 */
export function parseYouTubeVideoId(rawInput) {
  if (typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = 'https://' + candidate;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return '';
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let id = '';

  if (host === 'youtu.be') {
    id = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v') || '';
    } else {
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (['live', 'embed', 'shorts', 'v'].includes(segments[0]) && segments[1]) {
        id = segments[1];
      }
    }
  }

  return YOUTUBE_ID_PATTERN.test(id) ? id : '';
}

/**
 * Build a privacy-enhanced YouTube embed URL tuned for our custom 16:9 Broadcast HUD.
 * Disables native YouTube fullscreen (`fs=0`) so our outer wrapper fullscreen keeps HUD overlays visible.
 */
export function buildYouTubeEmbedUrl(inputOrId, { autoplay = false, mute = false } = {}) {
  const videoId = parseYouTubeVideoId(inputOrId);
  if (!videoId) return '';

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    fs: '0',
    iv_load_policy: '3',
  });
  if (autoplay) params.set('autoplay', '1');
  if (mute) params.set('mute', '1');

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Validate a channel logo URL or local asset path (blocks unsafe URI schemes).
 */
export function sanitizeChannelLogoUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return DEFAULT_CHANNEL_LOGO;
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_CHANNEL_LOGO;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return trimmed;
  } catch {
    // Fall through to default logo
  }
  return DEFAULT_CHANNEL_LOGO;
}

/**
 * Resolve which match should drive the broadcast HUD based on route override or Admin settings.
 */
export function resolveBroadcastMatch({
  broadcast,
  matches = [],
  liveMatch = null,
  overrideMatchId = null,
}) {
  if (overrideMatchId) {
    return matches.find(m => String(m.id) === String(overrideMatchId)) || null;
  }
  if (broadcast?.matchMode === 'manual' && broadcast?.manualMatchId) {
    const found = matches.find(m => String(m.id) === String(broadcast.manualMatchId));
    if (found) return found;
  }
  return liveMatch || null;
}

/**
 * Build OBS Browser Source URLs pointing to the Viewer production origin (or current origin in local dev).
 */
export function buildObsOverlayUrls(matchId = '', origin = VIEWER_PRODUCTION_ORIGIN) {
  const base = (origin || VIEWER_PRODUCTION_ORIGIN).replace(/\/+$/, '');
  const liveUrl = `${base}/overlay/live`;
  const matchUrl = matchId ? `${base}/overlay/${encodeURIComponent(matchId)}` : '';
  return {
    liveUrl,
    livePreviewUrl: `${liveUrl}?preview=1`,
    matchUrl,
    matchPreviewUrl: matchUrl ? `${matchUrl}?preview=1` : '',
  };
}
