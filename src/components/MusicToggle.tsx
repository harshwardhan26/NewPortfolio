"use client";

import { useEffect, useRef, useState } from "react";

// Set to the track's path once you've added a file you're licensed to use, e.g. "/audio/music.mp3"
// (see README → Background music). null = no music button.
const MUSIC_SRC: string | null = null;
const VOLUME = 0.08; // very low: background only
const FADE_MS = 1200;

/**
 * Opt-in background music. Appears after the intro (once the hero car has driven off, where the
 * engine sound's button disappears) in the same spot; fades in/out and pauses when the visitor
 * scrolls back to the intro. Renders nothing until MUSIC_SRC is set.
 */
export default function MusicToggle() {
  const available = MUSIC_SRC !== null;
  const [on, setOn] = useState(false);
  const [afterIntro, setAfterIntro] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fade = useRef(0);

  // After the intro = hero off screen, or its car has driven off (flag set by the hero).
  useEffect(() => {
    const hero = document.getElementById("top");
    let heroInView = true;
    const io = new IntersectionObserver(([e]) => (heroInView = e.isIntersecting));
    if (hero) io.observe(hero);
    const id = window.setInterval(() => setAfterIntro(!heroInView || hero?.dataset.carVisible === "0"), 250);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);

  // Play only when switched on and past the intro; fade the volume in/out.
  useEffect(() => {
    if (!MUSIC_SRC) return;
    const a = (audio.current ??= Object.assign(new Audio(MUSIC_SRC), { loop: true, volume: 0, preload: "none" }));
    const target = on && afterIntro ? VOLUME : 0;
    if (target > 0) a.play().catch(() => setOn(false));
    window.clearInterval(fade.current);
    const step = VOLUME / (FADE_MS / 50);
    fade.current = window.setInterval(() => {
      const v = a.volume + Math.sign(target - a.volume) * step;
      a.volume = Math.max(0, Math.min(VOLUME, Math.abs(target - v) < step ? target : v));
      if (a.volume === target) {
        window.clearInterval(fade.current);
        if (target === 0) a.pause();
      }
    }, 50);
    return () => window.clearInterval(fade.current);
  }, [on, afterIntro]);

  useEffect(() => () => audio.current?.pause(), []);

  if (!available) return null;
  return (
    <button
      type="button"
      className={`music-btn${afterIntro ? "" : " is-away"}`}
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={on ? "Pause background music" : "Play background music"}
    >
      <style href="music" precedence="default">{`
        .music-btn{position:fixed;right:var(--gutter);bottom:clamp(18px,4vh,32px);z-index:70;width:46px;height:46px;border-radius:50%;background:var(--ink);color:var(--on-ink);display:grid;place-items:center;box-shadow:0 10px 24px -12px rgba(0,0,0,.5);transition:transform .5s var(--ease),opacity .4s var(--ease),visibility 0s}
        .music-btn:hover{transform:scale(1.08)}
        .music-btn.is-away{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .4s var(--ease),visibility 0s .4s}
        .music-btn[aria-pressed="false"] svg{opacity:.55}
      `}</style>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
        <circle cx="17" cy="16" r="3" fill="currentColor" stroke="none" />
        {!on && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}
