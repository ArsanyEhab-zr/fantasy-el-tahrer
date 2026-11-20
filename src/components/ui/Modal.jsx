import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MOTION_EASE } from '../../utils/motion';

/**
 * Modal — Accessible dialog supporting ESC, backdrop dismissal, and Light/Dark themes.
 * Uses crisp solid surfaces (no glassmorphism).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle = null,
  theme = 'dark',
  maxWidth = 'max-w-md',
  children,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80"
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24, ease: MOTION_EASE.out }}
            className={`glass-card relative z-10 w-full ${maxWidth} max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border-2 overflow-hidden ${
              isLight
                ? 'bg-ops-surface border-ops-border text-ops-ink shadow-2xl'
                : 'bg-arena-surface border-arena-border text-arena-ink shadow-2xl'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-3 px-5 py-4 border-b shrink-0 ${
                isLight ? 'border-ops-border' : 'border-arena-border'
              }`}
            >
              <div className="min-w-0">
                <h2 className="font-display font-extrabold text-xl leading-snug">
                  {title}
                </h2>
                {subtitle && (
                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      isLight ? 'text-ops-muted' : 'text-arena-muted'
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className={`w-11 h-11 -m-1.5 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isLight
                    ? 'text-ops-muted hover:bg-ops-subtle hover:text-ops-ink'
                    : 'text-arena-muted hover:bg-arena-elevated hover:text-arena-ink'
                }`}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
