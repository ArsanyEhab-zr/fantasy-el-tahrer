import { parseTimestamp, toDateTimeLocalValue } from './formatters.js';

const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
export const dayLabel = number => 'اليوم ' + (ordinals[number - 1] || number);
const dateOf = match => match.matchDate || toDateTimeLocalValue(match.scheduledAt || match.date).slice(0, 10);
const kickoff = match => parseTimestamp(match.scheduledAt || match.date)?.getTime() ?? Infinity;

export function matchdays(matches) {
  const dates = new Map();
  const days = new Map();
  const sorted = [...matches].sort((a, b) => kickoff(a) - kickoff(b));
  for (const match of sorted) {
    if (match.matchDay && dateOf(match)) dates.set(dateOf(match), Number(match.matchDay));
  }
  const reserved = new Set(matches.map(m => Number(m.matchDay)));
  let next = 1;
  for (const match of sorted) {
    const date = dateOf(match);
    if (date && !dates.has(date)) {
      while (reserved.has(next)) next++;
      dates.set(date, next++);
    }
    const number = Number(match.matchDay) || dates.get(date) || 0;
    if (!days.has(number)) days.set(number, { number, date, label: number ? dayLabel(number) : 'بدون موعد', matches: [] });
    const day = days.get(number);
    if (match.matchDayLabel) day.label = match.matchDayLabel;
    day.matches.push(match);
  }
  return [...days.values()].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.number - b.number);
}

export function activeMatchday(days, today = toDateTimeLocalValue(new Date()).slice(0, 10)) {
  const dated = days.filter(day => day.date);
  return days.find(day => day.matches.some(m => m.status === 'مباشر'))
    || dated.find(day => day.date === today)
    || dated.find(day => day.date > today && day.matches.some(m => !['منتهية','انتهت','انسحاب'].includes(m.status)))
    || dated.at(-1) || days.at(-1);
}
