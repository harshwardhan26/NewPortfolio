"use client";

/**
 * One virtual M4 drivetrain shared by the engine sound and the HUD.
 * - Cruise (default): scroll speed is the accelerator (what the visitor "asks for").
 * - Drive mode: DriveMode writes the simulated car's speed / throttle / wheelspin into `input`.
 * A 6-speed gearbox turns road speed into revs: upshift ignition cut, rev-matched downshift
 * blips, lift-off crackle. `pops` increments whenever the exhaust should crackle.
 */
export const GEAR_TOP = [58, 95, 135, 175, 215, 265]; // km/h at the shift point
export const IDLE = 850, REDLINE = 7400;
const SHIFT_RPM = 7300, DOWN_RPM = 2900;
const PX_PER_M = 46; // page px per metre (matches the drive-mode car scale on desktop)

export const drivetrain = {
  driving: false, // drive mode active
  input: { speed: 0, throttle: 0, spin: 0, reverse: false }, // drive mode: m/s, 0..1, 0..1
  speed: 0, // km/h
  rpm: IDLE,
  gear: 1, // 1..6 (0 = reverse)
  throttle: 0,
  pops: 0,
  odo: 0, // metres travelled this visit
  lap: 0, // seconds on the site
};

let started = false;

export function startDrivetrain() {
  if (started || typeof window === "undefined") return;
  started = true;
  const d = drivetrain;
  let lastY = window.scrollY, lastT = performance.now(), g = 0, cut = 0, blip = 0, popCool = 0, wasPushing = false;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    d.lap += dt;
    const dy = Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;

    let r: number;
    if (d.driving) {
      const kmh = Math.abs(d.input.speed) * 3.6;
      d.speed = kmh;
      d.odo += Math.abs(d.input.speed) * dt;
      d.throttle = d.input.throttle;
      if (d.input.reverse) {
        g = 0;
        r = Math.max(IDLE, kmh * (REDLINE / 40));
      } else {
        const idx = GEAR_TOP.findIndex((top) => kmh < top * 0.97);
        g = idx < 0 ? GEAR_TOP.length - 1 : idx;
        r = Math.max(IDLE, kmh * (REDLINE / GEAR_TOP[g]));
      }
      r = Math.min(REDLINE + 200, r + d.input.spin * 2600); // wheelspin flares the revs
      d.gear = d.input.reverse ? 0 : g + 1;
    } else {
      d.odo += dy / PX_PER_M;
      const v = dy / (dt * 1000); // px per ms
      const target = Math.min(1, v / 2.4) * 260; // km/h the scroll is asking for
      const pushing = target > d.speed + 2;
      if (pushing) {
        d.speed += Math.min(75, (target - d.speed) * 2.2) * dt;
        d.throttle = Math.min(1, 0.45 + (target - d.speed) / 50);
      } else {
        d.speed = Math.max(0, d.speed - Math.max(14, (d.speed - target) * 1.1) * dt); // engine braking
        d.throttle = 0.03;
      }
      r = Math.max(IDLE, d.speed * (REDLINE / GEAR_TOP[g]));
      if (r > SHIFT_RPM && g < GEAR_TOP.length - 1) {
        g++;
        cut = 0.11; // ignition cut on upshift
        d.pops++;
      } else if (r < DOWN_RPM && g > 0) {
        g--;
        blip = 0.14; // rev-matched downshift
      }
      r = Math.max(IDLE, d.speed * (REDLINE / GEAR_TOP[g]));
      if (cut > 0) {
        cut -= dt;
        d.throttle = 0;
        r *= 0.97;
      }
      if (blip > 0) {
        blip -= dt;
        d.throttle = Math.max(d.throttle, 0.7);
        r = Math.min(REDLINE, r * 1.12);
      }
      popCool -= dt;
      if (wasPushing && !pushing && d.rpm > 4800 && popCool <= 0) {
        d.pops++; // lift-off at high revs: overrun crackle
        popCool = 1.2;
      }
      wasPushing = pushing;
      d.gear = g + 1;
    }
    d.rpm += (r - d.rpm) * Math.min(1, dt * 14);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
