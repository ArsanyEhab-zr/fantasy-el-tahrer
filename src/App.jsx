import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useLayoutEffect, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { TournamentProvider } from './hooks/TournamentProvider.jsx';

// 3 Completely Separated App Shells (Code-split Admin & Referee so Fans load fast!)
import ViewerLayout from './layouts/ViewerLayout.jsx';
import HomePage from './pages/viewer/HomePage.jsx';
import LiveMatchPage from './pages/viewer/LiveMatchPage.jsx';
import StandingsPage from './pages/viewer/StandingsPage.jsx';
import TopScorersPage from './pages/viewer/TopScorersPage.jsx';
import PlayerProfilePage from './pages/viewer/PlayerProfilePage.jsx';
import BracketPage from './pages/viewer/BracketPage.jsx';

// Lazy-loaded Admin Portal (/admin/*)
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const ManageTeams = lazy(() => import('./pages/admin/ManageTeams.jsx'));
const ManagePlayers = lazy(() => import('./pages/admin/ManagePlayers.jsx'));
const ManageGroups = lazy(() => import('./pages/admin/ManageGroups.jsx'));
const ManageMatches = lazy(() => import('./pages/admin/ManageMatches.jsx'));
const ManageBracket = lazy(() => import('./pages/admin/ManageBracket.jsx'));
const ManageDiscipline = lazy(() => import('./pages/admin/ManageDiscipline.jsx'));

// Lazy-loaded Referee Pitch Controller (/referee/*)
const RefereeLayout = lazy(() => import('./layouts/RefereeLayout.jsx'));
const RefereePage = lazy(() => import('./pages/referee/RefereePage.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div
      dir="rtl"
      className="min-h-dvh w-full bg-arena-bg text-arena-ink flex items-center justify-center p-6"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-fanta-orange border-t-transparent animate-spin" />
        <span className="font-display font-bold text-sm text-arena-muted">
          جاري تحميل البوابة…
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TournamentProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* APP 1: FANTA VIEWER (Public Fan Experience) */}
              <Route path="/" element={<ViewerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="live" element={<LiveMatchPage />} />
                <Route path="standings" element={<StandingsPage />} />
                <Route path="scorers" element={<TopScorersPage />} />
                <Route path="bracket" element={<BracketPage />} />
                <Route path="player/:id" element={<PlayerProfilePage />} />
              </Route>

              {/* APP 2: FANTA ADMIN (League Operations Portal) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="teams" element={<ManageTeams />} />
                <Route path="players" element={<ManagePlayers />} />
                <Route path="groups" element={<ManageGroups />} />
                <Route path="matches" element={<ManageMatches />} />
                <Route path="bracket" element={<ManageBracket />} />
                <Route path="discipline" element={<ManageDiscipline />} />
                <Route path="create-match" element={<Navigate to="/admin/matches" replace />} />
                <Route path="stats" element={<Navigate to="/admin/discipline" replace />} />
              </Route>

              {/* APP 3: FANTA REFEREE (Mobile-First Pitch Controller) */}
              <Route path="/referee" element={<RefereeLayout />}>
                <Route index element={<RefereePage />} />
                <Route path="*" element={<Navigate to="/referee" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </TournamentProvider>
    </MotionConfig>
  );
}
