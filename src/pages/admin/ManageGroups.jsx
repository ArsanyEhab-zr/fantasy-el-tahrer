import { useState } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Layers, Plus, Trash2, Sparkles, Pencil, CheckCircle2 } from 'lucide-react';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../../components/ui/TeamCrest';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';

export default function ManageGroups() {
  const { teams = [], groups = [], loading, getTeam } = useTournament();

  const [editingId, setEditingId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const toggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setGroupName('');
    setSelectedTeams([]);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        name: groupName.trim(),
        teams: selectedTeams,
      };
      if (editingId) {
        await updateDoc(doc(db, 'groups', String(editingId)), payload);
        setFeedback({ type: 'success', text: 'تم تحديث المجموعة بنجاح.' });
      } else {
        await addDoc(collection(db, 'groups'), payload);
        setFeedback({ type: 'success', text: 'تم إنشاء المجموعة بنجاح.' });
      }
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ المجموعة.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingId(group.id);
    setGroupName(group.name || '');
    setSelectedTeams(group.teams || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`حذف مجموعة "${group.name}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'groups', String(group.id)));
      setFeedback({ type: 'success', text: `تم حذف ${group.name}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف المجموعة.' });
    }
  };

  const handleGenerateFixtures = async (group) => {
    const teamIds = group.teams || [];
    if (teamIds.length < 2) {
      setFeedback({ type: 'error', text: 'يجب وجود فريقين على الأقل لتوليد المباريات.' });
      return;
    }
    if (!window.confirm(`توليد مباريات الدوري (الكل ضد الكل) لمجموعة "${group.name}"؟`)) return;

    try {
      const batch = writeBatch(db);
      for (let i = 0; i < teamIds.length; i += 1) {
        for (let j = i + 1; j < teamIds.length; j += 1) {
          const matchRef = doc(collection(db, 'matches'));
          batch.set(matchRef, {
            type: 'group',
            groupId: group.id,
            homeTeam: teamIds[i],
            awayTeam: teamIds[j],
            homeTeamId: teamIds[i],
            awayTeamId: teamIds[j],
            status: 'مجدولة',
            homeScore: 0,
            awayScore: 0,
            timerStatus: 'idle',
            accumulatedSeconds: 0,
            round: group.name || 'دور المجموعات',
            events: [],
          });
        }
      }
      await batch.commit();
      setFeedback({
        type: 'success',
        text: `تم توليد مباريات ${group.name} — يمكنك الآن تحديد تواريخها ومواعيدها من جدول المباريات.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد المباريات.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          GROUPS &amp; TABLES
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          إدارة المجموعات
        </h1>
      </div>

      {/* Create / Edit Group Form */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
        <h2 className="font-display font-extrabold text-xl text-ops-ink mb-4">
          {editingId ? 'تعديل المجموعة' : 'إنشاء مجموعة جديدة'}
        </h2>

        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div>
            <label htmlFor="group-name" className="block text-xs font-bold text-ops-ink mb-1.5">
              اسم المجموعة (أو اسم الدوري العام)
            </label>
            <input
              id="group-name"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="مثال: المجموعة الأولى — أو الدوري العام"
              className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-ops-ink mb-2">
              اختر فرق المجموعة ({selectedTeams.length} محدد):
            </span>
            {teams.length === 0 ? (
              <p className="text-xs text-ops-muted">أضف الفرق أولاً من صفحة إدارة الفرق.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {teams.map((team) => {
                  const checked = selectedTeams.includes(team.id);
                  return (
                    <label
                      key={team.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-fanta-orange/10 border-fanta-orange text-ops-ink'
                          : 'bg-ops-bg border-ops-border hover:border-ops-muted/50 text-ops-ink'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTeam(team.id)}
                        className="w-4 h-4 accent-fanta-orange shrink-0"
                      />
                      <TeamCrest team={team} size="xs" variant="light" />
                      <span className="font-display font-bold text-sm truncate">
                        {team.nameAr}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-6 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span>{editingId ? 'حفظ التعديلات' : 'إنشاء المجموعة'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[48px] px-5 rounded-xl bg-ops-subtle text-ops-ink font-display font-bold text-sm cursor-pointer"
              >
                إلغاء
              </button>
            )}
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
        </form>
      </section>

      {/* Existing Groups */}
      <section className="space-y-3.5">
        <h2 className="font-display font-extrabold text-xl text-ops-ink">
          المجموعات الحالية ({groups.length})
        </h2>

        {loading ? (
          <LoadingSkeleton count={2} theme="light" height="h-32" />
        ) : groups.length === 0 ? (
          <EmptyState
            theme="light"
            icon={Layers}
            title="لا توجد مجموعات حتى الآن"
            description="أنشئ مجموعة واحدة (لنظام الدوري الكامل) أو عدة مجموعات ووزع الفرق عليها."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-ops-border">
                    <h3 className="font-display font-extrabold text-xl text-ops-ink">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditGroup(group)}
                        aria-label={`تعديل ${group.name}`}
                        className="w-10 h-10 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-center text-ops-ink cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        aria-label={`حذف ${group.name}`}
                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-700 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(group.teams || []).length > 0 ? (
                      group.teams.map((tId) => {
                        const team = getTeam(tId);
                        return (
                          <span
                            key={tId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ops-bg border border-ops-border text-xs font-bold text-ops-ink"
                          >
                            <TeamCrest team={team} size="xs" variant="light" className="!w-5 !h-5 !text-[10px] !rounded-md" />
                            <span>{team?.nameAr || 'فريق محذوف'}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-ops-muted">لا توجد فرق في هذه المجموعة</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateFixtures(group)}
                  className="w-full min-h-[46px] rounded-xl bg-ops-ink hover:bg-ops-ink/90 text-arena-bg font-display font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} className="text-fanta-volt" aria-hidden="true" />
                  <span>توليد مباريات المجموعة تلقائياً</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
