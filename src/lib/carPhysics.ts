/**
 * Planar vehicle dynamics for a rear-wheel-drive car (BMW M4 Competition figures), used by drive mode.
 *
 * Single-track ("bicycle") model in SI units, world frame X right / Y up, yaw ψ CCW from +X:
 *   m(v̇x − vy·r) = Fx − Fyf·sinδ − drag
 *   m(v̇y + vx·r) = Fyr + Fyf·cosδ
 *   Iz·ṙ          = a·Fyf·cosδ − b·Fyr
 * Tyres: simplified Pacejka magic formula Fy = μ·Fz·sin(C·atan(B·α)), with a friction circle on the
 * driven rear axle, so traction (or a locked handbrake) uses up lateral grip → oversteer / drifts.
 * Longitudinal load transfer from the previous step's acceleration. Fixed 240 Hz sub-steps.
 */

export const M4 = {
  mass: 1725, // kg
  Iz: 2900, // kg·m² yaw inertia
  a: 1.39, // m, CG → front axle
  b: 1.47, // m, CG → rear axle (wheelbase 2.86 m)
  h: 0.5, // m, CG height
  length: 4.79, // m
  track: 1.6, // m
  muF: 1.16, // front tyre peak friction (Michelin Pilot Sport 4S class)
  muR: 1.12, // rear (slightly less → neutral-to-oversteer balance)
  B: 9.5, // magic-formula stiffness
  C: 1.35, // magic-formula shape
  maxDrive: 14000, // N, low-gear torque limit at the rear contact patch
  power: 320000, // W at the wheels (375 kW / 503 hp crank, ~15 % drivetrain loss)
  maxSteer: 0.6, // rad
  steerRate: 3.5, // rad/s
  CdA: 0.72, // m²
};

const G = 9.81, RHO = 1.2;

export type CarState = {
  x: number; y: number; // m, world
  psi: number; // rad, yaw
  vx: number; vy: number; // m/s, body frame (x forward, y left)
  r: number; // rad/s, yaw rate
  delta: number; // rad, front wheel angle
  ax: number; // m/s², last longitudinal accel (load transfer)
  ay: number; // m/s², last lateral accel
  slipR: number; // rad, rear slip angle (for smoke / skid marks)
  spin: number; // 0..1, rear wheelspin
};

/** steer: target wheel angle (rad). throttle: -1..1 (negative = reverse). brake, handbrake: 0..1. */
export type Controls = { steer: number; throttle: number; brake: number; handbrake?: number };

export const createCar = (x: number, y: number, psi: number, speed = 0): CarState => ({
  x, y, psi, vx: speed, vy: 0, r: 0, delta: 0, ax: 0, ay: 0, slipR: 0, spin: 0,
});

const tyre = (alpha: number, Fz: number, mu: number, p = M4) => mu * Fz * Math.sin(p.C * Math.atan(p.B * alpha));

/** Advance by dt seconds (internally sub-stepped at ≤ 1/240 s). */
export function step(s: CarState, c: Controls, dt: number, p = M4) {
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  const L = p.a + p.b;
  const hb = c.handbrake ?? 0;
  for (let i = 0; i < n; i++) {
    // Steering actuator: rate-limited toward the target.
    const want = Math.max(-p.maxSteer, Math.min(p.maxSteer, c.steer));
    s.delta += Math.max(-p.steerRate * h, Math.min(p.steerRate * h, want - s.delta));

    // Static loads + longitudinal transfer.
    const Fzf = Math.max(0, (p.mass * G * p.b - p.mass * s.ax * p.h) / L);
    const Fzr = Math.max(0, (p.mass * G * p.a + p.mass * s.ax * p.h) / L);

    const u = Math.max(Math.abs(s.vx), 0.5); // avoid the singular slip angle at standstill
    const dir = s.vx >= 0 ? 1 : -1;
    const alphaF = s.delta - Math.atan2(s.vy + p.a * s.r, u) * dir;
    const alphaR = -Math.atan2(s.vy - p.b * s.r, u) * dir;

    // Longitudinal: rear drive (torque/power limited, traction limited), brakes (~60/40),
    // handbrake locks the rear (full sliding friction against the direction of travel).
    const moving = Math.abs(s.vx) > 0.05 ? Math.sign(s.vx) : 0;
    const brakeF = c.brake * p.muF * Fzf * 0.95 * moving;
    const capR = p.muR * Fzr;
    let FxR = c.throttle * Math.min(p.maxDrive, p.power / Math.max(Math.abs(s.vx), 1)) - c.brake * capR * 0.95 * moving;
    if (hb > 0) FxR = FxR * (1 - hb) - hb * capR * 0.9 * moving;
    s.spin = hb > 0 ? 0 : Math.max(0, Math.min(1, (Math.abs(FxR) - capR) / (0.4 * capR)));
    FxR = Math.max(-capR, Math.min(capR, FxR));
    // Friction circle: what's left for cornering on the rear (a locked wheel has almost none).
    const latCapR = Math.sqrt(Math.max(0, capR * capR - FxR * FxR)) * (1 - 0.6 * hb);
    let FyR = tyre(alphaR, Fzr, p.muR, p);
    FyR = Math.max(-latCapR, Math.min(latCapR, FyR));
    const FyF = tyre(alphaF, Fzf, p.muF, p);
    const FxF = -brakeF;

    const v2 = s.vx * s.vx + s.vy * s.vy;
    const drag = 0.5 * RHO * p.CdA * v2 * moving;
    const roll = 0.012 * p.mass * G * moving * Math.min(1, Math.abs(s.vx));

    const fx = FxR + FxF * Math.cos(s.delta) - FyF * Math.sin(s.delta) - drag - roll;
    const fy = FyR + FyF * Math.cos(s.delta) + FxF * Math.sin(s.delta);
    const mz = p.a * (FyF * Math.cos(s.delta) + FxF * Math.sin(s.delta)) - p.b * FyR;

    s.vx += (fx / p.mass + s.vy * s.r) * h;
    s.vy += (fy / p.mass - s.vx * s.r) * h;
    s.r += (mz / p.Iz) * h;
    s.ax = fx / p.mass;
    s.ay = fy / p.mass;

    // Brakes/handbrake can stop the car but never drive it backwards; parked = no creep.
    if ((c.brake > 0 || hb > 0) && c.throttle <= 0 && Math.abs(s.vx) < 0.4) s.vx = 0;
    if (c.throttle === 0 && Math.abs(s.vx) < 0.3 && Math.abs(s.vy) < 0.3) {
      s.vx = s.vy = 0;
      s.r *= 0.9;
    }

    s.psi += s.r * h;
    const cs = Math.cos(s.psi), sn = Math.sin(s.psi);
    s.x += (s.vx * cs - s.vy * sn) * h;
    s.y += (s.vx * sn + s.vy * cs) * h;
    s.slipR = alphaR;
  }
  return s;
}

/** Body sideslip angle β (rad): between where the car points and where it travels. */
export const sideslip = (s: CarState) => Math.atan2(s.vy, Math.max(Math.abs(s.vx), 0.5));
export const speed = (s: CarState) => Math.hypot(s.vx, s.vy);
