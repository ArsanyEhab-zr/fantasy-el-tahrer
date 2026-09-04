import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import MaskingTape from '../../components/primitives/MaskingTape';

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [nameAr, setNameAr] = useState('');
  const [short, setShort] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'teams', String(editingId)), { nameAr, short, emoji });
      } else {
        await addDoc(collection(db, 'teams'), { nameAr, short, emoji });
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
        await deleteDoc(doc(db, 'teams', String(id)));
        alert('تم الحذف بنجاح');
      } catch (err) {
        console.error("FIREBASE ERROR:", err);
        alert(err.message);
      }
    }
  };

  const handleEdit = (team) => {
    setEditingId(team.id);
    setNameAr(team.nameAr);
    setShort(team.short || '');
    setEmoji(team.emoji || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setNameAr('');
    setShort('');
    setEmoji('');
  };

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="إدارة الفرق" showBack backTo="/admin" />

      <div className="flex flex-col gap-6 mt-4">
        <CardboardContainer variant="note" className="p-4 relative animate-fade-in-up">
          <MaskingTape color="yellow" position="top-right" width="40px" rotation={10} />
          <h2 className="text-stamp text-xl mb-4">{editingId ? 'تعديل الفريق' : 'إضافة فريق جديد'}</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input 
              required 
              placeholder="اسم الفريق (مثال: صقور النصر)"
              className="w-full p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-marker"
              value={nameAr} onChange={e => setNameAr(e.target.value)}
            />
            <div className="flex gap-3">
              <input 
                required 
                placeholder="الرمز (مثال: الصقور)"
                className="w-2/3 p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-marker"
                value={short} onChange={e => setShort(e.target.value)}
              />
              <input 
                required 
                placeholder="إيموجي (🦅)"
                className="w-1/3 p-2 border-2 border-scrap-ink rounded bg-white/50 focus:bg-white text-center text-marker"
                value={emoji} onChange={e => setEmoji(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <TornPaperButton variant="primary" type="submit" fullWidth>
                {editingId ? 'حفظ التعديلات' : 'إضافة الفريق'}
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
          <h2 className="text-stamp text-xl mb-4">الفرق المسجلة</h2>
          {loading ? (
            <p className="text-center text-marker animate-pulse">جاري التحميل...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-2 bg-white/60 border-b-2 border-black/10 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{team.emoji}</span>
                    <span className="font-bold text-lg text-marker">{team.nameAr}</span>
                    <span className="text-xs text-scrap-outline">({team.short})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(team)} className="text-blue-600 font-bold underline text-sm">تعديل</button>
                    <button onClick={() => handleDelete(team.id)} className="text-red-600 font-bold underline text-sm">حذف</button>
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
