import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import {
  Shield,
  Users,
  CalendarClock,
  Scale,
  GitBranch,
  Layers,
  Wifi,
  WifiOff,
  Loader2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../../utils/firebase';
import { saveTournamentSettings } from '../../utils/tournamentSchema';
import { useTournament } from '../../hooks/TournamentContext';

/**
 * AdminDashboard — League Operations Control Center (/admin).
 * Features Global Tournament Mode toggle ("تفعيل دور الإقصائيات") + Half Duration config + Live KPIs.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    teams = [],
    players = [],
    matches = [],
    groups = [],
    penalties = [],
    liveMatch,
    settings,
  } = useTournament();

  const [connectionStatus, setConnectionStatus] = useState('checking');
  const enableKnockout = Boolean(settings?.enableKnockout);
  const [draftHalf, setHalfDuration] = useState(null);
  const halfDuration = draftHalf ?? settings?.halfDurationMinutes ?? 10;
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  useEffect(() => {
    async function checkFirebaseConnection() {
      if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        setConnectionStatus('disconnected');
        return;
      }
      try {
        await getDocs(query(collection(db, 'teams'), limit(1)));
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('disconnected');
      }
    }
    checkFirebaseConnection();
  }, []);

  const persistTournamentConfig = async (nextKnockout, nextHalfDuration) => {
    setSavingSettings(true);
    setStatusFeedback(null);
    try {
      await saveTournamentSettings({
        enableKnockout: Boolean(nextKnockout),
        halfDurationMinutes: Math.max(1, Math.min(90, Number(nextHalfDuration) || 10)),
      });
      setHalfDuration(null);
      setStatusFeedback({
        type: 'success',
        text: 'تم حفظ إعدادات الدوري وتحديث تطبيق الجمهور فوراً.',
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء حفظ الإعدادات.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleKnockout = () => {
    const nextValue = !enableKnockout;

    persistTournamentConfig(nextValue, halfDuration);
  };

  const kpis = [
    { label: 'الفرق المسجلة', value: teams.length, icon: Shield, to: '/teams' },
    { label: 'اللاعبون', value: players.length, icon: Users, to: '/players' },
    { label: 'المباريات', value: matches.length, icon: CalendarClock, to: '/matches' },
    { label: 'قرارات الخصم', value: penalties.length, icon: Scale, to: '/discipline' },
  ];

  const shortcuts = [
    {
      title: 'الفرق والمجموعات',
      desc: 'إضافة الفرق، تعديل الشعارات، وتوزيع المجموعات.',
      icon: Layers,
      to: '/groups',
    },
    {
      title: 'جدولة المباريات',
      desc: 'تحديد التاريخ وساعة الانطلاق الدقيقة والملعب لكل مباراة.',
      icon: CalendarClock,
      to: '/matches',
    },
    {
      title: 'الانضباط وخصم النقاط',
      desc: 'مراجعة قرارات الشغب والانسحاب وتجاوز إحصائيات اللاعبين.',
      icon: Scale,
      to: '/discipline',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Firebase Connection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
            FANTASY EL TAHRRER
          </span>
          <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
            لوحة عمليات الدوري
          </h1>
        </div>

        <div>
          {connectionStatus === 'checking' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>جاري التحقق من الاتصال…</span>
            </span>
          )}
          {connectionStatus === 'connected' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <Wifi size={14} aria-hidden="true" />
              <span>متصل بـ Firestore مباشر</span>
            </span>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold">
              <WifiOff size={14} aria-hidden="true" />
              <span>تعذر الاتصال بقاعدة البيانات</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Match Banner if Active */}
      {liveMatch && (
        <div className="glass-card glass-alert-red rounded-2xl bg-red-50 border-2 border-red-300 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shrink-0" />
            <div>
              <div className="font-display font-extrabold text-sm text-red-900">
                توجد مباراة مباشرة قيد اللعب الآن
              </div>
              <div className="text-xs font-semibold text-red-700">
                يمكنك متابعتها أو تعديلها طارئاً من سجل المباريات.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="min-h-[42px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-display font-bold text-xs cursor-pointer"
          >
            فتح سجل المباريات
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => navigate(kpi.to)}
              className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border hover:border-fanta-orange p-4 text-right transition-colors cursor-pointer shadow-[0_4px_16px_-6px_rgba(17,20,28,0.06)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-ops-bg border border-ops-border flex items-center justify-center text-fanta-orange">
                  <Icon size={20} strokeWidth={2.3} aria-hidden="true" />
                </div>
                <span className="font-display font-extrabold text-3xl num-tabular text-ops-ink">
                  {kpi.value}
                </span>
              </div>
              <div className="font-display font-bold text-sm text-ops-muted">
                {kpi.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Global Tournament Mode Control Card */}
      <section
        aria-labelledby="tournament-mode-heading"
        className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)] space-y-5"
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-ops-border">
          <div className="w-10 h-10 rounded-xl bg-fanta-orange/15 text-fanta-orange flex items-center justify-center">
            <Sliders size={20} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div>
            <h2
              id="tournament-mode-heading"
              className="font-display font-extrabold text-xl text-ops-ink"
            >
              التحكم في نظام البطولة
            </h2>
            <p className="text-xs font-semibold text-ops-muted">
              تُطبق هذه الإعدادات فورياً على تطبيق الجمهور وتطبيق الحكم.
            </p>
          </div>
        </div>

        {/* Toggle Switch: Enable Knockout Stage */}
        <div className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ops-bg border border-ops-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch size={18} className="text-fanta-orange" aria-hidden="true" />
              <span className="font-display font-extrabold text-base text-ops-ink">
                تفعيل دور الإقصائيات (Knockout Stage)
              </span>
            </div>
            <p className="text-xs font-semibold text-ops-muted leading-relaxed">
              {enableKnockout
                ? 'مُفعّل — سيظهر تبويب شجرة البطولة للجمهور في التطبيق العام.'
                : 'مُعطّل — البطولة تعمل بنظام الدوري والمجموعات فقط، وتختفي شجرة الإقصائيات تماماً عن الجمهور.'}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enableKnockout}
            disabled={savingSettings}
            onClick={handleToggleKnockout}
            className={`relative inline-flex h-10 w-18 shrink-0 items-center rounded-full border-2 transition-colors cursor-pointer ${
              enableKnockout
                ? 'bg-fanta-orange border-fanta-orange'
                : 'bg-ops-subtle border-ops-border'
            }`}
          >
            <span className="sr-only">تفعيل دور الإقصائيات</span>
            <span
              className={`inline-block h-7 w-7 rounded-full bg-white shadow-md transition-transform ${
                enableKnockout ? '-translate-x-1.5' : '-translate-x-9'
              }`}
            />
          </button>
        </div>

        {/* Half Duration Setting */}
        <div className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ops-bg border border-ops-border">
          <div>
            <label
              htmlFor="half-duration-input"
              className="font-display font-extrabold text-base text-ops-ink block"
            >
              مدة الشوط الواحد (بالدقائق)
            </label>
            <p className="text-xs font-semibold text-ops-muted mt-0.5">
              تُستخدم لحساب الوقت الأصلي وإظهار مؤشر الوقت بدل الضائع تلقائياً (مثلاً 20+2&apos;).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              id="half-duration-input"
              type="number"
              min={5}
              max={60}
              value={halfDuration}
              onChange={(e) => setHalfDuration(e.target.value)}
              className="w-22 h-11 rounded-xl border-2 border-ops-border bg-ops-surface text-center font-display font-extrabold text-lg num-tabular text-ops-ink"
            />
            <button
              type="button"
              disabled={savingSettings}
              onClick={() => persistTournamentConfig(enableKnockout, halfDuration)}
              className="min-h-[44px] px-4 rounded-xl bg-ops-ink hover:bg-ops-ink/90 text-arena-bg font-display font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              حفظ المدة
            </button>
          </div>
        </div>

        {statusFeedback && (
          <div
            role="status"
            className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-700'
            }`}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{statusFeedback.text}</span>
          </div>
        )}
      </section>

      {/* Quick Operations Navigation */}
      <section className="space-y-3">
        <h2 className="font-display font-extrabold text-xl text-ops-ink">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border hover:border-fanta-orange p-4 text-right flex items-start gap-3.5 transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-fanta-orange/12 text-fanta-orange flex items-center justify-center shrink-0">
                  <Icon size={22} strokeWidth={2.3} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-ops-ink">
                    {item.title}
                  </h3>
                  <p className="text-xs font-semibold text-ops-muted mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="text-xs font-semibold text-ops-muted pt-2">
        المجموعات الحالية: <strong className="num-tabular text-ops-ink">{groups.length}</strong>
      </div>
    </div>
  );
}
