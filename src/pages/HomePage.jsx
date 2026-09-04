import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import CardboardContainer from '../components/primitives/CardboardContainer';
import TornPaperButton from '../components/primitives/TornPaperButton';
import MaskingTape from '../components/primitives/MaskingTape';
import InkDoodle from '../components/primitives/InkDoodle';
import PaperScrap from '../components/primitives/PaperScrap';
import MatchCard from '../components/match/MatchCard';
import LiveIndicator from '../components/match/LiveIndicator';

export default function HomePage() {
  const navigate = useNavigate();
  const { liveMatch, recentMatches, getTeam, loading } = useTournament();

  const homeTeam = liveMatch ? getTeam(liveMatch.homeTeam) : null;
  const awayTeam = liveMatch ? getTeam(liveMatch.awayTeam) : null;

  return (
    <ScrapbookPage>
      <ScrapbookHeader />

      <div className="flex flex-col gap-8 mt-4">
        {/* Live match banner */}
        <div className="relative animate-paper-drop" style={{ '--card-angle': '-1deg' }}>
          <CardboardContainer variant="board" rotation={-1} withTape withDoodle>
            {liveMatch ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <LiveIndicator minute={liveMatch.minute} />
                  <PaperScrap color="pink" size="sm" rotation={3}>
                    الآن
                  </PaperScrap>
                </div>
                <div className="text-center">
                  <span className="text-stamp text-3xl text-white">
                    {homeTeam?.nameAr || homeTeam?.short || '...'}
                  </span>
                  <span className="text-stamp text-4xl text-scrap-cyan mx-3"
                    style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
                  >
                    {liveMatch.homeScore}
                  </span>
                  <span className="text-white/50 text-2xl mx-1">-</span>
                  <span className="text-stamp text-4xl text-scrap-magenta mx-3"
                    style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
                  >
                    {liveMatch.awayScore}
                  </span>
                  <span className="text-stamp text-3xl text-white">
                    {awayTeam?.nameAr || awayTeam?.short || '...'}
                  </span>
                </div>
                <div className="text-center mt-2">
                  <TornPaperButton
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/live')}
                  >
                    تابع المباراة ⚡
                  </TornPaperButton>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <span className="text-stamp text-xl text-white/70">لا توجد مباراة مباشرة</span>
              </div>
            )}
          </CardboardContainer>
        </div>

        {/* Navigation menu */}
        <div className="px-2">
          <h2
            className="text-stamp text-2xl mb-4 inline-block"
            style={{ transform: 'rotate(-2deg)' }}
          >
            القائمة الرئيسية
          </h2>
          <InkDoodle type="underline" size={100} className="-mt-2 right-0 opacity-20" />

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '⚡ المباريات', to: '/live', variant: 'primary', rot: -1.5 },
              { label: '📊 الترتيب', to: '/standings', variant: 'secondary', rot: 1 },
              { label: '⚽ الهدافون', to: '/scorers', variant: 'primary', rot: 0.5 },
              { label: '🏆 شجرة البطولة', to: '/bracket', variant: 'secondary', rot: -1 },
              { label: '🏁 الحكم', to: '/referee', variant: 'ghost', rot: 1.5 },
              { label: '⚙️ الإدارة', to: '/admin', variant: 'ghost', rot: -0.5 },
            ].map((item, idx) => (
              <div
                key={item.to}
                className="animate-paper-drop"
                style={{
                  animationDelay: `${0.1 + idx * 0.08}s`,
                  opacity: 0,
                  '--card-angle': `${item.rot}deg`,
                }}
              >
                <TornPaperButton
                  variant={item.variant}
                  onClick={() => navigate(item.to)}
                  fullWidth
                  rotation={item.rot}
                >
                  {item.label}
                </TornPaperButton>
              </div>
            ))}
          </div>
        </div>

        {/* Recent results */}
        <div>
          <div className="relative inline-block mb-3 px-2">
            <h2 className="text-stamp text-xl" style={{ transform: 'rotate(1deg)' }}>
              آخر النتائج
            </h2>
            <MaskingTape color="yellow" position="top-right" width="40px" rotation={15} />
          </div>

          <div className="space-y-4">
            {recentMatches.length > 0 ? (
              recentMatches.map((match, idx) => (
                <div
                  key={match.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${0.4 + idx * 0.08}s`, opacity: 0 }}
                >
                  <MatchCard match={match} />
                </div>
              ))
            ) : (
              <CardboardContainer variant="note" className="text-center p-3">
                <span className="text-marker text-scrap-ink/50">لا توجد نتائج حديثة</span>
              </CardboardContainer>
            )}
          </div>
        </div>

        {/* BULLETPROOF SPACER */}
        <div className="h-24 w-full shrink-0"></div>
      </div>

      </ScrapbookPage>
  );
}
