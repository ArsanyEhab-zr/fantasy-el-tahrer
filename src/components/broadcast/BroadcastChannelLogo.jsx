import { useState } from 'react';
import { FALLBACK_LEAGUE_LOGO, sanitizeChannelLogoUrl } from '../../utils/broadcast';

function ChannelLogoImage({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK_LEAGUE_LOGO : src}
      alt="شعار بث فانتزي التحرير"
      onError={() => setFailed(true)}
      className="h-7 sm:h-10 md:h-12 lg:h-13 w-auto max-w-[120px] sm:max-w-[185px] md:max-w-[220px] object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
    />
  );
}

/**
 * BroadcastChannelLogo — Crisp top-right channel watermark for Watch Live & OBS Overlay.
 */
export default function BroadcastChannelLogo({ logoUrl }) {
  const resolved = sanitizeChannelLogoUrl(logoUrl);
  return (
    <div className="shrink-0 flex items-center justify-end">
      <ChannelLogoImage key={resolved} src={resolved} />
    </div>
  );
}
