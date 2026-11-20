import { Shield } from 'lucide-react';
import { getTeamAccent } from '../../utils/formatters';

/**
 * TeamCrest — Clean geometric team crest badge.
 * Displays team initials or custom badge gracefully with consistent sizing.
 */
export default function TeamCrest({
  team,
  size = 'md',
  variant = 'dark',
  className = '',
}) {
  const accent = getTeamAccent(team?.id || team?.nameAr || '');
  const label = (team?.short || team?.nameAr || '؟').slice(0, 2);

  const sizes = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 text-sm rounded-xl',
    md: 'w-12 h-12 text-base rounded-2xl',
    lg: 'w-16 h-16 text-xl rounded-2xl',
  }[size] || 'w-12 h-12 text-base rounded-2xl';

  if (variant === 'light') {
    return (
      <div
        className={`${sizes} shrink-0 inline-flex items-center justify-center font-display font-extrabold border-2 border-ops-border bg-ops-bg text-ops-ink select-none ${className}`}
        aria-hidden="true"
      >
        {team?.emoji ? (
          <span className="leading-none">{team.emoji}</span>
        ) : team?.nameAr ? (
          <span>{label}</span>
        ) : (
          <Shield size={18} className="text-ops-muted" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${sizes} shrink-0 inline-flex items-center justify-center font-display font-extrabold border-2 select-none ${accent.bg} ${accent.border} ${accent.text} ${className}`}
      aria-hidden="true"
    >
      {team?.emoji ? (
        <span className="leading-none">{team.emoji}</span>
      ) : team?.nameAr ? (
        <span>{label}</span>
      ) : (
        <Shield size={20} className="opacity-70" />
      )}
    </div>
  );
}
