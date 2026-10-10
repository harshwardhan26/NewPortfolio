"use client";

import { useEffect, useRef, useState } from "react";
import { REDLINE, drivetrain, startDrivetrain } from "@/lib/drivetrain";

/**
 * M4-style straight-six, synthesised in an AudioWorklet (public/audio/engine-worklet.js):
 * combustion pulse train → exhaust resonators → saturation, plus a small room reverb.
 * Revs, throttle and crackles come from the shared drivetrain (src/lib/drivetrain.ts): scroll speed
 * in cruise, the simulated car in drive mode.
 * Opt-in via the button (browsers need a gesture to start audio anyway). Only audible while the
 * intro car is on screen (the hero sets data-car-visible); the button hides once it has driven off.
 */

async function createEngine() {
  const ctx = new AudioContext({ latencyHint: "interactive" });
  await ctx.audioWorklet.addModule("/audio/engine-worklet.js");
  const node = new AudioWorkletNode(ctx, "engine", { outputChannelCount: [2] });

  // Gentle tone shaping: tame fizz, keep the low growl.
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 3200;
  shelf.gain.value = -9;
  const body = ctx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 140;
  body.Q.value = 0.9;
  body.gain.value = 4;

  // Short synthetic room so it sounds like it's outside, not in your ear.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 0.7);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  verb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.16;

  const master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;

  node.connect(body).connect(shelf);
  shelf.connect(master);
  shelf.connect(verb).connect(wet).connect(master);
  master.connect(comp).connect(ctx.destination);

  const rpm = node.parameters.get("rpm")!;
  const thr = node.parameters.get("throttle")!;
  return {
    ctx,
    set(r: number, t: number, volume: number) {
      const now = ctx.currentTime;
      rpm.setTargetAtTime(r, now, 0.025);
      thr.setTargetAtTime(t, now, 0.03);
      master.gain.setTargetAtTime(volume, now, 0.12);
    },
    pop: () => node.port.postMessage("pop"),
  };
}

export default function EngineSound() {
  const [on, setOn] = useState(false);
  const engine = useRef<Awaited<ReturnType<typeof createEngine>> | null>(null);
  const starting = useRef(false);
  const onRef = useRef(false);

  const enable = async (value: boolean) => {
    onRef.current = value;
    setOn(value);
    if (value && !engine.current && !starting.current) {
      starting.current = true;
      try {
        engine.current = await createEngine();
      } catch {
        onRef.current = false; // no AudioWorklet support: stay silent
        setOn(false);
      }
      starting.current = false;
    }
    if (value) engine.current?.ctx.resume();
  };

  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startDrivetrain();
    const hero = document.getElementById("top");
    // Hero on screen (covers reduced-motion, where the car is parked and the hero sets no flag)…
    let heroInView = true;
    const io = new IntersectionObserver(([en]) => (heroInView = en.isIntersecting));
    if (hero) io.observe(hero);
    // …and the car itself on screen, or the visitor is driving it.
    const audible = () => drivetrain.driving || (heroInView && hero?.dataset.carVisible !== "0");
    let away = false, pops = drivetrain.pops, raf = 0;
    const tick = () => {
      const gone = !audible();
      if (gone !== away) btnRef.current?.classList.toggle("is-away", (away = gone));
      const e = engine.current;
      if (e) {
        if (drivetrain.pops !== pops) {
          pops = drivetrain.pops;
          e.pop();
        }
        const { rpm, throttle } = drivetrain;
        const vol = onRef.current && !gone && document.visibilityState === "visible" ? 0.14 + 0.3 * Math.min(1, rpm / REDLINE) * (0.55 + 0.45 * throttle) : 0;
        e.set(rpm, throttle, vol);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <button
      type="button"
      ref={btnRef}
      className="engine-btn"
      onClick={() => enable(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn engine sound off" : "Turn engine sound on"}
    >
      <style href="engine" precedence="default">{`
        .engine-btn{position:fixed;right:var(--gutter);bottom:clamp(18px,4vh,32px);z-index:70;width:46px;height:46px;border-radius:50%;background:var(--ink);color:var(--on-ink);display:grid;place-items:center;box-shadow:0 10px 24px -12px rgba(0,0,0,.5);transition:transform .5s var(--ease),opacity .4s var(--ease),visibility 0s}
        .engine-btn.is-away{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .4s var(--ease),visibility 0s .4s}
        .engine-btn:hover{transform:scale(1.08)}
      `}</style>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
        {on ? (
          <>
            <path d="M16 9a4 4 0 0 1 0 6" />
            <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
    </button>
  );
}
