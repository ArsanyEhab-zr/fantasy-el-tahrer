import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, UserX } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import PlayerProfile from '../../components/player/PlayerProfile';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { RevealBlock } from '../../components/ui/MotionPrimitives';

export default function PlayerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlayer, loading } = useTournament();

  const player = getPlayer(id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="رجوع"
          className="w-11 h-11 rounded-xl bg-arena-surface border border-arena-border hover:border-fanta-orange flex items-center justify-center text-arena-ink transition-colors cursor-pointer"
        >
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
        <div>
          <span className="text-xs font-display font-bold text-fanta-orange">بطاقة اللاعب</span>
          <h1 className="font-display font-extrabold text-xl text-arena-ink leading-none">
            {player?.nameAr || 'ملف اللاعب'}
          </h1>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} height="h-36" />
      ) : player ? (
        <RevealBlock>
          <PlayerProfile player={player} />
        </RevealBlock>
      ) : (
        <EmptyState
          icon={UserX}
          title="لم يتم العثور على اللاعب"
          description="تأكد من الرابط أو ارجع لقائمة الهدافين لاختيار لاعب آخر."
          action={
            <button
              type="button"
              onClick={() => navigate('/scorers')}
              className="min-h-[44px] px-5 rounded-xl bg-fanta-orange text-arena-bg font-display font-extrabold text-sm cursor-pointer"
            >
              قائمة الهدافين
            </button>
          }
        />
      )}
    </div>
  );
}
