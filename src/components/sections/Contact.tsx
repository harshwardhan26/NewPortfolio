"use client";

import { useState } from "react";
import { CAR, PROFILE } from "@/lib/data";
import { scrollToTarget } from "@/lib/scroll";

function HopLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`ct-line ${className ?? ""}`} aria-hidden="true">
      {text.split(" ").map((word, w) => (
        <span key={w} className="ct-word">
          {Array.from(word, (ch, i) => (
            <span key={i} className="ct-ch">{ch}</span>
          ))}
        </span>
      ))}
    </span>
  );
}

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the mailto link still works */
    }
  };
  const hop = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.classList.contains("ct-ch") && !t.classList.contains("is-hop")) {
      t.classList.add("is-hop");
      t.addEventListener("animationend", () => t.classList.remove("is-hop"), { once: true });
    }
  };

  return (
    <section id="contact" className="section ct" aria-labelledby="contact-title">
      <style href="contact" precedence="default">{`
        .ct-h{font-weight:700;letter-spacing:-.05em;line-height:.95;font-size:clamp(44px,9vw,150px);margin-top:20px}
        .ct-line{display:block}
        .ct-word{display:inline-block;white-space:nowrap;margin-right:.22em}
        .ct-ch{display:inline-block}
        .ct-ch.is-hop{animation:hop .6s var(--ease)}
        @keyframes hop{0%{transform:none}35%{transform:translateY(-.16em)}70%{transform:translateY(.03em)}100%{transform:none}}
        .ct-mail{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:clamp(36px,6vh,64px)}
        .ct-mail a{font-weight:600;letter-spacing:-.03em;font-size:clamp(22px,3.6vw,52px);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.16em;overflow-wrap:anywhere;transition:color .4s var(--ease)}
        .ct-mail a:hover{color:var(--ink-2)}
        .ct-copy{height:36px;padding:0 14px;border-radius:999px;font:500 12px var(--font-mono);box-shadow:inset 0 0 0 1px rgba(var(--fg-rgb),.22);transition:background-color .4s var(--ease),color .4s var(--ease)}
        .ct-copy:hover,.ct-copy.is-done{background:var(--ink);color:var(--on-ink)}
        .ct-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .ct-row{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
        .ct-badge{width:132px;height:132px;position:relative;flex:none}
        .ct-badge svg{width:100%;height:100%;animation:spin 18s linear infinite}
        .ct-badge b{position:absolute;inset:0;display:grid;place-items:center;font-size:28px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ft{border-top:1px solid var(--line);padding-block:28px;font-size:13px;color:var(--mute)}
        .ft-in{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-right:64px}
        .ft-credit{margin-top:14px;font-size:11px;line-height:1.6}
        .ft a{color:var(--ink);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--faint)}
      `}</style>
      <div className="wrap">
        <p className="tag rv"><b>05</b> — Contact</p>
        <h2 id="contact-title" className="ct-h" onMouseOver={hop}>
          <span className="sr-only">Let&apos;s build something together.</span>
          <HopLine text="Let's build" />
          <HopLine text="something" />
          <span className="ct-line serif-accent" aria-hidden="true">
            {Array.from("together.", (ch, i) => <span key={i} className="ct-ch">{ch}</span>)}
          </span>
        </h2>
        <div className="ct-row">
          <div>
            <div className="ct-mail rv">
              <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
              <button type="button" className={`ct-copy${copied ? " is-done" : ""}`} onClick={copy}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <span className="sr-only" aria-live="polite">{copied ? "Email copied to clipboard" : ""}</span>
            </div>
            <div className="ct-links rv" style={{ "--i": 1 } as React.CSSProperties}>
              <a className="btn btn-primary" href={PROFILE.phoneHref}>Call {PROFILE.phone}</a>
              <a className="btn btn-ghost" href={PROFILE.github} target="_blank" rel="noreferrer">GitHub ↗</a>
              <a className="btn btn-ghost" href={PROFILE.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            </div>
          </div>
          <a href={`mailto:${PROFILE.email}`} className="ct-badge rv" style={{ "--i": 2 } as React.CSSProperties} aria-label={`Say hello by email to ${PROFILE.email}`}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <path id="ct-c" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <circle cx="50" cy="50" r="49" fill="none" style={{ stroke: "rgba(var(--fg-rgb),.18)" }} />
              <text fontFamily="var(--font-mono)" fontSize="9" fill="currentColor">
                <textPath href="#ct-c" textLength="236" lengthAdjust="spacing">SAY HELLO · SAY HELLO · SAY HELLO · </textPath>
              </text>
            </svg>
            <b aria-hidden="true">↗</b>
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap ft-in">
        <span>© {new Date().getFullYear()} {PROFILE.name}</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); scrollToTarget("#top"); }}>Back to top ↑</a>
        <span>Built with Next.js</span>
      </div>
      <p className="wrap ft-credit">
        Hero car based on <a href={CAR.credit.url} target="_blank" rel="noreferrer">“{CAR.credit.title}”</a> by{" "}
        <a href={CAR.credit.authorUrl} target="_blank" rel="noreferrer">{CAR.credit.author}</a>, licensed under{" "}
        <a href={CAR.credit.licenceUrl} target="_blank" rel="noreferrer">{CAR.credit.licence}</a>. Repainted renders, same licence. BMW and M4 are trademarks of BMW AG.
      </p>
    </footer>
  );
}
