import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageTeams from '../pages/admin/ManageTeams';
import ManagePlayers from '../pages/admin/ManagePlayers';
import ManageGroups from '../pages/admin/ManageGroups';
import ManageMatches from '../pages/admin/ManageMatches';
import ManageBracket from '../pages/admin/ManageBracket';
import ManageDiscipline from '../pages/admin/ManageDiscipline';
import ManageBroadcast from '../pages/admin/ManageBroadcast';

function LegacyAdminRedirect() {
  const { pathname, search, hash } = useLocation();
  const path = pathname.replace(/^\/admin(?:\/+|$)/i, '');
  return <Navigate replace to={{ pathname: '/' + path, search, hash }} />;
}

export default function TargetRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="teams" element={<ManageTeams />} />
        <Route path="players" element={<ManagePlayers />} />
        <Route path="groups" element={<ManageGroups />} />
        <Route path="matches" element={<ManageMatches />} />
        <Route path="bracket" element={<ManageBracket />} />
        <Route path="discipline" element={<ManageDiscipline />} />
        <Route path="broadcast" element={<ManageBroadcast />} />
        <Route path="stats" element={<Navigate replace to="/discipline" />} />
        <Route path="create-match" element={<Navigate replace to="/matches" />} />
      </Route>
      <Route path="/admin/*" element={<LegacyAdminRedirect />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
