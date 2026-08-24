import { ArrowLeftIcon, CircleXIcon, HomeIcon } from 'lucide-react';
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-sky-500/10 blur-xl" />

            <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-800/70">
              <CircleXIcon size={76} strokeWidth={1.4} className="text-slate-500" />
            </div>
          </div>
          <span className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-500">Error 404</span>

          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Page Not Found</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            The page you are looking for does not exist, has been moved, or is no longer available.
          </p>

          <div className="mt-7 flex w-full gap-3">
            <a
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-950/20 transition-all duration-200 hover:bg-sky-500 active:scale-[0.98]"
            >
              <HomeIcon size={17} />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
