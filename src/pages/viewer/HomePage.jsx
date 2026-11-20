import { Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  BarChart3,
  Flame,
  GitBranch,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,

} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import MatchdayHero from '../../components/match/MatchdayHero';
import { matchViewerUrl } from '../../utils/formatters';
import ScoreBoard from '../../components/match/ScoreBoard';
import MatchCard from '../../components/match/MatchCard';
import TeamCrest from '../../components/ui/TeamCrest';
import { StaggerList, StaggerItem, RevealBlock } from '../../components/ui/MotionPrimitives';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';

/**
 * HomePage — Fanta Public Fan Hub (/).
 * Strictly fan-only: zero links to Admin or Referee portals.
 * Conditionally shows Knockout entry ONLY when settings.enableKnockout === true.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const {
    liveMatch,
    liveMatches,
    upcomingMatches: contextUpcoming = [],
    recentMatches = [],
    topScorers = [],
    getTeam,
    loading,
    settings,
  } = useTournament();

  const enableKnockout = Boolean(settings?.enableKnockout);
  const upcomingMatches = contextUpcoming.slice(0, 4);

  const nextMatch = upcomingMatches[0] || null;
  const topThreeScorers = topScorers.slice(0, 3);

  const quickActions = [
    {
      label: 'الترتيب',
      sub: 'جداول المجموعات',
      to: '/standings',
      icon: BarChart3,
      accent: 'text-fanta-volt bg-fanta-volt/12 border-fanta-volt/40',
    },
    {
      label: 'الهدافون',
      sub: 'سباق الأهداف',
      to: '/scorers',
      icon: Flame,
      accent: 'text-fanta-orange bg-fanta-orange/12 border-fanta-orange/40',
    },
    ...(enableKnockout
      ? [
          {
            label: 'الإقصائيات',
            sub: 'شجرة البطولة',
            to: '/bracket',
            icon: GitBranch,
            accent: 'text-fanta-sky bg-fanta-sky/12 border-fanta-sky/40',
          },
        ]
      : [
          {
            label: 'مركز البث',
            sub: 'متابعة لحظية',
            to: '/live',
            icon: Radio,
            accent: 'text-fanta-crimson bg-fanta-crimson/12 border-fanta-crimson/40',
          },
        ]),
  ];

  return (
    <>
      <MatchdayHero liveMatch={liveMatch} />
      <div id="match-centre" className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-8 md:py-16">
      {/* Hero Banner: Live Match Center OR Next Scheduled Kick-Off */}
      <RevealBlock>
        {loading ? (
          <LoadingSkeleton count={1} height="h-56" />
        ) : liveMatch ? (
          <div className="space-y-3">
            {liveMatches.map(match => (
              <Link key={match.id} to={matchViewerUrl(match.id)} className="block rounded-3xl">
                <ScoreBoard match={match} />
                <span className="flex min-h-12 items-center justify-center gap-2 text-fanta-orange">
                  <Radio size={18} /> ادخل مركز المتابعة المباشر
                </span>
              </Link>
            ))}
          </div>
        ) : nextMatch ? (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold">المباراة القادمة</h2>
            <MatchCard match={nextMatch} onClick={() => navigate(matchViewerUrl(nextMatch.id))} />
          </section>
        ) : null}
      </RevealBlock>

      {/* Quick Fan Navigation Cards (ZERO Admin/Referee links) */}
      <StaggerList className="grid grid-cols-3 gap-3">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <StaggerItem key={item.to}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="glass-card w-full h-full rounded-2xl bg-arena-surface border-2 border-arena-border hover:border-fanta-orange/60 p-3.5 sm:p-4 text-right flex flex-col justify-between gap-3 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.accent}`}
                  aria-hidden="true"
                >
                  <Icon size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="font-display font-extrabold text-base sm:text-lg text-arena-ink leading-tight">
                    {item.label}
                  </div>
                  <div className="text-xs font-semibold text-arena-muted mt-0.5 hidden sm:block">
                    {item.sub}
                  </div>
                </div>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Desktop 2-Column Content Split: Scheduled Matches + Top Scorers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upcoming Scheduled Matches */}
        <section aria-labelledby="upcoming-heading" className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="upcoming-heading"
              className="font-display font-extrabold text-xl text-arena-ink flex items-center gap-2"
            >
              <CalendarClock size={21} className="text-fanta-orange" aria-hidden="true" />
              <span>جدول المباريات القادمة</span>
            </h2>
            <span className="text-xs font-display font-bold text-arena-muted num-tabular">
              {upcomingMatches.length} مباريات
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton count={2} height="h-28" />
          ) : upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} onClick={() => navigate(matchViewerUrl(match.id))} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="لا توجد مباريات مجدولة حالياً"
              description="سيتم الإعلان عن مواعيد المباريات القادمة فور جدولتها من إدارة الدوري."
            />
          )}
        </section>

        {/* Top 3 Scorers Preview (Goals ONLY) */}
        <section aria-labelledby="scorers-preview-heading" className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="scorers-preview-heading"
              className="font-display font-extrabold text-xl text-arena-ink flex items-center gap-2"
            >
              <Flame size={21} className="text-fanta-volt" aria-hidden="true" />
              <span>صدارة الهدافين</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate('/scorers')}
              className="inline-flex items-center gap-1 text-xs font-display font-bold text-fanta-orange hover:underline min-h-[36px] px-1 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} height="h-18" />
          ) : topThreeScorers.length > 0 ? (
            <div className="glass-card rounded-3xl bg-arena-surface border-2 border-arena-border divide-y divide-arena-border/70 overflow-hidden">
              {topThreeScorers.map((player, index) => {
                const team = getTeam(player.teamId || player.team);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => navigate(`/player/${player.id}`)}
                    className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-arena-elevated/70 transition-colors text-right cursor-pointer"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-extrabold text-sm num-tabular shrink-0 ${
                        index === 0
                          ? 'bg-fanta-volt text-arena-bg'
                          : index === 1
                            ? 'bg-fanta-orange text-arena-bg'
                            : 'bg-arena-elevated text-arena-ink border border-arena-border'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <TeamCrest team={team} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm sm:text-base text-arena-ink truncate">
                        {player.nameAr}
                      </div>
                      <div className="text-xs font-semibold text-arena-muted truncate">
                        {team?.nameAr || team?.short || ''}
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-arena-bg border border-arena-border text-center shrink-0">
                      <span className="font-display font-extrabold text-lg num-tabular text-fanta-volt">
                        {player.goals || 0}
                      </span>
                      <span className="text-[11px] font-bold text-arena-muted mr-1">هدف</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Flame}
              title="سباق الهدافين لم يبدأ بعد"
              description="تظهر قائمة الهدافين تلقائياً فور تسجيل أول أهداف الدوري."
            />
          )}
        </section>
      </div>

      {/* Recent Finished Results */}
      <section aria-labelledby="recent-heading" className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="recent-heading"
            className="font-display font-extrabold text-xl text-arena-ink flex items-center gap-2"
          >
            <CheckCircle2 size={21} className="text-emerald-400" aria-hidden="true" />
            <span>آخر النتائج</span>
          </h2>
          <button
            type="button"
            onClick={() => navigate('/standings')}
            className="inline-flex items-center gap-1 text-xs font-display font-bold text-fanta-orange hover:underline min-h-[36px] px-1 cursor-pointer"
          >
            <span>جدول الترتيب</span>
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} height="h-24" />
        ) : recentMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentMatches.map((match) => (
              <MatchCard key={match.id} match={match} onClick={() => navigate(matchViewerUrl(match.id))} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="لا توجد نتائج منتهية بعد"
            description="ستُعرض هنا نتائج المباريات فور انتهائها مباشرة."
          />
        )}
      </section>
      </div>
    </>
  );
}
