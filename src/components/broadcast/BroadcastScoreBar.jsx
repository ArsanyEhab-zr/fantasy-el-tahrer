import { motion, AnimatePresence } from 'framer-motion';
import { Flame, PauseCircle } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import TeamCrest from '../ui/TeamCrest';
import { ScoreFlipNumber } from '../ui/MotionPrimitives';
import { MOTION_EASE } from '../../utils/motion';
import { formatMatchDateTime } from '../../utils/formatters';

/**
 * BroadcastScoreBar — Compact TV-style animated scoreboard bug for Watch Live & OBS Overlay.
 * Displays official league crest, Home Team, animated ScoreFlipNumber digits, synced live clock,
 * Away Team, and an animated Goal Flash banner when a goal is scored.
 */
export default function BroadcastScoreBar({ match, goalFlash = null }) {
  const { getTeam, getPlayer, settings } = useTournament();
  const clock = useMatchTimer(match, settings?.halfDurationMinutes || 10);

  if (!match) return null;

  const home = getTeam(match.homeTeamId || match.homeTeam);
  const away = getTeam(match.awayTeamId || match.awayTeam);
  const isLive = match.status === 'مباشر' || match.status === 'live';
  const isPaused = isLive && match.timerStatus === 'paused';
  const isFinished = match.status === 'منتهية' || match.status === 'انتهت' || match.status === 'finished';
  const isForfeit = match.status === 'انسحاب' || match.status === 'forfeit';
  const scheduled = formatMatchDateTime(match.scheduledAt || match.date);

  const flashPlayer = goalFlash?.playerId ? getPlayer(goalFlash.playerId) : null;
  const flashTeam = goalFlash?.teamId ? getTeam(goalFlash.teamId) : null;

  return (
    <div dir="rtl" className="inline-flex flex-col items-end max-w-full">
      {/* Primary TV Scoreboard Pill */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: MOTION_EASE.out }}
        className={`relative rounded-xl sm:rounded-2xl overflow-hidden border backdrop-blur-md shadow-[0_12px_30px_-8px_rgba(0,0,0,0.9)] transition-colors ${
          goalFlash
            ? 'bg-[#0b1f38]/95 border-fanta-orange shadow-[0_0_24px_rgba(232,200,127,0.55)]'
            : 'bg-[#071528]/88 border-fanta-orange/40'
        }`}
      >
        {/* Top metallic gold-to-volt broadcast accent bar */}
        <div
          className="h-[2px] w-full bg-gradient-to-l from-fanta-orange via-fanta-amber to-fanta-volt"
          aria-hidden="true"
        />

        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 py-1 sm:px-3 sm:py-1.5">
          {/* Official League Emblem */}
          <img
            src="/league-logo.webp"
            alt=""
            width="28"
            height="28"
            className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 object-contain drop-shadow"
          />

          <span className="h-4 sm:h-5 w-px bg-white/15 shrink-0" aria-hidden="true" />

          {/* Home Team */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <TeamCrest team={home} size="xs" className="!w-5 !h-5 sm:!w-7 sm:!h-7 !text-[10px] !border" />
            <span className="font-display font-extrabold text-[11px] sm:text-sm text-arena-ink truncate max-w-[62px] sm:max-w-[118px] leading-none">
              {home?.nameAr || home?.short || 'فريق 1'}
            </span>
          </div>

          {/* Animated Score Box */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-[#040d1a]/95 border border-white/15 shadow-inner shrink-0">
            <ScoreFlipNumber
              value={match.homeScore ?? 0}
              className="font-display font-extrabold text-sm sm:text-lg leading-none text-fanta-orange"
            />
            <span className="text-white/40 font-bold text-xs sm:text-sm leading-none select-none">-</span>
            <ScoreFlipNumber
              value={match.awayScore ?? 0}
              className="font-display font-extrabold text-sm sm:text-lg leading-none text-fanta-volt"
            />
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="font-display font-extrabold text-[11px] sm:text-sm text-arena-ink truncate max-w-[62px] sm:max-w-[118px] leading-none">
              {away?.nameAr || away?.short || 'فريق 2'}
            </span>
            <TeamCrest team={away} size="xs" className="!w-5 !h-5 sm:!w-7 sm:!h-7 !text-[10px] !border" />
          </div>

          {/* Live Clock / Match Status Pill */}
          <div className="shrink-0">
            {isLive ? (
              <div
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-display font-extrabold text-[10px] sm:text-xs num-tabular leading-none ${
                  isPaused
                    ? 'bg-fanta-amber/20 border border-fanta-amber/60 text-fanta-amber'
                    : clock.isStoppage
                      ? 'bg-fanta-amber text-arena-bg'
                      : 'bg-fanta-crimson text-white shadow-[0_0_12px_rgba(253,113,129,0.5)]'
                }`}
              >
                {isPaused ? (
                  <>
                    <PauseCircle size={11} className="shrink-0" aria-hidden="true" />
                    <span>استراحة</span>
                    <span className="hidden sm:inline">{clock.mmss}</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0" aria-hidden="true">
                      <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex rounded-full h-full w-full bg-current" />
                    </span>
                    <span>{clock.mmss}</span>
                    {clock.isStoppage && (
                      <span className="text-[9px] sm:text-[10px] font-black">
                        ({clock.displayMinute})
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-arena-elevated/90 border border-arena-border text-[10px] sm:text-[11px] font-display font-bold text-arena-muted leading-none">
                {isFinished ? 'انتهت' : isForfeit ? 'انسحاب' : scheduled?.timePart || 'مجدولة'}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Celebratory Goal Flash Sub-Banner */}
      <AnimatePresence>
        {goalFlash && (
          <motion.div
            key={goalFlash.id}
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={MOTION_EASE.punch}
            className="mt-1.5 inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-l from-fanta-orange via-fanta-amber to-fanta-volt text-arena-bg font-display font-extrabold text-[11px] sm:text-sm shadow-[0_8px_28px_-4px_rgba(232,200,127,0.75)]"
          >
            <Flame size={15} strokeWidth={2.7} className="shrink-0" aria-hidden="true" />
            <span>هدف!</span>
            {(flashPlayer?.nameAr || goalFlash.playerName) && (
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {flashPlayer?.nameAr || goalFlash.playerName}
              </span>
            )}
            {flashTeam?.nameAr && (
              <span className="hidden sm:inline opacity-80">({flashTeam.nameAr})</span>
            )}
            {goalFlash.displayMinute && (
              <span className="px-1.5 py-0.5 rounded bg-arena-bg/20 num-tabular text-[10px] sm:text-xs">
                {goalFlash.displayMinute}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
