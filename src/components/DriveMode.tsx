"use client";

import { useEffect, useRef, useState } from "react";
import { CAR } from "@/lib/data";
import { M4, createCar, sideslip, step, type CarState } from "@/lib/carPhysics";
import { drivetrain } from "@/lib/drivetrain";
import { fitCanvas, loadFrames, nearest } from "@/lib/frames";
import { setScrollLocked } from "@/lib/scroll";
import { createSmoke } from "@/lib/smoke";

const T = CAR.turn;
const STEP = (Math.PI * 2) / T.frames;
// Turntable calibration (screen heading θ = atan2(dy, dx), y down): frame 7 faces the viewer
// (θ = 90°), 25 faces right (0°), 43 faces away (-90°), 61 faces left (180°).
const frameFor = (theta: number) => {
  const i = Math.round(7 + (Math.PI / 2 - theta) / STEP);
  return ((i % T.frames) + T.frames) % T.frames;
};
const TOP_SPEED = 30; // m/s (108 km/h) governor: the "track" is only a screen wide
const REVERSE_MAX = 6; // m/s
const DRIVE_KEYS: Record<string, "up" | "down" | "left" | "right" | "hb"> = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "hb",
};

type Seg = { x1: number; y1: number; x2: number; y2: number; a: number };

/**
 * Drive mode: the visitor drives the M4 (real vehicle dynamics, src/lib/carPhysics.ts) around the
 * whole page. Arrow keys / WASD, Space = handbrake, Esc = exit; on-screen pedals on touch screens.
 * The page scrolls to follow the car; skid marks stay painted on the page; tyre smoke and the engine
 * sound come from the simulation. Loaded only when drive mode is switched on.
 */
export default function DriveMode({ onExit }: { onExit: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const skidRef = useRef<HTMLCanvasElement>(null);
  const smokeRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ up: false, down: false, left: false, right: false, hb: false });
  const [touch, setTouch] = useState(false);
  const [hint, setHint] = useState(true);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const t = window.setTimeout(() => setHint(false), 5000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const box = boxRef.current!, cv = cvRef.current!, skid = skidRef.current!;
    const ctx = cv.getContext("2d")!;
    const sk = skid.getContext("2d")!;
    const smoke = createSmoke(smokeRef.current!);
    html.dataset.driving = "1";
    drivetrain.driving = true;
    setScrollLocked(true);

    let vw = 0, vh = 0, bw = 0, bh = 0, ppm = 40, docH = 0, frame = -1, raf = 0, last = 0, lastTr = "", emitAcc = 0;
    let fg = "241, 237, 231", fgTick = 0, scroll = window.scrollY;
    const segs: Seg[] = [];
    let prevRear: { l: [number, number]; r: [number, number] } | null = null;
    let car: CarState | null = null;

    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      bw = box.offsetWidth;
      bh = box.offsetHeight;
      ppm = (bw * 0.67) / M4.length; // the car's length on screen ↔ its real 4.79 m
      docH = document.documentElement.scrollHeight;
      skid.width = vw;
      skid.height = vh;
    };
    measure();
    const { frames, cancel } = loadFrames(T.dir, T.frames, () => (frame = -1));
    const unfit = fitCanvas(cv, () => (frame = -1));

    // Spawn mid-screen, facing right, parked.
    car = createCar(vw / 2 / ppm, -(scroll + vh * 0.6) / ppm, 0, 0);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === "Escape" && down) {
        exitRef.current();
        return;
      }
      const k = DRIVE_KEYS[e.code];
      if (!k || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      keys.current[k] = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    const blur = () => Object.keys(keys.current).forEach((k) => (keys.current[k as keyof typeof keys.current] = false));
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", measure);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(1 / 30, (now - (last || now)) / 1000);
      last = now;
      const c = car!, k = keys.current;

      // Driver inputs → controls.
      const v = c.vx;
      let throttle = 0, brake = 0;
      if (k.up) {
        if (v < -0.5) brake = 1;
        else throttle = v > TOP_SPEED ? 0 : 1;
      }
      if (k.down) {
        if (v > 0.5) brake = 1;
        else throttle = v < -REVERSE_MAX ? 0 : -0.35;
      }
      const steerMax = M4.maxSteer / (1 + Math.abs(v) / 10);
      const input = (k.left ? 1 : 0) - (k.right ? 1 : 0);
      // Steering with a light counter-steer assist (keeps keyboard drifts catchable).
      const steer = input * steerMax + (input === 0 ? 0.7 : 0.35) * sideslip(c) * (v >= 0 ? 1 : 0);
      step(c, { steer, throttle, brake, handbrake: k.hb ? 1 : 0 }, dt);

      // Walls: the screen edges and the top / bottom of the page. Bounce, lose most of the speed.
      let px = c.x * ppm, py = -c.y * ppm;
      const minX = bw * 0.28, maxX = vw - bw * 0.28, minY = bh * 0.5, maxY = docH - bh * 0.5;
      if (px < minX || px > maxX || py < minY || py > maxY) {
        const cs = Math.cos(c.psi), sn = Math.sin(c.psi);
        let wx = c.vx * cs - c.vy * sn, wy = c.vx * sn + c.vy * cs;
        if (px < minX || px > maxX) wx = -wx * 0.25;
        if (py < minY || py > maxY) wy = -wy * 0.25;
        px = Math.max(minX, Math.min(maxX, px));
        py = Math.max(minY, Math.min(maxY, py));
        c.x = px / ppm;
        c.y = -py / ppm;
        c.vx = wx * cs + wy * sn;
        c.vy = -wx * sn + wy * cs;
        c.r *= 0.5;
      }

      // Camera: keep the car in the middle band of the screen by scrolling the page.
      const sy = py - scroll;
      let target = scroll;
      if (sy > vh * 0.66) target = py - vh * 0.66;
      else if (sy < vh * 0.34) target = py - vh * 0.34;
      target = Math.max(0, Math.min(docH - vh, target));
      const prev = scroll;
      scroll += (target - scroll) * Math.min(1, dt * 7);
      if (Math.abs(scroll - window.scrollY) >= 0.5) window.scrollTo(0, scroll);
      smoke.shift(0, -(scroll - prev));

      // Car sprite.
      const tr = `translate3d(${(px - bw / 2).toFixed(1)}px,${(py - scroll - bh * 0.55).toFixed(1)}px,0)`;
      if (tr !== lastTr) box.style.transform = lastTr = tr;
      const f = frameFor(-c.psi);
      if (f !== frame) {
        const img = nearest(frames, f, T.frames);
        if (img) {
          frame = f;
          ctx.imageSmoothingQuality = "high";
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
        }
      }

      // Rear contact patches (page px), squashed in depth to match the sprite's view angle.
      const th = -c.psi;
      const hx = Math.cos(th), hy = Math.sin(th) * 0.45;
      const rear = M4.b * ppm, half = (M4.track / 2) * ppm;
      const rx = px - hx * rear, ry = py + bh * 0.12 - hy * rear;
      const ox = -Math.sin(th) * half, oy = Math.cos(th) * half * 0.45;
      const l: [number, number] = [rx + ox, ry + oy], r: [number, number] = [rx - ox, ry - oy];
      const slide = Math.max(0, (Math.abs(c.slipR) - 0.12) / 0.3) * Math.min(1, Math.abs(c.vx) / 4);
      const intensity = Math.min(1, slide + c.spin + (k.hb ? Math.min(1, Math.abs(c.vx) / 3) : 0));

      // Skid marks (stay on the page) + tyre smoke.
      if (intensity > 0.15 && prevRear) {
        const a = Math.min(0.55, intensity * 0.55);
        segs.push({ x1: prevRear.l[0], y1: prevRear.l[1], x2: l[0], y2: l[1], a }, { x1: prevRear.r[0], y1: prevRear.r[1], x2: r[0], y2: r[1], a });
        if (segs.length > 8000) segs.splice(0, segs.length - 8000);
        emitAcc += intensity * 110 * dt;
        const wvx = Math.cos(th) * c.vx * ppm, wvy = Math.sin(th) * c.vx * ppm;
        while (emitAcc >= 1) {
          emitAcc -= 1;
          const w = Math.random() < 0.5 ? l : r;
          smoke.emit(w[0], w[1] - scroll, -wvx * 0.08, -wvy * 0.08, bw / 330);
        }
      }
      prevRear = { l, r };
      if (++fgTick % 30 === 1) fg = getComputedStyle(html).getPropertyValue("--fg-rgb").trim() || fg;
      sk.clearRect(0, 0, vw, vh);
      sk.lineCap = "butt"; // round caps would stack up where segments meet
      sk.lineWidth = Math.max(3, ppm * 0.26); // 275 mm tyre
      for (const s of segs) {
        if (Math.max(s.y1, s.y2) < scroll - 20 || Math.min(s.y1, s.y2) > scroll + vh + 20) continue;
        sk.strokeStyle = `rgba(${fg},${(s.a * 0.16).toFixed(3)})`;
        sk.beginPath();
        sk.moveTo(s.x1, s.y1 - scroll);
        sk.lineTo(s.x2, s.y2 - scroll);
        sk.stroke();
      }

      // Feed the shared drivetrain (engine sound + HUD).
      const inp = drivetrain.input;
      inp.speed = c.vx;
      inp.throttle = Math.abs(throttle);
      inp.spin = Math.max(c.spin, k.hb ? 0 : slide * 0.6);
      inp.reverse = c.vx < -0.3 || throttle < 0;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", measure);
      cancel();
      unfit();
      smoke.destroy();
      drivetrain.driving = false;
      Object.assign(drivetrain.input, { speed: 0, throttle: 0, spin: 0, reverse: false });
      delete html.dataset.driving;
      setScrollLocked(false);
    };
  }, []);

  // Touch pedals: hold to press.
  const pad = (k: keyof typeof keys.current, label: string, glyph: string) => (
    <button
      type="button"
      className={`dm-pad dm-${k}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        keys.current[k] = true;
      }}
      onPointerUp={() => (keys.current[k] = false)}
      onPointerCancel={() => (keys.current[k] = false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {glyph}
    </button>
  );

  return (
    <div className="dm" role="region" aria-label="Drive mode">
      <style href="drive" precedence="default">{`
        .dm-skid,.dm-smoke{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none}
        .dm-skid{z-index:43}.dm-smoke{z-index:44}
        .dm-car{position:fixed;left:0;top:0;z-index:45;pointer-events:none;width:clamp(180px,22vw,330px);aspect-ratio:${T.width}/${T.height};will-change:transform;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}
        .dm-car canvas{width:100%;height:100%;display:block}
        @media (max-width:720px){.dm-car{width:40vw}}
        html[data-driving] .drive-car,html[data-driving] .tl-car{visibility:hidden}
        .dm-hint{position:fixed;left:50%;top:84px;translate:-50% 0;z-index:72;padding:10px 16px;border-radius:999px;background:rgba(var(--card-rgb),.85);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:var(--shadow-hair);font:500 12px/1.4 var(--font-mono);color:var(--ink-2);white-space:nowrap;transition:opacity .6s var(--ease)}
        .dm-hint kbd{font:inherit;color:var(--ink);padding:1px 6px;border-radius:5px;box-shadow:inset 0 0 0 1px var(--line);margin:0 2px}
        .dm-hint.is-gone{opacity:0}
        .dm-pads{position:fixed;inset:auto 0 calc(env(safe-area-inset-bottom) + 96px) 0;z-index:72;display:flex;justify-content:space-between;padding:0 16px;pointer-events:none}
        .dm-pads > div{display:flex;gap:10px;pointer-events:auto}
        .dm-pad{width:64px;height:64px;border-radius:50%;background:rgba(var(--card-rgb),.8);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:var(--shadow-hair);color:var(--ink);font-size:22px;touch-action:none;user-select:none;-webkit-user-select:none}
        .dm-pad:active{background:var(--ink);color:var(--on-ink)}
        .dm-hb{width:auto;padding:0 16px;border-radius:999px;font:600 11px var(--font-mono);letter-spacing:.08em}
      `}</style>
      <canvas ref={skidRef} className="dm-skid" aria-hidden="true" />
      <canvas ref={smokeRef} className="dm-smoke" aria-hidden="true" />
      <div ref={boxRef} className="dm-car" aria-hidden="true">
        <canvas ref={cvRef} />
      </div>
      <p className={`dm-hint${hint ? "" : " is-gone"}`} aria-live="polite">
        {touch ? (
          "Hold the pedals to drive · HB = handbrake"
        ) : (
          <>
            <kbd>↑↓←→</kbd>/<kbd>WASD</kbd> drive · <kbd>Space</kbd> handbrake · <kbd>Esc</kbd> exit
          </>
        )}
      </p>
      {touch && (
        <div className="dm-pads">
          <div>
            {pad("left", "Steer left", "◀")}
            {pad("right", "Steer right", "▶")}
          </div>
          <div>
            {pad("hb", "Handbrake", "HB")}
            {pad("down", "Brake / reverse", "▼")}
            {pad("up", "Accelerate", "▲")}
          </div>
        </div>
      )}
    </div>
  );
}
