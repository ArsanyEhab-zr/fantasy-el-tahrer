import { Navigate, Route, Routes } from 'react-router-dom';
import RefereeLayout from '../layouts/RefereeLayout';
import RefereePage from '../pages/referee/RefereePage';

export default function TargetRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RefereeLayout />}>
        <Route index element={<RefereePage />} />
      </Route>
      <Route path="/referee/*" element={<Navigate replace to="/" />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
