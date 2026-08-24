import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
  type LinksFunction,
  type LoaderFunction,
  type MetaFunction,
} from 'react-router';
import './app.css';
import { useEffect } from 'react';
import { popToast } from './utils/services/session.service';
import { AuthLoader } from './utils/services/auth.service';
import { blockUserInteraction } from './utils/services/function.service';
import { ToastProvider } from './components/provider/Toast.Provider';
import { SocketProvider } from './components/provider/Socket.Provider';
import PagePreloader from './components/common/PagePreloader';
import { AnimatePresence } from 'motion/react';
import Spinner from './components/common/Spinner';
import config from '../config';
import { CircleXIcon, HomeIcon, TriangleAlert } from 'lucide-react';
import { getLanguage } from './utils/services/language/server';
import { loadMessages } from './utils/services/language/loader';
import { LanguageProvider, useLanguage } from './utils/services/language/context';

export const links: LinksFunction = () => [
  // 🔤 Fonts
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  },

  // -----------------------------------------------------------------------------
  // Icons
  //
  // Place an `icon.png` file inside the `/public` directory.
  //
  // Recommended:
  // - PNG format
  // - Square image (1:1 aspect ratio)
  // - Minimum 512x512px
  // - 1024x1024px recommended for best quality
  // - Transparent background supported
  //
  // Generate all required web icons by running:
  //
  //   yarn assets
  //
  // This will create:
  // - favicon.ico
  // - favicon-16x16.png
  // - favicon-32x32.png
  // - apple-touch-icon.png
  //
  // These icons are used by browsers, bookmarks, tabs,
  // and iOS home screen shortcuts.
  // -----------------------------------------------------------------------------

  {
    rel: 'icon',
    href: '/icon/favicon.ico',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/icon/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/icon/favicon-16x16.png',
  },
  {
    rel: 'apple-touch-icon',
    href: '/icon/apple-touch-icon.png',
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: config.TITLE },
    { name: 'description', content: config.TITLE },
    // 🔹 Robots
    { name: 'robots', content: 'index, follow' },
    // 🔹 Open Graph (Facebook, Discord, etc.)
    { property: 'og:title', content: config.TITLE },
    { property: 'og:description', content: config.TITLE },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '' },
    // 🔹 Twitter / X cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: config.TITLE },
    { name: 'twitter:description', content: config.TITLE },
    { name: 'twitter:image', content: '' },
  ];
};

export const loader: LoaderFunction = async ({ request, context }) => {
  const ctx = context as {
    root?: boolean;
  };
  ctx.root = false;

  const { toastData, destroy } = await popToast(request);
  const response = await AuthLoader(request, [destroy]);
  const payload = {
    toastData,
    user: response.user || null,
  };
  ctx.root = true;
  return response.headers ? data(payload, { headers: response.headers }) : data(payload);
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, messages } = useLoaderData();
  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body id="root">
        <SocketProvider>
          <ToastProvider>{children}</ToastProvider>
        </SocketProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const location = useLocation();
  const isRunning = navigation.state === 'loading' && navigation.formMethod == null && navigation.formAction == null;
  const isNavigationActive = navigation.state !== 'idle';
  useEffect(() => {
    const excludedPages = ['watch'];
    const shouldBlock = isNavigationActive && !excludedPages.some((page) => location.pathname.includes(page) || location.search.includes(page));
    const unblock = shouldBlock ? blockUserInteraction() : null;
    return () => unblock?.();
  }, [isNavigationActive, location.pathname, location.search]);
  return (
    <>
      <PagePreloader />
      <AnimatePresence>{isRunning && <Spinner animate fixed />}</AnimatePresence>
      <Outlet />
    </>
  );
}

const isDev = import.meta.env.DEV;
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { Link } from 'react-router';

export function ErrorBoundary({ error }: { error: any }) {
  const message = error?.data || error?.message || 'An unexpected error occurred.';

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl" />

            <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-800/70 shadow-inner">
              <AlertTriangleIcon size={70} strokeWidth={1.4} className="text-amber-400/80" />
            </div>
          </div>
          <span className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/80">Application Error</span>
          <h1 className="max-w-md text-2xl font-bold tracking-tight text-slate-100">Something went wrong</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            An unexpected error occurred while loading this section. Please try again or return to the homepage.
          </p>

          {isDev && (
            <div className="mt-6 w-full overflow-hidden rounded-xl border border-amber-500/10 bg-black/20 text-left">
              <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/70">Development Error</span>
              </div>

              <div className="max-h-40 overflow-auto p-4">
                <code className="block break-words font-mono text-xs leading-5 text-slate-400">{message}</code>
              </div>
            </div>
          )}
          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleReload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white active:scale-[0.98]"
            >
              <RefreshCwIcon size={16} />
              Try Again
            </button>

            <a
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-950/20 transition-all duration-200 hover:bg-sky-500 active:scale-[0.98]"
            >
              <HomeIcon size={16} />
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
