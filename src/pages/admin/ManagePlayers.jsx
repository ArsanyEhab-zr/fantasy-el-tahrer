import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Users, Plus, Pencil, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';

const POSITIONS = ['لاعب', 'حارس مرمى', 'مدافع', 'لاعب وسط', 'مهاجم'];

/**
 * ManagePlayers — Roster Management (/admin/players).
 * Cleanly creates & edits player profiles (Name, Team, Position, Jersey # — ZERO Assists).
 */
export default function ManagePlayers() {
  const [searchParams] = useSearchParams();
  const initialTeamFilter = searchParams.get('team') || 'all';

  return <PlayerRoster key={initialTeamFilter} initialTeamFilter={initialTeamFilter} />;
}

function PlayerRoster({ initialTeamFilter }) {
  const { teams = [], players = [], loading, getTeam } = useTournament();

  const [filterTeam, setFilterTeam] = useState(initialTeamFilter);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [nameAr, setNameAr] = useState('');
  const [position, setPosition] = useState('مهاجم');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [teamId, setTeamId] = useState(initialTeamFilter !== 'all' ? initialTeamFilter : '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setNameAr('');
    setPosition('مهاجم');
    setJerseyNumber('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameAr.trim() || !teamId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        nameAr: nameAr.trim(),
        position: position.trim() || 'لاعب',
        number: jerseyNumber === '' ? null : Number(jerseyNumber),
        jerseyNumber: jerseyNumber === '' ? null : Number(jerseyNumber),
        team: teamId,
        teamId,
      };
      if (editingId) {
        await updateDoc(doc(db, 'players', String(editingId)), payload);
        setFeedback({ type: 'success', text: 'تم تحديث بيانات اللاعب.' });
      } else {
        await addDoc(collection(db, 'players'), { ...payload, goals: 0, manualGoalOffset: 0, manualYellowOffset: 0, manualRedOffset: 0 });
        setFeedback({ type: 'success', text: 'تمت إضافة اللاعب إلى قائمة الفريق.' });
      }
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ اللاعب.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (player) => {
    setEditingId(player.id);
    setNameAr(player.nameAr || '');
    setPosition(player.position || 'لاعب');
    setJerseyNumber(player.jerseyNumber != null ? String(player.jerseyNumber) : '');
    setTeamId(player.teamId || player.team || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (player) => {
    if (!window.confirm(`حذف اللاعب "${player.nameAr}" نهائياً؟`)) return;
    try {
      await deleteDoc(doc(db, 'players', String(player.id)));
      if (editingId === player.id) resetForm();
      setFeedback({ type: 'success', text: `تم حذف ${player.nameAr}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف اللاعب.' });
    }
  };

  const filteredPlayers = players.filter((p) => {
    const pTeam = p.teamId || p.team;
    const matchesTeam = filterTeam === 'all' || pTeam === filterTeam;
    const matchesSearch = !searchTerm.trim() || (p.nameAr || '').includes(searchTerm.trim());
    return matchesTeam && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          ROSTERS
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          قوائم اللاعبين
        </h1>
      </div>

      {/* Add / Edit Player Form */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
        <h2 className="font-display font-extrabold text-xl text-ops-ink mb-4">
          {editingId ? 'تعديل بيانات اللاعب' : 'إضافة لاعب جديد'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-4">
              <label htmlFor="player-name" className="block text-xs font-bold text-ops-ink mb-1.5">
                اسم اللاعب
              </label>
              <input
                id="player-name"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: أحمد علي"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="player-team" className="block text-xs font-bold text-ops-ink mb-1.5">
                الفريق
              </label>
              <select
                id="player-team"
                required
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
              >
                <option value="" disabled>
                  اختر الفريق
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="player-pos" className="block text-xs font-bold text-ops-ink mb-1.5">
                المركز
              </label>
              <select
                id="player-pos"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-12 px-2.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-ops-ink font-semibold"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="player-num" className="block text-xs font-bold text-ops-ink mb-1.5">
                رقم القميص
              </label>
              <input
                id="player-num"
                type="number"
                min={0}
                max={99}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="10"
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange text-center num-tabular text-ops-ink font-bold"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-6 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span>{editingId ? 'حفظ التعديلات' : 'إضافة اللاعب'}</span>
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ops-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم اللاعب…"
            className="w-full h-12 pr-10 pl-4 rounded-xl border-2 border-ops-border bg-ops-surface text-ops-ink font-semibold"
          />
        </div>

        <select
          aria-label="تصفية حسب الفريق"
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="h-12 px-4 rounded-xl border-2 border-ops-border bg-ops-surface text-ops-ink font-bold sm:w-56"
        >
          <option value="all">جميع الفرق ({players.length})</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameAr}
            </option>
          ))}
        </select>
      </div>

      {/* Players List */}
      {loading ? (
        <LoadingSkeleton count={4} theme="light" height="h-18" />
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          theme="light"
          icon={Users}
          title="لا يوجد لاعبون مطابقون"
          description="أضف لاعبي كل فريق (5 أساسيين على الأقل + البدلاء) ليتمكن الحكم من اختيار التشكيلة."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPlayers.map((player) => {
            const team = getTeam(player.teamId || player.team);
            return (
              <div
                key={player.id}
                className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-ops-ink text-arena-bg font-display font-extrabold text-sm num-tabular flex items-center justify-center shrink-0">
                    {player.jerseyNumber ?? '—'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-base text-ops-ink truncate">
                      {player.nameAr}
                    </div>
                    <div className="text-xs font-semibold text-ops-muted truncate">
                      {team?.nameAr || 'بدون فريق'} • {player.position || 'لاعب'} •{' '}
                      <strong className="num-tabular text-fanta-orange">
                        {player.goals || 0} أهداف
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleEdit(player)}
                    aria-label={`تعديل ${player.nameAr}`}
                    className="w-10 h-10 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-center text-ops-ink cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleDelete(player)}
                    aria-label={`حذف ${player.nameAr}`}
                    className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-700 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
