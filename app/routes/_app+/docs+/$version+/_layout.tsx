import { MDXProvider } from '@mdx-js/react';
import { Outlet, type LoaderFunctionArgs, useLoaderData } from 'react-router';

import Sidebar_Left from '~/components/ui/Sidebar_Left';
import Sidebar_Right from '~/components/ui/Sidebar_Right';
import { mdxComponents } from '~/components/docs/MDXComponents';

import { getVersion, getVersionMeta } from '~/utils/docs/meta.server';
import type { DocsLoaderData, DocsNavigationCategory } from '~/utils/types/docs';

export async function loader({ params }: LoaderFunctionArgs): Promise<DocsLoaderData> {
  const versionSlug = params.version;

  if (!versionSlug) {
    throw new Response('Documentation version is required', { status: 400 });
  }

  const { meta, version: currentVersion } = getVersion(versionSlug);
  const { versionMeta } = getVersionMeta(currentVersion);

  const categories: DocsNavigationCategory[] = versionMeta.categories.map((category) => ({
    title: category.title,
    folder: category.folder,
    slug: category.slug,
    items: category.items.map((item) => ({
      title: item.title,
      slug: item.slug,
      url: `/docs/${currentVersion.slug}/${category.slug}/${item.slug}`,
    })),
  }));

  return {
    versions: meta.versions,
    currentVersion,
    categories,
  };
}

export default function DocsVersionLayout() {
  const data = useLoaderData<typeof loader>();

  return (
    <main id="docs" className="relative min-h-[calc(100vh-4rem)] bg-slate-950">
      <Sidebar_Left versions={data.versions} currentVersion={data.currentVersion} categories={data.categories} />

      <MDXProvider components={mdxComponents}>
        <Outlet />
      </MDXProvider>

      <Sidebar_Right />
    </main>
  );
}
