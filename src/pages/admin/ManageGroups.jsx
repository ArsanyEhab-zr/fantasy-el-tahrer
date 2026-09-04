import { useState } from 'react';
import { collection, doc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useTournament } from '../../hooks/TournamentContext';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import MaskingTape from '../../components/primitives/MaskingTape';
import InkDoodle from '../../components/primitives/InkDoodle';

export default function ManageGroups() {
  const { teams, groups, loading, getTeam } = useTournament();

  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);

  const toggleTeam = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("الرجاء إدخال اسم المجموعة");
      return;
    }
    
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        teams: selectedTeams
      });
      setNewGroupName('');
      setSelectedTeams([]);
      alert("تم إنشاء المجموعة بنجاح");
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;
    try {
      await deleteDoc(doc(db, 'groups', String(id)));
    } catch(err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  const generateFixtures = async (groupId, teamsList) => {
    if (!teamsList || teamsList.length < 2) {
      alert("يجب أن تحتوي المجموعة على فريقين على الأقل لتوليد المباريات");
      return;
    }
    
    if (!window.confirm("هل أنت متأكد من توليد المباريات؟ (سيتم إضافة مباريات جديدة)")) return;

    try {
      const batch = writeBatch(db);
      for (let i = 0; i < teamsList.length; i++) {
        for (let j = i + 1; j < teamsList.length; j++) {
          const newMatchRef = doc(collection(db, 'matches'));
          batch.set(newMatchRef, {
            type: 'group',
            groupId: groupId,
            homeTeam: teamsList[i],
            awayTeam: teamsList[j],
            status: 'مجدولة',
            homeScore: 0,
            awayScore: 0,
            round: 'دور المجموعات'
          });
        }
      }
      await batch.commit();
      alert("تم توليد المباريات بنجاح!");
    } catch (err) {
      console.error("FIREBASE ERROR:", err);
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">جاري التحميل...</div>;

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="إدارة المجموعات" showBack backTo="/admin" />
      
      <div className="flex flex-col gap-6 mt-4 pb-12">
        {/* Create Group Form */}
        <CardboardContainer variant="board" className="p-4 relative animate-paper-drop">
          <MaskingTape color="pink" position="top-left" width="50px" rotation={-10} />
          <h2 className="text-stamp text-xl mb-4">إنشاء مجموعة جديدة</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold font-marker mb-1 block">اسم المجموعة (مثال: أ، B، الأولى)</label>
              <input 
                type="text" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="اسم المجموعة..."
                className="w-full p-2 border-2 border-scrap-ink rounded bg-white/80 font-marker"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold font-marker mb-2 block">اختر فرق المجموعة:</label>
              <div className="grid grid-cols-2 gap-2">
                {teams.map(team => (
                  <label key={team.id} className="flex items-center gap-2 bg-white/50 p-2 border border-black/10 rounded cursor-pointer hover:bg-white/80 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => toggleTeam(team.id)}
                      className="accent-scrap-cyan w-4 h-4"
                    />
                    <span className="text-sm font-bold text-marker truncate">{team.emoji} {team.nameAr}</span>
                  </label>
                ))}
              </div>
            </div>

            <TornPaperButton variant="primary" onClick={handleCreateGroup} fullWidth rotation={-0.5}>
              إنشاء وحفظ
            </TornPaperButton>
          </div>
        </CardboardContainer>

        <div className="relative inline-block my-2 text-center">
          <h2 className="text-stamp text-2xl" style={{ transform: 'rotate(-2deg)' }}>
            المجموعات الحالية
          </h2>
          <InkDoodle type="underline" size={100} className="-bottom-3 right-0 opacity-20" />
        </div>

        {/* Existing Groups List */}
        {groups.length === 0 ? (
          <CardboardContainer variant="note" className="text-center p-6 text-marker text-scrap-ink/50">
            لا توجد مجموعات حتى الآن.
          </CardboardContainer>
        ) : (
          groups.map((group, idx) => (
            <CardboardContainer key={group.id} variant="note" className="p-4 relative animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <MaskingTape color="yellow" position="top-right" width="40px" rotation={15} />
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-stamp text-2xl border-b-2 border-black/10 pb-1">{group.name}</h3>
                <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500 font-bold font-marker hover:scale-110 transition-transform">
                  حذف ❌
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {group.teams && group.teams.length > 0 ? group.teams.map(tId => {
                  const team = getTeam(tId);
                  return (
                    <span key={tId} className="bg-white/80 border border-black/20 px-2 py-1 rounded text-sm font-bold shadow-sm">
                      {team ? `${team.emoji} ${team.nameAr}` : 'مجهول'}
                    </span>
                  );
                }) : (
                  <span className="text-sm text-black/50">لا يوجد فرق في هذه المجموعة</span>
                )}
              </div>

              <TornPaperButton 
                variant="secondary" 
                onClick={() => generateFixtures(group.id, group.teams)} 
                fullWidth 
                size="sm"
                rotation={1}
              >
                توليد المباريات (Round-Robin) ⚡
              </TornPaperButton>
            </CardboardContainer>
          ))
        )}
      </div>
    </ScrapbookPage>
  );
}
