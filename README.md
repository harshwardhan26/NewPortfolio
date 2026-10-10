# Harshwardhan Patil — Portfolio

A single-page portfolio built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 and Lenis. The palette is white, black and gray only. There is no WebGL and no GSAP. The first load ships about 126 kB of JS.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

## Content

All text lives in `src/lib/data.ts`. Every string traces back to `public/Harshwardhan-Patil-Resume.pdf`, including its embedded links. Components only read from that file.

The résumé has no certifications or achievements, so those sections are left out. `CERTIFICATIONS` and `ACHIEVEMENTS` are empty arrays. To add them later, fill the arrays, then add a section and a `NAV` entry.

## Sections

| # | Section | Component | Signature interaction |
|---|---------|-----------|-----------------------|
| — | Hero | `hero/Hero.tsx` | Pinned stage; a black M4 drives right→left with scroll, wheels rolling, revealing the name |
| — | Drive mode + HUD | `DriveMode.tsx`, `Hud.tsx` | Drive the M4 around the page (real tyre physics, skid marks); live instrument cluster |
| — | Engine sound | `EngineSound.tsx` | Straight-six engine synth with a 6-speed gearbox follows scroll speed (opt-in) |
| 01 | About | `sections/About.tsx` | Lanyard ID card: damped pendulum swing, idle sway, 3D flip (hover / tap / Enter / Space) |
| 02 | Skills | `sections/Skills.tsx` | Periodic table, diagonal wave reveal, family filter, sticky inspector with brand logo |
| 03 | Work | `sections/Work.tsx` | Expanding accordion gallery with an illustrative grayscale mini-UI per project |
| 04 | Experience | `sections/Experience.tsx` | Scroll-drawn timeline spine with an M4 riding its tip; stops light up as it passes |
| 05 | Contact | `sections/Contact.tsx` | Letter-hop heading, copy-email chip (`aria-live`), spinning "say hello" badge |

Shared code: `Navigation.tsx` (frosted pill, sliding active indicator, progress bar, mobile overlay), `ui/RevealObserver.tsx` (`.rv` / `.rv-mask`), `ui/TechLogo.tsx` (`BRAND`, `CONCEPT`, `isBrand()`), `lib/hooks.ts`, and `lib/scroll.tsx` (Lenis plus `scrollToTarget`).

## Hero car and engine sound

The page is built around a glossy black BMW M4, drawn from pre-rendered frames on `<canvas>`. No WebGL runs in the browser.

**Hero drive-by** (`hero/Hero.tsx`, images in `public/m4/body/` and `public/m4/wheels/`):
- The hero pins in place while you scroll, and the car drives in from the right and out to the left.
- The body is a single image with the rims and tyres removed; the brake discs and calipers stay fixed, as on a real car.
- Each wheel is its own sprite, rendered face-on with the camera on the axle so it looks the same at any rotation, and rotated live with a CSS transform by distance ÷ radius. A static mask on each wheel (`wheels/*-mask.webp`, rendered with the body occluding) hides the parts of the tyre the bodywork covers. The angle is continuous, so the wheels turn smoothly at any refresh rate. A pre-blurred copy of each wheel fades in as wheel speed rises.
- Moving reflections: soft light bands fixed on screen, clipped to the paint by `side-mask`, slide across the body as it passes.
- The headlight beam and the lamp glows are CSS layers that move with the car.
- The solid name is revealed behind the rear bumper, and the heading and buttons fade in once the car has gone.

**Timeline car** (`sections/Experience.tsx`, 72 Isle of Man Green turntable frames in `public/m4/turn/`):
- A small M4 rides the tip of the "path so far" line as it draws down with scroll, nose toward you.
- Scroll back up and it U-turns, stepping through the side view to face away, then drives back up.
- The frames load only when the section is near.

**Engine sound** (`EngineSound.tsx` plus `public/audio/engine-worklet.js`):
- The engine is a synthesised straight-six; there's no audio file. It runs in an AudioWorklet:
  - Each cylinder firing is an exhaust pressure pulse (a kick, then a rarefaction dip) plus combustion noise. The firing rate is rpm ÷ 20.
  - Each cylinder varies slightly, which gives the burble.
  - Two exhaust-pipe resonators shape the tone, followed by a low-pass that opens with throttle and soft saturation.
  - Intake rush and overrun crackle are layered on top.
- On the main thread, a high-shelf cut, a low-mid boost and a short synthetic room reverb finish the sound.
- Scroll speed drives a virtual car through a 6-speed gearbox. Revs climb in each gear, upshifts cut the ignition with a crackle, downshifts blip the throttle, and lifting off at high revs pops.
- The sound is opt-in through the round button at the bottom right. It only plays while the intro car is on screen; the button hides once the car has driven off and returns when you scroll back up.

**Drive mode** (`DriveMode.tsx` + `src/lib/carPhysics.ts`; loaded only when used):
- Press **D**, or the HUD's Drive button, to drive the M4 around the whole page.
  - Keys: arrow keys or WASD to drive, **Space** for the handbrake, **Esc** to exit.
  - Touch screens get on-screen pedals instead.
- **Physics:** single-track rear-drive model in SI units using M4 Competition figures: 1,725 kg, 2.86 m wheelbase, yaw inertia, CG height and load transfer.
  - Tyres follow a Pacejka magic formula with a friction circle on the driven rear axle. Power oversteer and handbrake slides come from the tyres, not animation.
  - Drive is torque-limited at low speed and power-limited (320 kW at the wheels) above that. There's also aero drag, plus a 108 km/h governor because the "track" is one screen wide.
  - A light counter-steer assist keeps keyboard drifts catchable.
- `npm run check:physics` checks the model against real-world figures: 0–100 km/h ≈ 4.3 s, 100–0 km/h ≈ 35 m, about 1.1 g cornering, power oversteer, handbrake turns and reverse.
- The page scrolls to follow the car. The screen edges and the page ends act as walls.
- Skid marks are drawn wherever the rear tyres slide or spin and stay on the page until you exit. Tyre smoke and the engine sound follow the simulation.

**HUD** (`Hud.tsx` + `src/lib/drivetrain.ts`):
- An M4-style instrument cluster at the bottom of the screen: tachometer with redline, speed, gear (N/R/1–6), odometer and lap timer.
- It shares one virtual drivetrain with the engine sound: scroll speed when cruising, the simulated car in drive mode.

**Background music** (`MusicToggle.tsx`):
- Put a track at `public/audio/music.mp3`, then set `MUSIC_SRC = "/audio/music.mp3"` in `MusicToggle.tsx` and rebuild. While it's `null`, no music button is shown.
- After the intro (once the car has driven off), a music button takes the sound button's place. Music is opt-in, plays at 8% volume, fades in and out, and pauses if you scroll back to the intro.
- **Licensing:** only add music you're allowed to use. Game soundtracks such as Clash of Clans (Supercell) or Minecraft (Microsoft/C418) are copyrighted. Supercell's Fan Content Policy allows some free, non-commercial fan use with an "unofficial, not endorsed by Supercell" disclaimer. Check its current terms before publishing.

**Scrolling:** Lenis smooth scroll, tuned for calm browsing (`src/lib/scroll.tsx`):
- Each wheel or trackpad tick moves about half as far as native, with a soft glide (`lerp` 0.065).
- A single event can't jump more than 70 px.
- The scroll target can't run more than 40% of a screen ahead, which caps top speed at about 1,300 px/s. In the intro it's 20%, so even a hard flick takes about 4 s to get past the car.
- Touch scrolling on phones stays native. Reduced motion turns it all off.

**Theme:** dark by default. The sun/moon button in the nav switches to light mode, and the choice is saved in `localStorage` and applied before first paint. Colours are tokens on `:root`, overridden under `:root[data-theme="light"]` in `globals.css`.

**Reduced motion / no JS:** an inline script adds `html.drive` before first paint, unless the visitor prefers reduced motion. Without that class, the hero is static (car parked, name visible) and the roaming car isn't rendered.

**Images:** the hero body (1600 or 3840 px, picked by `srcset`; 3840 for large/Retina screens) is the LCP image; the wheel sprites total about 160 KB. Everything is rendered at 2× and downscaled (supersampled) for clean edges. The turntable frames (about 1.5 MB) load only after the page's `load` event, coarse to fine, 4 at a time.

**Re-rendering the frames** (the model folder lives in `assets/`, which is git-ignored):

```bash
npm run render:m4 -- assets/2025_bmw_m4_competition/scene.gltf --paint "#07604f" --set all
```

- `--set body|body-hd|wheels|wheels-blur|side-mask|turn|all` picks which set to render. `wheels` prints the axle positions; copy them into `CAR.side.wheels`. `--lights` sets the headlight brightness.
- `--paint` sets any hex colour. It applies to the materials matched by `--match`, which defaults to the body, bodykit and hood.
- The frame sizes and camera settings are in the `SETS` table in `scripts/render-m4.mjs`. Keep them in sync with `CAR` in `src/lib/data.ts`.

## Fonts

The fonts are self-hosted from `src/fonts` through `next/font/local`. All three are under the SIL Open Font License 1.1, taken from the Fontsource packages:

- Inter Tight (variable)
- Instrument Serif (regular and italic)
- JetBrains Mono (variable)

## Logo credits and licences

- The hero car is based on ["2025 BMW M4 Competition"](https://sketchfab.com/3d-models/2025-bmw-m4-competition-f8141ecd755547989c9209784b71ad43) by [Ddiaz Design](https://sketchfab.com/ddiaz-design), licensed under [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/).
  - The renders in `public/m4/` are repainted (Isle of Man Green), so they are shared under the same licence.
  - The model may not be used commercially, so keep this site non-commercial while it is in use.
  - The credit also appears in the site footer.
  - BMW and M4 are trademarks of BMW AG. This site isn't affiliated with BMW.

- Technology logos come from [Devicon](https://devicon.dev) v2.16.0, under the MIT licence (`public/logos/LICENSE-devicon.txt`).
- The PostHog and GitHub Copilot logos come from [Simple Icons](https://simpleicons.org) v13.21.0, under CC0 1.0 (`public/logos/LICENSE-simple-icons.txt`).
- All logos are trademarks of their respective owners. They appear here only to name the technologies used.
- The concept icons (DSA, OOP, Auth, API, DB design, query optimisation, testing, debugging, Agile, SDLC, MVC, SQL, REST, Responsive) are custom line icons in `ui/TechLogo.tsx`.
