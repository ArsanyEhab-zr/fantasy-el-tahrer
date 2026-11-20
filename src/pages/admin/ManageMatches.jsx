import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import {
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../../components/ui/TeamCrest';
import StatusBadge from '../../components/ui/StatusBadge';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { formatMatchDateTime, toDateTimeLocalValue, parseTimestamp } from '../../utils/formatters';

const STATUS_OPTIONS = ['مجدولة', 'مباشر', 'منتهية', 'انسحاب'];

/**
 * ManageMatches — Exact Match Scheduler & Emergency Override Console (/admin/matches).
 * Allows creating/editing matches with exact Date & Kick-off Time (scheduledAt), group/round, pitch, and score overrides.
 */
export default function ManageMatches() {
  const { teams = [], groups = [], matches = [], loading, getTeam } = useTournament();

  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);

  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [round, setRound] = useState('دور المجموعات');
  const [pitch, setPitch] = useState('الملعب الرئيسي');
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [status, setStatus] = useState('مجدولة');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setHomeTeamId('');
    setAwayTeamId('');
    setGroupId('');
    setRound('دور المجموعات');
    setPitch('الملعب الرئيسي');
    setScheduledLocal('');
    setStatus('مجدولة');
    setHomeScore(0);
    setAwayScore(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      setFeedback({ type: 'error', text: 'اختر فريقين مختلفين أولاً.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const scheduledAt = scheduledLocal
        ? Timestamp.fromDate(new Date(scheduledLocal))
        : null;

      const payload = {
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        homeTeamId,
        awayTeamId,
        groupId: groupId || null,
        type: groupId ? 'group' : round === 'نصف النهائي' || round === 'النهائي' ? 'knockout' : 'group',
        round: round.trim() || 'دور المجموعات',
        pitch: pitch.trim(),
        scheduledAt,
        status,
        homeScore: parseInt(homeScore, 10) || 0,
        awayScore: parseInt(awayScore, 10) || 0,
      };

      if (editingId) {
        await updateDoc(doc(db, 'matches', String(editingId)), payload);
        setFeedback({ type: 'success', text: 'تم تحديث تفاصيل وموعد المباراة بنجاح.' });
      } else {
        await addDoc(collection(db, 'matches'), {
          ...payload,
          timerStatus: 'idle',
          accumulatedSeconds: 0,
          events: [],
        });
        setFeedback({ type: 'success', text: 'تمت جدولة المباراة بنجاح.' });
      }
      resetForm();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ المباراة.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (match) => {
    setEditingId(match.id);
    setHomeTeamId(match.homeTeamId || match.homeTeam || '');
    setAwayTeamId(match.awayTeamId || match.awayTeam || '');
    setGroupId(match.groupId || '');
    setRound(match.round || 'دور المجموعات');
    setPitch(match.pitch || 'الملعب الرئيسي');
    setScheduledLocal(toDateTimeLocalValue(match.scheduledAt || match.date));
    setStatus(match.status || 'مجدولة');
    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المباراة نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'matches', String(id)));
      setFeedback({ type: 'success', text: 'تم حذف المباراة بنجاح.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف المباراة.' });
    }
  };

  const filteredMatches = [...matches]
    .filter((m) => filterStatus === 'all' || m.status === filterStatus)
    .sort((a, b) => {
      const da = parseTimestamp(a.scheduledAt || a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseTimestamp(b.scheduledAt || b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          MATCH SCHEDULER
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          جدول المباريات
        </h1>
      </div>

      {/* Exact Match Scheduler Form */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
        <h2 className="font-display font-extrabold text-xl text-ops-ink mb-4">
          {editingId ? 'تعديل المباراة / التجاوز الطارئ' : 'جدولة مباراة جديدة بموعد دقيق'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="match-home" className="block text-xs font-bold text-ops-ink mb-1.5">
                الفريق المستضيف
              </label>
              <select
                id="match-home"
                required
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              >
                <option value="" disabled>اختر الفريق المستضيف</option>
                {teams
                  .filter((t) => t.id !== awayTeamId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="match-away" className="block text-xs font-bold text-ops-ink mb-1.5">
                الفريق الضيف
              </label>
              <select
                id="match-away"
                required
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              >
                <option value="" disabled>اختر الفريق الضيف</option>
                {teams
                  .filter((t) => t.id !== homeTeamId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label htmlFor="match-datetime" className="block text-xs font-bold text-ops-ink mb-1.5">
                تاريخ ووقت الانطلاق الدقيق
              </label>
              <input
                id="match-datetime"
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink num-tabular"
              />
            </div>

            <div>
              <label htmlFor="match-group" className="block text-xs font-bold text-ops-ink mb-1.5">
                المجموعة (اختياري)
              </label>
              <select
                id="match-group"
                value={groupId}
                onChange={(e) => {
                  const val = e.target.value;
                  setGroupId(val);
                  const found = groups.find((g) => g.id === val);
                  if (found) setRound(found.name);
                }}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              >
                <option value="">بدون مجموعة محددة</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="match-pitch" className="block text-xs font-bold text-ops-ink mb-1.5">
                الملعب
              </label>
              <input
                id="match-pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="مثال: ملعب 1"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label htmlFor="match-round" className="block text-xs font-bold text-ops-ink mb-1.5">
                الجولة / الدور
              </label>
              <input
                id="match-round"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="دور المجموعات — الجولة 1"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              />
            </div>

            <div>
              <label htmlFor="match-status" className="block text-xs font-bold text-ops-ink mb-1.5">
                حالة المباراة
              </label>
              <select
                id="match-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:bg-ops-subtle focus:border-fanta-orange font-semibold text-ops-ink"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {editingId && (
              <div>
                <span className="block text-xs font-bold text-ops-ink mb-1.5">
                  تجاوز النتيجة (مستضيف : ضيف)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    aria-label="نتيجة المستضيف"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-ops-border bg-ops-bg text-center font-display font-extrabold text-lg num-tabular"
                  />
                  <span className="font-bold text-ops-muted">:</span>
                  <input
                    type="number"
                    min={0}
                    aria-label="نتيجة الضيف"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-ops-border bg-ops-bg text-center font-display font-extrabold text-lg num-tabular"
                  />
                </div>
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
              <span>{editingId ? 'حفظ التعديل' : 'جدولة المباراة'}</span>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `الكل (${matches.length})` },
          { key: 'مجدولة', label: 'مجدولة' },
          { key: 'مباشر', label: 'مباشر' },
          { key: 'منتهية', label: 'منتهية' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`min-h-[42px] px-4 rounded-xl font-display font-bold text-xs transition-colors cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-ops-ink text-arena-bg'
                : 'bg-ops-surface border border-ops-border text-ops-muted hover:text-ops-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {loading ? (
        <LoadingSkeleton count={3} theme="light" height="h-24" />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          theme="light"
          icon={CalendarClock}
          title="لا توجد مباريات في هذا التصنيف"
          description="استخدم نموذج الجدولة أعلاه لإضافة المباريات وتحديد تاريخ ووقت الانطلاق."
        />
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const home = getTeam(match.homeTeamId || match.homeTeam);
            const away = getTeam(match.awayTeamId || match.awayTeam);
            const dt = formatMatchDateTime(match.scheduledAt || match.date);

            return (
              <div
                key={match.id}
                className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusBadge status={match.status} timerStatus={match.timerStatus} />
                    <span className="font-bold text-ops-muted">{match.round || 'دور المجموعات'}</span>
                    {dt && (
                      <span className="inline-flex items-center gap-1 font-bold text-ops-ink bg-ops-bg px-2 py-0.5 rounded-md border border-ops-border num-tabular">
                        <Clock size={12} className="text-fanta-orange" aria-hidden="true" />
                        <span>{dt.full}</span>
                      </span>
                    )}
                    {match.pitch && (
                      <span className="inline-flex items-center gap-1 text-ops-muted font-semibold">
                        <MapPin size={12} aria-hidden="true" />
                        <span>{match.pitch}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest team={home} size="xs" variant="light" />
                      <span className="font-display font-extrabold text-base text-ops-ink truncate">
                        {home?.nameAr || 'يُحدد'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-ops-ink text-arena-bg font-display font-extrabold text-sm num-tabular shrink-0">
                      {match.homeScore ?? 0} - {match.awayScore ?? 0}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest team={away} size="xs" variant="light" />
                      <span className="font-display font-extrabold text-base text-ops-ink truncate">
                        {away?.nameAr || 'يُحدد'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(match)}
                    className="min-h-[42px] px-3.5 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border text-xs font-bold text-ops-ink inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil size={14} aria-hidden="true" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(match.id)}
                    aria-label="حذف المباراة"
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
