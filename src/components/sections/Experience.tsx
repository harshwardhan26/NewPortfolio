"use client";

import { useEffect, useRef, useState } from "react";
import { CAR, EDUCATION, EXPERIENCE } from "@/lib/data";
import { fitCanvas, loadFrames, nearest, type Frames } from "@/lib/frames";
import { useScrollProgress } from "@/lib/hooks";
import { SectionHead } from "../ui/SectionHead";

// Chronological by start year.
const STOPS = [...EDUCATION, ...EXPERIENCE].sort((a, b) => parseInt(a.when.match(/\d{4}/)![0]) - parseInt(b.when.match(/\d{4}/)![0]));

const T = CAR.turn;
// Turntable frames: 7 = nose toward the viewer (driving down the page), 43 = nose away (driving up).
const DOWN = 7, UP = 43;

/**
 * A small M4 riding the tip of the timeline spine. Facing down while the line draws down; on a scroll
 * back up it U-turns (steps frame by frame through the side view) and faces away.
 */
function TimelineCar({ progress }: { progress: number }) {
  const boxRef = useRef<HTMLLIElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const target = useRef(DOWN);
  const last = useRef(progress);

  // Direction of travel decides which way the car faces.
  useEffect(() => {
    if (progress > last.current + 1e-4) target.current = DOWN;
    else if (progress < last.current - 1e-4) target.current = UP;
    last.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!document.documentElement.classList.contains("drive")) return;
    const box = boxRef.current!, cv = cvRef.current!;
    const ctx = cv.getContext("2d")!;
    let frames: Frames = [], cancel = () => {}, raf = 0, cur = DOWN, shown = -1, acc = 0, lastT = 0;
    const unfit = fitCanvas(cv, () => (shown = -1));
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      acc += Math.min(0.1, (t - (lastT || t)) / 1000);
      lastT = t;
      // U-turn: one frame (5°) every 1/45 s toward the target, always turning the same way.
      while (acc > 1 / 45 && cur !== target.current) {
        acc -= 1 / 45;
        cur = (cur + 1) % T.frames;
      }
      if (cur === target.current) acc = 0;
      if (cur !== shown) {
        const img = nearest(frames, cur, T.frames);
        if (img) {
          shown = cur;
          ctx.imageSmoothingQuality = "high";
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.drawImage(img, 0, 0, cv.width, cv.height);
        }
      }
    };
    // Load the frames and run only while the timeline is near the viewport.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!frames.length) ({ frames, cancel } = loadFrames(T.dir, T.frames, () => (shown = -1)));
          if (!raf) raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      cancel();
      unfit();
    };
  }, []);

  return (
    <li ref={boxRef} className="tl-car" aria-hidden="true" style={{ "--p": progress } as React.CSSProperties}>
      <canvas ref={cvRef} />
    </li>
  );
}

export default function Experience() {
  const listRef = useRef<HTMLOListElement>(null);
  const progress = useScrollProgress(listRef, 0.7, 0.55);
  const [marks, setMarks] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => {
      const ol = listRef.current;
      if (!ol) return;
      const h = ol.offsetHeight || 1;
      setMarks(Array.from(ol.querySelectorAll<HTMLElement>(":scope > li.tl-stop"), (li) => (li.offsetTop + 14) / h));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section id="experience" className="section" aria-labelledby="exp-title">
      <style href="exp" precedence="default">{`
        .tl{position:relative;list-style:none;margin:56px 0 0;padding:0 0 0 clamp(36px,6vw,80px);max-width:900px}
        .tl-spine{position:absolute;left:clamp(10px,2vw,24px);top:6px;bottom:0;width:2px;background:var(--soft);border-radius:2px}
        .tl-spine i{position:absolute;inset:0;background:var(--ink);transform-origin:50% 0;border-radius:2px}
        .tl-stop{position:relative;padding-bottom:clamp(40px,7vh,72px);display:grid;grid-template-columns:150px minmax(0,1fr);gap:8px 32px}
        .tl-stop > *{transform:translateX(-6px);transition:transform .8s var(--ease)}
        .tl-stop.is-lit > *{transform:none}
        .tl-t,.tl-next b{color:var(--mute);transition:color .8s var(--ease)}
        .tl-stop.is-lit .tl-t,.tl-stop.is-lit .tl-next b{color:var(--ink)}
        .tl-stop::before{content:"";position:absolute;left:calc(-1 * clamp(36px,6vw,80px) + clamp(10px,2vw,24px) - 6px);top:6px;width:14px;height:14px;border-radius:50%;background:var(--paper);box-shadow:inset 0 0 0 2px var(--faint);transition:box-shadow .5s var(--ease),background-color .5s var(--ease),transform .5s var(--ease)}
        .tl-stop.is-lit::before{background:var(--ink);box-shadow:inset 0 0 0 2px var(--ink),0 0 0 6px rgba(var(--fg-rgb),.08);transform:scale(1.1)}
        .tl-when{font:500 13px/1.6 var(--font-mono);color:var(--mute)}
        .tl-kind{display:inline-block;margin-top:6px;font:500 10px var(--font-mono);text-transform:uppercase;letter-spacing:.08em;padding:3px 8px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line)}
        .tl-t{font-weight:700;letter-spacing:-.035em;font-size:clamp(22px,2.4vw,34px);line-height:1.05}
        .tl-place{color:var(--ink-2);margin-top:6px}
        .tl-d{color:var(--mute);margin-top:8px;line-height:1.55;max-width:40em}
        .tl-next{margin-top:8px;border:1.5px dashed rgba(var(--fg-rgb),.25);border-radius:24px;padding:24px 28px;display:flex;align-items:baseline;gap:16px;flex-wrap:wrap}
        .tl-next b{font-weight:700;letter-spacing:-.04em;font-size:clamp(26px,3vw,40px)}
        .tl-car{display:none}
        html.drive .tl-car{display:block;position:absolute;z-index:3;pointer-events:none;left:calc(clamp(10px,2vw,24px) + 1px);top:calc(6px + (100% - 6px) * var(--p,0));width:clamp(130px,12vw,180px);aspect-ratio:${T.width}/${T.height};translate:-50% -62%;filter:drop-shadow(0 10px 14px rgba(0,0,0,.6))}
        .tl-car canvas{width:100%;height:100%;display:block}
        @media (max-width:640px){.tl-stop{grid-template-columns:minmax(0,1fr)}}
      `}</style>
      <div className="wrap">
        <SectionHead index="04" label="Experience & education" id="exp-title" title="The path" accent="so far." />
        <ol ref={listRef} className="tl">
          <li className="tl-spine" aria-hidden="true">
            <i style={{ transform: `scaleY(${progress})` }} />
          </li>
          <TimelineCar progress={progress} />
          {STOPS.map((s, i) => (
            <li key={s.title} className={`tl-stop${progress >= (marks[i] ?? 1) - 0.02 ? " is-lit" : ""}`}>
              <div>
                <p className="tl-when">{s.when}</p>
                <span className="tl-kind">{s.kind}</span>
              </div>
              <div>
                <h3 className="tl-t">{s.title}</h3>
                <p className="tl-place">{s.place}</p>
                {s.detail && <p className="tl-d">{s.detail}</p>}
              </div>
            </li>
          ))}
          <li className={`tl-stop${progress > 0.97 ? " is-lit" : ""}`} style={{ paddingBottom: 0 }}>
            <p className="tl-when">Next</p>
            <div className="tl-next">
              <b>Your team?</b>
              <a href="#contact" className="btn btn-ghost">Let&apos;s talk →</a>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
