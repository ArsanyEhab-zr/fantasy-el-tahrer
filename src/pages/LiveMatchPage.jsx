import { useState, useEffect, useRef } from 'react';
import { useLiveMatch } from '../hooks/useLiveMatch';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import ScoreBoard from '../components/match/ScoreBoard';
import HandDrawnTimeline from '../components/match/HandDrawnTimeline';
import CardboardContainer from '../components/primitives/CardboardContainer';
import MaskingTape from '../components/primitives/MaskingTape';

export default function LiveMatchPage() {
  const { match, events, loading, error } = useLiveMatch();
  
  const [toast, setToast] = useState(null);
  const prevEventsLength = useRef(0);

  useEffect(() => {
    // Determine if we have a NEW event (array length increased)
    if (events.length > prevEventsLength.current && prevEventsLength.current > 0) {
      const newEvent = events[0]; // useLiveMatch now orders descending, so [0] is newest
      if (['goal', 'assist', 'yellow', 'red', 'sub'].includes(newEvent.type)) {
        setToast(newEvent);
        setTimeout(() => setToast(null), 6000);
      }
    }
    prevEventsLength.current = events.length;
  }, [events]);

  if (loading) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="مركز المتابعة" showBack />
        <div className="flex justify-center items-center h-64">
          <h2 className="text-stamp text-xl animate-pulse text-scrap-ink/50" style={{ transform: 'rotate(-2deg)' }}>
            جاري التحميل...
          </h2>
        </div>
      </ScrapbookPage>
    );
  }

  if (error || !match) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="مركز المتابعة" showBack />
        <div className="flex justify-center items-center h-64">
          <CardboardContainer variant="note" rotation={-1.5} className="p-6 text-center w-3/4">
            <p className="text-stamp text-xl text-scrap-ink/60">لا توجد مباراة مباشرة حالياً</p>
          </CardboardContainer>
        </div>
      </ScrapbookPage>
    );
  }

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="مركز المتابعة" showBack />

      {/* Live Notification Toast */}
      {toast && (
        (() => {
          const config = {
            goal: { icon: '⚽', title: 'هدف جديد!', color: 'text-scrap-magenta', variant: 'note' },
            assist: { icon: '🎯', title: 'أسيست!', color: 'text-scrap-cyan', variant: 'note' },
            yellow: { icon: '🟨', title: 'بطاقة صفراء!', color: 'text-amber-500', variant: 'note' },
            red: { icon: '🟥', title: 'بطاقة حمراء!', color: 'text-red-600', variant: 'board' },
            sub: { icon: '🔄', title: 'تبديل!', color: 'text-scrap-ink', variant: 'note' }
          }[toast.type] || { icon: '⚡', title: 'حدث جديد!', color: 'text-scrap-ink', variant: 'note' };

          return (
            <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[100] animate-paper-drop w-11/12 max-w-[350px]">
              <CardboardContainer variant={config.variant} rotation={-2} className="px-6 py-3 flex items-center justify-between border-4 border-black/20 shadow-hard-lg">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{config.icon}</span>
                  <div>
                    <div className={`text-stamp text-2xl ${config.color}`}>
                      {config.title}
                    </div>
                    <div className="text-marker font-bold text-lg">{toast.playerName}</div>
                    {toast.detail && <div className="text-[10px] font-marker opacity-70 mt-1">{toast.detail}</div>}
                  </div>
                </div>
                <MaskingTape color="yellow" position="top-right" width="40px" rotation={15} />
              </CardboardContainer>
            </div>
          );
        })()
      )}

      {/* Main Scoreboard */}
      <div className="animate-paper-drop">
        <ScoreBoard match={match} />
      </div>

      {/* Match Events Timeline */}
      <div className="mb-12 mt-6">
        <div className="relative inline-block mb-4">
          <h2 className="text-stamp text-xl" style={{ transform: 'rotate(-2deg)' }}>
            أحداث المباراة
          </h2>
          <MaskingTape color="yellow" position="top-right" width="40px" rotation={20} />
        </div>
        <HandDrawnTimeline events={events} />
      </div>

    </ScrapbookPage>
  );
}
