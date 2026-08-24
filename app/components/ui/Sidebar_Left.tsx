import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

import type { SidebarLeftProps } from '~/utils/types/docs';
import { Select } from '../common/Select';

export default function Sidebar_Left({ versions, currentVersion, categories }: SidebarLeftProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="w-0 shrink-0 lg:w-[20rem] duration-200" />
      <div
        className={[
          'fixed inset-0 top-[4rem] z-30 bg-black/50 backdrop-blur-sm',
          'transition-opacity duration-300',
          'lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={[
          'fixed left-0 top-[4rem] z-40 flex h-[calc(100vh-4rem)] w-[20rem] flex-col overflow-hidden border-r border-slate-800/60 bg-slate-900/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0',
          'lg:translate-x-0 lg:opacity-100',
        ].join(' ')}
      >
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Documentation</span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close documentation navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 lg:hidden"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Version */}
        <div className="mb-4 shrink-0">
          <label htmlFor="docs-version" className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Version
          </label>

          <Select
            options={versions.map((version) => ({
              label: version.title,
              value: version.slug,
            }))}
            placeholder="Select a version"
            onChange={(value) => {
              if (value === null) return;

              setMobileOpen(false);
              navigate(`/docs/${value}`);
            }}
            clearable={false}
            searchable={false}
            value={currentVersion.slug}
            classNames={{
              triggerOpen: 'border-slate-600',
              itemSelected: 'bg-slate-500/15 text-slate-300',
            }}
          />
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 pb-4">
            {/* Index / Welcome */}
            <Link
              to={`/docs/${currentVersion.slug}`}
              onClick={() => setMobileOpen(false)}
              className={[
                'rounded-lg px-3 py-2 text-sm transition',
                location.pathname === `/docs/${currentVersion.slug}`
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
              ].join(' ')}
            >
              {currentVersion.index ?? 'Welcome'}
            </Link>

            {/* Categories */}
            {categories.map((category) => (
              <div key={category.slug}>
                <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-slate-500">{category.title}</h3>

                <div className="flex flex-col gap-1">
                  {category.items.map((item) => {
                    const active = location.pathname === item.url;

                    return (
                      <Link
                        key={item.slug}
                        to={item.url}
                        onClick={() => setMobileOpen(false)}
                        className={[
                          'rounded-lg px-3 py-2 text-sm transition',
                          active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                        ].join(' ')}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Mobile open button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open documentation navigation"
        className="fixed left-4 top-[5rem] z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/90 text-slate-400 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:bg-slate-800 hover:text-white lg:hidden"
      >
        <ChevronRight size={18} />
      </button>
    </>
  );
}
