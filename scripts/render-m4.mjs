#!/usr/bin/env node
// Renders the hero car frame sets (transparent WebP):
//   public/m4/body/{1600,2880}.webp + wheels/{front,rear}[-blur].webp  hero side view, wheels separate
//   public/m4/turn/NN.webp  360° turntable (car that roams the page)
//   npm run render:m4 -- [model.gltf] [--paint "#050505"] [--set body|body-hd|wheels|wheels-blur|side-mask|turn|all]
// Offline only: three.js runs in headless Chromium here; the site never ships WebGL.
import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "..");
const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    paint: { type: "string", default: "#07604f" }, // BMW Isle of Man Green
    lights: { type: "string", default: "7" }, // headlight / tail-light emissive intensity
    match: { type: "string", default: "^m4car_(body|bodykit|hood)1$" },
    set: { type: "string", default: "all" },
    quality: { type: "string", default: "0.86" },
    ss: { type: "string", default: "2" }, // supersampling factor
  },
});
const model = positionals[0] ?? "assets/2025_bmw_m4_competition/scene.gltf";

// Keep in sync with CAR in src/lib/data.ts.
const SIDE = { elev: 3, dist: 0.95, start: 0 };
const SETS = {
  // Hero: body without rims/tyres + per-wheel sprites that the page rotates live (smooth at any fps).
  body: { mode: "body", n: 1, w: 1600, h: 640, ...SIDE },
  "body-hd": { mode: "body", n: 1, w: 3840, h: 1536, ...SIDE, q: 0.93 },
  wheels: { mode: "wheels", n: 1, w: 3840, h: 1536, ...SIDE, q: 0.93 },
  "wheel-mask": { mode: "wheel-mask", n: 1, w: 3840, h: 1536, ...SIDE },
  "wheels-blur": { mode: "wheels", n: 1, w: 3840, h: 1536, ...SIDE, q: 0.9, blur: (2 * Math.PI) / 5, samples: 24 },
  // Reference: full car with real wheels, to calibrate the wheel sprites (not shipped; delete after).
  "side-ref": { mode: "side", n: 1, w: 2880, h: 1152, ...SIDE },
  // Paint-only alpha mask (white body, transparent elsewhere) for runtime moving reflections.
  "side-mask": { mode: "mask", n: 1, w: 1600, h: 640, ...SIDE },
  // 360° turntable for the car that roams the page.
  turn: { mode: "turn", n: 72, w: 900, h: 560, elev: 14, dist: 1.8, start: -0.6 },
};

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".gltf": "model/gltf+json", ".bin": "application/octet-stream", ".png": "image/png", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  const path = normalize(join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!path.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.error("page:", e.message));
const qs = new URLSearchParams({ model: "/" + model, paint: o.paint, match: o.match, lights: o.lights });
await page.goto(`http://127.0.0.1:${server.address().port}/scripts/render-m4.html?${qs}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 180_000 });
console.log("materials:", (await page.evaluate(() => window.materials)).join(", "));

for (const [name, set] of Object.entries(SETS)) {
  if (o.set !== "all" && o.set !== name) continue;
  const write = async (rel, url) => {
    const buf = Buffer.from(url.split(",")[1], "base64");
    await mkdir(dirname(join(ROOT, "public/m4", rel)), { recursive: true });
    await writeFile(join(ROOT, "public/m4", rel), buf);
    return buf.length;
  };
  if (set.mode === "wheels" || set.mode === "wheel-mask") {
    const res = await page.evaluate((a) => window.frame(a), { ...set, i: 0, quality: set.q ?? +o.quality, ss: +o.ss });
    const tag = set.mode === "wheel-mask" ? "-vis" : set.blur ? "-blur" : "";
    let bytes = 0;
    for (const [k, wh] of res.entries()) bytes += await write(`wheels/${k ? "rear" : "front"}${tag}.${tag === "-vis" ? "png" : "webp"}`, wh.url);
    // Geometry as fractions of the frame, for CAR.side.wheels in src/lib/data.ts.
    const meta = res.map((wh) => ({ x: +(wh.x / set.w).toFixed(4), y: +(wh.y / set.h).toFixed(4), size: +((wh.half * 2) / set.w).toFixed(4), r: +(wh.r / set.w).toFixed(4) }));
    console.log(`${name} → public/m4/wheels (${(bytes / 1024).toFixed(0)} KB)`, JSON.stringify(meta));
    continue;
  }
  if (set.n === 1) {
    const url = await page.evaluate((a) => window.frame(a), { ...set, i: 0, quality: set.q ?? +o.quality, ss: +o.ss });
    const rel = set.mode === "body" ? `body/${set.w}.webp` : `${name}/00.webp`;
    console.log(`${name} → public/m4/${rel} (${((await write(rel, url)) / 1024).toFixed(0)} KB)`);
    continue;
  }
  const dir = join(ROOT, "public/m4", name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  let bytes = 0;
  for (let i = 0; i < set.n; i++) {
    const url = await page.evaluate((a) => window.frame(a), { ...set, i, quality: set.q ?? +o.quality, ss: +o.ss });
    const buf = Buffer.from(url.split(",")[1], "base64");
    bytes += buf.length;
    await writeFile(join(dir, `${String(i).padStart(2, "0")}.webp`), buf);
    process.stdout.write(`\r${name} ${i + 1}/${set.n}`);
  }
  console.log(` → public/m4/${name} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
}
await browser.close();
server.close();
