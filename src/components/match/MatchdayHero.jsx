import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { matchViewerUrl } from '../../utils/formatters';
import ShotFrames from './ShotFrames';

export default function MatchdayHero({ liveMatch }) {
  const track = useRef(null);
  const [portrait, setPortrait] = useState(() => matchMedia('(orientation: portrait)').matches);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [failed, setFailed] = useState(false);
  const asset = '/brand/matchday/' + (portrait ? 'portrait' : 'wide');
  const animated = !reducedMotion && !failed;

  useEffect(() => {
    const orientation = matchMedia('(orientation: portrait)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const changeOrientation = () => {
      setPortrait(orientation.matches);
      setFailed(false);
    };
    const changeMotion = () => setReducedMotion(motion.matches);
    orientation.addEventListener('change', changeOrientation);
    motion.addEventListener('change', changeMotion);
    return () => {
      orientation.removeEventListener('change', changeOrientation);
      motion.removeEventListener('change', changeMotion);
    };
  }, []);

  return (
    <section ref={track} aria-labelledby="matchday-title" className={animated ? 'shot-track shot-track-animated' : 'shot-track'}>
      <div className="matchday relative isolate w-full overflow-hidden font-geist text-white">
        <div className="matchday-media" aria-hidden="true" style={{ backgroundImage: `url(${asset}.webp)` }}>
          {animated && <ShotFrames track={track} onFailure={setFailed} />}
        </div>
        <div className="matchday-content">
          <div className="matchday-copy">
            <p className="hero-enter mb-4 flex items-center gap-3 text-sm font-bold sm:mb-6">
              <span className="h-px w-9 bg-fanta-orange" /> دوري فانتزي التحرير <span lang="en" className="tracking-[0.16em] text-fanta-orange">MATCHDAY</span>
            </p>
            <h1 id="matchday-title" className="hero-enter text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.22]" style={{ animationDelay: '0.2s' }}>
              كل مباراة.<br />كل هدف.<br /><span className="text-fanta-orange">لحظة بلحظة.</span>
            </h1>
          </div>
          <div className="matchday-copy">
            <p className="hero-enter mb-4 max-w-sm text-base leading-relaxed text-white/90">
              من أول صافرة لآخر دقيقة، تابع نتائج الدوري وسباق الهدافين وترتيب فريقك.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {liveMatch ? <Link className="hero-action" to={matchViewerUrl(liveMatch.id)}><Radio size={17} /> تابع المباراة مباشرة</Link>
                : <a className="hero-action" href="#match-centre">استكشف المباريات <ArrowRight size={16} className="rotate-180" /></a>}
              {animated && <span className="inline-flex items-center gap-1.5 text-sm text-white"><ArrowDown size={15} /> مرّر لتتبّع الكرة</span>}
            </div>
          </div>
        </div>
        {animated && <div aria-hidden="true" className="shot-progress" />}
      </div>
    </section>
  );
}
