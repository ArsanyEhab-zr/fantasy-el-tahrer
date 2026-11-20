const dateLabel = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', timeZone: 'UTC' });

export default function MatchdaySelector({ days, selected, select }) {
  if (!days.length) return null;
  return <nav aria-label="أيام الدوري" className="flex max-w-full gap-2 overflow-x-auto py-1">
    {days.map(day => <button key={day.number} type="button" aria-pressed={day.number === selected?.number}
      onClick={() => select(day.number)}
      className="min-h-11 shrink-0 rounded-full border border-current/25 px-4 text-sm font-bold aria-pressed:bg-fanta-volt aria-pressed:text-black">
      {day.label}{day.date && ' • ' + dateLabel.format(new Date(day.date + 'T12:00:00Z'))}
    </button>)}
  </nav>;
}
