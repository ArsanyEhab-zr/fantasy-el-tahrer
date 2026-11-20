import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Shield, Plus, Pencil, Trash2, Users, CheckCircle2 } from 'lucide-react';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../../components/ui/TeamCrest';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';

export default function ManageTeams() {
  const navigate = useNavigate();
  const { teams = [], players = [], groups = [], loading } = useTournament();

  const [editingId, setEditingId] = useState(null);
  const [nameAr, setNameAr] = useState('');
  const [short, setShort] = useState('');
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setNameAr('');
    setShort('');
    setEmoji('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        nameAr: nameAr.trim(),
        short: short.trim() || nameAr.trim().slice(0, 8),
        emoji: emoji.trim(),
      };
      if (editingId) {
        await updateDoc(doc(db, 'teams', String(editingId)), payload);
        setFeedback({ type: 'success', text: 'تم تحديث بيانات الفريق بنجاح.' });
      } else {
        await addDoc(collection(db, 'teams'), payload);
        setFeedback({ type: 'success', text: 'تم إضافة الفريق الجديد بنجاح.' });
      }
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الفريق.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (team) => {
    setEditingId(team.id);
    setNameAr(team.nameAr || '');
    setShort(team.short || '');
    setEmoji(team.emoji || '');
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (team) => {
    if (!window.confirm(`هل أنت متأكد من حذف فريق "${team.nameAr}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'teams', String(team.id)));
      setFeedback({ type: 'success', text: `تم حذف فريق ${team.nameAr}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف الفريق.' });
    }
  };

  const getTeamGroupName = (teamId) =>
    groups.find((g) => (g.teams || []).includes(teamId))?.name || null;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          TEAMS DIRECTORY
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          إدارة الفرق
        </h1>
      </div>

      {/* Add / Edit Form Card */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
        <h2 className="font-display font-extrabold text-xl text-ops-ink mb-4">
          {editingId ? 'تعديل بيانات الفريق' : 'إضافة فريق جديد'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-6">
              <label htmlFor="team-name" className="block text-xs font-bold text-ops-ink mb-1.5">
                اسم الفريق الكامل
              </label>
              <input
                id="team-name"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: صقور فانتزي التحرير"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="team-short" className="block text-xs font-bold text-ops-ink mb-1.5">
                الاسم المختصر
              </label>
              <input
                id="team-short"
                required
                value={short}
                onChange={(e) => setShort(e.target.value)}
                placeholder="مثال: الصقور"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="team-badge" className="block text-xs font-bold text-ops-ink mb-1.5">
                رمز اختياري
              </label>
              <input
                id="team-badge"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="FNT"
                maxLength={4}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-center text-ops-ink font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-6 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span>{editingId ? 'حفظ التعديلات' : 'إضافة الفريق'}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[48px] px-5 rounded-xl bg-ops-subtle hover:bg-ops-border text-ops-ink font-display font-bold text-sm cursor-pointer"
              >
                إلغاء التعديل
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

      {/* Teams List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xl text-ops-ink">
            الفرق المسجلة ({teams.length})
          </h2>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} theme="light" height="h-20" />
        ) : teams.length === 0 ? (
          <EmptyState
            theme="light"
            icon={Shield}
            title="لا توجد فرق مسجلة بعد"
            description="ابدأ بإضافة فرق الدوري من النموذج أعلاه ثم أضف قائمة لاعبي كل فريق."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {teams.map((team) => {
              const rosterCount = players.filter(
                (p) => (p.teamId || p.team) === team.id
              ).length;
              const groupName = getTeamGroupName(team.id);

              return (
                <div
                  key={team.id}
                  className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamCrest team={team} size="md" variant="light" />
                    <div className="min-w-0">
                      <h3 className="font-display font-extrabold text-base text-ops-ink truncate">
                        {team.nameAr}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-semibold text-ops-muted">
                        <span>{team.short}</span>
                        <span>•</span>
                        <span className="num-tabular">{rosterCount} لاعب</span>
                        {groupName && (
                          <span className="px-2 py-0.5 rounded-md bg-fanta-orange/12 text-fanta-orange font-bold">
                            {groupName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/players?team=${team.id}`)}
                      aria-label={`قائمة لاعبي ${team.nameAr}`}
                      title="قائمة اللاعبين"
                      className="w-10 h-10 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-center text-ops-ink cursor-pointer"
                    >
                      <Users size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(team)}
                      aria-label={`تعديل ${team.nameAr}`}
                      className="w-10 h-10 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-center text-ops-ink cursor-pointer"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(team)}
                      aria-label={`حذف ${team.nameAr}`}
                      className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-700 cursor-pointer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
