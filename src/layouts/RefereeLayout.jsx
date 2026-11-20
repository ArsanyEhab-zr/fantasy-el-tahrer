import { useState } from 'react';
import InstallAppButton from '../components/ui/InstallAppButton';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Flag } from 'lucide-react';
import { clearPinSession } from '../utils/pinSession';
import PinGuard from '../components/ui/PinGuard';
import FantaLogo from '../components/ui/FantaLogo';

/**
 * RefereeLayout — Fast, Mobile-First Pitch Controller Shell (/referee/*)
 * - Protected by Referee PinGuard
 * - Minimal high-contrast Pitch Carbon design (#080A0E) built for outdoor sunlight & thumb speed
 * - Zero Viewer or Admin navigation clutter
 */
export default function RefereeLayout() {
  const navigate = useNavigate();
  const [lockCount, setLockCount] = useState(0);

  const handleLock = () => {
    clearPinSession('referee');
    setLockCount(count => count + 1);
    navigate('/', { replace: true });
  };

  return (
    <PinGuard key={lockCount} expectedPin={__VERCEL_PIN_CHECK__ ? undefined : import.meta.env.VITE_REFEREE_PIN || '1111'} role="referee">
      <div dir="rtl" className="min-h-dvh w-full bg-arena-stadium text-arena-ink flex flex-col">
        {/* Minimal High-Contrast Top Bar */}
        <header className="sticky top-0 z-40 w-full bg-pitch-surface border-b-2 border-pitch-border pt-safe">
          <div className="max-w-md mx-auto px-4 min-h-15 flex flex-wrap items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2.5">
              <FantaLogo variant="dark" size="sm" />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fanta-volt text-arena-bg font-display font-extrabold text-xs">
                <Flag size={13} strokeWidth={2.7} aria-hidden="true" />
                <span>الحكم</span>
              </span>
            </div>

            <InstallAppButton />
            <button
              type="button"
              onClick={handleLock}
              aria-label="قفل شاشة الحكم"
              className="min-h-[44px] px-3 rounded-xl bg-pitch-elevated hover:bg-arena-border border border-pitch-border text-arena-muted hover:text-arena-ink text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>قفل</span>
            </button>
          </div>
        </header>

        {/* Thumb-First Mobile Pitch Workspace */}
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-safe">
          <Outlet />
        </main>
      </div>
    </PinGuard>
  );
}
