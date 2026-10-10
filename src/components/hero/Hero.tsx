"use client";

import { useEffect, useRef } from "react";
import { CAR, PROFILE } from "@/lib/data";
import { fitCanvas, loadBitmap, type Frame } from "@/lib/frames";
import { createSmoke } from "@/lib/smoke";
import { scrollToTarget } from "@/lib/scroll";

const S = CAR.side;
const DRIVE_END = 0.75; // share of the pinned scroll spent driving across
// Wheel sprite display width: car width (125vw phones / 105vw desktop) × sprite share of the frame.
const WHEEL_SIZES = `(max-width: 860px) ${Math.ceil(125 * CAR.side.wheelSize)}vw, ${Math.ceil(105 * CAR.side.wheelSize)}vw`;
// Overhead "studio" lights fixed on screen (fractions of the viewport): their reflections slide
// across the paint as the car drives under them.
const LIGHTS = [0.18, 0.62, 1.02];

/**
 * Pinned hero: the M4 drives in from the right and exits left as you scroll, and the solid name is
 * revealed behind its rear bumper. The wheels are separate sprites rotated live (CSS transform, on
 * the compositor) by exact distance travelled, so they turn smoothly at any refresh rate; a
 * pre-blurred copy fades in with wheel speed. Static when html lacks .drive (reduced motion / no JS).
 */
export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const spinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nameRef = useRef<HTMLSpanElement>(null);
  const smokeRef = useRef<HTMLCanvasElement>(null);
  const sheenRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!document.documentElement.classList.contains("drive")) return;
    const hero = heroRef.current!, car = carRef.current!, name = nameRef.current!;
    const sheen = sheenRef.current!;
    const spins = spinRefs.current.filter(Boolean) as HTMLDivElement[];
    const sctx = sheen.getContext("2d")!;
    const smoke = createSmoke(smokeRef.current!);
    // Layout values cached on resize, so the frame loop never forces layout.
    let W = 0, H = 0, top = 0, vw = 0, vh = 0, heroTop = 0, heroH = 0, nameL = 0, nameW = 0, nameT = 0, nameH = 0, raf = 0, running = false;
    let lastSheenX = NaN, lastX = NaN, lastT = 0, lastAngle = 0, speed = 0, emitAcc = 0, blur = 0;
    let lastP = -1, dirty = true, lastCarT = "", lastClip = "";
    let mask: Frame | null = null;

    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      heroTop = hero.offsetTop;
      heroH = hero.offsetHeight;
      W = car.offsetWidth;
      H = car.offsetHeight;
      top = car.offsetTop;
      const r = name.getBoundingClientRect();
      const st = name.offsetParent!.getBoundingClientRect(); // the sticky stage (car is positioned in it too)
      nameL = r.left;
      nameW = r.width;
      nameT = r.top - st.top;
      nameH = r.height;
      lastSheenX = NaN;
      lastX = NaN; // a resize isn't motion: no smoke burst
      dirty = true;
    };
    loadBitmap(S.mask).then((m) => (mask = m)).catch(() => {});
    // Fetch the blurred wheels after the page has loaded (they never compete with the LCP image).
    const loadBlur = () =>
      hero.querySelectorAll<HTMLImageElement>("img.blur[data-srcset]").forEach((img) => {
        img.srcset = img.dataset.srcset!;
        img.removeAttribute("data-srcset");
      });
    if (document.readyState === "complete") loadBlur();
    else window.addEventListener("load", loadBlur, { once: true });
    const unfitSheen = fitCanvas(sheen, measure, 0.5); // reflections are soft: half resolution

    // Moving reflections: soft skewed light bands fixed in screen space, clipped to the paint.
    const drawSheen = (x: number) => {
      if (!mask) return;
      const sw = sheen.width, sh = sheen.height, k = sw / W;
      sctx.globalCompositeOperation = "source-over";
      sctx.clearRect(0, 0, sw, sh);
      for (const L of LIGHTS) {
        const cx = (L * vw - x) * k; // light position relative to the car, in sheen px
        const bw = sw * 0.16; // broad, soft: an overhead softbox seen in the paint
        if (cx < -bw * 3 || cx > sw + bw * 3) continue;
        const g = sctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.3, "rgba(255,255,255,0.35)");
        g.addColorStop(0.5, "rgba(255,255,255,0.7)");
        g.addColorStop(0.7, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        sctx.fillStyle = g;
        // Skewed like a reflection wrapping over the curved flank.
        sctx.setTransform(1, 0, -0.12, 1, sh * 0.12 * 0.5, 0); // slight lean, following the flank
        sctx.fillRect(cx - bw, 0, bw * 2, sh);
        sctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // Brighter on the shoulder line, fading toward the sills.
      sctx.globalCompositeOperation = "destination-in";
      const v = sctx.createLinearGradient(0, sh * 0.15, 0, sh * 0.8);
      v.addColorStop(0, "rgba(0,0,0,.9)");
      v.addColorStop(0.35, "rgba(0,0,0,.6)");
      v.addColorStop(0.7, "rgba(0,0,0,.12)");
      v.addColorStop(1, "rgba(0,0,0,0)");
      sctx.fillStyle = v;
      sctx.fillRect(0, 0, sw, sh);
      sctx.drawImage(mask, 0, 0, sw, sh);
      sctx.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
      lastT = now;
      // Progress from cached layout + scrollY (no per-frame layout reads).
      const p = Math.min(1, Math.max(0, (window.scrollY - heroTop) / Math.max(1, heroH - vh)));
      // Idle: nothing moved and the wheel blur / smoke speed have settled, so skip all writes.
      if (p === lastP && !dirty && blur < 0.002 && speed < 1) return;
      lastP = p;
      dirty = false;
      const t = Math.min(1, p / DRIVE_END);
      const x0 = vw * 0.52 - 0.065 * W; // nose just past centre
      const x1 = -W; // fully gone on the left
      const x = x0 + (x1 - x0) * t;
      const carT = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (carT !== lastCarT) car.style.transform = lastCarT = carT;
      // Burnout: rear tyre smoke while the car is moving, more when it launches hard.
      const prevX = Number.isNaN(lastX) ? x : lastX;
      const v = dt === 0 ? 0 : (prevX - x) / dt; // px/s, leftward positive
      lastX = x;
      const launch = Math.max(0, v - speed);
      speed += (v - speed) * Math.min(1, dt * 8);
      const intensity = Math.min(1, Math.abs(speed) / 1800 + launch / 900);
      if (intensity > 0.06 && x > -W * 0.8) {
        emitAcc += intensity * 260 * dt;
        const wy = top + 0.84 * H; // rear tyre contact patch
        while (emitAcc >= 1) {
          emitAcc -= 1;
          // Spread puffs along the path the rear wheel covered this frame, so the trail is continuous.
          const wx = prevX + (x - prevX) * Math.random() + 0.766 * W;
          smoke.emit(wx, wy, speed * 0.2, -20, W / 1100);
        }
      }
      // Reveal the name along the car's rear outline, band by band, so it appears exactly behind
      // the tail (bands above/below the car use the nearest band's edge).
      const P = S.rearProfile, N = P.length;
      const pts: string[] = [];
      let lastEdge = S.rear;
      for (let i = 0; i < N; i++) {
        const y0 = top + (i * H) / N - nameT, y1 = top + ((i + 1) * H) / N - nameT;
        if (y1 < 0 || y0 > nameH) continue;
        if (P[i] > 0) lastEdge = P[i];
        const e = Math.min(nameW, Math.max(0, x + (P[i] > 0 ? P[i] : lastEdge) * W - nameL));
        pts.push(`${e.toFixed(1)}px ${Math.max(0, y0).toFixed(1)}px`, `${e.toFixed(1)}px ${Math.min(nameH, y1).toFixed(1)}px`);
      }
      const clip = pts.length
        ? `polygon(${nameW + 20}px -20px, ${pts[0].split(" ")[0]} -20px, ${pts.join(", ")}, ${pts[pts.length - 1].split(" ")[0]} ${nameH + 20}px, ${nameW + 20}px ${nameH + 20}px)`
        : `inset(-10% 0 -10% ${Math.min(nameW, Math.max(0, x + S.rear * W - nameL)).toFixed(1)}px)`;
      if (clip !== lastClip) name.style.clipPath = lastClip = clip;
      hero.style.setProperty("--p", p.toFixed(4));
      // Wheels: exact rolling angle = distance / radius (counter-clockwise when driving left).
      const angle = (x0 - x) / (S.wheelRadius * W);
      const omega = dt > 0 ? Math.abs(angle - lastAngle) / dt : 0; // rad/s
      lastAngle = angle;
      blur += (Math.min(1, Math.max(0, (omega - 6) / 18)) - blur) * Math.min(1, dt * 12);
      for (const s of spins) {
        s.style.transform = `rotate(${(-angle).toFixed(4)}rad)`;
        s.style.setProperty("--blur", blur.toFixed(3));
      }
      if (x !== lastSheenX) {
        lastSheenX = x;
        drawSheen(x);
      }
      car.dataset.angle = angle.toFixed(3);
      // Tell the engine sound whether the car is actually on screen.
      const onScreen = x < vw && x + W > 0 ? "1" : "0";
      if (hero.dataset.carVisible !== onScreen) hero.dataset.carVisible = onScreen;
    };

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!e.isIntersecting && running) {
        hero.dataset.carVisible = "0";
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(hero);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      unfitSheen();
      smoke.destroy();
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", loadBlur);
    };
  }, []);

  const ratio = S.height / S.width;
  return (
    <section id="top" ref={heroRef} className="hero" aria-labelledby="hero-title">
      <style href="hero" precedence="default">{`
        .hero{position:relative;--cw:105vw}
        .hero-stage{position:relative;height:100svh;min-height:560px;overflow:clip}
        .hero-name{position:absolute;left:50%;top:38%;translate:-50% -50%;margin:0;font-weight:800;letter-spacing:-.05em;line-height:.8;font-size:clamp(44px,11.6vw,230px);white-space:nowrap;user-select:none}
        .hero-name span{display:block}
        .hero-name .ghost{color:transparent;-webkit-text-stroke:1.2px rgba(var(--fg-rgb),.14)}
        .hero-name .fill{position:absolute;inset:0;color:var(--ink)}
        .drive-car{position:absolute;left:0;top:calc(46% - var(--cw) * ${ratio} / 2);width:var(--cw);aspect-ratio:${S.width}/${S.height};transform:translateX(calc(50vw - var(--cw) / 2))}
        .hero-smoke{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none}
        html.drive .hero-smoke{display:block}
        .drive-car{will-change:transform}
        .drive-car > img,.drive-car > canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
        .wheel{position:absolute;translate:-50% -50%;aspect-ratio:1;width:${S.wheelSize * 100}%;mask-size:100% 100%;-webkit-mask-size:100% 100%;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat}
        .spin{position:absolute;inset:0;will-change:transform}
        .spin img{position:absolute;inset:0;width:100%;height:100%;display:block}
        .spin .sharp{opacity:calc(1 - var(--blur,0) * .9)}
        .spin .blur{opacity:var(--blur,0)}
        .drive-car .sheen{mix-blend-mode:screen;opacity:.32;pointer-events:none}
        /* Headlights: a soft beam ahead of the nose, plus lamp glows. */
        .lamp{position:absolute;border-radius:50%;pointer-events:none;mix-blend-mode:screen;translate:-50% -50%}
        .lamp.head{left:${S.headlight.x * 100}%;top:${S.headlight.y * 100}%;width:6%;aspect-ratio:1;background:radial-gradient(closest-side,rgba(235,244,255,.7),rgba(190,215,255,.18) 45%,transparent)}
        .lamp.tail{left:${S.taillight.x * 100}%;top:${S.taillight.y * 100}%;width:4%;aspect-ratio:1;background:radial-gradient(closest-side,rgba(255,60,60,.55),rgba(200,20,30,.15) 45%,transparent)}
        .beam{position:absolute;right:${(1 - S.headlight.x) * 100 - 1}%;top:${S.headlight.y * 100}%;width:48%;height:44%;translate:0 -40%;pointer-events:none;mix-blend-mode:screen;
          background:linear-gradient(to left,rgba(230,238,255,.16),rgba(230,238,255,.05) 50%,transparent 85%);
          clip-path:polygon(100% 40%,100% 52%,0 92%,0 14%);filter:blur(16px)}
        html:not(.drive) .beam{opacity:.7}
        [data-theme="light"] .beam{display:none} /* no visible beam in daylight */
        /* "Scroll to drive" cue: bottom-centre of the stage, fades out as soon as the drive starts. */
        .hero-hint{position:absolute;left:50%;bottom:calc(clamp(14px,3vh,24px) + 92px);translate:-50% 0;margin:0;display:none;flex-direction:column;align-items:center;gap:12px;font:500 12px var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);pointer-events:none;z-index:2}
        .hero-hint .mouse{width:24px;height:38px;border-radius:14px;box-shadow:inset 0 0 0 1.5px currentColor;position:relative}
        .hero-hint .mouse::after{content:"";position:absolute;left:50%;top:8px;width:3px;height:8px;margin-left:-1.5px;border-radius:2px;background:currentColor;animation:hint 1.6s var(--ease) infinite}
        @keyframes hint{0%{transform:translateY(0);opacity:1}70%{transform:translateY(12px);opacity:0}100%{transform:translateY(0);opacity:0}}
        .hero-copy{position:absolute;left:0;right:0;bottom:clamp(28px,6vh,64px);display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
        .hero-h1{font-weight:700;letter-spacing:-.045em;line-height:.95;font-size:clamp(40px,5.6vw,88px);max-width:7.5em}
        .hero-ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
        .hero-meta{text-align:right;font:500 12px/1.7 var(--font-mono);color:var(--mute);text-transform:uppercase;letter-spacing:.04em}
        .hero-meta b{color:var(--ink);font-weight:500}

        .hero-meta{margin-right:64px}
        html:not(.drive) .hero{--cw:60vw}
        html:not(.drive) .drive-car{top:41%;transform:translateX(calc(100vw - var(--cw) * .97))}
        html.drive .hero{height:340svh}
        html.drive .hero-stage{position:sticky;top:0}
        html.drive .drive-car{transform:translateX(calc(52vw - var(--cw) * .065))}
        html.drive .hero-name .fill{clip-path:inset(-10% 0 -10% 100%)}
        html.drive .hero-hint{display:flex;opacity:calc(1 - var(--p,0) * 25)}
        html.drive .hero-copy{opacity:clamp(0, (var(--p,0) - .55) * 6, 1);translate:0 calc((1 - clamp(0, (var(--p,0) - .55) * 6, 1)) * 24px)}

        @media (max-width:860px){
          .hero{--cw:125vw}
          .hero-name{top:32%}
          .drive-car{top:calc(38% - var(--cw) * ${ratio} / 2)}
          html.drive .hero{height:220svh}
          .hero-copy{flex-direction:column;align-items:flex-start;gap:16px;bottom:84px}
          .hero-meta{text-align:left;margin-right:0}
          html:not(.drive) .hero{--cw:100vw}
          html:not(.drive) .drive-car{top:40%;transform:none}
        }
      `}</style>

      <div className="hero-stage">
        <p className="hero-name" aria-hidden="true">
          <span className="ghost">{PROFILE.firstName.toUpperCase()}</span>
          <span className="fill" ref={nameRef}>{PROFILE.firstName.toUpperCase()}</span>
        </p>

        <canvas ref={smokeRef} className="hero-smoke" aria-hidden="true" />
        <div ref={carRef} className="drive-car" role="img" aria-label="3D render of an Isle of Man Green BMW M4 coupé with its headlights on, driving across the screen as you scroll">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={S.body}
            srcSet={`${S.body} ${S.width}w, ${S.bodyHd} ${S.hdWidth}w`}
            sizes="(max-width: 860px) 125vw, 105vw"
            alt=""
            width={S.width}
            height={S.height}
            fetchPriority="high"
            decoding="async"
          />
          <canvas ref={sheenRef} className="sheen" aria-hidden="true" />
          {S.wheels.map((w, i) => (
            <div
              key={w.id}
              className="wheel"
              style={{
                left: `${w.x * 100}%`,
                top: `${w.y * 100}%`,
                // Static mask (doesn't rotate): hides the parts of the tyre the bodywork covers.
                maskImage: `url(/m4/wheels/${w.id}-mask.webp)`,
                WebkitMaskImage: `url(/m4/wheels/${w.id}-mask.webp)`,
              }}
            >
              <div className="spin" ref={(el) => { spinRefs.current[i] = el; }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="sharp"
                  src={`/m4/wheels/${w.id}-sm.webp`}
                  srcSet={`/m4/wheels/${w.id}-sm.webp 260w, /m4/wheels/${w.id}.webp 600w`}
                  sizes={WHEEL_SIZES}
                  alt=""
                  decoding="async"
                />
                {/* Motion-blur copy: only needed once the car moves, so its src is set after load. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="blur" data-srcset={`/m4/wheels/${w.id}-blur-sm.webp 260w, /m4/wheels/${w.id}-blur.webp 600w`} sizes={WHEEL_SIZES} alt="" decoding="async" />
              </div>
            </div>
          ))}
          <span className="beam" aria-hidden="true" />
          <span className="lamp head" aria-hidden="true" />
          <span className="lamp tail" aria-hidden="true" />
        </div>
        <p className="hero-hint" aria-hidden="true"><span className="mouse" />Scroll to drive</p>

        <div className="wrap hero-copy">
          <div>
            <p className="tag">
              <b>{PROFILE.name}</b> — Portfolio
            </p>
            <h1 id="hero-title" className="hero-h1">
              Full Stack <span className="serif-accent">Developer.</span>
            </h1>
            <div className="hero-ctas">
              <a href="#work" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToTarget("#work"); }}>
                Explore work
              </a>
              <a href="#contact" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); scrollToTarget("#contact"); }}>
                Let&apos;s talk
              </a>
              <a href={PROFILE.resume} download className="btn btn-ghost">
                Résumé ↓
              </a>
            </div>
          </div>
          <p className="hero-meta">
            <b>{PROFILE.degree}</b>
            <br />
            {PROFILE.university} · {PROFILE.gradYear}
            <br />
            {PROFILE.location}
          </p>
        </div>
      </div>
    </section>
  );
}
