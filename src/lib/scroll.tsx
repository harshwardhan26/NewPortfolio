"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { prefersReducedMotion } from "./hooks";

let lenis: Lenis | null = null;

export function scrollToTarget(target: string | number) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : null;
  if (lenis) {
    lenis.scrollTo(el ?? (typeof target === "number" ? target : 0), { offset: 0, duration: 1.2 });
  } else if (el) {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  } else {
    window.scrollTo({ top: typeof target === "number" ? target : 0 });
  }
  if (el) {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
}

export function setScrollLocked(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // Calm, slow browsing even with fast trackpads / free-spinning wheels:
    //  - wheelMultiplier: each wheel/trackpad tick moves about half as far as native;
    //  - lerp: softer easing toward the target (silkier glide);
    //  - MAX_STEP: a single event can't jump more than ~70 px (trackpad momentum spikes);
    //  - lead cap: the target can't run more than ~40% of a screen ahead of what's shown, which caps
    //    top speed at roughly LERP × lead × 60 fps ≈ 1,400 px/s on a 900 px tall window; inside the
    //    intro (car drive-by) it's ~20%, so even a hard flick takes a few seconds to get past it.
    const MAX_STEP = 70;
    const LERP = 0.065;
    lenis = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      wheelMultiplier: 0.55,
      virtualScroll: (data) => {
        if (!lenis || !data.event.type.includes("wheel")) return true;
        const hero = document.getElementById("top");
        const inIntro = hero && lenis.animatedScroll < hero.offsetHeight - window.innerHeight;
        const maxLead = window.innerHeight * (inIntro ? 0.2 : 0.4);
        const step = Math.max(-MAX_STEP, Math.min(MAX_STEP, data.deltaY));
        const lead = lenis.targetScroll - lenis.animatedScroll;
        data.deltaY = Math.max(-maxLead - lead, Math.min(maxLead - lead, step));
        return true;
      },
    });
    let raf = requestAnimationFrame(function loop(t) {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
