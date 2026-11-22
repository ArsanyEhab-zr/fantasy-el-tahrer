import { parseTimestamp, toDateTimeLocalValue } from './formatters.js';

const CAIRO_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const CAIRO_TIME_FMT = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  timeZone: 'Africa/Cairo',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const CAIRO_LONG_DATE_FMT = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'Africa/Cairo',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const UPCOMING_STATUSES = new Set(['مجدولة', 'قادمة', 'scheduled']);

export function getCairoDateString(date = new Date()) {
  return CAIRO_DATE_FMT.format(date);
}

export function getTomorrowCairoDateString(now = new Date()) {
  const today = getCairoDateString(now);
  const [year, month, day] = today.split('-').map(Number);
  const nextUtc = new Date(Date.UTC(year, month - 1, day + 1));
  return nextUtc.toISOString().slice(0, 10);
}

export function formatCairoKickoffTime(scheduledAt) {
  const date = parseTimestamp(scheduledAt);
  if (!date) return 'موعد غير محدد';
  return CAIRO_TIME_FMT.format(date);
}

export function formatCairoLongDate(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString || '';
  const [y, m, d] = dateString.split('-').map(Number);
  return CAIRO_LONG_DATE_FMT.format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
}

function resolveMatchCairoDate(match) {
  const ts = parseTimestamp(match?.scheduledAt || match?.date);
  if (ts) return toDateTimeLocalValue(ts).slice(0, 10);
  return typeof match?.matchDate === 'string' ? match.matchDate.slice(0, 10) : '';
}

function teamNameFrom(teamsMap, id, fallback = 'فريق') {
  if (!id) return fallback;
  const team = teamsMap.get(String(id));
  return team?.nameAr || team?.name || fallback;
}

export function getTomorrowScheduledMatches({ matches = [], teams = [], now = new Date() }) {
  const tomorrowDate = getTomorrowCairoDateString(now);
  const teamsMap = teams instanceof Map
    ? teams
    : new Map(teams.map(t => [String(t.id), t]));

  const upcoming = matches
    .filter(match => {
      if (!match) return false;
      const status = match.status || 'مجدولة';
      if (!UPCOMING_STATUSES.has(status)) return false;
      return resolveMatchCairoDate(match) === tomorrowDate;
    })
    .sort((a, b) => {
      const ta = parseTimestamp(a.scheduledAt || a.date)?.getTime() ?? Infinity;
      const tb = parseTimestamp(b.scheduledAt || b.date)?.getTime() ?? Infinity;
      return ta - tb;
    });

  const items = upcoming.map(match => {
    const homeId = match.homeTeamId || match.homeTeam;
    const awayId = match.awayTeamId || match.awayTeam;
    const homeName = teamNameFrom(teamsMap, homeId, 'الفريق المستضيف');
    const awayName = teamNameFrom(teamsMap, awayId, 'الفريق الضيف');
    const timeLabel = formatCairoKickoffTime(match.scheduledAt || match.date);
    return {
      id: String(match.id || ''),
      homeName,
      awayName,
      timeLabel,
      pitch: match.pitch || '',
      round: match.round || '',
      line: `• ${homeName} × ${awayName} (${timeLabel})`,
    };
  });

  return { tomorrowDate, matches: items };
}

export function buildTomorrowReminderPayload({ matches = [], teams = [], now = new Date() }) {
  const { tomorrowDate, matches: items } = getTomorrowScheduledMatches({ matches, teams, now });
  const title = '📅 خلي بالك! مواعيد ماتشات بكرة في فانتزي التحرير';
  if (!items.length) {
    return { tomorrowDate, count: 0, matches: [], title, body: '' };
  }

  const maxLen = 1400;
  const lines = [];
  let length = 0;
  for (let i = 0; i < items.length; i += 1) {
    const line = items[i].line;
    const nextLen = length + (lines.length ? 1 : 0) + line.length;
    if (nextLen > maxLen && i < items.length) {
      const remaining = items.length - i;
      lines.push(`• و${remaining} مباريات أخرى في جدول البطولة`);
      break;
    }
    lines.push(line);
    length = nextLen;
  }

  return {
    tomorrowDate,
    count: items.length,
    matches: items,
    title,
    body: lines.join('\n'),
  };
}
