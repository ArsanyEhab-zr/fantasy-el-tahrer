import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Users,
  Layers,
  CalendarClock,
  GitBranch,
  Scale,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Flag,
} from 'lucide-react';
import { clearPinSession } from '../utils/pinSession';
import PinGuard from '../components/ui/PinGuard';
import FantaLogo from '../components/ui/FantaLogo';

const ADMIN_NAV = [
  { to: '/admin', label: 'لوحة العمليات', icon: LayoutDashboard, end: true },
  { to: '/admin/teams', label: 'الفرق', icon: Shield },
  { to: '/admin/players', label: 'قوائم اللاعبين', icon: Users },
  { to: '/admin/groups', label: 'المجموعات', icon: Layers },
  { to: '/admin/matches', label: 'جدول المباريات', icon: CalendarClock },
  { to: '/admin/bracket', label: 'دور الإقصائيات', icon: GitBranch },
  { to: '/admin/discipline', label: 'الانضباط والخصومات', icon: Scale },
];

/**
 * AdminLayout — League Operations Portal (/admin/*)
 * - Protected by Admin PinGuard
 * - Editorial Daylight theme (#F5F2EB canvas + #142D48 crisp cards + Fanta Orange primary)
 * - Completely isolated from Viewer navigation
 */
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleLock = () => {
    clearPinSession('admin');
    navigate('/');
  };

  const renderNavLinks = (onSelect) => (
    <nav aria-label="قائمة الإدارة" className="flex flex-col gap-1.5">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onSelect}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 min-h-[46px] rounded-xl font-display font-bold text-sm transition-colors ${
                isActive
                  ? 'bg-fanta-orange text-arena-bg shadow-[0_6px_16px_-6px_rgba(232,200,127,0.6)]'
                  : 'text-ops-ink/80 hover:bg-ops-subtle hover:text-ops-ink'
              }`
            }
          >
            <Icon size={19} strokeWidth={2.3} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <PinGuard role="admin">
      <div dir="rtl" className="min-h-dvh w-full bg-ops-canvas text-ops-ink flex">
        {/* Desktop Sidebar (lg+) */}
        <aside className="hidden lg:flex lg:flex-col w-68 shrink-0 bg-ops-surface border-l-2 border-ops-border sticky top-0 h-dvh p-5 justify-between">
          <div>
            <div className="pb-5 mb-5 border-b border-ops-border">
              <FantaLogo variant="light" size="sm" subtitle="بوابة إدارة الدوري" />
            </div>
            {renderNavLinks()}
          </div>

          <div className="pt-4 border-t border-ops-border space-y-2">
            <Link
              to="/referee"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-between text-xs font-bold text-ops-ink transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <Flag size={15} className="text-fanta-orange" aria-hidden="true" />
                <span>تطبيق الحكم</span>
              </span>
              <ExternalLink size={14} className="text-ops-muted" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-ops-bg hover:bg-ops-subtle border border-ops-border flex items-center justify-between text-xs font-bold text-ops-ink transition-colors"
            >
              <span>معاينة تطبيق الجمهور</span>
              <ExternalLink size={14} className="text-ops-muted" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLock}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2 text-xs font-bold text-red-700 transition-colors cursor-pointer"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>قفل لوحة الإدارة</span>
            </button>
          </div>
        </aside>

        {/* Main Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile / Tablet Top Bar */}
          <header className="lg:hidden sticky top-0 z-40 bg-ops-surface border-b-2 border-ops-border pt-safe">
            <div className="px-4 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="فتح قائمة الإدارة"
                  className="w-11 h-11 rounded-xl bg-ops-bg border border-ops-border flex items-center justify-center text-ops-ink cursor-pointer"
                >
                  <Menu size={22} strokeWidth={2.3} />
                </button>
                <FantaLogo variant="light" size="sm" subtitle="الإدارة" />
              </div>

              <button
                type="button"
                onClick={handleLock}
                aria-label="قفل الإدارة"
                className="min-h-[44px] px-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={15} aria-hidden="true" />
                <span>قفل</span>
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          {drawerOpen && (
            <div className="lg:hidden fixed inset-0 z-[100] flex" role="dialog" aria-modal="true" aria-label="قائمة الإدارة">
              <div
                className="fixed inset-0 bg-black/60"
                onClick={() => setDrawerOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] bg-ops-surface h-full p-5 flex flex-col justify-between shadow-2xl border-l-2 border-ops-border">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-ops-border">
                    <FantaLogo variant="light" size="sm" subtitle="بوابة الإدارة" />
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="إغلاق القائمة"
                      className="w-11 h-11 rounded-xl bg-ops-bg flex items-center justify-center text-ops-ink cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {renderNavLinks(() => setDrawerOpen(false))}
                </div>

                <div className="pt-4 border-t border-ops-border space-y-2">
                  <Link
                    to="/referee"
                    onClick={() => setDrawerOpen(false)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-ops-bg border border-ops-border flex items-center justify-between text-xs font-bold text-ops-ink"
                  >
                    <span>تطبيق الحكم</span>
                    <Flag size={14} className="text-fanta-orange" />
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setDrawerOpen(false)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl bg-ops-bg border border-ops-border flex items-center justify-between text-xs font-bold text-ops-ink"
                  >
                    <span>تطبيق الجمهور</span>
                    <ExternalLink size={14} className="text-ops-muted" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Content */}
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
            <Outlet />
          </main>
        </div>
      </div>
    </PinGuard>
  );
}
