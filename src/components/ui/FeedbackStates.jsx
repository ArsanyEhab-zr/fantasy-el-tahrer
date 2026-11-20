export function LoadingSkeleton({ count = 3, theme = 'dark', height = 'h-24' }) {
  const isLight = theme === 'light';
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="جاري التحميل">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`glass-card ${height} w-full rounded-2xl animate-pulse border ${
            isLight
              ? 'bg-ops-subtle/80 border-ops-border'
              : 'bg-arena-surface border-arena-border'
          }`}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action = null,
  theme = 'dark',
}) {
  const isLight = theme === 'light';
  return (
    <div
      className={`glass-card rounded-3xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center gap-3 ${
        isLight
          ? 'bg-ops-surface/70 border-ops-border text-ops-ink'
          : 'bg-arena-surface/70 border-arena-border text-arena-ink'
      }`}
    >
      {Icon && (
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isLight
              ? 'bg-ops-subtle text-fanta-orange'
              : 'bg-arena-elevated text-fanta-orange'
          }`}
          aria-hidden="true"
        >
          <Icon size={28} strokeWidth={2.2} />
        </div>
      )}
      <h3 className="font-display font-extrabold text-xl">{title}</h3>
      {description && (
        <p
          className={`text-sm max-w-xs leading-relaxed ${
            isLight ? 'text-ops-muted' : 'text-arena-muted'
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
