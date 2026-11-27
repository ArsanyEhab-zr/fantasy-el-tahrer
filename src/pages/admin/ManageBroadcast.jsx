import { useMemo, useState } from 'react';
import {
  Tv,
  Radio,
  PlayCircle,
  Layers,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertTriangle,
  Video,
  Camera,
  Eye,
  Monitor,
  Loader2,
} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { saveBroadcastConfig } from '../../utils/tournamentSchema';
import {
  DEFAULT_CHANNEL_LOGO,
  FALLBACK_LEAGUE_LOGO,
  VIEWER_PRODUCTION_ORIGIN,
  buildObsOverlayUrls,
  buildYouTubeEmbedUrl,
  parseYouTubeVideoId,
  sanitizeChannelLogoUrl,
} from '../../utils/broadcast';
import { formatMatchDateTime } from '../../utils/formatters';

const HUD_LAYER_ITEMS = [
  {
    key: 'scoreboard',
    title: 'لوحة النتيجة العلوية والساعة',
    desc: 'شريط البث العلوي المتحرك بالنتيجة، شعارات الفريقين، والساعة المتزامنة.',
  },
  {
    key: 'channelLogo',
    title: 'شعار القناة (أعلى اليمين)',
    desc: 'عرض شعار البث الرسمي في الزاوية العليا اليمنى.',
  },
  {
    key: 'eventTicker',
    title: 'شريط الأحداث والقرارات السفلي',
    desc: 'تنبيهات الأهداف، البطاقات، التبديلات، العقوبات، والتراجع عن القرارات لحظياً.',
  },
  {
    key: 'vintageStamp',
    title: 'ختم الكاميرا الكلاسيكي (REC)',
    desc: 'شارة تصوير ريترو (● REC + الاسم + توقيت القاهرة) في الزاوية الآمنة.',
  },
];

/**
 * ManageBroadcast — Admin YouTube Live & OBS Broadcast Control Center (/broadcast).
 * Saves to Firestore `config/broadcast` and publishes to `public/live_snapshot` synchronously.
 */
export default function ManageBroadcast() {
  const { broadcast, matches = [], liveMatch, getTeam } = useTournament();

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [obsMatchId, setObsMatchId] = useState('');
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const form = useMemo(() => {
    if (draft) return draft;
    return {
      isActive: Boolean(broadcast?.isActive),
      youtubeUrl: broadcast?.youtubeUrl || '',
      matchMode: broadcast?.matchMode || 'auto',
      manualMatchId: broadcast?.manualMatchId || '',
      channelLogoUrl: broadcast?.channelLogoUrl || DEFAULT_CHANNEL_LOGO,
      cameraStampName: broadcast?.cameraStampName || 'ARSANY',
      hudVisibility: {
        scoreboard: broadcast?.hudVisibility?.scoreboard !== false,
        channelLogo: broadcast?.hudVisibility?.channelLogo !== false,
        eventTicker: broadcast?.hudVisibility?.eventTicker !== false,
        vintageStamp: broadcast?.hudVisibility?.vintageStamp !== false,
      },
    };
  }, [broadcast, draft]);

  const updateForm = (patch) => {
    setFeedback(null);
    setDraft(prev => {
      const base = prev || form;
      return typeof patch === 'function' ? patch(base) : { ...base, ...patch };
    });
  };

  const parsedVideoId = parseYouTubeVideoId(form.youtubeUrl);
  const previewEmbedUrl = buildYouTubeEmbedUrl(parsedVideoId);
  const hasUrlInput = form.youtubeUrl.trim().length > 0;
  const isUrlInvalid = hasUrlInput && !parsedVideoId;
  const resolvedLogoUrl = sanitizeChannelLogoUrl(form.channelLogoUrl);

  const viewerOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : VIEWER_PRODUCTION_ORIGIN;

  const selectedObsMatch = obsMatchId || form.manualMatchId || liveMatch?.id || matches[0]?.id || '';
  const obsUrls = buildObsOverlayUrls(selectedObsMatch, viewerOrigin);

  const persist = async (nextState, successText) => {
    setSaving(true);
    setFeedback(null);
    try {
      await saveBroadcastConfig({
        ...nextState,
        youtubeVideoId: parseYouTubeVideoId(nextState.youtubeUrl),
      });
      setDraft(null);
      setFeedback({ type: 'success', text: successText });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذّر حفظ إعدادات البث.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMasterActive = () => {
    const nextActive = !form.isActive;
    const nextState = { ...form, isActive: nextActive };
    updateForm(nextState);
    void persist(
      nextState,
      nextActive
        ? 'تم تفعيل البث المباشر — صفحة Watch Live ومؤشر البث يعملان الآن لدى الجمهور.'
        : 'تم إيقاف البث المباشر — يظهر الآن وضع ما قبل البث للجمهور.'
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isUrlInvalid) {
      setFeedback({
        type: 'error',
        text: 'رابط YouTube غير صالح. الصق رابط بث/فيديو يوتيوب أو المعرّف المكوّن من 11 حرفاً.',
      });
      return;
    }
    void persist(form, 'تم حفظ ومزامنة إعدادات البث وOBS فورياً مع تطبيق الجمهور.');
  };

  const handleCopy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(curr => (curr === key ? '' : curr)), 2200);
    } catch {
      setFeedback({ type: 'error', text: 'تعذّر النسخ التلقائي — يمكنك نسخ الرابط يدوياً.' });
    }
  };

  const formatMatchOption = (m) => {
    const home = getTeam(m.homeTeamId || m.homeTeam)?.nameAr || 'الفريق الأول';
    const away = getTeam(m.awayTeamId || m.awayTeam)?.nameAr || 'الفريق الثاني';
    const dt = formatMatchDateTime(m.scheduledAt || m.date);
    return `${home} × ${away} (${m.status || 'مجدولة'}${dt ? ` • ${dt.datePart}` : ''})`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
            BROADCAST &amp; OBS STUDIO
          </span>
          <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
            إعدادات البث (YouTube / OBS)
          </h1>
          <p className="text-xs font-semibold text-ops-muted mt-1">
            تحكم فوري في صفحة Watch Live وروابط طبقة البث الشفافة لـ OBS بدون استهلاك قراءات إضافية من الجمهور.
          </p>
        </div>

        <a
          href={`${viewerOrigin}/watch-live`}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] px-4 rounded-xl bg-ops-surface hover:bg-ops-subtle border-2 border-ops-border text-ops-ink font-display font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <ExternalLink size={15} aria-hidden="true" />
          <span>فتح صفحة Watch Live</span>
        </a>
      </div>

      {/* Master Broadcast ON/OFF Banner */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 shadow-[0_6px_22px_-8px_rgba(17,20,28,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                form.isActive
                  ? 'bg-fanta-crimson/15 border-fanta-crimson text-fanta-crimson'
                  : 'bg-ops-bg border-ops-border text-ops-muted'
              }`}
            >
              <Radio size={23} strokeWidth={2.4} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-extrabold text-xl text-ops-ink">
                  حالة البث المباشر (ON / OFF)
                </h2>
                {form.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-fanta-crimson text-white font-display font-extrabold text-[11px]">
                    <span className="relative flex h-2 w-2" aria-hidden="true">
                      <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    <span>البث نشط</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-ops-bg border border-ops-border text-ops-muted font-display font-bold text-[11px]">
                    متوقف حالياً
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-ops-muted leading-relaxed">
                {form.isActive
                  ? 'مُفعّل — تظهر نقطة البث الحمراء بجانب Watch Live ويُعرض بث YouTube مباشرة للجمهور.'
                  : 'مُعطّل — تظهر شاشة "البث المباشر غير متاح حالياً" مع موعد المباراة القادمة بدلاً من الفيديو.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            disabled={saving}
            onClick={handleToggleMasterActive}
            className={`relative inline-flex h-10 w-18 shrink-0 items-center rounded-full border-2 transition-colors cursor-pointer disabled:opacity-60 ${
              form.isActive
                ? 'bg-fanta-crimson border-fanta-crimson'
                : 'bg-ops-subtle border-ops-border'
            }`}
          >
            <span className="sr-only">تشغيل أو إيقاف البث المباشر</span>
            <span
              className={`inline-block h-7 w-7 rounded-full bg-white shadow-md transition-transform ${
                form.isActive ? '-translate-x-1.5' : '-translate-x-9'
              }`}
            />
          </button>
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-200'
              : 'bg-red-950/60 border-fanta-crimson/60 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} aria-hidden="true" />
          ) : (
            <AlertTriangle size={16} aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Broadcast Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* YouTube Live + Match Source */}
        <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-ops-border">
            <div className="w-10 h-10 rounded-xl bg-fanta-orange/15 text-fanta-orange flex items-center justify-center">
              <PlayCircle size={20} strokeWidth={2.3} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-ops-ink">
                ربط بث YouTube ومصدر المباراة
              </h2>
              <p className="text-xs font-semibold text-ops-muted">
                يدعم روابط youtube.com/live و watch?v= و youtu.be و embed أو معرّف الفيديو مباشرة.
              </p>
            </div>
          </div>

          {/* YouTube URL Input */}
          <div className="space-y-2">
            <label htmlFor="broadcast-youtube-url" className="block text-xs font-bold text-ops-ink">
              رابط البث المباشر على YouTube أو معرّف الفيديو (Video ID)
            </label>
            <input
              id="broadcast-youtube-url"
              type="text"
              dir="ltr"
              value={form.youtubeUrl}
              onChange={(e) => updateForm({ youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/live/dQw4w9WgXcQ"
              className={`w-full h-12 px-4 rounded-xl border-2 bg-ops-bg text-ops-ink font-semibold text-sm transition-colors ${
                isUrlInvalid
                  ? 'border-fanta-crimson focus:border-fanta-crimson'
                  : 'border-ops-border focus:border-fanta-orange'
              }`}
            />
            {hasUrlInput && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {parsedVideoId ? (
                  <span className="inline-flex items-center gap-1.5 text-fanta-volt">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    <span>تم التعرف على الفيديو:</span>
                    <code dir="ltr" className="px-2 py-0.5 rounded bg-ops-bg border border-ops-border text-fanta-orange">
                      {parsedVideoId}
                    </code>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-fanta-crimson">
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>الرابط غير صالح — تأكد من نسخ رابط YouTube بشكل صحيح.</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mini YouTube Preview */}
          {previewEmbedUrl && (
            <div className="rounded-2xl border border-ops-border bg-ops-bg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-ops-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Video size={14} className="text-fanta-orange" aria-hidden="true" />
                  <span>معاينة مصغّرة للبث (youtube-nocookie)</span>
                </span>
                <span dir="ltr" className="text-[11px] opacity-80">16:9</span>
              </div>
              <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden border border-ops-border bg-black">
                <iframe
                  title="معاينة بث يوتيوب"
                  src={previewEmbedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          )}

          {/* Match Source Selector */}
          <div className="space-y-3 pt-2 border-t border-ops-border/70">
            <span className="block text-xs font-bold text-ops-ink">
              مصدر بيانات لوحة النتيجة والأحداث
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateForm({ matchMode: 'auto' })}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 text-right transition-colors cursor-pointer ${
                  form.matchMode === 'auto'
                    ? 'bg-fanta-orange/15 border-fanta-orange text-ops-ink'
                    : 'bg-ops-bg border-ops-border text-ops-muted hover:text-ops-ink'
                }`}
              >
                <div className="font-display font-extrabold text-sm">
                  تلقائي (المباراة المباشرة حالياً)
                </div>
                <div className="text-[11px] font-semibold opacity-80 mt-0.5">
                  {liveMatch
                    ? `نشطة الآن: ${getTeam(liveMatch.homeTeamId)?.nameAr || ''} × ${getTeam(liveMatch.awayTeamId)?.nameAr || ''}`
                    : 'يتابع تلقائياً أي مباراة يطلق الحكم صافرة بدايتها.'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateForm({ matchMode: 'manual' })}
                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 text-right transition-colors cursor-pointer ${
                  form.matchMode === 'manual'
                    ? 'bg-fanta-orange/15 border-fanta-orange text-ops-ink'
                    : 'bg-ops-bg border-ops-border text-ops-muted hover:text-ops-ink'
                }`}
              >
                <div className="font-display font-extrabold text-sm">
                  تثبيت مباراة محددة يدوياً
                </div>
                <div className="text-[11px] font-semibold opacity-80 mt-0.5">
                  اختر مباراة معينة لعرض نتيجتها وأحداثها على البث.
                </div>
              </button>
            </div>

            {form.matchMode === 'manual' && (
              <div>
                <label htmlFor="broadcast-manual-match" className="block text-xs font-bold text-ops-ink mb-1.5">
                  اختر المباراة المثبتة
                </label>
                <select
                  id="broadcast-manual-match"
                  value={form.manualMatchId}
                  onChange={(e) => updateForm({ manualMatchId: e.target.value })}
                  className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg focus:border-fanta-orange font-semibold text-sm text-ops-ink"
                >
                  <option value="">اختر مباراة من الجدول…</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {formatMatchOption(m)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Channel Logo & Vintage Camcorder Stamp */}
        <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-ops-border">
            <div className="w-10 h-10 rounded-xl bg-fanta-volt/15 text-fanta-volt flex items-center justify-center">
              <ImageIcon size={20} strokeWidth={2.3} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-ops-ink">
                شعار القناة وختم الكاميرا
              </h2>
              <p className="text-xs font-semibold text-ops-muted">
                يظهر الشعار في الزاوية العليا اليمنى من البث، وختم التصوير في الزاوية السفلية الآمنة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Channel Logo Path */}
            <div className="space-y-3">
              <label htmlFor="broadcast-logo-url" className="block text-xs font-bold text-ops-ink">
                مسار أو رابط شعار القناة (Top-Right Logo)
              </label>
              <input
                id="broadcast-logo-url"
                type="text"
                dir="ltr"
                value={form.channelLogoUrl}
                onChange={(e) => {
                  setLogoPreviewError(false);
                  updateForm({ channelLogoUrl: e.target.value });
                }}
                placeholder="/channel-logo.png"
                className="w-full h-12 px-4 rounded-xl border-2 border-ops-border bg-ops-bg focus:border-fanta-orange text-ops-ink font-semibold text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreviewError(false);
                    updateForm({ channelLogoUrl: DEFAULT_CHANNEL_LOGO });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-ops-bg hover:bg-ops-subtle border border-ops-border text-xs font-bold text-fanta-orange cursor-pointer"
                >
                  شعار القناة الرسمي ({DEFAULT_CHANNEL_LOGO})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreviewError(false);
                    updateForm({ channelLogoUrl: FALLBACK_LEAGUE_LOGO });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-ops-bg hover:bg-ops-subtle border border-ops-border text-xs font-bold text-ops-muted hover:text-ops-ink cursor-pointer"
                >
                  شعار الدوري ({FALLBACK_LEAGUE_LOGO})
                </button>
              </div>

              <div className="rounded-2xl border border-ops-border bg-arena-bg/90 p-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-ops-muted">معاينة الشعار:</span>
                <img
                  key={resolvedLogoUrl}
                  src={logoPreviewError ? FALLBACK_LEAGUE_LOGO : resolvedLogoUrl}
                  alt="معاينة شعار القناة"
                  onError={() => setLogoPreviewError(true)}
                  className="h-12 w-auto max-w-[200px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.75)]"
                />
              </div>
            </div>

            {/* Vintage Camcorder Stamp Name */}
            <div className="space-y-3">
              <label htmlFor="broadcast-stamp-name" className="block text-xs font-bold text-ops-ink">
                اسم ختم الكاميرا الكلاسيكي (Vintage Stamp)
              </label>
              <div className="relative">
                <input
                  id="broadcast-stamp-name"
                  type="text"
                  dir="ltr"
                  maxLength={24}
                  value={form.cameraStampName}
                  onChange={(e) => updateForm({ cameraStampName: e.target.value })}
                  placeholder="ARSANY"
                  className="w-full h-12 px-4 pl-10 rounded-xl border-2 border-ops-border bg-ops-bg focus:border-fanta-orange text-ops-ink font-semibold text-sm uppercase tracking-wider"
                />
                <Camera
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ops-muted pointer-events-none"
                  aria-hidden="true"
                />
              </div>

              <div className="rounded-2xl border border-ops-border bg-black/80 p-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-ops-muted">معاينة الختم:</span>
                <div
                  dir="ltr"
                  className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-white/90"
                  style={{ textShadow: '0 0 8px rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.95)' }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <span>REC</span>
                  <span className="text-fanta-orange">{(form.cameraStampName || 'ARSANY').toUpperCase()}</span>
                  <span className="text-white/75 num-tabular">20:00:00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Smart In-App HUD Layer Visibility Controls */}
        <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-ops-border">
            <div className="w-10 h-10 rounded-xl bg-fanta-sky/15 text-fanta-sky flex items-center justify-center">
              <Eye size={20} strokeWidth={2.3} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-ops-ink">
                التحكم بطبقات العرض داخل Watch Live
              </h2>
              <p className="text-xs font-semibold text-ops-muted">
                إذا كنت تدمج طبقة OBS مباشرة فوق بث YouTube، أوقف الطبقات المكررة هنا بضغطة واحدة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HUD_LAYER_ITEMS.map(item => {
              const enabled = form.hudVisibility[item.key] !== false;
              return (
                <div
                  key={item.key}
                  className="rounded-2xl bg-ops-bg border border-ops-border p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-sm text-ops-ink">
                      {item.title}
                    </div>
                    <p className="text-[11px] font-semibold text-ops-muted mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() =>
                      updateForm(prev => ({
                        ...prev,
                        hudVisibility: {
                          ...prev.hudVisibility,
                          [item.key]: !enabled,
                        },
                      }))
                    }
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors cursor-pointer ${
                      enabled
                        ? 'bg-fanta-orange border-fanta-orange'
                        : 'bg-ops-subtle border-ops-border'
                    }`}
                  >
                    <span className="sr-only">{item.title}</span>
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        enabled ? '-translate-x-1' : '-translate-x-7'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || isUrlInvalid}
              className="min-h-[48px] px-6 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={17} aria-hidden="true" />
              )}
              <span>حفظ ومزامنة إعدادات البث</span>
            </button>
            {draft && (
              <span className="text-xs font-bold text-fanta-amber">
                توجد تعديلات غير محفوظة
              </span>
            )}
          </div>
        </section>
      </form>

      {/* OBS Studio Integration & Browser Source URLs */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-ops-border">
          <div className="w-10 h-10 rounded-xl bg-fanta-orange/15 text-fanta-orange flex items-center justify-center">
            <Monitor size={20} strokeWidth={2.3} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-ops-ink">
              تكامل OBS Studio (Browser Source الشفاف)
            </h2>
            <p className="text-xs font-semibold text-ops-muted">
              انسخ أحد الروابط التالية وأضفه كـ Browser Source داخل OBS لدمج لوحة النتيجة والشعار والأحداث بخلفية شفافة.
            </p>
          </div>
        </div>

        {/* Auto Live Overlay URL */}
        <div className="rounded-2xl bg-ops-bg border border-ops-border p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-extrabold text-sm text-ops-ink flex items-center gap-1.5">
              <Tv size={15} className="text-fanta-orange" aria-hidden="true" />
              <span>رابط البث التلقائي (يتبع المباراة المباشرة تلقائياً)</span>
            </span>
            <a
              href={obsUrls.livePreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-fanta-volt hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={13} aria-hidden="true" />
              <span>معاينة (?preview=1)</span>
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={obsUrls.liveUrl}
              className="flex-1 h-11 px-3 rounded-xl bg-ops-surface border border-ops-border text-xs font-mono text-ops-ink"
            />
            <button
              type="button"
              onClick={() => handleCopy(obsUrls.liveUrl, 'live')}
              className="min-h-[44px] px-4 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedKey === 'live' ? <Check size={15} /> : <Copy size={15} />}
              <span>{copiedKey === 'live' ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Specific Match Overlay URL */}
        <div className="rounded-2xl bg-ops-bg border border-ops-border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-extrabold text-sm text-ops-ink flex items-center gap-1.5">
              <Layers size={15} className="text-fanta-sky" aria-hidden="true" />
              <span>رابط مباراة محددة (/overlay/:matchId)</span>
            </span>
            {obsUrls.matchPreviewUrl && (
              <a
                href={obsUrls.matchPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-fanta-volt hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink size={13} aria-hidden="true" />
                <span>معاينة (?preview=1)</span>
              </a>
            )}
          </div>

          <select
            aria-label="اختر مباراة لرابط OBS"
            value={selectedObsMatch}
            onChange={(e) => setObsMatchId(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-ops-surface border border-ops-border text-xs font-semibold text-ops-ink"
          >
            {matches.length === 0 && <option value="">لا توجد مباريات مسجلة بعد</option>}
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                {formatMatchOption(m)}
              </option>
            ))}
          </select>

          {obsUrls.matchUrl && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                dir="ltr"
                value={obsUrls.matchUrl}
                className="flex-1 h-11 px-3 rounded-xl bg-ops-surface border border-ops-border text-xs font-mono text-ops-ink"
              />
              <button
                type="button"
                onClick={() => handleCopy(obsUrls.matchUrl, 'match')}
                className="min-h-[44px] px-4 rounded-xl bg-ops-subtle hover:bg-ops-border text-ops-ink font-display font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedKey === 'match' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'match' ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Recommended OBS Settings Guide */}
        <div className="rounded-2xl bg-ops-bg/80 border border-ops-border/80 p-4 space-y-2">
          <div className="font-display font-extrabold text-xs text-fanta-orange">
            إعدادات OBS Browser Source الموصى بها:
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-semibold text-ops-muted">
            <li>• Width: <strong className="text-ops-ink num-tabular">1280</strong> × Height: <strong className="text-ops-ink num-tabular">720</strong> (أو 1920×1080)</li>
            <li>• FPS: <strong className="text-ops-ink num-tabular">60</strong> (لحركة سلسة للأهداف والساعة)</li>
            <li>• Custom CSS: <strong className="text-ops-ink">اتركه فارغاً</strong> (الخلفية شفافة تلقائياً)</li>
            <li>• فعّل خيار <strong className="text-ops-ink">Refresh browser when scene becomes active</strong></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
