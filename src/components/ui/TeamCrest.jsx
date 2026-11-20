import { useState } from 'react';
import { Shield } from 'lucide-react';
import { getTeamAccent } from '../../utils/formatters';

function CrestImage({ url, children }) {
  const [failed, setFailed] = useState(false);
  return failed ? children : (
    <img src={url} alt="" onError={() => setFailed(true)} className="w-full h-full object-contain" />
  );
}

export default function TeamCrest({ team, size = 'md', variant = 'dark', className = '' }) {
  const accent = getTeamAccent(team?.id || team?.nameAr || '');
  const sizes = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 text-sm rounded-xl',
    md: 'w-12 h-12 text-base rounded-2xl',
    lg: 'w-16 h-16 text-xl rounded-2xl',
  };
  const palette = variant === 'light'
    ? 'border-ops-border bg-ops-bg text-ops-ink'
    : [accent.bg, accent.border, accent.text].join(' ');
  const initials = (team?.shortName || team?.short || team?.nameAr || '').slice(0, 2);
  const fallback = team?.emoji || initials || <Shield size={18} />;
  const style = team?.color ? {
    borderColor: team.color,
    backgroundColor: `color-mix(in srgb, ${team.color} 24%, ${variant === 'light' ? '#fff' : '#10141c'})`,
  } : undefined;
  return (
    <div aria-hidden="true" style={style}
      className={`${sizes[size] || sizes.md} ${palette} shrink-0 inline-flex items-center justify-center border-2 font-display font-extrabold select-none ${className}`}>
      {team?.logoUrl ? <CrestImage key={team.logoUrl} url={team.logoUrl}>{fallback}</CrestImage> : fallback}
    </div>
  );
}
