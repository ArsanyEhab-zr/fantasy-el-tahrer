import { useNavigate } from 'react-router-dom';
import { GitBranch, BarChart3 } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import BracketView from '../../components/tournament/BracketView';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { RevealBlock } from '../../components/ui/MotionPrimitives';

/**
 * BracketPage — Conditional Knockout Stage View (/bracket).
 * Strictly honors settings.enableKnockout: if disabled, cleanly guides viewer back to League Standings.
 */
export default function BracketPage() {
  const navigate = useNavigate();
  const { bracket = [], loading, settings } = useTournament();

  const enableKnockout = Boolean(settings?.enableKnockout);

  if (!loading && !enableKnockout) {
    return (
      <EmptyState
        icon={BarChart3}
        title="البطولة بنظام الدوري فقط"
        description="دور الإقصائيات غير مفعل في هذه النسخة من دوري فانتزي التحرير. تابع المنافسة المباشرة عبر جدول الترتيب."
        action={
          <button
            type="button"
            onClick={() => navigate('/standings', { replace: true })}
            className="min-h-[46px] px-5 rounded-xl bg-fanta-orange text-arena-bg font-display font-extrabold text-sm cursor-pointer"
          >
            الذهاب إلى جدول الترتيب
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <RevealBlock>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-volt">
          KNOCKOUT STAGE
        </span>
        <h1 className="font-display font-extrabold text-3xl text-arena-ink leading-tight">
          شجرة الأدوار الإقصائية
        </h1>
      </RevealBlock>

      {loading ? (
        <LoadingSkeleton count={2} height="h-44" />
      ) : bracket.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="لم تبدأ الأدوار الإقصائية بعد"
          description="بمجرد تحديد المتأهلين من دور المجموعات ستظهر شجرة البطولة هنا كاملة."
        />
      ) : (
        <RevealBlock>
          <BracketView />
        </RevealBlock>
      )}
    </div>
  );
}
