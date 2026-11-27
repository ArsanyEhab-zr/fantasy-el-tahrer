import { Navigate, Route, Routes } from 'react-router-dom';
import ViewerLayout from '../layouts/ViewerLayout';
import HomePage from '../pages/viewer/HomePage';
import LiveMatchPage from '../pages/viewer/LiveMatchPage';
import StandingsPage from '../pages/viewer/StandingsPage';
import TopScorersPage from '../pages/viewer/TopScorersPage';
import BracketPage from '../pages/viewer/BracketPage';
import PlayerProfilePage from '../pages/viewer/PlayerProfilePage';
import WatchLivePage from '../pages/viewer/WatchLivePage';
import ObsOverlayPage from '../pages/viewer/ObsOverlayPage';

export default function TargetRoutes() {
  return (
    <Routes>
      {/* Transparent OBS Browser Source Overlays (mounted outside ViewerLayout) */}
      <Route path="/overlay/live" element={<ObsOverlayPage />} />
      <Route path="/overlay/:matchId" element={<ObsOverlayPage />} />

      <Route path="/" element={<ViewerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="watch-live" element={<WatchLivePage />} />
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
