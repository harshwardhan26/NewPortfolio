/*
 * Straight-six engine synthesiser (AudioWorklet).
 * Pulse-train synthesis: each cylinder firing is a short decaying exhaust pulse + combustion noise,
 * 6 cylinders per 2 crank revolutions (firing rate = rpm / 20 Hz), with per-cylinder variation.
 * The pulse train goes through two exhaust-pipe resonators (feedback combs), a throttle-dependent
 * low-pass, soft saturation and a DC blocker. Intake noise and overrun "pops" are layered on top.
 * Params: rpm (k-rate), throttle 0..1 (k-rate). port.postMessage("pop") fires a crackle burst.
 */
class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "rpm", defaultValue: 850, minValue: 400, maxValue: 9000, automationRate: "k-rate" },
      { name: "throttle", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.cyl = 0;
    this.cylGain = [1, 0.9, 1.06, 0.94, 1.03, 0.88]; // uneven cylinders = burble
    this.pulses = [];
    this.c1 = new Float32Array(2048);
    this.c2 = new Float32Array(2048);
    this.i1 = 0;
    this.i2 = 0;
    this.lp = 0;
    this.lpIn = 0;
    this.dcx = 0;
    this.dcy = 0;
    this.pops = 0; // samples of crackle left
    this.port.onmessage = (e) => {
      if (e.data === "pop") this.pops = Math.floor(sampleRate * (0.12 + Math.random() * 0.25));
    };
  }

  process(_inputs, outputs, params) {
    const out = outputs[0];
    const L = out[0];
    if (!L) return true;
    const sr = sampleRate;
    const rpm = params.rpm[0];
    const thr = params.throttle[0];
    const fire = rpm / 20; // Hz
    // Each firing is a short exhaust pressure kick (half-sine) then a rarefaction dip, so the
    // fundamental is the firing rate itself. Width shrinks with rpm but never overlaps the next.
    const w = Math.max(0.0007, Math.min(0.0032, 0.42 / fire)) * sr; // samples
    const noiseDecay = Math.exp(-1 / (sr * (0.003 + 0.004 * thr)));
    // Exhaust pipe resonances (shift a little with rpm as the gas heats up).
    const len1 = Math.min(2047, Math.floor(sr / (96 + rpm * 0.006)));
    const len2 = Math.min(2047, Math.floor(sr / (151 + rpm * 0.009)));
    const fb = 0.42 + 0.18 * thr;
    const cut = 380 + thr * 2400 + rpm * 0.12;
    const a = Math.exp((-2 * Math.PI * cut) / sr);
    const drive = 1.4 + 2.2 * thr;
    const intake = 0.05 + 0.22 * thr;

    for (let n = 0; n < L.length; n++) {
      // Crank: one firing per 1/fire seconds, tiny timing jitter.
      this.phase += (fire / sr) * (1 + (Math.random() - 0.5) * 0.015);
      if (this.phase >= 1) {
        this.phase -= 1;
        this.cyl = (this.cyl + 1) % 6;
        const e = this.cylGain[this.cyl] * (0.3 + 0.7 * thr) * (0.92 + Math.random() * 0.16);
        this.pulses.push({ e, t: 0, nz: e });
        if (this.pulses.length > 6) this.pulses.shift();
      }

      let s = 0;
      for (let k = this.pulses.length - 1; k >= 0; k--) {
        const p = this.pulses[k];
        const t = p.t;
        if (t < w) s += p.e * Math.sin((Math.PI * t) / w);
        else if (t < 2.6 * w) s -= 0.38 * p.e * Math.sin((Math.PI * (t - w)) / (1.6 * w));
        s += p.nz * (Math.random() * 2 - 1) * (0.18 + 0.3 * thr);
        p.nz *= noiseDecay;
        p.t++;
        if (t > 2.6 * w && p.nz < 1e-3) this.pulses.splice(k, 1);
      }

      // Overrun crackle: sparse sharp spikes.
      if (this.pops > 0) {
        this.pops--;
        if (Math.random() < 0.0016) s += (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 2);
      }

      // Two exhaust pipes (feedback comb resonators).
      const y1 = s + fb * this.c1[this.i1];
      this.c1[this.i1] = y1;
      this.i1 = (this.i1 + 1) % len1;
      const y2 = s + fb * 0.9 * this.c2[this.i2];
      this.c2[this.i2] = y2;
      this.i2 = (this.i2 + 1) % len2;
      let y = (y1 + y2) * 0.5;

      // Intake/induction rush, pulsing with the firing phase.
      y += (Math.random() * 2 - 1) * intake * (0.6 + 0.4 * Math.sin(this.phase * 2 * Math.PI));

      // Throttle-dependent low-pass, saturation, DC block.
      this.lp = (1 - a) * y + a * this.lp;
      const sat = Math.tanh(this.lp * drive) / Math.tanh(drive);
      this.dcy = sat - this.dcx + 0.995 * this.dcy;
      this.dcx = sat;
      L[n] = this.dcy * 0.5;
    }
    for (let ch = 1; ch < out.length; ch++) out[ch].set(L);
    return true;
  }
}

registerProcessor("engine", EngineProcessor);
