import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import ScoreBoard from '../components/match/ScoreBoard';
import ActionButton from '../components/referee/ActionButton';
import CardboardContainer from '../components/primitives/CardboardContainer';
import MaskingTape from '../components/primitives/MaskingTape';
import TornPaperButton from '../components/primitives/TornPaperButton';

export default function RefereePage() {
  const { match, loading, error } = useLiveMatch();
  const { players, getTeam } = useTournament();
  
  const [modalState, setModalState] = useState({ isOpen: false, type: null, subOffId: null });

  const openModal = (type) => setModalState({ isOpen: true, type, subOffId: null });
  const closeModal = () => setModalState({ isOpen: false, type: null, subOffId: null });

  const handleEndMatch = async () => {
    if (window.confirm("هل أنت متأكد من إنهاء المباراة؟")) {
      try {
        await updateDoc(doc(db, 'matches', match.id), { status: 'منتهية' });
        alert('تم إنهاء المباراة بنجاح');
      } catch(err) {
        console.error("FIREBASE ERROR:", err);
        alert(err.message);
      }
    }
  };

  const submitSub = async (offId, onId) => {
    if (!match?.id || !offId || !onId) return;
    try {
      const offPlayer = players.find(p => p.id === offId);
      const onPlayer = players.find(p => p.id === onId);
      const isHome = match.homeTeam === offPlayer.team;
      
      const eventData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: 'sub',
        minute: match.minute || 0,
        teamId: offPlayer.team,
        playerId: onId,
        playerName: onPlayer.nameAr,
        timestamp: new Date().toISOString(),
        detail: `بدلاً من ${offPlayer.nameAr}`
      };
      
      const pitchField = isHome ? 'homeActivePitch' : 'awayActivePitch';
      const benchField = isHome ? 'homeBench' : 'awayBench';
      
      const newPitch = (match[pitchField] || []).filter(id => id !== offId);
      newPitch.push(onId);
      
      const newBench = (match[benchField] || []).filter(id => id !== onId);
      
      await updateDoc(doc(db, 'matches', match.id), {
        events: arrayUnion(eventData),
        [pitchField]: newPitch,
        [benchField]: newBench
      });
      closeModal();
    } catch (err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const submitAction = async (playerId, actionType) => {
    if (!match?.id || !playerId) return;
    try {
      const player = players.find(p => p.id === playerId);
      const isHome = match.homeTeam === player.team;
      
      let finalActionType = actionType;
      const matchUpdate = {};
      const eventsToPush = [];
      const pitchField = isHome ? 'homeActivePitch' : 'awayActivePitch';
      let removeFromPitch = false;

      // Double Yellow Automation
      if (actionType === 'yellow') {
        const hasYellow = (match.events || []).some(e => e.playerId === playerId && e.type === 'yellow');
        if (hasYellow) {
          // Push the second yellow FIRST
          eventsToPush.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: 'yellow',
            minute: match.minute || 0,
            teamId: player.team,
            playerId,
            playerName: player.nameAr,
            timestamp: new Date().toISOString(),
            detail: 'بطاقة صفراء ثانية'
          });
          // Then switch the main action to RED
          finalActionType = 'red';
        }
      }

      if (finalActionType === 'red') removeFromPitch = true;

      const mainEventData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: finalActionType,
        minute: match.minute || 0,
        teamId: player.team,
        playerId,
        playerName: player.nameAr,
        timestamp: new Date().toISOString()
      };
      
      if (finalActionType === 'goal') {
        matchUpdate[isHome ? 'homeScore' : 'awayScore'] = (match[isHome ? 'homeScore' : 'awayScore'] || 0) + 1;
        mainEventData.detail = 'هدف!';
      } else if (finalActionType === 'assist') {
        mainEventData.detail = 'أسيست';
      } else if (finalActionType === 'yellow') {
        mainEventData.detail = 'بطاقة صفراء';
      } else if (finalActionType === 'red') {
        mainEventData.detail = 'بطاقة حمراء';
      }

      eventsToPush.push(mainEventData);
      
      // We cannot use arrayUnion for multiple dynamic objects easily without spreading, 
      // but arrayUnion supports multiple arguments: arrayUnion(...eventsToPush)
      matchUpdate.events = arrayUnion(...eventsToPush);

      if (removeFromPitch) {
        matchUpdate[pitchField] = (match[pitchField] || []).filter(id => id !== playerId);
      }

      await updateDoc(doc(db, 'matches', match.id), matchUpdate);
      closeModal();
    } catch (err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="لوحة تحكم الحكم" showBack backTo="/admin" />
        <div className="flex justify-center items-center h-64">
          <h2 className="text-stamp text-xl animate-pulse text-scrap-ink/50" style={{ transform: 'rotate(-2deg)' }}>
            جاري التحميل...
          </h2>
        </div>
      </ScrapbookPage>
    );
  }

  if (error || !match) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="لوحة تحكم الحكم" showBack backTo="/admin" />
        <div className="flex justify-center items-center h-64">
          <p className="text-marker text-scrap-magenta text-xl">لا توجد مباراة مباشرة حالياً</p>
        </div>
      </ScrapbookPage>
    );
  }

  // Active Pitch Filtering
  const activePitchIds = [...(match.homeActivePitch || []), ...(match.awayActivePitch || [])];
  const activePlayers = players.filter(p => activePitchIds.includes(p.id));

  // Render correct players in Modal
  let modalPlayers = [];
  let modalTitle = 'اختر اللاعب';
  
  if (modalState.type === 'sub_off') {
    modalPlayers = activePlayers;
    modalTitle = 'من سيخرج؟ (Active Pitch)';
  } else if (modalState.type === 'sub_on') {
    const offPlayer = players.find(p => p.id === modalState.subOffId);
    if (offPlayer) {
      const isHome = match.homeTeam === offPlayer.team;
      const benchIds = isHome ? match.homeBench : match.awayBench;
      modalPlayers = players.filter(p => (benchIds || []).includes(p.id));
      modalTitle = `من سيدخل بديلاً لـ ${offPlayer.nameAr}؟ (Bench)`;
    }
  } else if (modalState.type) {
    modalPlayers = activePlayers;
    if (modalState.type === 'goal') modalTitle = 'من سجل الهدف؟';
    if (modalState.type === 'assist') modalTitle = 'من صنع الهدف؟';
    if (modalState.type === 'yellow') modalTitle = 'لمن البطاقة الصفراء؟';
    if (modalState.type === 'red') modalTitle = 'لمن البطاقة الحمراء؟';
  }

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="لوحة تحكم الحكم" showBack backTo="/admin" />

      <div className="animate-paper-drop">
        <ScoreBoard match={match} />
      </div>

      <CardboardContainer variant="board" rotation={1} className="mt-6 mb-8 relative z-10">
        <div className="relative inline-block mb-4">
          <h2 className="text-stamp text-xl" style={{ transform: 'rotate(-2deg)' }}>
            تسجيل الأحداث
          </h2>
          <MaskingTape color="pink" position="top-right" width="30px" rotation={25} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ActionButton type="goal" onClick={() => openModal('goal')} />
          <ActionButton type="assist" onClick={() => openModal('assist')} />
          <ActionButton type="yellow" onClick={() => openModal('yellow')} />
          <ActionButton type="red" onClick={() => openModal('red')} />
          <ActionButton type="sub" onClick={() => openModal('sub_off')} />
        </div>
      </CardboardContainer>

      <div className="text-center mt-6 mb-12">
        <TornPaperButton variant="danger" onClick={handleEndMatch}>
          إنهاء المباراة 🛑
        </TornPaperButton>
      </div>

      {/* Player Selection Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <CardboardContainer variant="note" className="w-full max-w-sm max-h-[80vh] flex flex-col p-4 relative animate-fade-in-up">
            <button onClick={closeModal} className="absolute top-2 left-3 text-red-500 font-bold text-xl">X</button>
            <h2 className="text-stamp text-xl mb-4 text-center border-b-2 border-black/10 pb-2">
              {modalTitle}
            </h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-1">
              {modalPlayers.length === 0 && (
                <p className="text-center text-marker text-gray-500">لا يوجد لاعبين متاحين</p>
              )}
              {modalPlayers.map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    if (modalState.type === 'sub_off') {
                      setModalState({ isOpen: true, type: 'sub_on', subOffId: p.id });
                    } else if (modalState.type === 'sub_on') {
                      submitSub(modalState.subOffId, p.id);
                    } else {
                      submitAction(p.id, modalState.type);
                    }
                  }}
                  className="bg-white/60 p-2 rounded text-marker text-right border-2 border-transparent hover:border-black flex justify-between items-center transition-colors"
                >
                  <span className="font-bold text-sm">{p.nameAr}</span>
                  <span className="text-[10px] text-gray-500 bg-black/5 px-2 py-1 rounded">{getTeam(p.team)?.nameAr}</span>
                </button>
              ))}
            </div>
          </CardboardContainer>
        </div>
      )}
    </ScrapbookPage>
  );
}
