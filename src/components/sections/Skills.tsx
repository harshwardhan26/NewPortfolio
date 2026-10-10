"use client";

import { useState } from "react";
import { SKILL_GROUPS, SKILL_USAGE, type Family, type Skill } from "@/lib/data";
import { useInView } from "@/lib/hooks";
import { SectionHead } from "../ui/SectionHead";
import { BRAND, TechLogo, isBrand } from "../ui/TechLogo";

const ALL: Skill[] = SKILL_GROUPS.flatMap((g) => g.skills);
const FAMILIES = SKILL_GROUPS.map((g) => g.family);

export default function Skills() {
  const [filter, setFilter] = useState<Family | null>(null);
  const [active, setActive] = useState<Skill>(ALL[0]);
  const [gridRef, inView] = useInView<HTMLOListElement>({ threshold: 0.15 });
  const used = SKILL_USAGE[active.name];
  const tint = BRAND[active.logo]?.tint;

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <style href="skills" precedence="default">{`
        .sk-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:36px}
        .sk-chip{height:36px;padding:0 16px;border-radius:999px;font-size:13px;font-weight:500;box-shadow:inset 0 0 0 1px rgba(var(--fg-rgb),.18);transition:background-color .4s var(--ease),color .4s var(--ease)}
        .sk-chip:hover{box-shadow:inset 0 0 0 1px var(--ink)}
        .sk-chip[aria-pressed="true"]{background:var(--ink);color:var(--on-ink);box-shadow:none}
        .sk-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;margin-top:28px;align-items:start}
        .sk-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}
        .sk-tile{width:100%;aspect-ratio:1;position:relative;text-align:left;background:var(--card);border-radius:14px;box-shadow:var(--shadow-hair);padding:10px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;
          opacity:0;transform:translateY(18px) scale(.96);transition:opacity .7s var(--ease),transform .7s var(--ease),box-shadow .4s var(--ease),filter .4s var(--ease);transition-delay:calc(var(--d8) * 40ms)}
        .sk-grid.is-in .sk-tile{opacity:1;transform:none}
        .sk-grid.is-in .sk-tile.is-dim{opacity:.28;filter:grayscale(1)}
        .sk-tile:hover,.sk-tile:focus-visible,.sk-tile.is-active{box-shadow:inset 0 0 0 1.5px var(--ink),var(--shadow-soft);transform:translateY(-3px);transition-delay:0s}
        .sk-tile.is-active{background:var(--ink);color:var(--on-ink)}
        .sk-tile.is-active .sk-n,.sk-tile.is-active .sk-f{color:rgba(var(--bg-rgb),.6)}
        .sk-n{font:500 10px var(--font-mono);color:var(--mute)}
        .sk-s{font-weight:700;letter-spacing:-.04em;font-size:clamp(18px,2.1vw,30px);line-height:1}
        .sk-name{font-size:11px;font-weight:500;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sk-f{font:500 9px var(--font-mono);color:var(--faint);text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sk-insp{position:sticky;top:96px;padding:24px;border-radius:26px;min-height:420px;display:flex;flex-direction:column}
        .sk-logo{position:relative;width:150px;height:150px;margin:8px auto 20px;display:grid;place-items:center;animation:pop .6s var(--ease)}
        .sk-logo::before{content:"";position:absolute;inset:-30px;border-radius:50%;background:radial-gradient(closest-side,var(--tint,transparent),transparent);opacity:.22;z-index:0}
        .sk-logo > *{position:relative;z-index:1;width:150px!important;height:150px!important}
        .sk-logo .concept{width:120px!important;height:120px!important;color:var(--ink)}
        @keyframes pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
        .sk-insp h3{font-weight:700;letter-spacing:-.035em;font-size:26px;line-height:1.05}
        .sk-meta{display:flex;justify-content:space-between;font:500 11px var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
        .sk-used{margin-top:auto;padding-top:18px;border-top:1px solid var(--line);font-size:14px;color:var(--ink-2)}
        .sk-used ul{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:4px}
        .sk-used li::before{content:"→ ";color:var(--faint)}
        @media (max-width:1080px){.sk-layout{grid-template-columns:minmax(0,1fr)}.sk-insp{position:relative;top:auto;min-height:0}}
        @media (max-width:720px){.sk-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.sk-tile{transition-delay:calc(var(--d4) * 40ms)}}
      `}</style>
      <div className="wrap">
        <SectionHead index="02" label="Skills" id="skills-title" title="The periodic table" accent="of my stack." />
        <div className="sk-chips rv" role="group" aria-label="Filter skills by family">
          <button type="button" className="sk-chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            All · {ALL.length}
          </button>
          {FAMILIES.map((f) => (
            <button key={f} type="button" className="sk-chip" aria-pressed={filter === f} onClick={() => setFilter(filter === f ? null : f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="sk-layout">
          <ol ref={gridRef} className={`sk-grid${inView ? " is-in" : ""}`} aria-label="Skills">
            {ALL.map((s, i) => {
              const d8 = Math.floor(i / 8) + (i % 8);
              const d4 = Math.floor(i / 4) + (i % 4);
              const dim = filter !== null && s.family !== filter;
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    className={`sk-tile${dim ? " is-dim" : ""}${active.name === s.name ? " is-active" : ""}`}
                    style={{ "--d8": d8, "--d4": d4 } as React.CSSProperties}
                    onMouseEnter={() => setActive(s)}
                    onFocus={() => setActive(s)}
                    onClick={() => setActive(s)}
                    aria-label={`${s.name}, ${s.family}`}
                  >
                    <span className="sk-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <span className="sk-s" aria-hidden="true">{s.symbol}</span>
                    <span aria-hidden="true">
                      <span className="sk-name" style={{ display: "block" }}>{s.name}</span>
                      <span className="sk-f" style={{ display: "block" }}>{s.family}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <aside className="card sk-insp" aria-live="polite" aria-label="Skill inspector">
            <div className="sk-meta">
              <span>No. {String(ALL.indexOf(active) + 1).padStart(2, "0")}</span>
              <span>{active.family}</span>
            </div>
            <div key={active.name} className="sk-logo" style={{ "--tint": tint } as React.CSSProperties}>
              {isBrand(active.logo) ? <TechLogo name={active.logo} size={150} /> : <TechLogo name={active.logo} size={120} className="concept" />}
            </div>
            <h3>{active.name}</h3>
            <div className="sk-used">
              <span className="mono text-xs uppercase tracking-wider text-mute">{used ? "Used in" : "Listed in"}</span>
              <ul>{used ? used.map((u) => <li key={u}>{u}</li>) : <li>Technical Skills · {active.family}</li>}</ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
