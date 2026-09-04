import { Link } from 'react-router-dom';
import MaskingTape from '../primitives/MaskingTape';
import { DoodleSVG } from '../../utils/doodleSVGs';

/**
 * ScrapbookHeader — Top header with tournament logo and name,
 * styled with tape accents and a pasted-on look.
 */
export default function ScrapbookHeader({ title, showBack = false, backTo = "/" }) {
  return (
    <header className="relative mb-6">
      {/* Tape decoration across top */}
      <div className="relative">
        <MaskingTape color="cyan" position="top-right" width="70px" rotation={-15} />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 pt-2 text-center md:text-right">
        {showBack && (
          <Link
            to={backTo}
            className="w-10 h-10 flex items-center justify-center bg-white shadow-hard-sm press-effect rounded-sm"
            style={{ clipPath: 'polygon(3% 0%, 100% 2%, 97% 100%, 0% 98%)' }}
          >
            <span className="text-lg">→</span>
          </Link>
        )}

        {/* Logo area */}
        <div className="flex flex-col md:flex-row items-center gap-3 flex-1">
          <div
            className="w-11 h-11 bg-scrap-cyan flex items-center justify-center shadow-hard-sm"
            style={{
              transform: 'rotate(-3deg)',
              borderRadius: '4px',
            }}
          >
            <span className="text-2xl">⚽</span>
          </div>

          <div>
            <h1
              className="text-stamp text-xl text-scrap-ink leading-tight"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {title || 'بطولة الأبطال'}
            </h1>
            <span className="text-typewriter text-[10px] text-scrap-outline tracking-widest">
              TOURNAMENT HUB ٢٠٢٥
            </span>
          </div>
        </div>

        {/* Doodle accent */}
        <DoodleSVG type="star" size={20} className="opacity-30" />
      </div>

      {/* Separator — hand-drawn underline */}
      <svg className="w-full h-3 mt-3 text-scrap-ink/20" viewBox="0 0 400 10" preserveAspectRatio="none">
        <path
          d="M0 5 C 30 3, 60 7, 100 5 C 140 3, 180 8, 220 5 C 260 2, 300 7, 350 5 C 370 4, 390 6, 400 5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </header>
  );
}
