"use client";

export type Frame = ImageBitmap | HTMLImageElement;
export type Frames = (Frame | undefined)[];

export const frameUrl = (dir: string, i: number) => `${dir}${String(i).padStart(2, "0")}.webp`;

/** Fetch + decode once into an ImageBitmap (GPU-friendly, no decode on draw); <img> fallback. */
export async function loadBitmap(url: string): Promise<Frame> {
  if ("createImageBitmap" in window) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url);
    return createImageBitmap(await res.blob());
  }
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

/**
 * Load a frame sequence after the page's load event (never competes with LCP), 4 at a time,
 * coarse-to-fine so early scrubbing already has nearby frames. Returns the live array + cancel.
 */
export function loadFrames(dir: string, n: number, onFrame?: () => void) {
  const frames: Frames = [];
  let dead = false;
  const order = [12, 6, 3, 1].flatMap((step, k, all) =>
    Array.from({ length: n }, (_, i) => i).filter((i) => i % step === 0 && (k === 0 || i % all[k - 1] !== 0)),
  );
  const run = async () => {
    let next = 0;
    const worker = async () => {
      while (!dead && next < order.length) {
        const i = order[next++];
        try {
          frames[i] = await loadBitmap(frameUrl(dir, i));
          onFrame?.();
        } catch {
          /* missing frame: nearest() falls back */
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  };
  const start = () => ("requestIdleCallback" in window ? requestIdleCallback(() => run()) : setTimeout(run, 200));
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  return {
    frames,
    cancel: () => {
      dead = true;
      window.removeEventListener("load", start);
    },
  };
}

/** Closest loaded frame to i (wrapping). */
export function nearest(frames: Frames, i: number, n: number) {
  for (let k = 0; k < n; k++) {
    const f = frames[(i + k) % n] ?? frames[(i - k + n) % n];
    if (f) return f;
  }
}

/** Keep a canvas backing store at CSS size × DPR (max 2) × scale. Calls onResize after each change. */
export function fitCanvas(cv: HTMLCanvasElement, onResize: () => void, scale = 1) {
  const ro = new ResizeObserver(() => {
    const r = cv.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2) * scale;
    cv.width = Math.max(1, Math.round(r.width * d));
    cv.height = Math.max(1, Math.round(r.height * d));
    onResize();
  });
  ro.observe(cv);
  return () => ro.disconnect();
}
