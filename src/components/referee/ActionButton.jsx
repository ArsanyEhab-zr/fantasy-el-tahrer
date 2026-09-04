import TornPaperButton from '../primitives/TornPaperButton';

const actionConfig = {
  goal: { icon: '⚽', label: 'هدف', variant: 'secondary' },
  assist: { icon: '👟', label: 'أسيست', variant: 'secondary' },
  yellow: { icon: '🟨', label: 'إنذار', variant: 'ghost' },
  red: { icon: '🟥', label: 'طرد', variant: 'danger' },
  sub: { icon: '🔄', label: 'تبديل', variant: 'ghost' },
  foul: { icon: '⛔', label: 'مخالفة', variant: 'ghost' },
  corner: { icon: '🚩', label: 'ركنية', variant: 'secondary' },
};

/**
 * ActionButton — Quick action button for the referee dashboard.
 */
export default function ActionButton({ type = 'goal', onClick, className = '' }) {
  const config = actionConfig[type] || actionConfig.goal;

  return (
    <TornPaperButton
      variant={config.variant}
      onClick={onClick}
      fullWidth
      size="lg"
      icon={config.icon}
      className={className}
    >
      {config.label}
    </TornPaperButton>
  );
}
