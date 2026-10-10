"use client";

/**
 * Tyre smoke: soft grey sprites that billow, rise and fade. One instance per canvas.
 * Coordinates are CSS px relative to the canvas. The loop only runs while particles exist.
 */
type P = { x: number; y: number; vx: number; vy: number; age: number; life: number; r0: number; r1: number };

const MAX = 600;
let sprite: HTMLCanvasElement | null = null;
function getSprite() {
  if (sprite) return sprite;
  sprite = document.createElement("canvas");
  sprite.width = sprite.height = 128;
  const g = sprite.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  // Gaussian falloff (many stops) so overlapping puffs blend without visible rings.
  for (let i = 0; i <= 16; i++) {
    const r = i / 16;
    grad.addColorStop(r, `rgba(150,146,142,${Math.exp(-4 * r * r) * (1 - r)})`);
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return sprite;
}

export function createSmoke(cv: HTMLCanvasElement) {
  const ctx = cv.getContext("2d")!;
  const ps: P[] = [];
  let raf = 0, last = 0, w = 0, h = 0;

  const resize = () => {
    const r = cv.getBoundingClientRect();
    w = r.width;
    h = r.height;
    cv.width = Math.round(w);
    cv.height = Math.round(h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(cv);
  resize();

  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    ctx.clearRect(0, 0, w, h);
    const img = getSprite();
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        ps.splice(i, 1);
        continue;
      }
      const drag = Math.exp(-dt * 1.8);
      p.vx *= drag;
      p.vy = p.vy * drag - 14 * dt; // rises
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const r = p.r0 + (p.r1 - p.r0) * Math.sqrt(k);
      ctx.globalAlpha = 0.46 * Math.min(1, k * 5) * (1 - k) ** 1.2;
      ctx.drawImage(img, p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    raf = ps.length ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };

  return {
    /** Puff at (x, y) drifting with (vx, vy) px/s; size scales with `scale`. */
    emit(x: number, y: number, vx: number, vy: number, scale = 1) {
      if (ps.length >= MAX) ps.shift();
      ps.push({
        x: x + (Math.random() - 0.5) * 10 * scale,
        y: y + (Math.random() - 0.5) * 6 * scale,
        vx: vx + (Math.random() - 0.5) * 60,
        vy: vy - Math.random() * 30,
        age: 0,
        life: 1.6 + Math.random() * 1.2,
        r0: 18 * scale,
        r1: (110 + Math.random() * 90) * scale,
      });
      if (!raf) raf = requestAnimationFrame(frame);
    },
    /** Move every particle (e.g. by the scroll delta, so smoke stays on the page). */
    shift(dx: number, dy: number) {
      if (!dx && !dy) return;
      for (const p of ps) {
        p.x += dx;
        p.y += dy;
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
