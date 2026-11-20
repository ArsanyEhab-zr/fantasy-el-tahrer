import { Trophy, ArrowLeftRight } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../ui/TeamCrest';
import StatusBadge from '../ui/StatusBadge';

function BracketNode({ match, matchId, getTeam, isFinal = false }) {
  if (!match) {
    return (
      <div
        className={`glass-card w-60 shrink-0 rounded-2xl border-2 border-dashed p-3.5 text-center ${
          isFinal
            ? 'border-fanta-volt/60 bg-arena-surface'
            : 'border-arena-border bg-arena-surface/60'
        }`}
      >
        <span className="text-xs font-display font-bold text-arena-muted">
          {isFinal ? 'المباراة النهائية — لم تُحدد بعد' : `${matchId} • قريباً`}
        </span>
      </div>
    );
  }

  const home = getTeam(match.homeTeamId || match.homeTeam);
  const away = getTeam(match.awayTeamId || match.awayTeam);
  const isFinished = match.status === 'منتهية' || match.status === 'انتهت' || match.status === 'انسحاب';
  const homeWon = isFinished && (match.winnerTeamId ? match.homeTeamId === match.winnerTeamId : match.homeScore > match.awayScore);
  const awayWon = isFinished && (match.winnerTeamId ? match.awayTeamId === match.winnerTeamId : match.awayScore > match.homeScore);

  return (
    <div
      className={`glass-card w-60 shrink-0 rounded-2xl border-2 overflow-hidden ${
        isFinal
          ? 'border-fanta-volt bg-scoreboard-turf shadow-[0_12px_32px_-8px_rgba(164,212,182,0.3)]'
          : 'border-arena-border bg-arena-surface'
      }`}
    >
      <div className="px-3 py-2 bg-arena-elevated/80 border-b border-arena-border flex items-center justify-between gap-2">
        <span className="text-[11px] font-display font-bold text-arena-muted">
          {isFinal ? 'النهائي الكبير' : match.round || matchId}
        </span>
        <StatusBadge status={match.status} />
      </div>

      <div className="p-2.5 space-y-1.5" dir="rtl">
        <div
          className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
            homeWon
              ? 'bg-fanta-volt/12 border-fanta-volt/50'
              : 'bg-arena-bg/70 border-arena-border/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <TeamCrest team={home} size="xs" />
            <span
              className={`font-display text-sm truncate ${
                homeWon ? 'font-extrabold text-fanta-volt' : 'font-bold text-arena-ink'
              }`}
            >
              {home?.nameAr || home?.short || 'يُحدد'}
            </span>
          </div>
          <span className="font-display font-extrabold text-base num-tabular text-arena-ink">
            {match.homeScore ?? '-'}
          </span>
        </div>

        <div
          className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
            awayWon
              ? 'bg-fanta-volt/12 border-fanta-volt/50'
              : 'bg-arena-bg/70 border-arena-border/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <TeamCrest team={away} size="xs" />
            <span
              className={`font-display text-sm truncate ${
                awayWon ? 'font-extrabold text-fanta-volt' : 'font-bold text-arena-ink'
              }`}
            >
              {away?.nameAr || away?.short || 'يُحدد'}
            </span>
          </div>
          <span className="font-display font-extrabold text-base num-tabular text-arena-ink">
            {match.awayScore ?? '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoundColumn({ title, matchIds, matches, getTeam, accentClass = 'bg-arena-elevated text-arena-ink' }) {
  return (
    <div className="flex flex-col justify-around gap-5 shrink-0">
      <div className="text-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-display font-extrabold text-xs ${accentClass}`}
        >
          {title === 'النهائي' && <Trophy size={14} aria-hidden="true" />}
          <span>{title}</span>
        </span>
      </div>
      <div className="flex flex-col justify-around flex-1 gap-6">
        {matchIds.map((id) => (
          <BracketNode
            key={id}
            matchId={id}
            match={matches.find((m) => m.id === id || m.bracketSlotId === id)}
            getTeam={getTeam}
            isFinal={id === 'FINAL'}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * BracketView — High-contrast connected Knockout Stage Bracket (4, 8, or 16 teams).
 * Smooth horizontal scroll on small screens with clear Winner & Champion highlights.
 */
export default function BracketView({ className = '' }) {
  const { matches = [], bracketConfig, getTeam } = useTournament();
  const size = bracketConfig?.size || 4;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-arena-muted">
        <span>نظام خروج المغلوب ({size} فرق)</span>
        <span className="inline-flex items-center gap-1 md:hidden">
          <ArrowLeftRight size={13} aria-hidden="true" />
          <span>اسحب أفقياً</span>
        </span>
      </div>

      <div className="w-full overflow-x-auto pb-4 no-scrollbar" dir="ltr">
        <div className="inline-flex items-stretch gap-6 min-w-max px-1 py-2">
          {size === 16 && (
            <RoundColumn
              title="دور الـ 16"
              matchIds={['R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8']}
              matches={matches}
              getTeam={getTeam}
              accentClass="bg-arena-elevated border border-arena-border text-arena-ink"
            />
          )}
          {(size === 8 || size === 16) && (
            <RoundColumn
              title="ربع النهائي"
              matchIds={['QF1', 'QF2', 'QF3', 'QF4']}
              matches={matches}
              getTeam={getTeam}
              accentClass="bg-fanta-sky/15 border border-fanta-sky/40 text-fanta-sky"
            />
          )}
          <RoundColumn
            title="نصف النهائي"
            matchIds={['SF1', 'SF2']}
            matches={matches}
            getTeam={getTeam}
            accentClass="bg-fanta-orange/15 border border-fanta-orange/50 text-fanta-orange"
          />
          <RoundColumn
            title="النهائي"
            matchIds={['FINAL']}
            matches={matches}
            getTeam={getTeam}
            accentClass="bg-fanta-volt text-arena-bg"
          />
        </div>
      </div>
    </div>
  );
}
