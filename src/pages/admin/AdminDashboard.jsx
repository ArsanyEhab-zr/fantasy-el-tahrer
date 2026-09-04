import { useNavigate } from 'react-router-dom';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import InkDoodle from '../../components/primitives/InkDoodle';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="لوحة الإدارة" showBack />

      <div className="flex flex-col gap-6 mt-4">
        {/* Core Controls */}
        <CardboardContainer variant="board" className="relative p-6 animate-fade-in-up">
          <InkDoodle type="star" size={30} className="absolute -top-3 -right-3 text-scrap-magenta" />
          <h2 className="text-stamp text-2xl mb-6 text-center">الإدارة الأساسية</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <TornPaperButton variant="primary" onClick={() => navigate('/admin/teams')} fullWidth>
              الفرق
            </TornPaperButton>
            <TornPaperButton variant="secondary" onClick={() => navigate('/admin/players')} fullWidth rotation={1}>
              اللاعبين
            </TornPaperButton>
            <TornPaperButton variant="danger" onClick={() => navigate('/admin/matches/create')} fullWidth rotation={-1}>
              إنشاء مباراة
            </TornPaperButton>
            <TornPaperButton variant="ghost" onClick={() => navigate('/referee')} fullWidth rotation={0}>
              شاشة الحكم
            </TornPaperButton>
          </div>
        </CardboardContainer>

        {/* God Mode Expansion */}
        <CardboardContainer variant="note" className="relative p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <InkDoodle type="lightning" size={30} className="absolute -bottom-3 -left-3 text-scrap-cyan" />
          <h2 className="text-stamp text-xl mb-4 text-center border-b-2 border-black/10 pb-2">صلاحيات التحكم الكامل</h2>
          
          <div className="flex flex-col gap-3">
            <TornPaperButton variant="ghost" onClick={() => navigate('/admin/groups')} fullWidth rotation={1}>
              📊 تجاوز الترتيب والمجموعات
            </TornPaperButton>
            <TornPaperButton variant="ghost" onClick={() => navigate('/admin/bracket')} fullWidth rotation={-1}>
              🏆 التحكم اليدوي في الشجرة
            </TornPaperButton>
            <TornPaperButton variant="ghost" onClick={() => navigate('/admin/matches')} fullWidth rotation={0.5}>
              ⏱️ سجل المباريات (تعديل/حذف)
            </TornPaperButton>
            <TornPaperButton variant="ghost" onClick={() => navigate('/admin/stats')} fullWidth rotation={-0.5}>
              👤 التجاوز اليدوي لإحصائيات اللاعبين
            </TornPaperButton>
          </div>
        </CardboardContainer>
      </div>
    </ScrapbookPage>
  );
}
