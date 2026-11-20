import { notifyPenalty } from '../../utils/notifications';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Scale,
  AlertTriangle,
  Trash2,
  Search,
  Save,
  CheckCircle2,
  UserCog,
} from 'lucide-react';
import { db } from '../../utils/firebase';
import {
  applyDisciplinaryPenalty,
  reverseDisciplinaryPenalty,
} from '../../utils/tournamentSchema';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../../components/ui/TeamCrest';
import { EmptyState } from '../../components/ui/FeedbackStates';

const PRESET_REASONS = ['شغب', 'انسحاب', 'سلوك غير رياضي', 'مخالفة لائحة'];

/**
 * ManageDiscipline — Disciplinary Oversight & Emergency Overrides (/admin/discipline).
 * Tab 1: View / Add / Reverse team point deductions (شغب / انسحاب).
 * Tab 2: Emergency player stat overrides (Goals, Yellow, Red ONLY — ZERO Assists).
 */
export default function ManageDiscipline() {
  const { teams = [], players = [], penalties = [], getTeam } = useTournament();

  const [activeTab, setActiveTab] = useState('penalties');
  const [feedback, setFeedback] = useState(null);

  // Penalty Form
  const [teamId, setTeamId] = useState('');
  const [pointsDeducted, setPointsDeducted] = useState(3);
  const [reason, setReason] = useState('شغب');
  const [savingPenalty, setSavingPenalty] = useState(false);

  // Player Stat Overrides (Goals, Yellow, Red ONLY — Zero Assists)
  const [searchTerm, setSearchTerm] = useState('');
  const [statEdits, setStatEdits] = useState({});

  const handleAddPenalty = async (e) => {
    e.preventDefault();
    if (!teamId) {
      setFeedback({ type: 'error', text: 'اختر الفريق المعاقب أولاً.' });
      return;
    }
    const pts = Math.max(1, parseInt(pointsDeducted, 10) || 1);
    setSavingPenalty(true);
    setFeedback(null);
    try {
      await applyDisciplinaryPenalty({
        teamId,
        pointsDeducted: pts,
        reason: reason.trim() || 'قرار انضباطي',
      });
      notifyPenalty(getTeam(teamId)?.nameAr || 'الفريق', pts, reason.trim() || 'قرار انضباطي');
      setFeedback({
        type: 'success',
        text: `تم تسجيل خصم -${pts} نقاط على ${getTeam(teamId)?.nameAr || 'الفريق'}.`,
      });
      setTeamId('');
      setPointsDeducted(3);
      setReason('شغب');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تطبيق الخصم.' });
    } finally {
      setSavingPenalty(false);
    }
  };

  const handleReversePenalty = async (pen) => {
    const team = getTeam(pen.teamId);
    if (!window.confirm(`إلغاء خصم -${pen.pointsDeducted} نقاط عن فريق "${team?.nameAr || ''}"؟`)) {
      return;
    }
    try {
      await reverseDisciplinaryPenalty(pen.id);
      setFeedback({ type: 'success', text: 'تم إلغاء قرار الخصم وإعادة النقاط للفريق.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إلغاء الخصم.' });
    }
  };

  const handleSavePlayerStats = async (player) => {
    const edited = statEdits[player.id];
    if (!edited) return;
    try {
      const matchGoals = (player.goals || 0) - (player.manualGoalOffset || 0);
      const matchYellow = (player.yellowCards || 0) - (player.manualYellowOffset || 0);
      const matchRed = (player.redCards || 0) - (player.manualRedOffset || 0);

      await updateDoc(doc(db, 'players', String(player.id)), {
        manualGoalOffset: (parseInt(edited.goals, 10) || 0) - matchGoals,
        manualYellowOffset: (parseInt(edited.yellowCards, 10) || 0) - matchYellow,
        manualRedOffset: (parseInt(edited.redCards, 10) || 0) - matchRed,
      });
      setStatEdits(prev => {
        const next = { ...prev };
        delete next[player.id];
        return next;
      });
      setFeedback({ type: 'success', text: `تم تحديث إحصائيات ${player.nameAr} بنجاح.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث الإحصائيات.' });
    }
  };

  const filteredPlayers = players.filter(
    (p) => !searchTerm.trim() || (p.nameAr || '').includes(searchTerm.trim())
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          DISCIPLINE &amp; OVERRIDES
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          الانضباط وخصم النقاط
        </h1>
      </div>

      {/* Mode Switcher */}
      <div className="glass-card grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-ops-surface border-2 border-ops-border max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('penalties')}
          className={`min-h-[44px] rounded-xl font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'penalties'
              ? 'bg-fanta-orange text-arena-bg'
              : 'text-ops-muted hover:text-ops-ink'
          }`}
        >
          <Scale size={17} aria-hidden="true" />
          <span>خصومات الفرق</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`min-h-[44px] rounded-xl font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'stats'
              ? 'bg-ops-ink text-arena-bg'
              : 'text-ops-muted hover:text-ops-ink'
          }`}
        >
          <UserCog size={17} aria-hidden="true" />
          <span>تعديل إحصائيات اللاعبين</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-red-50 border border-red-300 text-red-700'
          }`}
        >
          <CheckCircle2 size={15} aria-hidden="true" />
          <span>{feedback.text}</span>
        </div>
      )}

      {activeTab === 'penalties' ? (
        <div className="space-y-6">
          {/* Add Deduction Form */}
          <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
            <h2 className="font-display font-extrabold text-xl text-ops-ink mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" aria-hidden="true" />
              <span>تسجيل قرار خصم نقاط</span>
            </h2>

            <form onSubmit={handleAddPenalty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pen-team" className="block text-xs font-bold text-ops-ink mb-1.5">
                    الفريق
                  </label>
                  <select
                    id="pen-team"
                    required
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
                  >
                    <option value="" disabled>اختر الفريق</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-bold text-ops-ink mb-1.5">
                    عدد النقاط المخصومة
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPointsDeducted(n)}
                        className={`h-12 px-4 rounded-xl font-display font-extrabold text-sm num-tabular border-2 cursor-pointer transition-colors ${
                          Number(pointsDeducted) === n
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-ops-bg border-ops-border text-ops-ink'
                        }`}
                      >
                        -{n}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={30}
                      aria-label="عدد مخصص للنقاط المخصومة"
                      value={pointsDeducted}
                      onChange={(e) => setPointsDeducted(e.target.value)}
                      className="w-18 h-12 rounded-xl border-2 border-ops-border bg-ops-bg text-center font-display font-extrabold num-tabular"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="pen-reason" className="block text-xs font-bold text-ops-ink mb-1.5">
                  سبب العقوبة
                </label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        reason === preset
                          ? 'bg-ops-ink text-arena-bg border-ops-ink'
                          : 'bg-ops-bg text-ops-ink border-ops-border hover:bg-ops-subtle'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  id="pen-reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب السبب (شغب / انسحاب / سلوك غير رياضي…)"
                  className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
                />
              </div>

              <button
                type="submit"
                disabled={savingPenalty}
                className="min-h-[48px] px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-display font-extrabold text-sm cursor-pointer disabled:opacity-50"
              >
                تطبيق الخصم فوراً
              </button>
            </form>
          </section>

          {/* Active Penalties List */}
          <section className="space-y-3">
            <h2 className="font-display font-extrabold text-xl text-ops-ink">
              سجل الخصومات الفعالة ({penalties.length})
            </h2>

            {penalties.length === 0 ? (
              <EmptyState
                theme="light"
                icon={Scale}
                title="لا توجد عقوبات خصم نقاط مسجلة"
                description="عند تطبيق أي خصم نقاط (من الإدارة أو من الحكم)، سيظهر هنا فوراً مع إمكانية التراجع عنه."
              />
            ) : (
              <div className="space-y-3">
                {penalties.map((pen) => {
                  const team = getTeam(pen.teamId);
                  return (
                    <div
                      key={pen.id}
                      className="glass-card rounded-2xl bg-ops-surface border-2 border-red-200 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TeamCrest team={team} size="sm" variant="light" />
                        <div className="min-w-0">
                          <div className="font-display font-extrabold text-base text-ops-ink">
                            {team?.nameAr || 'فريق غير معروف'}
                          </div>
                          <div className="text-xs font-semibold text-ops-muted">
                            السبب: <strong className="text-red-700">{pen.reason}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-display font-extrabold text-sm num-tabular">
                          -{pen.pointsDeducted} نقاط
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReversePenalty(pen)}
                          className="min-h-[42px] px-3.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          <span>إلغاء الخصم</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Emergency Player Stat Overrides — Goals, Yellow, Red ONLY (ZERO Assists) */
        <div className="space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ops-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن لاعب لتعديل إحصائياته…"
              className="w-full h-12 pr-10 pl-4 rounded-xl border-2 border-ops-border bg-ops-surface text-ops-ink font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPlayers.map((player) => {
              const team = getTeam(player.teamId || player.team);
              const vals = statEdits[player.id] || {
                goals: player.goals || 0,
                yellowCards: player.yellowCards || 0,
                redCards: player.redCards || 0,
              };

              return (
                <div
                  key={player.id}
                  className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-ops-border">
                    <div className="min-w-0">
                      <div className="font-display font-extrabold text-base text-ops-ink truncate">
                        {player.nameAr}
                      </div>
                      <div className="text-xs font-semibold text-ops-muted">
                        {team?.nameAr || 'بدون فريق'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSavePlayerStats(player)}
                      className="min-h-[40px] px-3.5 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Save size={14} aria-hidden="true" />
                      <span>حفظ</span>
                    </button>
                  </div>

                  {/* 3 Columns ONLY: Goals, Yellow Cards, Red Cards (NO Assists) */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div>
                      <label className="block text-xs font-bold text-ops-muted mb-1">الأهداف</label>
                      <input
                        type="number"
                        min={0}
                        value={vals.goals}
                        onChange={(e) =>
                          setStatEdits((prev) => ({
                            ...prev,
                            [player.id]: { ...vals, goals: e.target.value },
                          }))
                        }
                        className="w-full h-11 rounded-xl border-2 border-ops-border bg-ops-bg text-center font-display font-extrabold num-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">إنذارات</label>
                      <input
                        type="number"
                        min={0}
                        value={vals.yellowCards}
                        onChange={(e) =>
                          setStatEdits((prev) => ({
                            ...prev,
                            [player.id]: { ...vals, yellowCards: e.target.value },
                          }))
                        }
                        className="w-full h-11 rounded-xl border-2 border-amber-300 bg-amber-50/40 text-center font-display font-extrabold num-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-700 mb-1">طرد</label>
                      <input
                        type="number"
                        min={0}
                        value={vals.redCards}
                        onChange={(e) =>
                          setStatEdits((prev) => ({
                            ...prev,
                            [player.id]: { ...vals, redCards: e.target.value },
                          }))
                        }
                        className="w-full h-11 rounded-xl border-2 border-red-300 bg-red-50/40 text-center font-display font-extrabold num-tabular"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
