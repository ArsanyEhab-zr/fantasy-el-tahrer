import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';

export default function OverridePlayerStats() {
  const { players, getTeam } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local edit state to avoid spamming Firestore on every keystroke
  const [editState, setEditState] = useState({});

  useEffect(() => {
    // Initialize edit state
    const initial = {};
    players.forEach(p => {
      if (!editState[p.id]) {
        initial[p.id] = {
          goals: p.goals || 0,
          assists: p.assists || 0,
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0
        };
      }
    });
    setEditState(prev => ({...prev, ...initial}));
  }, [players]);

  const handleStatChange = (playerId, field, val) => {
    const num = parseInt(val) || 0;
    setEditState(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: num }
    }));
  };

  const handleSave = async (playerId) => {
    try {
      const p = players.find(x => x.id === playerId);
      
      const targetGoals = editState[playerId].goals;
      const targetAssists = editState[playerId].assists;
      const targetYellow = editState[playerId].yellowCards;
      const targetRed = editState[playerId].redCards;

      const matchGoals = p.goals - (p.manualGoalOffset || 0);
      const matchAssists = p.assists - (p.manualAssistOffset || 0);
      const matchYellow = p.yellowCards - (p.manualYellowOffset || 0);
      const matchRed = p.redCards - (p.manualRedOffset || 0);

      const updates = {
        manualGoalOffset: targetGoals - matchGoals,
        manualAssistOffset: targetAssists - matchAssists,
        manualYellowOffset: targetYellow - matchYellow,
        manualRedOffset: targetRed - matchRed
      };

      await updateDoc(doc(db, 'players', String(playerId)), updates);
      alert("تم الحفظ بنجاح!");
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const filtered = players.filter(p => p.nameAr.includes(searchTerm));

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="تجاوز الإحصائيات" showBack backTo="/admin" />
      
      <div className="flex flex-col gap-4 mt-4 pb-12 animate-fade-in-up">
        <input 
          type="text" 
          placeholder="ابحث عن لاعب..." 
          className="w-full p-2 border-2 border-scrap-ink rounded bg-white/80 font-marker"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {filtered.map(p => (
          <CardboardContainer key={p.id} variant="note" className="p-3">
            <div className="flex justify-between items-center mb-2 border-b border-black/10 pb-2">
              <div className="flex flex-col text-right w-1/2">
                <span className="font-bold text-sm font-marker truncate">{p.nameAr}</span>
                <span className="text-[10px] text-scrap-outline">{getTeam(p.team)?.nameAr}</span>
              </div>
              <button 
                onClick={() => handleSave(p.id)}
                className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-xs press-effect"
              >
                حفظ
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-marker">
              <div>
                <label className="block mb-1 text-scrap-ink">أهداف</label>
                <input type="number" className="w-full p-1 border-2 border-black/20 text-center rounded bg-white/50" value={editState[p.id]?.goals ?? 0} onChange={e => handleStatChange(p.id, 'goals', e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-scrap-ink">أسيست</label>
                <input type="number" className="w-full p-1 border-2 border-black/20 text-center rounded bg-white/50" value={editState[p.id]?.assists ?? 0} onChange={e => handleStatChange(p.id, 'assists', e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-scrap-ink">أصفر</label>
                <input type="number" className="w-full p-1 border-2 border-yellow-400 text-center rounded bg-white/50" value={editState[p.id]?.yellowCards ?? 0} onChange={e => handleStatChange(p.id, 'yellowCards', e.target.value)} />
              </div>
              <div>
                <label className="block mb-1 text-scrap-ink">أحمر</label>
                <input type="number" className="w-full p-1 border-2 border-red-500 text-center rounded bg-white/50" value={editState[p.id]?.redCards ?? 0} onChange={e => handleStatChange(p.id, 'redCards', e.target.value)} />
              </div>
            </div>
          </CardboardContainer>
        ))}
      </div>
    </ScrapbookPage>
  );
}
