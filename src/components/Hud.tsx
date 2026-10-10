"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { REDLINE, drivetrain, startDrivetrain } from "@/lib/drivetrain";

// Drive mode (physics, sprites, skid marks) is only downloaded when someone presses Drive.
const DriveMode = dynamic(() => import("./DriveMode"), { ssr: false });

const ARC = 100; // normalised tach arc length (pathLength); the arc sweeps 270°
const MAX_RPM = 8000;

/**
 * M4-style instrument cluster: tachometer (with redline), speed, gear, odometer and lap timer, all
 * from the shared drivetrain (scroll speed in cruise, the simulated car in drive mode). Values are
 * written straight to the DOM each frame (no React re-renders). Also hosts the Drive button (D).
 */
export default function Hud() {
  const [driving, setDriving] = useState(false);
  const tachRef = useRef<SVGPathElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const odoRef = useRef<HTMLSpanElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setDriving((d) => !d), []);

  useEffect(() => {
    startDrivetrain();
    let raf = 0, n = 0;
    const last = { speed: "", gear: "", odo: "", lap: "", tach: "", red: false };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const d = drivetrain;
      const frac = Math.min(1, d.rpm / MAX_RPM);
      const tach = (frac * ARC).toFixed(1);
      if (tach !== last.tach) tachRef.current?.setAttribute("stroke-dasharray", `${(last.tach = tach)} ${ARC}`);
      const red = d.rpm > REDLINE - 400;
      if (red !== last.red) rootRef.current?.classList.toggle("is-red", (last.red = red));
      if (++n % 3) return; // digits at ~20 fps: easier to read
      const speed = String(Math.round(d.speed));
      if (speed !== last.speed && speedRef.current) speedRef.current.textContent = last.speed = speed;
      const gear = d.gear === 0 ? "R" : d.speed < 1 && d.throttle < 0.05 ? "N" : String(d.gear);
      if (gear !== last.gear && gearRef.current) gearRef.current.textContent = last.gear = gear;
      const odo = (d.odo / 1000).toFixed(2);
      if (odo !== last.odo && odoRef.current) odoRef.current.textContent = last.odo = odo;
      const m = Math.floor(d.lap / 60), s = d.lap - m * 60;
      const lap = `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
      if (lap !== last.lap && lapRef.current) lapRef.current.textContent = last.lap = lap;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // D starts drive mode (inside drive mode D steers right; Esc exits).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (driving || e.code !== "KeyD" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setDriving(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [driving]);

  return (
    <>
      <div ref={rootRef} className={`hud${driving ? " is-driving" : ""}`} role="group" aria-label="Instrument cluster">
        <style href="hud" precedence="default">{`
          .hud{position:fixed;left:50%;bottom:clamp(14px,3vh,24px);translate:-50% 0;z-index:69;display:flex;align-items:center;gap:14px;padding:8px 8px 8px 12px;border-radius:999px;background:rgba(var(--card-rgb),.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:var(--shadow-hair),0 14px 34px -20px rgba(0,0,0,.6);color:var(--ink);font-family:var(--font-mono);user-select:none}
          .hud-tach{position:relative;width:52px;height:52px;flex:none}
          .hud-tach svg{width:100%;height:100%;display:block;overflow:visible}
          .hud-tach .track{stroke:rgba(var(--fg-rgb),.14)}
          .hud-tach .red{stroke:#d64545}
          .hud-tach .val{stroke:var(--ink);transition:stroke .2s}
          .hud.is-red .hud-tach .val{stroke:#d64545}
          .hud-gear{position:absolute;inset:0;display:grid;place-items:center;font-weight:600;font-size:17px;padding-top:4px}
          .hud-speed{display:flex;align-items:baseline;gap:5px;min-width:76px}
          .hud-speed b{font:700 26px/1 var(--font-sans);letter-spacing:-.04em;font-variant-numeric:tabular-nums;min-width:2.1ch;text-align:right}
          .hud-speed small,.hud-meta small{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
          .hud-meta{display:grid;grid-template-columns:auto auto;gap:2px 8px;align-items:baseline;font-size:12px;font-variant-numeric:tabular-nums;padding-left:12px;border-left:1px solid var(--line)}
          .hud-drive{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:999px;background:var(--ink);color:var(--on-ink);font:600 13px var(--font-sans);letter-spacing:-.01em;transition:transform .4s var(--ease),background-color .3s var(--ease)}
          .hud-drive:hover{transform:translateY(-1px)}
          .hud-drive kbd{font:500 10px var(--font-mono);padding:2px 6px;border-radius:5px;background:rgba(var(--bg-rgb),.18)}
          .hud.is-driving .hud-drive{background:#d64545;color:#fff}
          @media (max-width:720px){
            .hud{left:var(--gutter);translate:none;gap:10px;padding:6px 6px 6px 8px}
            .hud-tach{width:42px;height:42px}
            .hud-meta{display:none}
            .hud-speed{min-width:58px}.hud-speed b{font-size:20px}
            .hud-drive{height:34px;padding:0 12px}.hud-drive kbd{display:none}
            html[data-driving] .hud{bottom:auto;top:76px}
          }
          @media print{.hud{display:none}}
        `}</style>
        <div className="hud-tach" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            {/* 270° sweep from 7:30 to 4:30; red band from 7,400 rpm */}
            <path className="track" d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" strokeWidth="8" strokeLinecap="round" pathLength={ARC} />
            <path className="red" d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" strokeWidth="8" pathLength={ARC} strokeDasharray={`0 ${(REDLINE / MAX_RPM) * ARC} ${ARC}`} />
            <path ref={tachRef} className="val" d="M 21.7 78.3 A 40 40 0 1 1 78.3 78.3" fill="none" strokeWidth="8" strokeLinecap="round" pathLength={ARC} strokeDasharray={`0 ${ARC}`} />
          </svg>
          <span ref={gearRef} className="hud-gear">N</span>
        </div>
        <div className="hud-speed" aria-hidden="true">
          <b ref={speedRef}>0</b>
          <small>km/h</small>
        </div>
        <div className="hud-meta" aria-hidden="true">
          <small>Odo</small>
          <span><span ref={odoRef}>0.00</span> km</span>
          <small>Lap</small>
          <span ref={lapRef}>00:00.0</span>
        </div>
        <button type="button" className="hud-drive" onClick={toggle} aria-pressed={driving} aria-label={driving ? "Exit drive mode" : "Drive the car (drive mode)"}>
          {driving ? "Exit" : "Drive"}
          <kbd>{driving ? "Esc" : "D"}</kbd>
        </button>
      </div>
      {driving && <DriveMode onExit={() => setDriving(false)} />}
    </>
  );
}
