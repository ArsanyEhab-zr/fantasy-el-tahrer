import { useState } from 'react';
import { doc, setDoc, runTransaction } from 'firebase/firestore';
import { GitBranch, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { db } from '../../utils/firebase';
import { saveTournamentSettings } from '../../utils/tournamentSchema';
import { useTournament } from '../../hooks/TournamentContext';

const BRACKET_SLOTS = {
  16: [
    'R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8',
    'QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', 'FINAL',
  ],
  8: ['QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', 'FINAL'],
  4: ['SF1', 'SF2', 'FINAL'],
};

const SLOT_NAMES = {
  R16_1: 'دور الـ 16 — مباراة 1', R16_2: 'دور الـ 16 — مباراة 2',
  R16_3: 'دور الـ 16 — مباراة 3', R16_4: 'دور الـ 16 — مباراة 4',
  R16_5: 'دور الـ 16 — مباراة 5', R16_6: 'دور الـ 16 — مباراة 6',
  R16_7: 'دور الـ 16 — مباراة 7', R16_8: 'دور الـ 16 — مباراة 8',
  QF1: 'ربع النهائي 1', QF2: 'ربع النهائي 2', QF3: 'ربع النهائي 3', QF4: 'ربع النهائي 4',
  SF1: 'نصف النهائي الأول', SF2: 'نصف النهائي الثاني', FINAL: 'المباراة النهائية',
};

const getRoundName = (slotId) => {
  if (slotId.startsWith('R16')) return 'دور الـ 16';
  if (slotId.startsWith('QF')) return 'ربع النهائي';
  if (slotId.startsWith('SF')) return 'نصف النهائي';
  return 'النهائي';
};

export default function ManageBracket() {
  const { teams = [], matches = [], bracketConfig, settings } = useTournament();

  const enableKnockout = Boolean(settings?.enableKnockout);

  const [draftSize, setSize] = useState(null);
  const size = draftSize ?? bracketConfig?.size ?? 4;
  const [bracketState, setBracketState] = useState({});
  const [feedback, setFeedback] = useState(null);

  const slotTeams = slotId => {
    const match = matches.find(item => item.id === slotId || item.bracketSlotId === slotId);
    return { home: match?.homeTeamId || '', away: match?.awayTeamId || '', ...bracketState[slotId] };
  };

  const handleEnableKnockoutNow = async () => {
    try {
      await saveTournamentSettings({ enableKnockout: true });
      setFeedback({ type: 'success', text: 'تم تفعيل دور الإقصائيات في تطبيق الجمهور.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleSaveSize = async () => {
    try {
      await setDoc(doc(db, 'config', 'bracket'), { size: Number(size) }, { merge: true });
      setSize(null);
      setFeedback({ type: 'success', text: `تم ضبط حجم شجرة الإقصائيات على ${size} فرق.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleSaveSlot = async (slotId) => {
    const edits = bracketState[slotId];
    if (!edits) return;
    try {
      await runTransaction(db, async tx => {
        const ref = doc(db, 'matches', slotId);
        const bound = (await tx.get(doc(db, 'config', 'bracket'))).data()?.slotMatches?.[slotId];
        if (bound && bound !== slotId) throw new Error('الخانة مرتبطة بمباراة مسجلة.');
        const snap = await tx.get(ref);
        const current = snap.data();
        if (current?.status && !['مجدولة', 'scheduled'].includes(current.status)) {
          throw new Error('لا يمكن تغيير طرفي مواجهة بدأت بالفعل.');
        }
        const update = { type: 'knockout', round: getRoundName(slotId) };
        for (const [side, id] of Object.entries(edits)) {
          update[side + 'Team'] = id;
          update[side + 'TeamId'] = id;
        }
        if (!snap.exists()) Object.assign(update, {homeScore: 0, awayScore: 0, status: 'مجدولة', timerStatus: 'idle'});
        tx.set(ref, update, { merge: true });
      });
      setBracketState(prev => {
        const remaining = { ...prev };
        delete remaining[slotId];
        return remaining;
      });
      setFeedback({ type: 'success', text: `تم حفظ ${SLOT_NAMES[slotId]} بنجاح.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          KNOCKOUT TREE
        </span>
        <h1 className="font-display font-extrabold text-3xl text-ops-ink leading-tight">
          إدارة دور الإقصائيات
        </h1>
      </div>

      {/* Warning Banner if Knockout Mode is OFF */}
      {!enableKnockout && (
        <div className="glass-card glass-alert-amber rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            <div>
              <div className="font-display font-extrabold text-sm">
                دور الإقصائيات مُعطّل حالياً للجمهور
              </div>
              <p className="text-xs font-semibold text-amber-800 mt-0.5">
                لن يرى المشجعون تبويب الإقصائيات حتى تقوم بتفعيله من لوحة العمليات أو بالضغط هنا.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableKnockoutNow}
            className="min-h-[42px] px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-display font-bold text-xs shrink-0 cursor-pointer"
          >
            تفعيل الإقصائيات الآن
          </button>
        </div>
      )}

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

      {/* Size Config */}
      <section className="glass-card rounded-3xl bg-ops-surface border-2 border-ops-border p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="bracket-size" className="block text-xs font-bold text-ops-ink mb-1.5">
            حجم الشجرة (عدد الفرق المتأهلة)
          </label>
          <select
            id="bracket-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full h-12 px-3 rounded-xl border-2 border-ops-border bg-ops-bg font-bold text-ops-ink"
          >
            <option value={4}>4 فرق (نصف النهائي + النهائي)</option>
            <option value={8}>8 فرق (من ربع النهائي)</option>
            <option value={16}>16 فريقاً (من دور الـ 16)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleSaveSize}
          className="min-h-[48px] px-6 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <GitBranch size={17} aria-hidden="true" />
          <span>حفظ حجم الشجرة</span>
        </button>
      </section>

      {/* Matchup Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BRACKET_SLOTS[size].map((slotId) => (
          <div
            key={slotId}
            className="glass-card rounded-2xl bg-ops-surface border-2 border-ops-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <h2 className="font-display font-extrabold text-base text-ops-ink">
                {SLOT_NAMES[slotId]}
              </h2>
              <span className="text-xs font-bold text-ops-muted num-tabular">{slotId}</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-ops-muted mb-1">المستضيف</label>
                <select
                  value={slotTeams(slotId).home}
                  onChange={(e) =>
                    setBracketState((prev) => ({
                      ...prev,
                      [slotId]: { ...prev[slotId], home: e.target.value },
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border-2 border-ops-border bg-ops-bg font-semibold text-sm text-ops-ink"
                >
                  <option value="">يُحدد لاحقاً</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ops-muted mb-1">الضيف</label>
                <select
                  value={slotTeams(slotId).away}
                  onChange={(e) =>
                    setBracketState((prev) => ({
                      ...prev,
                      [slotId]: { ...prev[slotId], away: e.target.value },
                    }))
                  }
                  className="w-full h-11 px-3 rounded-xl border-2 border-ops-border bg-ops-bg font-semibold text-sm text-ops-ink"
                >
                  <option value="">يُحدد لاحقاً</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.nameAr}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSlot(slotId)}
                className="w-full min-h-[44px] rounded-xl bg-ops-ink hover:bg-ops-ink/90 text-arena-bg font-display font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save size={15} aria-hidden="true" />
                <span>حفظ المواجهة</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
