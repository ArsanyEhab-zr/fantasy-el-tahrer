import { Navigate, Route, Routes } from 'react-router-dom';
import ViewerLayout from '../layouts/ViewerLayout';
import HomePage from '../pages/viewer/HomePage';
import LiveMatchPage from '../pages/viewer/LiveMatchPage';
import StandingsPage from '../pages/viewer/StandingsPage';
import TopScorersPage from '../pages/viewer/TopScorersPage';
import BracketPage from '../pages/viewer/BracketPage';
import PlayerProfilePage from '../pages/viewer/PlayerProfilePage';

export default function TargetRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ViewerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="live" element={<LiveMatchPage />} />
        <Route path="standings" element={<StandingsPage />} />
        <Route path="scorers" element={<TopScorersPage />} />
        <Route path="bracket" element={<BracketPage />} />
        <Route path="player/:id" element={<PlayerProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
