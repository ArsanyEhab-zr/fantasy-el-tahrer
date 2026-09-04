import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import MaskingTape from '../../components/primitives/MaskingTape';

const BRACKET_SLOTS = {
  16: ['R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8', 'QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', 'FINAL'],
  8: ['QF1', 'QF2', 'QF3', 'QF4', 'SF1', 'SF2', 'FINAL'],
  4: ['SF1', 'SF2', 'FINAL']
};

const SLOT_NAMES = {
  R16_1: 'دور الـ 16 (1)', R16_2: 'دور الـ 16 (2)', R16_3: 'دور الـ 16 (3)', R16_4: 'دور الـ 16 (4)',
  R16_5: 'دور الـ 16 (5)', R16_6: 'دور الـ 16 (6)', R16_7: 'دور الـ 16 (7)', R16_8: 'دور الـ 16 (8)',
  QF1: 'ربع النهائي (1)', QF2: 'ربع النهائي (2)', QF3: 'ربع النهائي (3)', QF4: 'ربع النهائي (4)',
  SF1: 'نصف النهائي الأول', SF2: 'نصف النهائي الثاني', FINAL: 'النهائي'
};

const ROUND_NAMES = {
  R16: 'دور الـ 16',
  QF: 'ربع النهائي',
  SF: 'نصف النهائي',
  FINAL: 'النهائي'
};

export default function ManageBracket() {
  const { teams, matches, bracketConfig } = useTournament();
  
  const [size, setSize] = useState(bracketConfig?.size || 4);
  const [bracketState, setBracketState] = useState({});

  useEffect(() => {
    setSize(bracketConfig?.size || 4);
  }, [bracketConfig]);

  useEffect(() => {
    // Populate state from existing matches
    const state = {};
    BRACKET_SLOTS[16].forEach(slotId => {
      const match = matches.find(m => m.id === slotId);
      if (match) {
        state[slotId] = { home: match.homeTeam || '', away: match.awayTeam || '' };
      } else {
        state[slotId] = { home: '', away: '' };
      }
    });
    setBracketState(state);
  }, [matches]);

  const handleSaveSize = async () => {
    try {
      await setDoc(doc(db, 'config', 'bracket'), { size: parseInt(size) });
      alert("تم حفظ حجم الشجرة بنجاح");
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const handleSaveMatch = async (slotId) => {
    const stateObj = bracketState[slotId];
    if (!stateObj) return;

    let roundName = ROUND_NAMES.FINAL;
    if (slotId.startsWith('R16')) roundName = ROUND_NAMES.R16;
    if (slotId.startsWith('QF')) roundName = ROUND_NAMES.QF;
    if (slotId.startsWith('SF')) roundName = ROUND_NAMES.SF;

    try {
      await setDoc(doc(db, 'matches', slotId), {
        type: 'knockout',
        homeTeam: stateObj.home,
        awayTeam: stateObj.away,
        round: roundName,
        homeScore: 0,
        awayScore: 0,
        status: 'مجدولة'
      }, { merge: true });
      alert(`تم حفظ ${SLOT_NAMES[slotId]} بنجاح`);
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const TeamSelect = ({ val, setVal }) => (
    <select className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 text-marker text-[11px]" value={val} onChange={e => setVal(e.target.value)}>
      <option value="">اختر الفريق</option>
      {teams.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nameAr}</option>)}
    </select>
  );

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="إدارة الشجرة (Bracket)" showBack backTo="/admin" />
      
      <div className="flex flex-col gap-6 mt-4 pb-12 animate-fade-in-up">
        
        {/* Settings */}
        <CardboardContainer variant="board" className="p-4 relative">
          <MaskingTape color="pink" position="top-right" width="40px" rotation={10} />
          <h3 className="text-stamp text-lg mb-4 text-center border-b-2 border-black/10 pb-2">إعدادات الشجرة</h3>
          
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-bold font-marker mb-1 block">حجم الشجرة (عدد الفرق):</label>
              <select className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 text-marker" value={size} onChange={e => setSize(Number(e.target.value))}>
                <option value={4}>4 فرق (نصف نهائي فقط)</option>
                <option value={8}>8 فرق (من ربع النهائي)</option>
                <option value={16}>16 فريق (من دور الـ 16)</option>
              </select>
            </div>
            <TornPaperButton variant="primary" onClick={handleSaveSize} fullWidth>
              حفظ الإعدادات
            </TornPaperButton>
          </div>
        </CardboardContainer>

        <CardboardContainer variant="note" className="p-3 text-center">
          <p className="text-sm font-marker text-scrap-ink text-red-600">
            ملاحظة: يمكنك تعيين الفرق يدوياً هنا، ولكن عندما تنتهي مباراة إقصائية سيتم ترحيل الفائز تلقائياً للخانة التالية!
          </p>
        </CardboardContainer>

        {/* Slotting */}
        {BRACKET_SLOTS[size].map(slotId => (
          <CardboardContainer key={slotId} variant="note" className="p-3 mb-2 relative shadow-md">
            <h3 className="text-stamp text-sm mb-3 border-b border-black/10 pb-1">{SLOT_NAMES[slotId]}</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-12 text-center bg-black/10 rounded py-1">مستضيف</span>
                <div className="flex-1">
                  <TeamSelect 
                    val={bracketState[slotId]?.home || ''} 
                    setVal={(v) => setBracketState(prev => ({...prev, [slotId]: {...prev[slotId], home: v}}))} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-12 text-center bg-black/10 rounded py-1">ضيف</span>
                <div className="flex-1">
                  <TeamSelect 
                    val={bracketState[slotId]?.away || ''} 
                    setVal={(v) => setBracketState(prev => ({...prev, [slotId]: {...prev[slotId], away: v}}))} 
                  />
                </div>
              </div>
              <div className="mt-2">
                <TornPaperButton variant="secondary" size="sm" onClick={() => handleSaveMatch(slotId)} fullWidth>
                  حفظ {slotId}
                </TornPaperButton>
              </div>
            </div>
          </CardboardContainer>
        ))}

      </div>
    </ScrapbookPage>
  );
}
