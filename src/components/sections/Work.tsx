"use client";

import { useState } from "react";
import { PROJECTS } from "@/lib/data";
import { SectionHead } from "../ui/SectionHead";
import { TechLogo } from "../ui/TechLogo";

/** Illustrative HVAC calculator sketch (that project has no public site to screenshot). */
function MiniUI() {
  return (
    <div className="mu">
      <div className="mu-bar"><i /><i /><i /><span className="mu-url" /></div>
      <div className="mu-steps"><b className="on">1</b><span /><b className="on">2</b><span /><b>3</b></div>
      <div className="mu-split">
        <div className="mu-col">
          {["ADP", "SHG", "BF"].map((k) => (
            <div key={k} className="mu-field"><small>{k}</small><span className="mu-line w60" /></div>
          ))}
        </div>
        <div className="mu-chartbox">
          <div className="mu-chart">{[40, 72, 55, 88, 64, 80, 46].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
          <span className="mu-btn">Export PDF</span>
        </div>
      </div>
    </div>
  );
}

export default function Work() {
  const [open, setOpen] = useState(0);

  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <style href="work" precedence="default">{`
        .wk{display:flex;gap:10px;height:min(78svh,600px);margin-top:48px}
        .wk-p{position:relative;flex:1 1 0;min-width:72px;background:var(--card);border-radius:28px;box-shadow:var(--shadow-hair);overflow:hidden;transition:flex-grow .9s var(--ease),box-shadow .6s var(--ease)}
        .wk-p.is-open{flex-grow:8;box-shadow:var(--shadow-hair),var(--shadow-soft)}
        .wk-spine{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:22px 0;width:100%;transition:opacity .4s var(--ease)}
        .wk-p.is-open .wk-spine{opacity:0;pointer-events:none}
        .wk-spine .mono{font-size:12px;color:var(--mute)}
        .wk-vt{writing-mode:vertical-rl;transform:rotate(180deg);font-weight:600;letter-spacing:-.02em;font-size:17px;white-space:nowrap}
        .wk-plus{width:36px;height:36px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(var(--fg-rgb),.2);display:grid;place-items:center;font-size:18px;transition:transform .6s var(--ease),background-color .4s var(--ease),color .4s var(--ease)}
        .wk-spine:hover .wk-plus{transform:rotate(90deg);background:var(--ink);color:var(--on-ink)}
        .wk-body{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;padding:clamp(22px,3vw,40px);opacity:0;visibility:hidden;transition:opacity .5s var(--ease),visibility 0s .5s}
        .wk-p.is-open .wk-body{opacity:1;visibility:visible;transition:opacity .7s var(--ease) .25s}
        .wk-info{display:flex;flex-direction:column;min-width:0;overflow:auto}
        .wk-k{font:500 12px var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.06em}
        .wk-t{font-weight:700;letter-spacing:-.045em;line-height:1;font-size:clamp(30px,3.4vw,52px);margin-top:12px}
        .wk-d{color:var(--ink-2);line-height:1.55;margin-top:14px;font-size:15px}
        .wk-f{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;font-size:13px;color:var(--ink-2)}
        .wk-f li{padding-left:14px;position:relative;line-height:1.35}
        .wk-f li::before{content:"";position:absolute;left:0;top:.5em;width:6px;height:6px;border-radius:50%;background:var(--ink)}
        .wk-tech{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
        .wk-tech span{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:999px;background:var(--paper);font-size:12px;font-weight:500}
        .wk-cta{margin-top:auto;padding-top:20px}
        .wk-ui{position:relative;border-radius:20px;background:var(--paper);box-shadow:var(--shadow-hair);overflow:hidden;clip-path:inset(0 100% 0 0 round 20px);transition:clip-path 1.1s var(--ease)}
        .wk-p.is-open .wk-ui{clip-path:inset(0 0 0 0 round 20px);transition-delay:.35s}
        .wk-shot{margin:0;display:flex;flex-direction:column;background:#0e0e0e}
        .wk-shot-bar{display:flex;align-items:center;gap:6px;height:30px;padding:0 12px;flex:none;background:var(--card);border-bottom:1px solid var(--line)}
        .wk-shot-bar i{width:8px;height:8px;border-radius:50%;background:var(--soft)}
        .wk-shot-bar span{margin-left:8px;flex:1;max-width:60%;font:500 10px var(--font-mono);color:var(--mute);background:var(--paper);border-radius:6px;padding:3px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wk-shot img{flex:1;min-height:0;width:100%;object-fit:cover;object-position:top center;display:block}
        .wk-ui-l{position:absolute;right:14px;bottom:12px;font:500 10px var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.08em;background:var(--card);padding:4px 8px;border-radius:999px;box-shadow:var(--shadow-hair)}

        .mu{position:absolute;inset:18px;display:flex;flex-direction:column;gap:12px;background:var(--card);border-radius:14px;padding:12px;box-shadow:0 20px 40px -24px rgba(0,0,0,.35)}
        .mu-bar{display:flex;gap:5px;align-items:center}
        .mu-bar i{width:8px;height:8px;border-radius:50%;background:var(--soft)}
        .mu-url{flex:1;height:10px;border-radius:6px;background:var(--paper);margin-left:8px}
        .mu-line{display:block;height:8px;border-radius:5px;background:var(--soft)}
        .w60{width:60%}
        .mu-btn{font:600 10px var(--font-mono);background:var(--ink);color:var(--on-ink);padding:6px 10px;border-radius:999px;align-self:flex-start}
        .mu-split{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px;flex:1;min-height:0}
        .mu-col{display:flex;flex-direction:column;gap:9px;min-height:0}
        .mu-steps{display:flex;align-items:center;gap:6px}
        .mu-steps b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:600 10px var(--font-mono);box-shadow:inset 0 0 0 1px var(--line)}
        .mu-steps b.on{background:var(--ink);color:var(--on-ink);box-shadow:none}
        .mu-steps span{flex:1;height:1px;background:var(--line)}
        .mu-field{display:flex;flex-direction:column;gap:5px;padding:8px;border-radius:9px;box-shadow:inset 0 0 0 1px var(--line)}
        .mu-field small{font:600 9px var(--font-mono);color:var(--mute)}
        .mu-chartbox{display:flex;flex-direction:column;gap:10px;background:var(--paper);border-radius:12px;padding:10px}
        .mu-chart{flex:1;display:flex;align-items:flex-end;gap:5px;min-height:60px}
        .mu-chart i{flex:1;background:var(--ink);border-radius:4px 4px 0 0;opacity:.85}
        .mu-chart i:nth-child(odd){opacity:.35}

        @media (max-width:980px){
          .wk{flex-direction:column;height:auto}
          .wk-p{flex:none;min-width:0;height:76px;transition:height .8s var(--ease)}
          .wk-p.is-open{height:auto}
          .wk-spine{position:relative;flex-direction:row;padding:0 20px;height:76px;gap:14px}
          .wk-p.is-open .wk-spine{display:none}
          .wk-vt{writing-mode:horizontal-tb;transform:none;flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis}
          .wk-body{position:relative;inset:auto;grid-template-columns:minmax(0,1fr);display:none}
          .wk-p.is-open .wk-body{display:grid}
          .wk-ui{height:280px}
          .wk-info{overflow:visible}
        }
        @media (max-width:520px){.wk-f{grid-template-columns:minmax(0,1fr)}}
      `}</style>
      <div className="wrap">
        <SectionHead index="03" label="Selected work" id="work-title" title="Things I've" accent="built." />
        <div className="wk rv">
          {PROJECTS.map((p, i) => {
            const isOpen = open === i;
            return (
              <article
                key={p.id}
                className={`wk-p${isOpen ? " is-open" : ""}`}
                onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
                aria-labelledby={`wk-${p.id}`}
              >
                <button type="button" className="wk-spine" onClick={() => setOpen(i)} onFocus={() => setOpen(i)} aria-expanded={isOpen} aria-controls={`wk-b-${p.id}`} tabIndex={isOpen ? -1 : 0}>
                  <span className="mono">{p.index}</span>
                  <span className="wk-vt">{p.title}</span>
                  <span className="wk-plus" aria-hidden="true">+</span>
                </button>
                <div className="wk-body" id={`wk-b-${p.id}`}>
                  <div className="wk-info">
                    <p className="wk-k">
                      {p.index} — {p.kicker}
                    </p>
                    <h3 className="wk-t" id={`wk-${p.id}`}>{p.title}</h3>
                    <p className="wk-d">{p.description}</p>
                    <ul className="wk-f">
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div className="wk-tech" aria-label="Tech stack">
                      {p.tech.map((t) => (
                        <span key={t.name}>
                          {t.logo && <TechLogo name={t.logo} size={14} />}
                          {t.name}
                        </span>
                      ))}
                    </div>
                    {p.link && (
                      <div className="wk-cta">
                        <a className="btn btn-primary" href={p.link.href} target="_blank" rel="noreferrer">
                          {p.link.label} ↗
                        </a>
                      </div>
                    )}
                  </div>
                  {p.shot ? (
                    <figure className="wk-ui wk-shot">
                      <div className="wk-shot-bar" aria-hidden="true">
                        <i /><i /><i />
                        <span>{p.shot.domain}</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.shot.small}
                        srcSet={`${p.shot.small} 720w, ${p.shot.src} 1440w`}
                        sizes="(max-width: 980px) 90vw, 40vw"
                        alt={`Home page of ${p.title} (${p.shot.domain}), screenshot of the live site`}
                        width={p.shot.w}
                        height={p.shot.h}
                        style={p.shot.contain ? { objectFit: "contain", objectPosition: "center" } : undefined}
                        loading="lazy"
                        decoding="async"
                      />
                      <figcaption className="wk-ui-l">Live site</figcaption>
                    </figure>
                  ) : (
                    <div className="wk-ui" role="img" aria-label={`Illustrative interface sketch for ${p.title}, not a real screenshot`}>
                      <MiniUI />
                      <span className="wk-ui-l">Illustrative UI</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
