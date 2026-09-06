import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'motion/react';
import { Boxes, Database, Layers, Lock, Radio, Rocket, ServerCog, Shield, Terminal as TerminalIcon, Zap } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

export default function Index() {
  return (
    <div className="flutry-landing relative bg-[#08090D] text-[#E7E9EE] selection:bg-[#5B7CFA]/30 selection:text-white">
      <FontsAndKeyframes />
      <GridBackdrop />

      <Hero />
      <TechRow />
      <Features />
      <DevExperience />
      <Architecture />
      <Benefits />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ------------------------------------- styles / fonts / global keyframes */

function FontsAndKeyframes() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

      .flutry-landing {
        --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        --ink: #E7E9EE;
        --ink-dim: #8A93A6;
        --ink-faint: #565F70;
        --line: rgba(255,255,255,0.08);
        --accent: #5B7CFA;
        --accent-soft: #5B7CFA1a;
        --amber: #F2A65A;
        font-family: var(--font-display);
      }
      .flutry-landing .font-mono { font-family: var(--font-mono); }
      .flutry-landing .font-display { font-family: var(--font-display); }

      @keyframes flutry-dash {
        to { stroke-dashoffset: -200; }
      }
      @keyframes flutry-blink {
        0%, 45% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      @keyframes flutry-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes flutry-pulse-dot {
        0% { transform: scale(0.85); opacity: 0.6; }
        70% { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      .flutry-dash-line { stroke-dasharray: 6 8; animation: flutry-dash 6s linear infinite; }
      .flutry-cursor { animation: flutry-blink 1.1s step-end infinite; }
      .flutry-float { animation: flutry-float 6s ease-in-out infinite; }
      .flutry-corner::before, .flutry-corner::after,
      .flutry-corner-tl::before, .flutry-corner-br::after {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        border-color: var(--accent);
        opacity: 0.7;
      }
      .flutry-corner-tl::before {
        top: -1px; left: -1px;
        border-top: 1.5px solid var(--accent);
        border-left: 1.5px solid var(--accent);
      }
      .flutry-corner-br::after {
        bottom: -1px; right: -1px;
        border-bottom: 1.5px solid var(--accent);
        border-right: 1.5px solid var(--accent);
      }
      @media (prefers-reduced-motion: reduce) {
        .flutry-dash-line, .flutry-cursor, .flutry-float { animation: none !important; }
      }
    `}</style>
  );
}

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 40%, transparent 80%)',
      }}
    />
  );
}

/* --------------------------------------------------------------- Hero -- */

function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 sm:px-8 sm:pt-28 lg:px-10">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7"
        >
          <h1 className="mt-7 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            A backend framework built like the systems it runs.
          </h1>

          <p className="mt-6 max-w-lg text-balance text-base leading-relaxed text-[var(--ink-dim)] sm:text-lg">
            Flutry pairs Fastify's speed with Sequelize, Redis, and Socket.IO under one typed surface — so the shape of your code matches the shape of
            your architecture, from the first route to the last worker.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/docs/latest/getting-started/quick-start"
              className="group inline-flex items-center gap-2 rounded-sm bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#6B8AFF]"
            >
              <Rocket size={16} strokeWidth={2} />
              Get started
            </Link>
            <Link
              to="/docs/latest"
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--ink)] transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.03]"
            >
              Read the docs
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-6 font-mono text-xs text-[var(--ink-faint)]">
            <span>MIT licensed</span>
            <span className="h-3 w-px bg-[var(--line)]" />
            <span>Zero-config CLI</span>
            <span className="h-3 w-px bg-[var(--line)]" />
            <span>Full TypeScript inference</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5"
        >
          <HeroSchematic />
        </motion.div>
      </div>
    </section>
  );
}

function HeroSchematic() {
  return (
    <div className="flutry-corner flutry-corner-tl flutry-corner-br relative flutry-float rounded-sm border border-[var(--line)] bg-white/[0.015] p-6">
      <svg
        viewBox="0 0 400 320"
        className="h-auto w-full"
        role="img"
        aria-label="Flutry request flow: client to server to database, cache, and sockets"
      >
        {/* nodes */}
        <g className="font-mono">
          <NodeBox x={150} y={12} w={100} h={34} label="Client" />
          <NodeBox x={130} y={130} w={140} h={40} label="Flutry Server" accent />
          <NodeBox x={16} y={244} w={104} h={40} label="Sequelize" />
          <NodeBox x={148} y={244} w={104} h={40} label="Redis" />
          <NodeBox x={280} y={244} w={104} h={40} label="Socket.IO" />
        </g>

        {/* connectors */}
        <g stroke="#5B7CFA" strokeOpacity="0.55" strokeWidth="1.5" fill="none">
          <path d="M200 46 L200 130" className="flutry-dash-line" />
          <path d="M170 170 L68 244" className="flutry-dash-line" />
          <path d="M200 170 L200 244" className="flutry-dash-line" />
          <path d="M230 170 L332 244" className="flutry-dash-line" />
        </g>
      </svg>
    </div>
  );
}

function NodeBox({ x, y, w, h, label, accent }: { x: number; y: number; w: number; h: number; label: string; accent?: boolean }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={accent ? 'rgba(91,124,250,0.12)' : 'rgba(255,255,255,0.03)'}
        stroke={accent ? '#5B7CFA' : 'rgba(255,255,255,0.16)'}
        strokeWidth="1"
      />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="12" fill={accent ? '#C9D4FF' : '#AEB6C4'}>
        {label}
      </text>
    </g>
  );
}

/* ---------------------------------------------------------- Tech row -- */

const TECHNOLOGIES = [
  { name: 'TypeScript', note: 'end-to-end types' },
  { name: 'Fastify', note: 'HTTP core' },
  { name: 'Sequelize', note: 'ORM layer' },
  { name: 'Redis', note: 'cache & pub/sub' },
  { name: 'Socket.IO', note: 'realtime layer' },
];

function TechRow() {
  return (
    <section className="border-y border-[var(--line)] bg-white/[0.012]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
          {TECHNOLOGIES.map((t, i) => (
            <div key={t.name} className="flex items-center gap-3">
              {i !== 0 && <span className="hidden h-8 w-px bg-[var(--line)] sm:block" />}
              <div>
                <div className="font-display text-sm font-medium text-[var(--ink)]">{t.name}</div>
                <div className="font-mono text-[11px] text-[var(--ink-faint)]">{t.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Features -- */

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Everything a Node service needs, wired together correctly.
        </h2>
        <p className="mt-4 text-[var(--ink-dim)]">
          Flutry isn't a router with extras bolted on. Each piece — database, cache, realtime, CLI — is designed to share the same types and
          conventions.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-6">
        <FeatureCell
          className="lg:col-span-4"
          icon={<Shield size={18} strokeWidth={1.8} />}
          title="Typed from route to row"
          desc="Request handlers, database models, and socket events share one inference chain — a renamed column or field surfaces as a compile error, not a 2 a.m. incident."
        />
        <FeatureCell
          className="lg:col-span-2"
          icon={<Zap size={18} strokeWidth={1.8} />}
          title="Fastify at the core"
          desc="Built on the fastest mainstream Node HTTP framework, with none of the routing behavior hidden from you."
        />
        <FeatureCell
          className="lg:col-span-2"
          icon={<Database size={18} strokeWidth={1.8} />}
          title="Sequelize, pre-wired"
          desc="Models, migrations, and associations are scaffolded through the CLI and typed against your schema."
        />
        <FeatureCell
          className="lg:col-span-2"
          icon={<Radio size={18} strokeWidth={1.8} />}
          title="Redis, first-class"
          desc="Caching, sessions, and pub/sub messaging share a single client instance across your app."
        />
        <FeatureCell
          className="lg:col-span-2"
          icon={<Layers size={18} strokeWidth={1.8} />}
          title="Realtime out of the box"
          desc="Socket.IO namespaces are declared next to your HTTP routes, not bolted on as an afterthought."
        />
        <FeatureCell
          className="lg:col-span-3"
          icon={<Boxes size={18} strokeWidth={1.8} />}
          title="Modular by package"
          desc="Pull in @flutry/redis or @flutry/database-sequelize independently — the core server never assumes you need either."
        />
        <FeatureCell
          className="lg:col-span-3"
          icon={<TerminalIcon size={18} strokeWidth={1.8} />}
          title="One CLI, whole lifecycle"
          desc="Scaffold, generate, and run — flutry new, flutry generate, and flutry dev cover the project from init to daemon."
        />
      </div>
    </section>
  );
}

function FeatureCell({ icon, title, desc, className = '' }: { icon: React.ReactNode; title: string; desc: string; className?: string }) {
  return (
    <div className={`group relative bg-[#0A0C12] p-7 transition-colors duration-200 hover:bg-white/[0.02] ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--accent)]">{icon}</div>
      <h3 className="mt-5 font-display text-base font-medium text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ink-dim)]">{desc}</p>
    </div>
  );
}

/* ---------------------------------------------------- Developer experience */

const TERMINAL_LINES = ['npx flutry new my-app', 'cd my-app', 'npm run dev'];

function DevExperience() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="border-y border-[var(--line)] bg-white/[0.012]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-24 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From empty folder to running server in three lines.
          </h2>
          <p className="mt-4 text-[var(--ink-dim)]">
            The CLI scaffolds a working project with routing, a database connection, and a development server already configured — no boilerplate
            hunting required.
          </p>
        </div>

        <div ref={ref} className="lg:col-span-7">
          <div className="flutry-corner flutry-corner-tl flutry-corner-br relative overflow-hidden rounded-sm border border-[var(--line)] bg-[#0B0D13]">
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#565F70]/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#565F70]/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#565F70]/40" />
              <span className="ml-3 font-mono text-xs text-[var(--ink-faint)]">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm leading-8">
              {TERMINAL_LINES.map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.25 * i }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[var(--accent)]">$</span>
                  <span className="text-[var(--ink)]">{line}</span>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.9 }}
                className="mt-2 flex items-center gap-3 text-[var(--ink-faint)]"
              >
                <span className="text-[var(--accent)]">→</span>
                server listening on :3000
                <span className="flutry-cursor inline-block h-4 w-1.5 bg-[var(--ink-faint)]" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Architecture */

function Architecture() {
  const packages = [
    { name: '@flutry/server', desc: 'Fastify runtime, routing, lifecycle hooks' },
    { name: '@flutry/database-sequelize', desc: 'Typed models, migrations, associations' },
    { name: '@flutry/redis', desc: 'Shared client, caching, pub/sub channels' },
    { name: '@flutry/common', desc: 'Types and utilities shared across packages' },
    { name: 'CLI', desc: 'Project scaffolding and code generation' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One framework, split into packages you can actually reason about.
          </h2>
          <p className="mt-4 max-w-sm text-[var(--ink-dim)]">
            Every capability ships as its own package under the same namespace. Install what your service needs; leave the rest out of your bundle
            entirely.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-sm border border-[var(--line)] bg-[#0A0C12] p-6 sm:p-8">
            <div className="font-mono text-sm text-[var(--ink)]">
              <div className="text-white">Flutry</div>
              {packages.map((pkg, i) => {
                const isLast = i === packages.length - 1;
                return (
                  <div key={pkg.name} className="mt-3 flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[var(--ink-faint)]">{isLast ? '└──' : '├──'}</span>
                    <span className="text-[var(--accent)]">{pkg.name}</span>
                    <span className="text-xs text-[var(--ink-faint)]">{pkg.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Benefits */

const BENEFITS = [
  { icon: <Zap size={20} strokeWidth={1.8} />, title: 'Fast', desc: 'Fastify-level throughput, no framework tax on top.' },
  { icon: <Lock size={20} strokeWidth={1.8} />, title: 'Type-safe', desc: 'Inference runs from your schema to your handlers.' },
  { icon: <Boxes size={20} strokeWidth={1.8} />, title: 'Modular', desc: 'Every integration is an opt-in package, not a default.' },
  { icon: <ServerCog size={20} strokeWidth={1.8} />, title: 'Developer-first', desc: 'Conventions that stay out of the way once you know them.' },
];

function Benefits() {
  return (
    <section className="border-y border-[var(--line)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[var(--line)] px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-8 lg:grid-cols-4 lg:px-10">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex flex-col gap-3 px-1 py-10 sm:px-8">
            <div className="text-[var(--accent)]">{b.icon}</div>
            <div className="font-display text-lg font-medium text-white">{b.title}</div>
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 sm:px-8 lg:px-10">
      <div className="flutry-corner flutry-corner-tl flutry-corner-br relative overflow-hidden rounded-sm border border-[var(--line)] bg-white/[0.02] px-8 py-16 text-center sm:px-16">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your next service can be typed, cached, and realtime from the first commit.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[var(--ink-dim)]">Install the CLI and have a running project before your coffee's ready.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/docs/getting-started"
            className="inline-flex items-center gap-2 rounded-sm bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#6B8AFF]"
          >
            <Rocket size={16} strokeWidth={2} />
            Get started
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 rounded-sm border border-[var(--line)] px-5 py-3 text-sm font-medium text-[var(--ink)] transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.03]"
          >
            Documentation
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="font-display text-lg font-semibold text-white">Flutry</div>
            <p className="mt-3 max-w-[20ch] text-sm text-[var(--ink-faint)]">A typed backend framework for services that outgrow a single file.</p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: 'Features', to: '/#features' },
              { label: 'Packages', to: '/#architecture' },
              { label: 'Documentation', to: '/docs' },
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              { label: 'Getting started', to: '/docs/getting-started' },
              { label: 'CLI reference', to: '/docs/cli' },
              { label: 'Changelog', to: '/docs/changelog' },
            ]}
          />
          <FooterColumn
            title="Community"
            links={[
              { label: 'GitHub', to: 'https://github.com/Flutry-HQ', external: true },
              { label: 'Discord', to: 'https://github.com/Flutry-HQ', external: true },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col-reverse items-center justify-between gap-4 border-t border-[var(--line)] pt-6 sm:flex-row">
          <span className="font-mono text-xs text-[var(--ink-faint)]">© {new Date().getFullYear()} Flutry. MIT licensed.</span>
          <a
            href="https://github.com/Flutry-HQ"
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--ink-dim)] transition-colors hover:border-white/20 hover:text-white"
            aria-label="GitHub"
          >
            <FaGithub size={15} strokeWidth={1.8} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; to: string; external?: boolean }[] }) {
  return (
    <div>
      <div className="font-mono text-xs text-[var(--ink-faint)]">{title}</div>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((l) =>
          l.external ? (
            <li key={l.label}>
              <a href={l.to} target="_blank" rel="noreferrer" className="text-sm text-[var(--ink-dim)] transition-colors hover:text-white">
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link to={l.to} className="text-sm text-[var(--ink-dim)] transition-colors hover:text-white">
                {l.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
