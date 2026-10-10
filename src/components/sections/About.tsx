"use client";

import { useEffect, useRef, useState } from "react";
import { PROFILE, PROJECTS } from "@/lib/data";
import { prefersReducedMotion } from "@/lib/hooks";

const FACTS = [
  { k: "Location", v: PROFILE.location },
  { k: "Education", v: `${PROFILE.degree}, ${PROFILE.university} · CGPA ${PROFILE.cgpa} (${PROFILE.gradYear})` },
  { k: "Currently", v: `${PROFILE.currentRole}, ${PROFILE.currentCompany}, Pune` },
  { k: "Email", v: PROFILE.email, href: `mailto:${PROFILE.email}` },
];

// Deterministic barcode widths from the name.
const BARS = Array.from(PROFILE.name + PROFILE.gradYear, (c) => (c.charCodeAt(0) % 3) + 1);

function useSwing(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || prefersReducedMotion()) return;
    let angle = 0, vel = 0, lastX: number | null = null, lastT = 0, lastMove = 0, raf = 0, running = false;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (lastX !== null && now - lastT < 100) {
        const vx = (e.clientX - lastX) / Math.max(1, now - lastT); // px/ms
        vel += Math.max(-1.2, Math.min(1.2, vx)) * 0.3;
      }
      lastX = e.clientX;
      lastT = now;
      lastMove = now;
    };
    const step = (t: number) => {
      const idle = t - lastMove > 1500;
      const target = idle ? Math.sin(t / 1400) * 1.6 : 0; // subtle idle sway (deg)
      vel += (target - angle) * 0.012; // spring
      vel *= 0.94; // damping
      angle = Math.max(-14, Math.min(14, angle + vel));
      el.style.transform = `rotate(${angle.toFixed(3)}deg)`;
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!e.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [enabled]);
  return ref;
}

function IdCard() {
  const swing = useSwing(true);
  const [hover, setHover] = useState(false);
  const [toggled, setToggled] = useState(false);
  const lastPointer = useRef("mouse");
  const flipped = hover || toggled;

  return (
    <div className="lan" ref={swing}>
      <div className="lan-strap" aria-hidden="true">
        <div className="lan-strap-text">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i}>{PROFILE.name} · {PROFILE.role} · </span>
          ))}
        </div>
      </div>
      <div className="lan-clip" aria-hidden="true" />
      <div
        className={`idc${flipped ? " is-flipped" : ""}`}
        role="group"
        tabIndex={0}
        aria-roledescription="ID card"
        aria-label={`Developer ID card, ${flipped ? "back" : "front"} side`}
        aria-describedby="idc-hint"
        data-flipped={flipped}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
        onClick={() => lastPointer.current !== "mouse" && setToggled((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setToggled((f) => !f);
          }
        }}
      >
        <div className="idc-in">
          <span id="idc-hint" className="sr-only">Press Enter or Space to flip.</span>
          <div className="idc-face idc-front" aria-hidden={flipped}>
            <div className="idc-band">
              <span>DEVELOPER ID</span>
              <span className="mono">{PROFILE.initials}</span>
            </div>
            <div className="idc-photo">
              <div className="idc-photo-in">
                {PROFILE.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={PROFILE.portrait} alt={`Portrait of ${PROFILE.name}`} width={128} height={156} />
                ) : (
                  <span role="img" aria-label={`${PROFILE.name} monogram`}>{PROFILE.initials}</span>
                )}
              </div>
            </div>
            <p className="idc-name">{PROFILE.name}</p>
            <p className="idc-role">{PROFILE.role}</p>
            <dl className="idc-rows">
              <div><dt>ID No.</dt><dd>@harshwardhan26</dd></div>
              <div><dt>Dept.</dt><dd>Computer Engg.</dd></div>
              <div><dt>Valid till</dt><dd>{PROFILE.gradYear}</dd></div>
            </dl>
            <div className="idc-foot" aria-hidden="true">
              <div className="idc-bars">
                {BARS.map((w, i) => (
                  <i key={i} style={{ width: w }} />
                ))}
              </div>
              <div className="idc-holo" />
            </div>
          </div>
          <div className="idc-face idc-back" aria-hidden={!flipped}>
            <div className="idc-band">
              <span>WHAT I AM</span>
              <span className="mono">↺</span>
            </div>
            <ul className="idc-list">
              <li>{PROFILE.role}</li>
              <li>{PROFILE.degree} · CGPA {PROFILE.cgpa}</li>
              <li>{PROFILE.honours}</li>
              <li>{PROFILE.currentRole} at Leal Software Solutions</li>
              <li>Shipped {PROJECTS[0].title} and {PROJECTS[1].title}</li>
            </ul>
            <div className="idc-sign">
              <span className="serif-accent">{PROFILE.name}</span>
              <small>Signature</small>
            </div>
            <p className="idc-found">If found, say hello · {PROFILE.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <style href="about" precedence="default">{`
        .about{padding-top:0}
        .about-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:stretch}
        .about-col{display:flex;flex-direction:column;justify-content:flex-end;padding-top:var(--section-y)}
        .about-hi{font-weight:700;letter-spacing:-.045em;line-height:1;font-size:clamp(40px,4.6vw,72px)}
        .about-p{color:var(--ink-2);font-size:clamp(16px,1.2vw,18px);line-height:1.6;margin-top:22px;max-width:36em}
        .about-p + .about-p{color:var(--mute);margin-top:12px}
        .about-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .facts{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
        .facts li{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;padding:16px 0;border-bottom:1px solid var(--line);font-size:15px}
        .facts span{font:500 11px/1.9 var(--font-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--mute)}
        .facts a{text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--faint);overflow-wrap:anywhere}
        .about-quote{margin-top:32px;font:italic 400 clamp(24px,2.2vw,32px)/1.2 var(--font-serif);letter-spacing:-.01em}
        .about-quote::before{content:"“";display:block;font-size:2em;line-height:.6;color:var(--faint)}

        .lan{position:relative;display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;will-change:transform}
        .lan-strap{width:30px;height:calc(var(--section-y) + 56px);background:var(--accent);overflow:hidden;position:relative;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
        .lan-strap-text{writing-mode:vertical-rl;font:600 10px/30px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.8);white-space:nowrap;animation:strap 22s linear infinite;width:30px}
        @keyframes strap{to{transform:translateY(-50%)}}
        .lan-clip{width:44px;height:30px;margin-top:-4px;border-radius:6px 6px 10px 10px;background:linear-gradient(180deg,#e6e6e6,#9a9a9a 45%,#d6d6d6 60%,#7e7e7e);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 8px -4px rgba(0,0,0,.4);position:relative}
        .lan-clip::after{content:"";position:absolute;left:50%;bottom:-10px;width:14px;height:14px;translate:-50% 0;border-radius:50%;border:3px solid #9a9a9a;border-top-color:#d0d0d0}
        /* The ID card is a physical white card on the dark page: re-scope the tokens locally. */
        .idc{--card:#f6f3ee;--ink:#0d0d0d;--ink-2:#3a3a3a;--mute:#6b6963;--faint:#a9a6a0;--paper:#e9e6e0;--on-ink:#ffffff;--fg-rgb:13,13,13;--line:rgba(13,13,13,.1);color:var(--ink);width:300px;height:404px;margin-top:6px;perspective:1400px;cursor:pointer;border-radius:22px}
        .idc-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1s var(--ease)}
        .idc.is-flipped .idc-in{transform:rotateY(180deg)}
        .idc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--card);border-radius:22px;overflow:hidden;box-shadow:var(--shadow-hair),var(--shadow-soft);display:flex;flex-direction:column}
        .idc-face::before{content:"";position:absolute;top:10px;left:50%;width:46px;height:7px;translate:-50% 0;border-radius:9px;background:var(--paper);box-shadow:inset 0 1px 2px rgba(0,0,0,.18);z-index:2}
        .idc-back{transform:rotateY(180deg)}
        .idc-band{background:var(--ink);color:var(--on-ink);display:flex;justify-content:space-between;align-items:flex-end;padding:24px 18px 8px;font:600 11px var(--font-mono);letter-spacing:.18em}
        .idc-photo{align-self:center;margin-top:12px;padding:3px;border-radius:18px;background:linear-gradient(145deg,#d9d9d9,#7a7a7a 50%,#e8e8e8);box-shadow:0 0 0 6px rgba(var(--fg-rgb),.03),0 10px 30px -8px rgba(0,0,0,.35)}
        .idc-photo-in{width:128px;height:156px;border-radius:15px;overflow:hidden;background:linear-gradient(#f7f7f7,#e3e3e3);display:grid;place-items:center;font:italic 400 64px/1 var(--font-serif);color:var(--ink-2)}
        .idc-photo-in img,.idc-photo-in span{width:100%;height:100%;object-fit:cover;display:grid;place-items:center;transition:transform .8s var(--ease)}
        .idc:hover .idc-photo-in img,.idc:hover .idc-photo-in span{transform:scale(1.06)}
        .idc-name{text-align:center;font-weight:700;letter-spacing:-.03em;font-size:19px;margin-top:10px}
        .idc-role{text-align:center;font-size:12px;color:var(--mute);margin-top:2px}
        .idc-rows{margin:8px 18px 0;font-size:11px}
        .idc-rows div{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed var(--line)}
        .idc-rows dt{font-family:var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.06em;font-size:10px}
        .idc-rows dd{margin:0;font-weight:600}
        .idc-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding:8px 18px 12px}
        .idc-bars{display:flex;gap:2px;height:24px}
        .idc-bars i{display:block;background:var(--ink);height:100%}
        .idc-bars i:nth-child(3n){opacity:.55}
        .idc-holo{width:34px;height:34px;border-radius:50%;background:conic-gradient(from 0deg,#f2f2f2,#9c9c9c,#e9e9e9,#6f6f6f,#f7f7f7,#b5b5b5,#f2f2f2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.6);animation:holo 6s linear infinite}
        @keyframes holo{to{transform:rotate(360deg)}}
        .idc-list{list-style:none;margin:0;padding:18px;display:grid;gap:10px;font-size:14px;line-height:1.35}
        .idc-list li{padding-left:18px;position:relative}
        .idc-list li::before{content:"—";position:absolute;left:0;color:var(--faint)}
        .idc-sign{margin:auto 18px 0;border-bottom:1px solid var(--ink);padding-bottom:4px;display:flex;justify-content:space-between;align-items:flex-end}
        .idc-sign .serif-accent{font-size:26px;color:var(--ink)}
        .idc-sign small{font:500 9px var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.1em}
        .idc-found{font:500 10px/1.5 var(--font-mono);color:var(--mute);padding:10px 18px 16px;overflow-wrap:anywhere}

        @media (max-width:1080px){
          .about-grid{grid-template-columns:minmax(0,1fr) 300px}
          .about-mid{grid-row:1 / span 2;grid-column:2}
          .about-col:last-child{padding-top:24px}
        }
        @media (max-width:720px){
          .about-grid{grid-template-columns:minmax(0,1fr)}
          .about-mid{grid-row:auto;grid-column:auto;order:-1}
          .about-col{padding-top:48px}
          .lan-strap{height:96px}
          .about{padding-top:0}
        }
        @media (max-width:340px){.idc{transform:scale(.9);transform-origin:50% 0}}
      `}</style>
      <div className="wrap">
        <div className="about-grid">
          <div className="about-col">
            <p className="tag rv"><b>01</b> — About</p>
            <h2 id="about-title" className="about-hi" style={{ marginTop: 18 }}>
              <span className="rv-mask"><span>Hi, I&apos;m</span></span>
              <span className="rv-mask" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="serif-accent">{PROFILE.nickname}.</span>
              </span>
            </h2>
            <p className="about-p rv" style={{ "--i": 2 } as React.CSSProperties}>{PROFILE.resumeSummary}</p>
            <p className="about-p rv" style={{ "--i": 3 } as React.CSSProperties}>{PROFILE.extraLine}</p>
            <div className="about-btns rv" style={{ "--i": 4 } as React.CSSProperties}>
              <a className="btn btn-primary" href={PROFILE.resume} download>Résumé ↓</a>
              <a className="btn btn-ghost" href={PROFILE.github} target="_blank" rel="noreferrer">GitHub ↗</a>
              <a className="btn btn-ghost" href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            </div>
          </div>
          <div className="about-mid">
            <IdCard />
          </div>
          <div className="about-col">
            <p className="tag rv">Quick facts</p>
            <ul className="facts rv" style={{ marginTop: 16, "--i": 1 } as React.CSSProperties}>
              {FACTS.map((f) => (
                <li key={f.k}>
                  <span>{f.k}</span>
                  {f.href ? <a href={f.href}>{f.v}</a> : <p>{f.v}</p>}
                </li>
              ))}
            </ul>
            <blockquote className="about-quote rv" style={{ "--i": 2 } as React.CSSProperties}>{PROFILE.quote}</blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
