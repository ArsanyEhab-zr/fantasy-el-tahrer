import { BrowserRouter, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { TournamentProvider } from './hooks/TournamentProvider';
import TargetRoutes from '@app-routes';

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TournamentProvider>
        <BrowserRouter>
          <ScrollToTop />
          <TargetRoutes />
        </BrowserRouter>
      </TournamentProvider>
    </MotionConfig>
  );
}
