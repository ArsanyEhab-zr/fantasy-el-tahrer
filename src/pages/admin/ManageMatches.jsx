import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import MaskingTape from '../../components/primitives/MaskingTape';

export default function ManageMatches() {
  const { getTeam } = useTournament();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [editState, setEditState] = useState({ homeScore: 0, awayScore: 0, status: '' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'matches'), (snap) => {
      setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEdit = (match) => {
    setEditingId(match.id);
    setEditState({
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      status: match.status || 'منتهية'
    });
  };

  const handleSave = async (id) => {
    try {
      await updateDoc(doc(db, 'matches', String(id)), {
        homeScore: parseInt(editState.homeScore),
        awayScore: parseInt(editState.awayScore),
        status: editState.status
      });
      setEditingId(null);
      alert("تم تعديل المباراة");
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المباراة نهائياً؟")) {
      try {
        await deleteDoc(doc(db, 'matches', String(id)));
        alert('تم الحذف بنجاح');
      } catch (err) {
        console.error("FIREBASE ERROR:", err);
        alert(err.message);
      }
    }
  };

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="سجل المباريات" showBack backTo="/admin" />
      
      <div className="flex flex-col gap-4 mt-4 pb-12 animate-fade-in-up">
        {loading ? <p className="text-center">جاري التحميل...</p> : 
          matches.map(m => (
            <CardboardContainer key={m.id} variant="note" className="p-3">
              <div className="flex justify-between items-center border-b border-black/10 pb-2 mb-2">
                <span className="text-[10px] font-bold bg-black/10 px-2 py-1 rounded">ID: {m.id}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${m.status === 'مباشر' ? 'bg-red-500 text-white' : 'bg-gray-300'}`}>{m.status}</span>
              </div>
              
              <div className="flex justify-between items-center font-marker text-sm mb-3">
                <span className="w-1/3 text-right">{getTeam(m.homeTeam)?.nameAr}</span>
                
                {editingId === m.id ? (
                  <div className="flex gap-2 w-1/3 justify-center">
                    <input type="number" className="w-8 text-center border-2 border-black/20" value={editState.homeScore} onChange={e => setEditState({...editState, homeScore: e.target.value})} />
                    <span>-</span>
                    <input type="number" className="w-8 text-center border-2 border-black/20" value={editState.awayScore} onChange={e => setEditState({...editState, awayScore: e.target.value})} />
                  </div>
                ) : (
                  <span className="w-1/3 text-center text-lg text-scrap-magenta font-bold">{m.homeScore} - {m.awayScore}</span>
                )}
                
                <span className="w-1/3 text-left">{getTeam(m.awayTeam)?.nameAr}</span>
              </div>

              {editingId === m.id ? (
                <div className="flex flex-col gap-2">
                  <select className="w-full p-1 border-2 border-black/20 font-marker text-sm" value={editState.status} onChange={e => setEditState({...editState, status: e.target.value})}>
                    <option value="مجدولة">مجدولة</option>
                    <option value="مباشر">مباشر</option>
                    <option value="منتهية">منتهية</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(m.id)} className="flex-1 bg-green-500 text-white text-xs py-1 rounded font-bold">حفظ</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-400 text-white text-xs py-1 rounded font-bold">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 justify-center items-center">
                  {m.status === 'مجدولة' && (
                    <button 
                      onClick={() => navigate(`/admin/create-match?matchId=${m.id}`)} 
                      className="bg-scrap-cyan text-black px-3 py-1 rounded text-[11px] font-bold border-2 border-black/20 hover:scale-105 transition-transform"
                    >
                      إطلاق التشكيلة ⚡
                    </button>
                  )}
                  <button onClick={() => handleEdit(m)} className="text-blue-600 font-bold underline text-xs">تعديل النتيجة</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 font-bold underline text-xs">حذف</button>
                </div>
              )}
            </CardboardContainer>
          ))
        }
      </div>
    </ScrapbookPage>
  );
}
