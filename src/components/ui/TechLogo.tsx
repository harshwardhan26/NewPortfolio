/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

// Official brand SVGs copied into public/logos (devicon MIT, simple-icons CC0). `tint` = brand colour for soft glows.
export const BRAND: Record<string, { src: string; tint: string; mono?: boolean }> = {
  python: { src: "/logos/python.svg", tint: "#3776AB" },
  javascript: { src: "/logos/javascript.svg", tint: "#F7DF1E" },
  java: { src: "/logos/java.svg", tint: "#EA2D2E" },
  angular: { src: "/logos/angular.svg", tint: "#DD0031" },
  react: { src: "/logos/react.svg", tint: "#61DAFB" },
  tailwindcss: { src: "/logos/tailwindcss.svg", tint: "#38BDF8" },
  bootstrap: { src: "/logos/bootstrap.svg", tint: "#7952B3" },
  django: { src: "/logos/django.svg", tint: "#092E20", mono: true },
  djangorest: { src: "/logos/djangorest.svg", tint: "#A30000" },
  nodejs: { src: "/logos/nodejs.svg", tint: "#5FA04E" },
  express: { src: "/logos/express.svg", tint: "#444444", mono: true },
  firebase: { src: "/logos/firebase.svg", tint: "#FFCA28" },
  postgresql: { src: "/logos/postgresql.svg", tint: "#336791" },
  sqlite: { src: "/logos/sqlite.svg", tint: "#0F80CC" },
  git: { src: "/logos/git.svg", tint: "#F05032" },
  github: { src: "/logos/github.svg", tint: "#181717", mono: true },
  postman: { src: "/logos/postman.svg", tint: "#FF6C37" },
  vscode: { src: "/logos/vscode.svg", tint: "#007ACC" },
  sentry: { src: "/logos/sentry.svg", tint: "#362D59", mono: true },
  posthog: { src: "/logos/posthog.svg", tint: "#F9BD2B", mono: true },
  docker: { src: "/logos/docker.svg", tint: "#2496ED" },
  typescript: { src: "/logos/typescript.svg", tint: "#3178C6" },
  nextjs: { src: "/logos/nextjs.svg", tint: "#000000", mono: true },
  html5: { src: "/logos/html5.svg", tint: "#E34F26" },
  css3: { src: "/logos/css3.svg", tint: "#1572B6" },
  prisma: { src: "/logos/prisma.svg", tint: "#2D3748", mono: true },
  redis: { src: "/logos/redis.svg", tint: "#DC382D" },
  jest: { src: "/logos/jest.svg", tint: "#C21325" },
  pytest: { src: "/logos/pytest.svg", tint: "#0A9EDC" },
  githubactions: { src: "/logos/githubactions.svg", tint: "#2088FF" },
  vercel: { src: "/logos/vercel.svg", tint: "#000000", mono: true },
  linux: { src: "/logos/linux.svg", tint: "#FCC624" },
  npm: { src: "/logos/npm.svg", tint: "#CB3837" },
  githubcopilot: { src: "/logos/githubcopilot.svg", tint: "#000000", mono: true },
};

const S = (children: ReactNode) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// Thin line icons for concepts that have no brand mark.
export const CONCEPT: Record<string, ReactNode> = {
  sql: S(<><ellipse cx="24" cy="12" rx="13" ry="5" /><path d="M11 12v24c0 2.8 5.8 5 13 5s13-2.2 13-5V12" /><path d="M11 24c0 2.8 5.8 5 13 5s13-2.2 13-5" /></>),
  responsive: S(<><rect x="5" y="9" width="28" height="20" rx="2" /><path d="M14 35h10M19 29v6" /><rect x="33" y="17" width="11" height="20" rx="2" /><path d="M37.5 33.5h2" /></>),
  rest: S(<><path d="M8 16h26l-6-6M40 32H14l6 6" /><circle cx="40" cy="16" r="2" /><circle cx="8" cy="32" r="2" /></>),
  dsa: S(<><circle cx="24" cy="9" r="4" /><circle cx="12" cy="24" r="4" /><circle cx="36" cy="24" r="4" /><circle cx="6" cy="39" r="3" /><circle cx="18" cy="39" r="3" /><path d="M21.5 12 14.5 21M26.5 12l7 9M10.3 27.5 7.5 36.3M13.7 27.5l2.8 8.8" /></>),
  oop: S(<><rect x="16" y="5" width="16" height="12" rx="2" /><rect x="5" y="31" width="16" height="12" rx="2" /><rect x="27" y="31" width="16" height="12" rx="2" /><path d="M24 17v7M13 31v-7h22v7" /></>),
  auth: S(<><rect x="10" y="21" width="28" height="21" rx="3" /><path d="M16 21v-6a8 8 0 0 1 16 0v6" /><circle cx="24" cy="31" r="2.5" /><path d="M24 33.5V37" /></>),
  api: S(<><path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28" /></>),
  dbdesign: S(<><rect x="5" y="7" width="16" height="14" rx="2" /><path d="M5 12h16" /><rect x="27" y="27" width="16" height="14" rx="2" /><path d="M27 32h16M21 14h4a4 4 0 0 1 4 4v9" /></>),
  unit: S(<><rect x="8" y="8" width="32" height="32" rx="4" /><path d="m16 24 6 6 11-12" /></>),
  integration: S(<><rect x="5" y="16" width="14" height="16" rx="3" /><rect x="29" y="16" width="14" height="16" rx="3" /><path d="M19 24h10M25 20l4 4-4 4" /></>),
  debug: S(<><ellipse cx="24" cy="27" rx="9" ry="12" /><path d="M24 15v24M15 24H7M41 24h-8M16 17l-5-5M32 17l5-5M16 35l-5 5M32 35l5 5M19 15a5 5 0 0 1 10 0" /></>),
  query: S(<><circle cx="20" cy="20" r="12" /><path d="m29 29 12 12M14 20h12M14 15h8M14 25h6" /></>),
  agile: S(<><path d="M38 24a14 14 0 1 1-4.1-9.9" /><path d="M39 8v8h-8" /><circle cx="24" cy="24" r="3" /></>),
  sdlc: S(<><circle cx="24" cy="9" r="4" /><circle cx="39" cy="24" r="4" /><circle cx="24" cy="39" r="4" /><circle cx="9" cy="24" r="4" /><path d="M28 10.5 36.5 20M37.5 28 28 37.5M20 37.5 10.5 28M10.5 20 20 10.5" /></>),
  mvc: S(<><rect x="5" y="8" width="38" height="9" rx="2" /><rect x="5" y="21" width="17" height="19" rx="2" /><rect x="26" y="21" width="17" height="19" rx="2" /></>),
};

export const isBrand = (key: string) => key in BRAND;

export function TechLogo({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const b = BRAND[name];
  // Black/very dark marks are shown as light silhouettes so they stay visible on the dark theme.
  if (b)
    return (
      <img src={b.src} alt="" width={size} height={size} className={[className, b.mono && "logo-mono"].filter(Boolean).join(" ")} loading="lazy" decoding="async" />
    );
  const c = CONCEPT[name];
  if (!c) return null;
  return (
    <span className={className} style={{ display: "inline-grid", width: size, height: size, color: "var(--ink)" }}>
      {c}
    </span>
  );
}
