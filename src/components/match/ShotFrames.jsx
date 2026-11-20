import { useEffect, useRef } from 'react';

const frameCount = 96;
const columns = 12;

function drawShot(ctx, pitch, ball, width, height, frame) {
  const portrait = height >= width;
  const t = frame / (frameCount - 1);
  const travel = t * t * (3 - 2 * t);
  const arc = Math.sin(Math.PI * travel);
  const scale = Math.max(width / pitch.width, height / pitch.height) * (1 + 0.18 * travel);
  const cropX = (pitch.width * scale - width) * (portrait ? 0.80 : 0.69);
  const cropY = (pitch.height * scale - height) * 0.53;
  ctx.drawImage(pitch, -cropX, -cropY, pitch.width * scale, pitch.height * scale);

  const goalX = pitch.width * scale * 0.79 - cropX;
  const goalY = pitch.height * scale * 0.548 - cropY;
  const x = width * (portrait ? 0.48 : 0.68) * (1 - travel) + goalX * travel;
  const ground = height * (portrait ? 0.72 : 0.88) * (1 - travel) + goalY * travel;
  const radius = (portrait ? width * 0.218 : height * 0.205) * (1 - travel) + height * 0.012 * travel;
  const bottom = ground - height * (portrait ? 0.20 : 0.24) * arc;

  ctx.save();
  ctx.translate(x, ground);
  ctx.scale(radius * 1.2, radius * 0.19);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  shadow.addColorStop(0, `rgba(5,10,12,${0.65 - 0.4 * arc})`);
  shadow.addColorStop(1, 'transparent');
  ctx.fillStyle = shadow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();

  const tile = ball.width / columns;
  ctx.drawImage(ball, (frame % columns) * tile, Math.floor(frame / columns) * tile, tile, tile,
    x - radius, bottom - 2 * radius, 2 * radius, 2 * radius);
}

export default function ShotFrames({ track, onFailure }) {
  const canvas = useRef(null);

  useEffect(() => {
    const surface = canvas.current;
    const section = track.current;
    const ctx = surface.getContext('2d');
    if (!ctx) { onFailure(true); return; }

    const pitch = new Image();
    const ball = new Image();
    let ready = false;
    let disposed = false;
    let request = 0;
    let lastFrame = -1;

    function render() {
      request = 0;
      const width = surface.clientWidth;
      const height = surface.clientHeight;
      if (!width || !height) return;
      const distance = Math.max(1, section.offsetHeight - height);
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance));
      section.style.setProperty('--shot-progress', progress);
      if (!ready) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2, 1600 / Math.max(width, height));
      const w = Math.max(1, Math.round(width * ratio));
      const h = Math.max(1, Math.round(height * ratio));
      const frame = Math.round(progress * (frameCount - 1));
      if (lastFrame === frame && surface.width === w && surface.height === h) return;
      if (surface.width !== w) surface.width = w;
      if (surface.height !== h) surface.height = h;
      drawShot(ctx, pitch, ball, w, h, frame);
      lastFrame = frame;
    }

    function queue() {
      if (!disposed && !request) request = requestAnimationFrame(render);
    }

    pitch.src = '/brand/matchday/pitch.webp';
    ball.src = '/brand/matchday/ball-frames.webp';
    Promise.all([pitch.decode(), ball.decode()]).then(() => {
      ready = true;
      queue();
    }).catch(() => { if (!disposed) onFailure(true); });

    const resize = new ResizeObserver(queue);
    resize.observe(surface);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('pageshow', queue);
    queue();
    return () => {
      disposed = true;
      cancelAnimationFrame(request);
      resize.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('pageshow', queue);
    };
  }, [track, onFailure]);

  return <canvas ref={canvas} className="absolute inset-0 block size-full" />;
}
