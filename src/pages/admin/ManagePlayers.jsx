import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import MaskingTape from '../../components/primitives/MaskingTape';

export default function ManagePlayers() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [nameAr, setNameAr] = useState('');
  const [position, setPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [teamId, setTeamId] = useState('');

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubPlayers = onSnapshot(collection(db, 'players'), (snap) => {
      setPlayers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return () => {
      unsubTeams();
      unsubPlayers();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        nameAr, 
        position, 
        jerseyNumber: parseInt(jerseyNumber) || 0,
        team: teamId,
        // Default tournament stats for new players
        goals: editingId ? undefined : 0,
        assists: editingId ? undefined : 0
      };
      
      // Clean undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      if (editingId) {
        await updateDoc(doc(db, 'players', String(editingId)), payload);
      } else {
        await addDoc(collection(db, 'players'), payload);
      }
      resetForm();
      alert('تم بنجاح');
    } catch (err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await deleteDoc(doc(db, 'players', String(id)));
        alert('تم الحذف بنجاح');
      } catch (err) {
        console.error("FIREBASE ERROR:", err);
        alert(err.message);
      }
    }
  };

  const handleEdit = (player) => {
    setEditingId(player.id);
    setNameAr(player.nameAr);
    setPosition(player.position || '');
    setJerseyNumber(player.jerseyNumber || '');
    setTeamId(player.team || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setNameAr('');
    setPosition('');
    setJerseyNumber('');
    setTeamId('');
  };

  const getTeamName = (id) => teams.find(t => t.id === id)?.nameAr || 'بدون فريق';

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="إدارة اللاعبين" showBack backTo="/admin" />

      <div className="flex flex-col gap-6 mt-4">
        <CardboardContainer variant="note" className="p-4 relative animate-fade-in-up">
          <MaskingTape color="magenta" position="top-right" width="40px" rotation={-10} />
          <h2 className="text-stamp text-xl mb-4">{editingId ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input 
              required 
              placeholder="اسم اللاعب"
              className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-marker"
              value={nameAr} onChange={e => setNameAr(e.target.value)}
            />
            
            <select 
              required 
              className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-marker"
              value={teamId} onChange={e => setTeamId(e.target.value)}
            >
              <option value="" disabled>اختر الفريق</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.emoji} {t.nameAr}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <input 
                required 
                placeholder="المركز (مهاجم، دفاع...)"
                className="w-2/3 p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-marker"
                value={position} onChange={e => setPosition(e.target.value)}
              />
              <input 
                required 
                type="number"
                placeholder="الرقم"
                className="w-1/3 p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-center text-marker"
                value={jerseyNumber} onChange={e => setJerseyNumber(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 mt-2">
              <TornPaperButton variant="secondary" type="submit" fullWidth>
                {editingId ? 'حفظ التعديلات' : 'إضافة اللاعب'}
              </TornPaperButton>
              {editingId && (
                <TornPaperButton variant="ghost" type="button" onClick={resetForm} fullWidth>
                  إلغاء
                </TornPaperButton>
              )}
            </div>
          </form>
        </CardboardContainer>

        <CardboardContainer variant="board" className="p-4 min-h-[200px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-stamp text-xl mb-4">اللاعبون المسجلون</h2>
          {loading ? (
            <p className="text-center text-marker animate-pulse">جاري التحميل...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-white/60 border-b-2 border-black/10 rounded">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-scrap-ink text-white rounded-full text-xs font-bold">
                      {player.jerseyNumber || '?'}
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="font-bold text-sm text-marker leading-none">{player.nameAr}</span>
                      <span className="text-[10px] text-scrap-outline mt-1">{getTeamName(player.team)} • {player.position}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEdit(player)} className="text-blue-600 font-bold underline text-xs">تعديل</button>
                    <button onClick={() => handleDelete(player.id)} className="text-red-600 font-bold underline text-xs">حذف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardboardContainer>
      </div>
    </ScrapbookPage>
  );
}
