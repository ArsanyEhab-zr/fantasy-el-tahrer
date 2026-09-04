import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import HomePage from './pages/HomePage.jsx';
import LiveMatchPage from './pages/LiveMatchPage.jsx';
import StandingsPage from './pages/StandingsPage.jsx';
import BracketPage from './pages/BracketPage.jsx';
import TopScorersPage from './pages/TopScorersPage.jsx';
import PlayerProfilePage from './pages/PlayerProfilePage.jsx';
import RefereePage from './pages/RefereePage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageTeams from './pages/admin/ManageTeams.jsx';
import ManagePlayers from './pages/admin/ManagePlayers.jsx';
import CreateMatch from './pages/admin/CreateMatch.jsx';
import ManageGroups from './pages/admin/ManageGroups.jsx';
import ManageBracket from './pages/admin/ManageBracket.jsx';
import ManageMatches from './pages/admin/ManageMatches.jsx';
import OverridePlayerStats from './pages/admin/OverridePlayerStats.jsx';
import { TournamentProvider } from './hooks/TournamentContext.jsx';
import BottomNav from './components/layout/BottomNav.jsx';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center w-full">
        {/* The Mobile Phone Frame */}
        <div dir="rtl" className="w-full max-w-[390px] h-[100dvh] bg-scrap-paper-warm relative flex flex-col overflow-hidden shadow-2xl border-x border-black/20">
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
            <ScrollToTop />
            <TournamentProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/live" element={<LiveMatchPage />} />
                <Route path="/standings" element={<StandingsPage />} />
                <Route path="/bracket" element={<BracketPage />} />
                <Route path="/scorers" element={<TopScorersPage />} />
                <Route path="/player/:id" element={<PlayerProfilePage />} />
                <Route path="/referee" element={<RefereePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/teams" element={<ManageTeams />} />
                <Route path="/admin/players" element={<ManagePlayers />} />
                <Route path="/admin/create-match" element={<CreateMatch />} />
                <Route path="/admin/groups" element={<ManageGroups />} />
                <Route path="/admin/bracket" element={<ManageBracket />} />
                <Route path="/admin/matches" element={<ManageMatches />} />
                <Route path="/admin/stats" element={<OverridePlayerStats />} />
              </Routes>
            </TournamentProvider>
          </div>

          {/* Static Bottom Nav */}
          <BottomNav />
        </div>
      </div>
    </Router>
  );
}
