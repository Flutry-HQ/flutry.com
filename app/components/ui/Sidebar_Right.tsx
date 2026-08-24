import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar_Right() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="w-0 shrink-0 xl:w-[20rem] duration-200" />
      <div
        className={[
          'fixed inset-0 top-[4rem] z-30 bg-black/50 backdrop-blur-sm',
          'transition-opacity duration-300',
          'xl:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={[
          `
            fixed right-0 top-[4rem] z-40
            flex h-[calc(100vh-4rem)]
            w-[20rem]
            flex-col
            overflow-hidden
            border-l border-slate-800/60
            bg-slate-900/80
            p-4
            shadow-2xl shadow-black/20
            backdrop-blur-xl
            transition-all
            duration-300
            ease-in-out
          `,

          /*
           * Mobile:
           * closed by default
           */
          mobileOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',

          /*
           * Desktop:
           * always visible
           */
          'xl:translate-x-0 xl:opacity-100',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">On this page</span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close table of contents"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg
              text-slate-500
              transition
              hover:bg-slate-800
              hover:text-slate-200
              xl:hidden
            "
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right sidebar content */}
        <div className="mt-6">{/* Ide jöhet később a heading navigation */}</div>
      </aside>

      {/* Mobile open button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open table of contents"
        className="fixed right-4 top-[5rem] z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/90 text-slate-400 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:bg-slate-800 hover:text-white xl:hidden"
      >
        <ChevronLeft size={18} />
      </button>
    </>
  );
}
