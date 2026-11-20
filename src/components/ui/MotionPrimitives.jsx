import { MOTION_EASE } from '../../utils/motion';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shared Framer Motion primitives adhering to MOTION-SPEC.md:
 * - GPU-accelerated properties ONLY (transform + opacity)
 * - Context-aware durations (150ms micro, 280ms cards, 420ms dramatic event overlays)
 * - Automatic prefers-reduced-motion compliance via <MotionConfig reducedMotion="user">
 */

export function StaggerList({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: 0.055,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.3, ease: MOTION_EASE.out },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealBlock({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: MOTION_EASE.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScoreFlipNumber — Punches smoothly on live score changes without layout shift.
 */
export function ScoreFlipNumber({ value, className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden num-tabular ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: -24, opacity: 0, scale: 1.25 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.8 }}
          transition={MOTION_EASE.punch}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
