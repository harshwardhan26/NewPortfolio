"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAV, PROFILE } from "@/lib/data";
import { scrollToTarget, setScrollLocked } from "@/lib/scroll";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState({ x: 0, w: 0, on: false });
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Scroll state + progress bar (rAF-throttled, writes transform directly).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Active section.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main > section[id]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Slide the ink indicator under the active link.
  useLayoutEffect(() => {
    const measure = () => {
      const a = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
      setPill(a ? { x: a.offsetLeft, w: a.offsetWidth, on: true } : (p) => ({ ...p, on: false }));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  // Mobile overlay: Esc + scroll lock.
  useEffect(() => {
    if (!open) return;
    const trigger = menuBtn.current;
    setScrollLocked(true);
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      setScrollLocked(false);
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.dataset.theme === "light"), []);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      /* private mode: theme just isn't remembered */
    }
  };

  const go = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    setOpen(false);
    // Let the overlay release the scroll lock first.
    requestAnimationFrame(() => scrollToTarget(target));
  };

  return (
    <>
      <style href="nav" precedence="default">{`
        .nav-progress{position:fixed;inset:0 0 auto;height:2px;background:var(--ink);transform-origin:0 50%;transform:scaleX(0);z-index:70}
        .nav{position:fixed;top:14px;left:0;right:0;z-index:60;pointer-events:none}
        .nav-in{display:flex;align-items:center;justify-content:space-between;gap:16px}
        .nav-brand{pointer-events:auto;display:flex;align-items:center;gap:12px;border-radius:999px}
        .nav-mark{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font:600 13px/1 var(--font-mono);letter-spacing:.02em;box-shadow:inset 0 0 0 1.5px var(--ink);transition:background-color .5s var(--ease),color .5s var(--ease),transform .9s var(--ease);background:transparent}
        .nav-brand:hover .nav-mark{transform:rotate(360deg)}
        .nav.is-scrolled .nav-mark{background:var(--ink);color:var(--on-ink)}
        .nav-name{font-weight:600;letter-spacing:-.02em;font-size:15px;transition:opacity .5s var(--ease),transform .5s var(--ease)}
        .nav.is-scrolled .nav-name{opacity:0;transform:translateX(-8px)}
        .nav-pill{pointer-events:auto;position:relative;display:flex;align-items:center;padding:5px;border-radius:999px;transition:background-color .5s var(--ease),box-shadow .5s var(--ease)}
        .nav.is-scrolled .nav-pill,.nav-menu-btn{background:rgba(var(--card-rgb),.72);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:var(--shadow-hair),0 10px 30px -18px rgba(0,0,0,.3)}
        .nav-pill ul{position:relative;display:flex;list-style:none;margin:0;padding:0}
        .nav-ind{position:absolute;top:0;bottom:0;left:0;border-radius:999px;background:var(--ink);transition:transform .6s var(--ease),width .6s var(--ease),opacity .4s var(--ease)}
        .nav-pill a{position:relative;display:block;padding:10px 16px;border-radius:999px;font-size:14px;font-weight:500;color:var(--ink-2);transition:color .4s var(--ease)}
        .nav-pill a:hover{color:var(--ink)}
        .nav-pill a[aria-current="true"]{color:var(--on-ink)}
        .nav-right{display:flex;align-items:center;gap:10px}
        .nav-theme{pointer-events:auto;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:var(--ink);background:rgba(var(--card-rgb),.72);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:var(--shadow-hair);transition:transform .5s var(--ease),background-color .4s var(--ease)}
        .nav-theme:hover{transform:rotate(20deg) scale(1.06)}
        .nav-menu-btn{pointer-events:auto;display:none;height:44px;padding:0 20px;border-radius:999px;font-weight:500;font-size:14px}
        @media (max-width:860px){.nav-pill{display:none}.nav-menu-btn{display:inline-flex;align-items:center}}
        .nav-ov{position:fixed;inset:0;z-index:80;background:var(--paper);clip-path:circle(0% at calc(100% - 52px) 36px);transition:clip-path .8s var(--ease),visibility 0s .8s;visibility:hidden;display:flex;flex-direction:column;padding:18px var(--gutter) 32px}
        .nav-ov.is-open{clip-path:circle(150% at calc(100% - 52px) 36px);visibility:visible;transition:clip-path .8s var(--ease)}
        .nav-ov ol{list-style:none;margin:auto 0;padding:0}
        .nav-ov li{overflow:hidden;border-bottom:1px solid var(--line)}
        .nav-ov li a{display:flex;align-items:baseline;gap:16px;padding:14px 0;font-size:clamp(40px,12vw,72px);font-weight:700;letter-spacing:-.045em;line-height:1;transform:translateY(110%);transition:transform .8s var(--ease)}
        .nav-ov li a small{font:500 12px var(--font-mono);color:var(--mute);letter-spacing:0}
        .nav-ov.is-open li a{transform:none;transition-delay:calc(.15s + var(--i) * 60ms)}
      `}</style>
      <div ref={barRef} className="nav-progress" aria-hidden="true" />
      <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="wrap nav-in">
          <a href="#top" className="nav-brand" onClick={(e) => go(e, "#top")}>
            <span className="nav-mark" aria-hidden="true">{PROFILE.initials}</span>
            <span className="nav-name">{PROFILE.name}</span>
            <span className="sr-only">, back to top</span>
          </a>
          <div className="nav-right">
          <button type="button" className="nav-theme" onClick={toggleTheme} aria-label={light ? "Switch to dark mode" : "Switch to light mode"} aria-pressed={light}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {light ? (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              )}
            </svg>
          </button>
          <nav className="nav-pill" aria-label="Primary">
            <ul ref={listRef}>
              <li aria-hidden="true" className="nav-ind" style={{ transform: `translateX(${pill.x}px)`, width: pill.w, opacity: pill.on ? 1 : 0 }} />
              {NAV.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} data-id={n.id} aria-current={active === n.id ? "true" : undefined} onClick={(e) => go(e, `#${n.id}`)}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <button ref={menuBtn} type="button" className="nav-menu-btn" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>
            Menu
          </button>
          </div>
        </div>
      </header>
      <div id="mobile-menu" className={`nav-ov${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
        <div className="flex items-center justify-between">
          <span className="mono text-xs uppercase tracking-wider text-mute">Menu</span>
          <button type="button" className="btn btn-ghost" ref={closeBtn} onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <ol>
          {NAV.map((n, i) => (
            <li key={n.id}>
              <a href={`#${n.id}`} style={{ "--i": i } as React.CSSProperties} onClick={(e) => go(e, `#${n.id}`)}>
                <small>{String(i + 1).padStart(2, "0")}</small>
                {n.label}
              </a>
            </li>
          ))}
        </ol>
        <a href={`mailto:${PROFILE.email}`} className="mono text-sm text-ink-2 underline underline-offset-4">
          {PROFILE.email}
        </a>
      </div>
    </>
  );
}
