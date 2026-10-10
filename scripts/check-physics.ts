// Self-check for src/lib/carPhysics.ts against real-world M4 Competition behaviour.
//   npm run check:physics
import assert from "node:assert/strict";
import { createCar, sideslip, speed, step } from "../src/lib/carPhysics.ts";

const DT = 1 / 120;

// 1. 0–100 km/h: an M4 Competition (RWD) does it in ~3.9 s; a traction-limited model: 3.5–4.6 s.
{
  const s = createCar(0, 0, 0);
  let t = 0;
  while (speed(s) < 100 / 3.6 && t < 10) {
    step(s, { steer: 0, throttle: 1, brake: 0 }, DT);
    t += DT;
  }
  console.log(`0-100 km/h: ${t.toFixed(2)} s`);
  assert.ok(t > 3.5 && t < 4.6, "0-100 time out of range");
  assert.ok(Math.abs(s.y) < 0.01 && Math.abs(s.psi) < 1e-6, "straight-line run must stay straight");
}

// 2. Braking 100–0 km/h: sports tyres ≈ 33–38 m. The car must stop, not reverse.
{
  const s = createCar(0, 0, 0, 100 / 3.6);
  for (let t = 0; t < 6; t += DT) step(s, { steer: 0, throttle: 0, brake: 1 }, DT);
  console.log(`100-0 km/h: ${s.x.toFixed(1)} m`);
  assert.ok(s.x > 30 && s.x < 42, "braking distance out of range");
  assert.equal(s.vx, 0, "brakes must not drive the car backwards");
}

// 3. Cornering: lateral acceleration within tyre grip (~1.1–1.2 g on these tyres).
{
  const s = createCar(0, 0, 0, 25);
  let peak = 0;
  for (let t = 0; t < 6; t += DT) {
    step(s, { steer: 0.08, throttle: 0.35, brake: 0 }, DT);
    peak = Math.max(peak, Math.abs(s.ay) / 9.81);
  }
  console.log(`peak lateral: ${peak.toFixed(2)} g`);
  assert.ok(peak > 0.6 && peak < 1.25, "lateral grip out of range");
}

// 4. Power oversteer: full throttle mid-corner makes the rear step out (β grows).
{
  const s = createCar(0, 0, 0, 14);
  for (let t = 0; t < 1.5; t += DT) step(s, { steer: 0.25, throttle: 0.2, brake: 0 }, DT);
  const before = Math.abs(sideslip(s));
  let maxB = before, spin = 0;
  for (let t = 0; t < 1.2; t += DT) {
    step(s, { steer: 0.25, throttle: 1, brake: 0 }, DT);
    maxB = Math.max(maxB, Math.abs(sideslip(s)));
    spin = Math.max(spin, s.spin);
  }
  console.log(`sideslip: ${(before * 57.3).toFixed(1)}° → ${(maxB * 57.3).toFixed(1)}° under power (wheelspin ${spin.toFixed(2)})`);
  assert.ok(maxB > before * 2 && maxB > 0.12, "car should oversteer under power");
}

// 5. Handbrake turn: yanking the handbrake mid-corner swings the rear out.
{
  const s = createCar(0, 0, 0, 16);
  for (let t = 0; t < 0.6; t += DT) step(s, { steer: 0.2, throttle: 0.3, brake: 0 }, DT);
  let maxB = 0;
  for (let t = 0; t < 0.8; t += DT) {
    step(s, { steer: 0.3, throttle: 0, brake: 0, handbrake: 1 }, DT);
    maxB = Math.max(maxB, Math.abs(sideslip(s)));
  }
  console.log(`handbrake: sideslip up to ${(maxB * 57.3).toFixed(1)}°`);
  assert.ok(maxB > 0.25, "handbrake should swing the rear out");
}

// 6. Reverse: negative throttle drives backwards, gently.
{
  const s = createCar(0, 0, 0);
  for (let t = 0; t < 2; t += DT) step(s, { steer: 0, throttle: -0.3, brake: 0 }, DT);
  console.log(`reverse after 2 s: ${(s.vx * 3.6).toFixed(1)} km/h`);
  assert.ok(s.vx < -2, "reverse should move backwards");
}

// 7. Numerical sanity: long random drive stays finite.
{
  const s = createCar(0, 0, 0, 10);
  for (let i = 0; i < 20000; i++) {
    step(s, { steer: Math.sin(i / 300) * 0.5, throttle: ((i / 500) % 2) - 0.6, brake: i % 1700 < 100 ? 1 : 0, handbrake: i % 2300 < 60 ? 1 : 0 }, DT);
    assert.ok(Number.isFinite(s.x + s.y + s.vx + s.vy + s.r), "state went non-finite");
  }
}
console.log("physics checks passed");
