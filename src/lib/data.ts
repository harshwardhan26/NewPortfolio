// Single source of content. Every string here is traceable to the résumé
// (public/Harshwardhan-Patil-Resume.pdf), including its embedded hyperlinks.

export const PROFILE = {
  name: "Harshwardhan Patil",
  firstName: "Harshwardhan",
  nickname: "Harsh", // preferred short name (About greeting)
  initials: "HP",
  role: "Full Stack Developer",
  email: "hppatilhpp@gmail.com",
  phone: "7588603477",
  phoneHref: "tel:+917588603477",
  location: "Mumbai, Maharashtra",
  github: "https://github.com/harshwardhan26",
  githubLabel: "github.com/harshwardhan26",
  linkedin: "https://www.linkedin.com/in/harshwardhan-p-patil/",
  linkedinLabel: "linkedin.com/in/harshwardhan-p-patil",
  resume: "/Harshwardhan-Patil-Resume.pdf",
  // About-section bio: written by Harshwardhan (the résumé itself has no summary section).
  resumeSummary:
    "A Software Developer and builder passionate about creating practical products that solve real-world problems. I work across full-stack development, AI, and modern web technologies, turning ideas into scalable and user-focused applications.",
  // Verbatim résumé bullet.
  extraLine:
    "Shipped a live, mobile-first student housing marketplace for the Kolhapur market, with map-based property discovery backed by indexed PostgreSQL geo-queries and server-side filtering.",
  // Paraphrase of the résumé's own wording ("replacing a manual spreadsheet workflow").
  quote: "Replacing manual spreadsheet workflows with production full-stack software.",
  currentRole: "Software Developer Intern",
  currentCompany: "Leal Software Solutions Pvt. Ltd.",
  degree: "B.Tech, Computer Engineering",
  honours: "Honours in Data Science",
  cgpa: "7.65/10",
  university: "University of Mumbai",
  gradYear: "2027",
  portrait: "/portrait-bust.webp" as string | null,
};

// Hero car: pre-rendered frame sets (npm run render:m4). The model is CC BY-NC-SA 4.0,
// so the repainted renders carry the same licence. Keep sizes in sync with scripts/render-m4.mjs.
export const CAR = {
  paint: "Isle of Man Green",
  // Side view, nose left; frames are one full wheel revolution.
  // Hero side view (nose left): body without rims/tyres + wheel sprites rotated live on the page.
  side: {
    body: "/m4/body/1600.webp",
    bodyHd: "/m4/body/3840.webp",
    hdWidth: 3840,
    width: 1600,
    height: 640,
    // Wheel sprite centres (tyre outer face, as the camera sees it) and size, as fractions of the
    // frame: renderer output, then fitted against a full-car reference render (scripts/render-m4).
    wheels: [
      { id: "front", x: 0.1862, y: 0.6361 },
      { id: "rear", x: 0.7713, y: 0.6355 },
    ],
    wheelSize: 0.154, // sprite side / frame width
    wheelRadius: 0.0711, // tyre radius / frame width
    // Paint-only alpha mask for the moving reflections.
    mask: "/m4/side-mask/00.webp",
    rear: 0.94,
    // Rightmost opaque x of the body in 32 horizontal bands (fraction of frame width; 0 = no car in
    // that band). The name is revealed along this outline, so it appears exactly behind the tail.
    rearProfile: [0, 0, 0, 0, 0.623, 0.696, 0.746, 0.789, 0.829, 0.913, 0.917, 0.922, 0.924, 0.931, 0.932, 0.932, 0.937, 0.938, 0.939, 0.938, 0.937, 0.931, 0.884, 0.769, 0, 0, 0, 0, 0, 0, 0, 0],
    // Lamp positions as fractions of the frame.
    headlight: { x: 0.09, y: 0.45 },
    taillight: { x: 0.915, y: 0.4 },
  },
  // 360° turntable for the car that roams the page.
  turn: { dir: "/m4/turn/", frames: 72, width: 900, height: 560 },
  credit: {
    title: "2025 BMW M4 Competition",
    url: "https://sketchfab.com/3d-models/2025-bmw-m4-competition-f8141ecd755547989c9209784b71ad43",
    author: "Ddiaz Design",
    authorUrl: "https://sketchfab.com/ddiaz-design",
    licence: "CC BY-NC-SA 4.0",
    licenceUrl: "http://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
};

export const NAV = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

export type Family =
  | "Languages"
  | "Frontend"
  | "Backend"
  | "Databases"
  | "Testing & Quality"
  | "DevOps & Cloud"
  | "Tools & Monitoring"
  | "Concepts";

export type Skill = { name: string; symbol: string; family: Family; logo: string };

const group = (family: Family, skills: [name: string, symbol: string, logo: string][]) => ({
  family,
  skills: skills.map(([name, symbol, logo]) => ({ name, symbol, family, logo })),
});

// `logo` is a key into TechLogo's BRAND or CONCEPT map.
export const SKILL_GROUPS: { family: Family; skills: Skill[] }[] = [
  group("Languages", [
    ["Python", "Py", "python"],
    ["JavaScript", "Js", "javascript"],
    ["TypeScript", "Ts", "typescript"],
    ["Java", "Ja", "java"],
    ["SQL", "Sq", "sql"],
  ]),
  group("Frontend", [
    ["React", "Re", "react"],
    ["Angular", "Ng", "angular"],
    ["Next.js", "Nx", "nextjs"],
    ["HTML5", "Ht", "html5"],
    ["CSS3", "Cs", "css3"],
    ["Tailwind CSS", "Tw", "tailwindcss"],
    ["Bootstrap", "Bs", "bootstrap"],
    ["Responsive Web Design", "Rw", "responsive"],
  ]),
  group("Backend", [
    ["Node.js", "No", "nodejs"],
    ["Express.js", "Ex", "express"],
    ["Django", "Dj", "django"],
    ["Django REST Framework", "Dr", "djangorest"],
    ["REST APIs", "Ra", "rest"],
    ["Firebase", "Fb", "firebase"],
  ]),
  group("Databases", [
    ["PostgreSQL", "Pg", "postgresql"],
    ["SQLite", "Sl", "sqlite"],
    ["Prisma ORM", "Pr", "prisma"],
    ["Redis", "Rd", "redis"],
    ["Database Design", "Db", "dbdesign"],
    ["Query Optimization", "Qo", "query"],
  ]),
  group("Testing & Quality", [
    ["Unit Testing", "Ut", "unit"],
    ["Integration Testing", "It", "integration"],
    ["Jest", "Je", "jest"],
    ["Pytest", "Pt", "pytest"],
    ["Postman", "Pm", "postman"],
    ["Debugging", "Dg", "debug"],
  ]),
  group("DevOps & Cloud", [
    ["Git", "Gt", "git"],
    ["GitHub", "Gh", "github"],
    ["GitHub Actions (CI/CD)", "Ga", "githubactions"],
    ["Docker", "Dk", "docker"],
    ["Vercel", "Vc", "vercel"],
    ["Linux", "Lx", "linux"],
  ]),
  group("Tools & Monitoring", [
    ["VS Code", "Vs", "vscode"],
    ["Sentry", "Se", "sentry"],
    ["PostHog", "Ph", "posthog"],
    ["GitHub Copilot", "Co", "githubcopilot"],
    ["npm", "Np", "npm"],
  ]),
  group("Concepts", [
    ["Data Structures and Algorithms", "Ds", "dsa"],
    ["Object-Oriented Programming", "Op", "oop"],
    ["Authentication and Authorization", "Au", "auth"],
    ["API Design and Integration", "Ap", "api"],
    ["MVC/MVT Architecture", "Mv", "mvc"],
    ["Agile/Scrum", "Ag", "agile"],
    ["Software Development Life Cycle", "Sd", "sdlc"],
  ]),
];

export type Project = {
  id: string;
  index: string;
  title: string;
  kicker: string;
  description: string;
  features: string[];
  tech: { name: string; logo?: string }[];
  link?: { href: string; label: string };
  // Real home-page screenshot of the live site (public/projects), or an illustrative mini-UI.
  shot?: { src: string; small: string; domain: string; w: number; h: number; contain?: boolean };
  ui?: "hvac";
};

export const PROJECTS: Project[] = [
  {
    id: "aangan-pg",
    index: "01",
    title: "Aangan Hostels and PG",
    kicker: "Student housing marketplace · 2025 – 2026",
    description:
      "Shipped a live, mobile-first student housing marketplace for the Kolhapur market, with map-based property discovery backed by indexed PostgreSQL geo-queries and server-side filtering.",
    features: [
      "Normalised PostgreSQL schema with Prisma ORM",
      "Gated lead capture and verified reviews",
      "Admin console with lead management and CSV export",
      "Owner analytics",
      "Redis sliding-window rate limiting",
      "Sentry, PostHog, technical SEO; Vercel + GitHub Actions CI",
    ],
    tech: [
      { name: "Next.js", logo: "nextjs" },
      { name: "TypeScript", logo: "typescript" },
      { name: "PostgreSQL", logo: "postgresql" },
      { name: "Prisma", logo: "prisma" },
      { name: "Redis", logo: "redis" },
      { name: "Sentry", logo: "sentry" },
    ],
    link: { href: "https://aanganpg.com", label: "View live site" },
    shot: { src: "/projects/aangan-pg.webp", small: "/projects/aangan-pg-sm.webp", domain: "aanganpg.com", w: 1440, h: 1700 },
  },
  {
    id: "aangan-properties",
    index: "02",
    title: "Aangan Properties",
    kicker: "Buy & rent real estate · 2025",
    description:
      "Engineered a residential buy and rent real-estate platform with saved searches, multi-parameter filtering, and affordability calculators, distinct from the PG marketplace in both data model and user journey.",
    features: [
      "Google Generative AI voice assistant",
      "Conversational property discovery",
      "Multi-provider OAuth authentication",
      "Redis caching and rate limiting",
      "Server-side rendering for filter routes",
      "Saved searches and affordability calculators",
    ],
    tech: [
      { name: "Next.js", logo: "nextjs" },
      { name: "TypeScript", logo: "typescript" },
      { name: "PostgreSQL", logo: "postgresql" },
      { name: "Prisma", logo: "prisma" },
      { name: "Redis", logo: "redis" },
      { name: "Google Generative AI" },
    ],
    // The résumé links aangan-demo.vercel.app, which now redirects here.
    link: { href: "https://www.aanganproperties.in", label: "View live site" },
    shot: { src: "/projects/aangan-properties.webp", small: "/projects/aangan-properties-sm.webp", domain: "aanganproperties.in", w: 1440, h: 1700 },
  },
  {
    id: "portfolio",
    index: "03",
    title: "AI-Powered Developer Portfolio",
    kicker: "Portfolio platform · 2025",
    description:
      "Built a responsive full-stack portfolio with an LLM-backed chatbot that answers questions about projects, technical skills, and contact details from a structured knowledge base.",
    features: [
      "REST APIs in Node.js/Express",
      "Live GitHub repository integration",
      "Dynamic project rendering",
      "Mobile-first responsive layouts",
    ],
    tech: [
      { name: "JavaScript", logo: "javascript" },
      { name: "Tailwind CSS", logo: "tailwindcss" },
      { name: "Node.js", logo: "nodejs" },
      { name: "Express.js", logo: "express" },
    ],
    link: { href: "https://hpp.codes", label: "View live site" },
    shot: { src: "/projects/portfolio.webp", small: "/projects/portfolio-sm.webp", domain: "hpp.codes", w: 1440, h: 932, contain: true }, // single-screen site: show it whole
  },
  {
    id: "hlc",
    index: "04",
    title: "HVAC Heat-Load Calculation",
    kicker: "SaaS · Internship at Leal Software Solutions",
    description:
      "Develop a production full-stack SaaS platform for HVAC heat-load calculation using Angular 17 and Django REST Framework, replacing a manual spreadsheet workflow used by the firm’s design engineers.",
    features: [
      "Psychrometric APIs with Pandas and NumPy",
      "Validated against ISHRAE reference cases",
      "JWT auth and RBAC across multi-tenant SaaS",
      "Subscription billing and renewal handling",
      "PDF reports for HLC, AHU and ducting",
      "Unit and integration tests; Postman contracts",
    ],
    tech: [
      { name: "Angular", logo: "angular" },
      { name: "Django REST Framework", logo: "djangorest" },
      { name: "Python", logo: "python" },
      { name: "Bootstrap", logo: "bootstrap" },
      { name: "Chart.js" },
    ],
    ui: "hvac",
  },
];

const PG = "Aangan Hostels and PG";
const PROP = "Aangan Properties";
const FOLIO = "AI-Powered Developer Portfolio";
const HLC = "HVAC Heat-Load Calculation";

// Which résumé work uses which skill (for the Skills inspector).
export const SKILL_USAGE: Record<string, string[]> = {
  Python: [HLC],
  JavaScript: [FOLIO],
  TypeScript: [PG, PROP],
  Angular: [HLC],
  "Next.js": [PG, PROP],
  "Tailwind CSS": [FOLIO],
  Bootstrap: [HLC],
  "Responsive Web Design": [HLC, FOLIO],
  "Node.js": [FOLIO],
  "Express.js": [FOLIO],
  "Django REST Framework": [HLC],
  "REST APIs": [HLC, FOLIO],
  PostgreSQL: [PG, PROP],
  "Prisma ORM": [PG, PROP],
  Redis: [PG, PROP],
  "Database Design": [PG],
  "Query Optimization": [PG],
  "Unit Testing": [HLC],
  "Integration Testing": [HLC],
  Postman: [HLC],
  GitHub: [FOLIO],
  "GitHub Actions (CI/CD)": [PG],
  Vercel: [PG],
  Sentry: [PG],
  PostHog: [PG],
  "Authentication and Authorization": [HLC, PROP],
  "API Design and Integration": [HLC, FOLIO],
};

export type Stop = { kind: "Education" | "Experience"; when: string; title: string; place: string; detail?: string };

export const EDUCATION: Stop[] = [
  // School + junior college: from the previous résumé version, re-added at the owner's request.
  { kind: "Education", when: "Aug. 2013 – May 2021", title: "Schooling", place: "Podar International School, Kolhapur" },
  { kind: "Education", when: "Aug. 2021 – May 2023", title: "Junior College · Science", place: "New Model Junior College, Kolhapur" },
  {
    kind: "Education",
    when: "Aug. 2023 – May 2027 (Expected)",
    title: "B.Tech in Computer Engineering",
    place: "University of Mumbai, Mumbai, Maharashtra",
    detail: "Honours in Data Science · CGPA 7.65/10",
  },
];

export const EXPERIENCE: Stop[] = [
  {
    kind: "Experience",
    when: "June 2026 – Present",
    title: "Software Developer Intern",
    place: "Leal Software Solutions Pvt. Ltd., Pune, Maharashtra",
    detail:
      "Production HVAC heat-load SaaS in Angular 17 and Django REST Framework: psychrometric APIs validated against ISHRAE reference cases, JWT/RBAC across a multi-tenant model, subscription billing, PDF reports, and unit and integration tests.",
  },
];

// Not present in the résumé, so the sections are omitted.
export const CERTIFICATIONS: { title: string; issuer: string }[] = [];
export const ACHIEVEMENTS: { label: string; value: number; caption: string }[] = [];
