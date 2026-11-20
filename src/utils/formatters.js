/**
 * Date, time, and match clock formatting utilities for Project Fanta.
 * Always produces clean, legible Arabic/tabular strings with zero crashes on empty/invalid inputs.
 */

export const parseTimestamp = (value) => {
  if (value == null || value === '') return null;
  let date;
  if (typeof value.toDate === 'function') date = value.toDate();
  else if (typeof value.seconds === 'number') date = new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
  else date = new Date(value);
  return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
};

export const formatMatchDateTime = (scheduledAt) => {
  const date = parseTimestamp(scheduledAt);
  if (!date) return null;

  const datePart = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return {
    datePart,
    timePart,
    full: `${datePart} • ${timePart}`,
  };
};

export const toDateTimeLocalValue = (scheduledAt) => {
  const date = parseTimestamp(scheduledAt);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Formats raw elapsed match seconds into display strings with stoppage-time awareness.
 * Example (halfDurationMinutes = 20, regulation = 40 mins):
 *  - 852s -> mmss: "14:12", minute: 15, displayMinute: "15'", isStoppage: false
 *  - 2530s -> mmss: "42:10", minute: 43, displayMinute: "40+3'", isStoppage: true
 */
export const formatClockState = (totalSeconds = 0, regulationMinutes = 40) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  const currentMinute = Math.max(1, Math.floor(safeSeconds / 60) + (safeSeconds > 0 ? 1 : 0));
  const isStoppage = safeSeconds >= regulationMinutes * 60;
  const stoppageExtra = isStoppage ? Math.max(1, currentMinute - regulationMinutes) : 0;

  return {
    totalSeconds: safeSeconds,
    mmss: `${pad(mins)}:${pad(secs)}`,
    minute: safeSeconds === 0 ? 0 : currentMinute,
    isStoppage,
    stoppageExtra,
    displayMinute:
      safeSeconds === 0
        ? "0'"
        : isStoppage
          ? `${regulationMinutes}+${stoppageExtra}'`
          : `${currentMinute}'`,
  };
};

/**
 * Deterministic accent color for team badges when no custom color is set.
 */
const TEAM_ACCENTS = [
  { bg: 'bg-fanta-orange/15', border: 'border-fanta-orange/50', text: 'text-fanta-orange' },
  { bg: 'bg-fanta-volt/15', border: 'border-fanta-volt/50', text: 'text-fanta-volt' },
  { bg: 'bg-fanta-sky/15', border: 'border-fanta-sky/50', text: 'text-fanta-sky' },
  { bg: 'bg-fanta-crimson/15', border: 'border-fanta-crimson/50', text: 'text-fanta-crimson' },
  { bg: 'bg-fanta-amber/15', border: 'border-fanta-amber/50', text: 'text-fanta-amber' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-400/50', text: 'text-emerald-400' },
];

export const getTeamAccent = (seed = '') => {
  const str = String(seed || 'fanta');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % TEAM_ACCENTS.length;
  }
  return TEAM_ACCENTS[Math.abs(hash) % TEAM_ACCENTS.length];
};

export const matchViewerUrl = id => '/live?matchId=' + encodeURIComponent(id);
