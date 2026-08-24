import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';

import { loadDocsContent } from '~/utils/docs/mdxModules';

// Cache the lazy() wrapper per path so we don't recreate it (and re-suspend) on every render.
const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>();

function getLazyContent(mdxPath: string) {
  if (!lazyCache.has(mdxPath)) {
    const importFn = loadDocsContent(mdxPath);

    if (!importFn) {
      return null;
    }

    lazyCache.set(mdxPath, lazy(importFn));
  }

  return lazyCache.get(mdxPath)!;
}

interface MDXContentProps {
  path: string;
}

export default function MDXContent({ path }: MDXContentProps) {
  const Content = getLazyContent(path);

  if (!Content) {
    return null;
  }

  return <Content />;
}
