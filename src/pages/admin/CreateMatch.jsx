import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTournament } from '../../hooks/TournamentContext';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import MaskingTape from '../../components/primitives/MaskingTape';

export default function CreateMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingMatchId = searchParams.get('matchId');

  const { teams, players, matches } = useTournament();
  
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [existingMatch, setExistingMatch] = useState(null);
  
  const [homeLineup, setHomeLineup] = useState({});
  const [awayLineup, setAwayLineup] = useState({});

  useEffect(() => {
    if (existingMatchId && matches.length > 0) {
      const match = matches.find(m => m.id === existingMatchId);
      if (match) {
        setExistingMatch(match);
        setHomeTeam(match.homeTeam);
        setAwayTeam(match.awayTeam);
      }
    }
  }, [existingMatchId, matches]);

  const handleStartMatch = async () => {
    if (!homeTeam || !awayTeam) return alert('اختر الفريقين أولاً');
    
    const hPlayers = players.filter(p => p.team === homeTeam);
    const aPlayers = players.filter(p => p.team === awayTeam);

    const hStarters = hPlayers.filter(p => homeLineup[p.id]).map(p => p.id);
    const hBench = hPlayers.filter(p => !homeLineup[p.id]).map(p => p.id);
    const aStarters = aPlayers.filter(p => awayLineup[p.id]).map(p => p.id);
    const aBench = aPlayers.filter(p => !awayLineup[p.id]).map(p => p.id);

    if (hStarters.length !== 5) return alert('يجب اختيار 5 لاعبين أساسيين للمستضيف بالضبط.');
    if (aStarters.length !== 5) return alert('يجب اختيار 5 لاعبين أساسيين للضيف بالضبط.');

    try {
      if (existingMatchId) {
        await updateDoc(doc(db, 'matches', String(existingMatchId)), {
          status: 'مباشر',
          minute: 0,
          homeActivePitch: hStarters,
          homeBench: hBench,
          awayActivePitch: aStarters,
          awayBench: aBench,
          homeScore: 0,
          awayScore: 0,
          yellowCards: { home: 0, away: 0 },
          redCards: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 },
        });
      } else {
        await addDoc(collection(db, 'matches'), {
          homeTeam,
          awayTeam,
          homeScore: 0,
          awayScore: 0,
          status: 'مباشر',
          minute: 0,
          createdAt: serverTimestamp(),
          homeActivePitch: hStarters,
          homeBench: hBench,
          awayActivePitch: aStarters,
          awayBench: aBench,
          yellowCards: { home: 0, away: 0 },
          redCards: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 },
          round: 'مباراة ودية'
        });
      }
      alert('تم إطلاق المباراة بنجاح! الحكم الآن لديه السيطرة.');
      navigate('/referee');
    } catch (err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const togglePlayer = (id, isHome) => {
    if (isHome) setHomeLineup(prev => ({ ...prev, [id]: !prev[id] }));
    else setAwayLineup(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hPlayers = players.filter(p => p.team === homeTeam);
  const aPlayers = players.filter(p => p.team === awayTeam);

  return (
    <ScrapbookPage>
      <ScrapbookHeader title={existingMatchId ? "اختيار التشكيلة وبدء المباراة" : "إنشاء مباراة جديدة"} showBack backTo="/admin" />

      <div className="flex flex-col gap-6 mt-4 pb-12">
        <CardboardContainer variant="board" className="p-4 relative animate-fade-in-up">
          <MaskingTape color="cyan" position="top-right" width="40px" rotation={10} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-stamp mb-2 text-center text-sm">المستضيف</h3>
              {existingMatchId ? (
                <div className="text-center font-marker text-lg bg-white/50 p-2 rounded">
                  {teams.find(t => t.id === homeTeam)?.nameAr || 'يُحدد'}
                </div>
              ) : (
                <select className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 text-marker" value={homeTeam} onChange={e => setHomeTeam(e.target.value)}>
                  <option value="" disabled>اختر الفريق</option>
                  {teams.filter(t => t.id !== awayTeam).map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nameAr}</option>)}
                </select>
              )}
            </div>
            <div>
              <h3 className="text-stamp mb-2 text-center text-sm">الضيف</h3>
              {existingMatchId ? (
                <div className="text-center font-marker text-lg bg-white/50 p-2 rounded">
                  {teams.find(t => t.id === awayTeam)?.nameAr || 'يُحدد'}
                </div>
              ) : (
                <select className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 text-marker" value={awayTeam} onChange={e => setAwayTeam(e.target.value)}>
                  <option value="" disabled>اختر الفريق</option>
                  {teams.filter(t => t.id !== homeTeam).map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nameAr}</option>)}
                </select>
              )}
            </div>
          </div>
        </CardboardContainer>

        {homeTeam && awayTeam && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardboardContainer variant="note" className="p-2">
              <h3 className="text-stamp mb-2 text-center text-[11px] border-b-2 border-black/10 pb-2">تشكيلة المستضيف (حدد الأساسي)</h3>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {hPlayers.map(p => {
                  const isChecked = !!homeLineup[p.id];
                  const atLimit = Object.values(homeLineup).filter(Boolean).length >= 5;
                  const disabled = !isChecked && atLimit;
                  
                  return (
                    <label key={p.id} className={`flex items-center justify-between p-1 rounded cursor-pointer ${disabled ? 'bg-gray-200 opacity-50' : 'bg-white/60'}`}>
                      <span className="text-[10px] font-bold font-marker truncate">{p.nameAr}</span>
                      <input type="checkbox" checked={isChecked} disabled={disabled} onChange={() => togglePlayer(p.id, true)} className="w-3 h-3 accent-scrap-cyan" />
                    </label>
                  );
                })}
              </div>
            </CardboardContainer>

            <CardboardContainer variant="note" className="p-2">
              <h3 className="text-stamp mb-2 text-center text-[11px] border-b-2 border-black/10 pb-2">تشكيلة الضيف (حدد الأساسي)</h3>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {aPlayers.map(p => {
                  const isChecked = !!awayLineup[p.id];
                  const atLimit = Object.values(awayLineup).filter(Boolean).length >= 5;
                  const disabled = !isChecked && atLimit;

                  return (
                    <label key={p.id} className={`flex items-center justify-between p-1 rounded cursor-pointer ${disabled ? 'bg-gray-200 opacity-50' : 'bg-white/60'}`}>
                      <span className="text-[10px] font-bold font-marker truncate">{p.nameAr}</span>
                      <input type="checkbox" checked={isChecked} disabled={disabled} onChange={() => togglePlayer(p.id, false)} className="w-3 h-3 accent-scrap-cyan" />
                    </label>
                  );
                })}
              </div>
            </CardboardContainer>
          </div>
        )}

        <div className="mt-2 mb-12">
          <TornPaperButton variant="danger" onClick={handleStartMatch} fullWidth disabled={!homeTeam || !awayTeam}>
            إطلاق المباراة! ⚡
          </TornPaperButton>
        </div>
      </div>
    </ScrapbookPage>
  );
}
