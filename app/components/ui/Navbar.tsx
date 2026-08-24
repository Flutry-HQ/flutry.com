import { useEffect, useState } from 'react';
import Image from '../common/Image';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useLocation } from 'react-router';
import config from '../../../config';
import { FaDiscord, FaGithub } from 'react-icons/fa';

export default function Navbar() {
  const location = useLocation();
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    setOpenNav(false);
  }, [location.pathname]);

  const links = [{ to: '/docs', label: 'Docs' }];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label={`${config.TITLE} home`} className="group flex shrink-0 items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-sky-500/20 blur-md opacity-0 transition-opacity duration-300 grou  p-hover:opacity-100" />

              <Image src="/icon-text.png" alt={`${config.TITLE} logo`} width={96} height={32} className="relative h-8 w-max rounded-lg " />
            </div>
          </Link>

          <nav className="ml-10 hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active ? 'text-white' : 'text-white/80 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {link.label}

                  {active && (
                    <motion.span
                      layoutId="navbar-active"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="absolute bottom-0 left-1/2 h-px w-5 -translate-x-1/2 rounded-full bg-sky-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://github.com/Flutry-HQ"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-white sm:flex"
            >
              <FaGithub size={22} strokeWidth={1.8} />
            </a>
            <a
              href="https://github.com/Flutry-HQ"
              target="_blank"
              rel="noreferrer"
              aria-label="Discord"
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-white sm:flex"
            >
              <FaDiscord size={22} strokeWidth={1.8} />
            </a>

            <button
              type="button"
              onClick={() => setOpenNav(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-white/80 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white sm:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {openNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpenNav(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 34,
              }}
              className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-sm flex-col border-l border-white/[0.07] bg-slate-900/60 backdrop-blur-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
                <Link to="/" onClick={() => setOpenNav(false)} className="flex items-center gap-2.5">
                  <Image src="/icon-text.png" alt={`${config.TITLE} logo`} width={90} height={30} className="h-7.5 w-max rounded-lg" />
                </Link>

                <button
                  type="button"
                  onClick={() => setOpenNav(false)}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.01] text-white/80 transition-all hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Mobile navigation">
                {links.map((link) => {
                  const active = isActive(link.to);

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpenNav(false)}
                      className={`flex items-center rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                        active ? 'bg-white/[0.06] text-white' : 'text-white/55 hover:bg-white/[0.035] hover:text-white'
                      }`}
                    >
                      <span className="flex-1">{link.label}</span>

                      {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                    </Link>
                  );
                })}

                <div className="my-3 h-px bg-white/[0.06]" />

                <a
                  href="https://github.com/Flutry-HQ"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.035] hover:text-white"
                >
                  <FaGithub size={17} />
                  GitHub
                </a>
                <a
                  href="https://github.com/Flutry-HQ"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.035] hover:text-white"
                >
                  <FaDiscord size={17} />
                  Discord
                </a>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
