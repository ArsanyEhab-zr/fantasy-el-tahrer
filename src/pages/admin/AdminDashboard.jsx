import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import ScrapbookPage from '../../components/layout/ScrapbookPage';
import ScrapbookHeader from '../../components/layout/ScrapbookHeader';
import CardboardContainer from '../../components/primitives/CardboardContainer';
import TornPaperButton from '../../components/primitives/TornPaperButton';
import InkDoodle from '../../components/primitives/InkDoodle';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'

  useEffect(() => {
    async function checkFirebaseConnection() {
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      if (!apiKey) {
        setConnectionStatus('disconnected');
        return;
      }

      try {
        const q = query(collection(db, 'teams'), limit(1));
        await getDocs(q);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Firebase connection check failed:', error);
        setConnectionStatus('disconnected');
      }
    }

    checkFirebaseConnection();
  }, []);

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="لوحة الإدارة" showBack />

      {/* Firebase Connection Status Badge */}
      <div className="mb-4 flex justify-center">
        {connectionStatus === 'checking' && (
          <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-500 text-yellow-800 font-bold rounded-lg shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            <span>Checking Firebase Connection...</span>
          </div>
        )}
        {connectionStatus === 'connected' && (
          <div className="px-4 py-2 bg-emerald-100 border-2 border-emerald-600 text-emerald-800 font-bold rounded-lg shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Firebase Connected (Live)</span>
          </div>
        )}
        {connectionStatus === 'disconnected' && (
          <div className="px-4 py-2 bg-red-100 border-2 border-red-600 text-red-800 font-bold rounded-lg shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Firebase Disconnected: Check Environment Variables</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 mt-2">
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

