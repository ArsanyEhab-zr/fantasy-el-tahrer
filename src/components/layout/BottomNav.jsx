import { NavLink } from 'react-router-dom';
import MaskingTape from '../primitives/MaskingTape';

const navItems = [
  { to: '/', icon: '🏠', label: 'الرئيسية' },
  { to: '/live', icon: '⚡', label: 'مباشر' },
  { to: '/standings', icon: '📊', label: 'الترتيب' },
  { to: '/scorers', icon: '⚽', label: 'الهدافون' },
  { to: '/bracket', icon: '🏆', label: 'البطولة' },
];

/**
 * BottomNav — Tab navigation bar pinned to the bottom.
 * Styled as a strip of cardboard with tape accents.
 */
export default function BottomNav() {
  return (
    <nav className="w-full shrink-0 z-50 bg-scrap-brown border-t-2 border-scrap-ink shadow-[0_-4px_0_rgba(0,0,0,1)] relative">
      {/* Tape holding the nav to the page */}
      <MaskingTape color="cyan" position="center" width="60px" rotation={0} />

      <div
        className="px-2 pt-3 pb-4 flex items-center justify-around bg-cardboard"
        style={{
          clipPath: `polygon(
            0% 6%, 3% 0%, 8% 4%, 15% 1%, 25% 3%, 35% 0%, 45% 2%, 55% 0%, 
            65% 3%, 75% 1%, 85% 4%, 92% 0%, 97% 3%, 100% 5%,
            100% 100%, 0% 100%
          )`,
        }}
      >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 transition-transform duration-150
                ${isActive
                  ? 'scale-110 -translate-y-1'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-[9px] font-marker font-bold text-white
                      ${isActive ? 'opacity-100' : 'opacity-70'}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-scrap-cyan rounded-full mt-0.5 animate-pulse-live" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
    </nav>
  );
}
