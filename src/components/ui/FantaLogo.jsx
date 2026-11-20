export default function FantaLogo({ size = 'md', subtitle, className = '' }) {
  const imageSize = { sm: 'size-11', md: 'size-14', lg: 'size-20' }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/league-logo.webp" alt="" width="80" height="80" className={`${imageSize} shrink-0 object-contain`} />
      <div className="flex flex-col items-start">
        <span className="font-display text-base font-bold leading-tight">فانتزي التحرير</span>
        <span dir="ltr" lang="en" className="font-geist text-xs font-semibold text-fanta-orange">Fantasy El Tahrrer</span>
        {subtitle && <span className="mt-1 text-xs text-arena-muted">{subtitle}</span>}
      </div>
    </div>
  );
}
