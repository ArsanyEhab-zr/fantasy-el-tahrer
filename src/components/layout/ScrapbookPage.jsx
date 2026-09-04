import InkDoodle from '../primitives/InkDoodle';

/**
 * ScrapbookPage — Full-page wrapper with recycled paper background.
 * Provides the canvas for all pages.
 */
export default function ScrapbookPage({ children, className = '' }) {
  return (
    <div className={`min-h-full w-full relative flex flex-col bg-recycled-paper ${className}`}>
      {/* Scattered background doodles */}
      <InkDoodle type="football" size={60} className="absolute opacity-[0.04] top-20 left-4" />
      <InkDoodle type="star" size={40} className="absolute opacity-[0.04] top-[40%] right-6" />
      <InkDoodle type="trophy" size={50} className="absolute opacity-[0.04] bottom-32 left-8" />
      <InkDoodle type="lightning" size={35} className="absolute opacity-[0.04] top-[60%] left-[70%]" />

      {/* Page content */}
      <div className="relative z-10 w-full mx-auto px-5 pt-4 flex-1">
        {children}
        {/* BULLETPROOF SPACER to push content above the torn edge */}
        <div className="h-32 w-full shrink-0"></div>
      </div>
    </div>
  );
}
