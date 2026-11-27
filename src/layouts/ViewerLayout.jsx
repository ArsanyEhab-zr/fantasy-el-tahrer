import { usePushNotifications } from '../hooks/usePushNotifications';
import InstallAppButton from '../components/ui/InstallAppButton';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, Radio, X } from 'lucide-react';
import { useTournament } from '../hooks/TournamentContext';
import FantaLogo from '../components/ui/FantaLogo';

export default function ViewerLayout() {
  const push = usePushNotifications();
  const { pathname } = useLocation();
  const { liveMatch, settings, broadcast } = useTournament();
  const [menuPath, setMenuPath] = useState(null);
  const open = menuPath === pathname;
  const setOpen = value => setMenuPath(value ? pathname : null);
  const toggle = useRef(null);
  const home = pathname === '/';
  const broadcastLive = Boolean(broadcast?.isActive);
  const links = [
    ['/', 'الرئيسية'],
    ['/watch-live', 'Watch Live'],
    ['/live', 'مباشر'],
    ['/standings', 'الترتيب'],
    ['/scorers', 'الهدافون'],
    ...(settings?.enableKnockout ? [['/bracket', 'الإقصائيات']] : []),
  ];


  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 48rem)');
    const resize = () => { if (desktop.matches) setMenuPath(null); };
    const escape = event => {
      if (event.key === 'Escape') { setMenuPath(null); toggle.current?.focus(); }
    };
    desktop.addEventListener('change', resize);
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener('change', resize);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const menuLinks = links.map(([to, label]) => (
    <NavLink key={to} end to={to} onClick={() => setOpen(false)}
      className={({isActive}) => `inline-flex items-center gap-1.5 ${isActive ? 'text-fanta-orange' : 'text-white/80 hover:text-white'}`}>
      {to === '/watch-live' && broadcastLive && (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-fanta-crimson opacity-80" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-fanta-crimson" />
        </span>
      )}
      <span dir={to === '/watch-live' ? 'ltr' : undefined}>{label}</span>
    </NavLink>
  ));
  const action = <Link to={liveMatch ? '/live' : '/#match-centre'} onClick={() => {
    setOpen(false);
    if (!liveMatch) requestAnimationFrame(() => document.getElementById('match-centre')?.scrollIntoView());
  }} className="hero-action"><Radio size={16} />{liveMatch ? 'مباشر الآن' : 'مركز المباريات'}</Link>;

  const appControls = <>
    <button type="button" onClick={push.enable} disabled={push.busy || push.active}
      aria-label={push.active ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'} title={push.active ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-white/30 px-2 text-xs font-bold ${push.active ? 'text-emerald-300' : 'bg-black/50 text-white'}`}>
      <Bell size={17} /><span className={push.active ? 'sr-only xl:not-sr-only' : ''}>{push.active ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}</span>
    </button>
    <InstallAppButton />
  </>;

  return (
    <div dir="rtl" className="min-h-dvh bg-arena-stadium font-geist text-arena-ink">
      <header className={home ? 'absolute inset-x-0 top-0 z-30' : 'sticky top-0 z-30 border-b border-arena-border bg-arena-bg/95'}>
        <div className="relative z-30 mx-auto flex max-w-screen-2xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-12 lg:px-16">
          <Link to="/" onClick={() => setOpen(false)} aria-label="فانتزي التحرير — الرئيسية"><FantaLogo size="sm" /></Link>
          <nav aria-label="التنقل الرئيسي" className="hidden gap-6 text-sm font-semibold md:flex">{menuLinks}</nav>
          <div className="hidden items-center gap-2 md:flex">{appControls}</div>
          <div className="hidden lg:block">{action}</div>
          <button ref={toggle} className="relative grid size-11 place-items-center rounded-lg text-white transition-transform active:scale-90 md:hidden"
            aria-expanded={open} aria-controls="viewer-menu" aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} onClick={() => setOpen(!open)}>
            <Menu className={`absolute transition-all duration-300 ${open ? 'rotate-90 scale-50 opacity-0' : ''}`} />
            <X className={`absolute transition-all duration-300 ${open ? '' : '-rotate-90 scale-50 opacity-0'}`} />
          </button>
        </div>
        <nav id="viewer-menu" aria-label="قائمة الجوال" inert={!open} className={`fixed inset-x-0 top-0 z-20 overflow-hidden bg-arena-bg/98 backdrop-blur-xl transition-[height,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${open ? 'h-dvh opacity-100' : 'pointer-events-none h-0 opacity-0'}`}>
          <div className={`flex h-full flex-col items-start gap-5 overflow-auto px-8 py-20 text-3xl font-medium transition-all delay-100 duration-300 ${open ? 'opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="my-auto flex flex-col items-start gap-5">{menuLinks}<div className="mt-4">{action}</div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">{appControls}</div></div>
          </div>
        </nav>
      </header>
      {push.notice && <div role="status" className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-2xl border border-white/20 bg-slate-900 p-4 text-sm text-white shadow-lg">{push.notice}</div>}
      <main inert={open} className={home ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-8'}><Outlet /></main>
    </div>
  );
}
